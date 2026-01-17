/**
 * Smart Production Cleanup Script
 * 
 * This script analyzes the production database and:
 * 1. AUTO-PROTECTS: Imported clients, Vapi leads (clients with AI activity or phone+Lead status)
 * 2. SURFACES: Only uncertain records for manual review
 * 3. EXPORTS: CSV files for review
 * 
 * Usage:
 *   npx tsx server/scripts/smart-cleanup.ts --mode=analyze
 *   npx tsx server/scripts/smart-cleanup.ts --mode=purge --confirm
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ProtectionResult {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    reason: string;
    protected: boolean;
}

async function analyzeClients(): Promise<{ protected: ProtectionResult[]; uncertain: ProtectionResult[] }> {
    const protectedClients: ProtectionResult[] = [];
    const uncertainClients: ProtectionResult[] = [];

    // Get all clients with their related data
    const clients = await prisma.client.findMany({
        include: {
            activities: true,
            phones: true,
            emails: true,
        },
    });

    // Get import job dates to identify imported clients
    const importJobs = await prisma.importJob.findMany({
        where: { status: 'completed' },
        orderBy: { createdAt: 'asc' },
    });

    const earliestImportDate = importJobs.length > 0 ? importJobs[0].createdAt : null;

    for (const client of clients) {
        const primaryPhone = client.phones.find(p => p.isPrimary)?.number || client.phones[0]?.number;
        const primaryEmail = client.emails.find(e => e.isPrimary)?.email || client.emails[0]?.email;

        let isProtected = false;
        let protectionReason = '';

        // Rule 1: Has AI activity (Vapi lead)
        const hasAiActivity = client.activities.some(a => a.subType === 'ai' || a.user === 'AI Assistant');
        if (hasAiActivity) {
            isProtected = true;
            protectionReason = 'Has AI/Vapi call activity';
        }

        // Rule 2: Has phone number AND status is Lead-related
        if (!isProtected && primaryPhone && client.status?.toLowerCase().includes('lead')) {
            isProtected = true;
            protectionReason = 'Lead with phone number (likely Vapi)';
        }

        // Rule 3: Created after first import (likely imported data)
        if (!isProtected && earliestImportDate && client.createdAt >= earliestImportDate) {
            // Check if has real contact info
            if (primaryPhone || primaryEmail) {
                isProtected = true;
                protectionReason = 'Created after import date with contact info';
            }
        }

        // Rule 4: Has multiple phones/emails (imported data often has these)
        if (!isProtected && (client.phones.length > 1 || client.emails.length > 1)) {
            isProtected = true;
            protectionReason = 'Has multiple contact records (imported)';
        }

        const result: ProtectionResult = {
            id: client.id,
            name: client.name,
            email: primaryEmail,
            phone: primaryPhone,
            status: client.status,
            reason: isProtected ? protectionReason : 'No protection rule matched',
            protected: isProtected,
        };

        if (isProtected) {
            protectedClients.push(result);
        } else {
            uncertainClients.push(result);
        }
    }

    return { protected: protectedClients, uncertain: uncertainClients };
}

async function analyzeOtherEntities() {
    // Find test users (not the main admin)
    const users = await prisma.user.findMany();
    const testUsers = users.filter(u =>
        u.name.toLowerCase().includes('test') ||
        u.email.toLowerCase().includes('test')
    );

    // Find orphan tasks (not linked to any client)
    const orphanTasks = await prisma.task.findMany({
        where: { clientId: null },
    });

    // Find test events/workshops
    const testEvents = await prisma.event.findMany({
        where: {
            OR: [
                { title: { contains: 'test', mode: 'insensitive' } },
                { title: { contains: 'demo', mode: 'insensitive' } },
            ],
        },
    });

    return { testUsers, orphanTasks, testEvents };
}

function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
        console.log(`No data to export for ${filename}`);
        return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
        Object.values(row).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const outputPath = path.join(process.cwd(), filename);
    fs.writeFileSync(outputPath, csv);
    console.log(`Exported ${data.length} records to ${outputPath}`);
}

async function main() {
    const mode = process.argv.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'analyze';
    const confirm = process.argv.includes('--confirm');

    console.log('\n🔍 Smart Production Cleanup Tool\n');
    console.log('='.repeat(50));

    // Analyze clients
    console.log('\n📊 Analyzing clients...');
    const { protected: protectedClients, uncertain: uncertainClients } = await analyzeClients();

    console.log(`   ✅ Auto-Protected: ${protectedClients.length} clients`);
    console.log(`   ⚠️  Uncertain: ${uncertainClients.length} clients`);

    // Analyze other entities
    console.log('\n📊 Analyzing other entities...');
    const { testUsers, orphanTasks, testEvents } = await analyzeOtherEntities();

    console.log(`   👤 Potential test users: ${testUsers.length}`);
    console.log(`   📋 Orphan tasks: ${orphanTasks.length}`);
    console.log(`   📅 Potential test events: ${testEvents.length}`);

    if (mode === 'analyze') {
        // Export CSVs for review
        console.log('\n📁 Exporting files for review...');

        exportToCSV(
            uncertainClients.map(c => ({ ...c, ACTION: '' })),
            'uncertain_clients.csv'
        );

        exportToCSV(
            testUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, ACTION: '' })),
            'uncertain_users.csv'
        );

        exportToCSV(
            orphanTasks.map(t => ({ id: t.id, title: t.title, status: t.status, ACTION: '' })),
            'orphan_tasks.csv'
        );

        exportToCSV(
            testEvents.map(e => ({ id: e.id, title: e.title, type: e.type, startTime: e.startTime, ACTION: '' })),
            'uncertain_events.csv'
        );

        console.log('\n✅ Analysis complete!');
        console.log('\nNext steps:');
        console.log('1. Review the CSV files');
        console.log('2. Mark "DELETE" in ACTION column for records to remove');
        console.log('3. Run: npx tsx server/scripts/smart-cleanup.ts --mode=purge --confirm');
    }

    if (mode === 'purge') {
        if (!confirm) {
            console.log('\n⚠️  Purge mode requires --confirm flag');
            console.log('Run: npx tsx server/scripts/smart-cleanup.ts --mode=purge --confirm');
            process.exit(1);
        }

        console.log('\n🧹 Starting purge...');

        // Read marked CSVs and delete
        const deleteFromCSV = async (filename: string, deleteFunc: (ids: string[]) => Promise<number>) => {
            const csvPath = path.join(process.cwd(), filename);
            if (!fs.existsSync(csvPath)) {
                console.log(`   Skipping ${filename} (not found)`);
                return 0;
            }

            const content = fs.readFileSync(csvPath, 'utf-8');
            const lines = content.split('\n').slice(1); // Skip header
            const toDelete: string[] = [];

            for (const line of lines) {
                if (line.includes('"DELETE"') || line.includes(',DELETE')) {
                    const id = line.split(',')[0].replace(/"/g, '');
                    if (id) toDelete.push(id);
                }
            }

            if (toDelete.length > 0) {
                const count = await deleteFunc(toDelete);
                console.log(`   Deleted ${count} records from ${filename}`);
                return count;
            }
            return 0;
        };

        // Delete clients marked for deletion
        await deleteFromCSV('uncertain_clients.csv', async (ids) => {
            const result = await prisma.client.deleteMany({ where: { id: { in: ids } } });
            return result.count;
        });

        // Delete users marked for deletion
        await deleteFromCSV('uncertain_users.csv', async (ids) => {
            const result = await prisma.user.deleteMany({ where: { id: { in: ids } } });
            return result.count;
        });

        // Delete tasks marked for deletion
        await deleteFromCSV('orphan_tasks.csv', async (ids) => {
            const result = await prisma.task.deleteMany({ where: { id: { in: ids } } });
            return result.count;
        });

        // Delete events marked for deletion
        await deleteFromCSV('uncertain_events.csv', async (ids) => {
            const result = await prisma.event.deleteMany({ where: { id: { in: ids } } });
            return result.count;
        });

        console.log('\n✅ Purge complete!');
    }

    await prisma.$disconnect();
}

main().catch(console.error);
