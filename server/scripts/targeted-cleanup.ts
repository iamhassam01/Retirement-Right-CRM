/**
 * Targeted Production Cleanup Script
 * 
 * Based on user requirements:
 * 1. DELETE all uncertain events (4 test events)
 * 2. SKIP users (keep all)
 * 3. PRESERVE imported clients, DELETE all manually created/converted leads
 * 
 * Strategy: Query ImportJob to find import dates, protect clients created during imports
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const dryRun = !process.argv.includes('--execute');

    console.log('\n🎯 Targeted Production Cleanup\n');
    console.log('='.repeat(50));
    console.log(dryRun ? '⚠️  DRY RUN MODE (use --execute to apply)\n' : '🔴 LIVE EXECUTION MODE\n');

    // Get ImportJob data to identify import windows
    const importJobs = await prisma.importJob.findMany({
        where: { status: 'completed' },
        orderBy: { createdAt: 'asc' },
    });

    console.log(`📦 Found ${importJobs.length} completed import jobs`);

    let totalImportedRecords = 0;
    const importWindows: { start: Date; end: Date; count: number }[] = [];

    for (const job of importJobs) {
        totalImportedRecords += job.successCount;
        // Create a 5-minute window around the import for matching
        const start = new Date(job.createdAt.getTime() - 60000); // 1 min before
        const end = new Date((job.completedAt || job.createdAt).getTime() + 300000); // 5 min after
        importWindows.push({ start, end, count: job.successCount });
        console.log(`   - ${job.filename}: ${job.successCount} records (${job.createdAt.toISOString()})`);
    }

    console.log(`\n📊 Total expected imported records: ${totalImportedRecords}`);

    // Get all clients
    const allClients = await prisma.client.findMany({
        include: { phones: true, emails: true, activities: true }
    });

    console.log(`📋 Total clients in database: ${allClients.length}`);

    // Categorize clients
    const importedClients: string[] = [];
    const vapiLeads: string[] = [];
    const toDelete: { id: string; name: string; reason: string }[] = [];

    for (const client of allClients) {
        let isImported = false;
        let isVapiLead = false;

        // Check 1: Has AI activity (Vapi lead)
        const hasAiActivity = client.activities.some(a =>
            a.subType === 'ai' || a.user === 'AI Assistant'
        );
        if (hasAiActivity) {
            isVapiLead = true;
            vapiLeads.push(client.id);
            continue;
        }

        // Check 2: Created during an import window
        for (const window of importWindows) {
            if (client.createdAt >= window.start && client.createdAt <= window.end) {
                isImported = true;
                break;
            }
        }

        if (isImported) {
            importedClients.push(client.id);
            continue;
        }

        // Check 3: Has phone/email data (likely imported)
        if (client.phones.length > 0 || client.emails.length > 0) {
            importedClients.push(client.id);
            continue;
        }

        // Check 4: Status is "Active" and has a real-looking name (imported client data)
        // Imported clients typically have status "Active" and proper names
        if (client.status === 'Active' &&
            !client.name.toLowerCase().includes('test') &&
            !client.name.toLowerCase().includes('unknown caller')) {
            importedClients.push(client.id);
            continue;
        }

        // Everything else is test data
        toDelete.push({
            id: client.id,
            name: client.name,
            reason: `Status: ${client.status}, No import markers`
        });
    }

    console.log(`\n✅ Protected (Imported): ${importedClients.length} clients`);
    console.log(`✅ Protected (Vapi Leads): ${vapiLeads.length} clients`);
    console.log(`❌ To Delete: ${toDelete.length} clients`);

    if (toDelete.length > 0) {
        console.log('\nClients to be deleted:');
        toDelete.slice(0, 20).forEach(c => console.log(`   - ${c.name} (${c.reason})`));
        if (toDelete.length > 20) console.log(`   ... and ${toDelete.length - 20} more`);
    }

    // Get test events
    const testEvents = await prisma.event.findMany({
        where: {
            OR: [
                { title: { contains: 'test', mode: 'insensitive' } },
                { title: { contains: 'demo', mode: 'insensitive' } },
                { title: { contains: 'TEST', mode: 'insensitive' } },
            ],
        },
    });

    console.log(`\n📅 Test events to delete: ${testEvents.length}`);
    testEvents.forEach(e => console.log(`   - ${e.title} (${e.type})`));

    if (!dryRun) {
        console.log('\n🧹 Executing cleanup...');

        // Delete test events
        if (testEvents.length > 0) {
            const eventResult = await prisma.event.deleteMany({
                where: { id: { in: testEvents.map(e => e.id) } }
            });
            console.log(`   ✓ Deleted ${eventResult.count} test events`);
        }

        // Delete test clients
        if (toDelete.length > 0) {
            const clientResult = await prisma.client.deleteMany({
                where: { id: { in: toDelete.map(c => c.id) } }
            });
            console.log(`   ✓ Deleted ${clientResult.count} test clients`);
        }

        console.log('\n✅ Cleanup complete!');
    } else {
        console.log('\n⚠️  This was a dry run. Run with --execute to apply changes.');
    }

    await prisma.$disconnect();
}

main().catch(console.error);
