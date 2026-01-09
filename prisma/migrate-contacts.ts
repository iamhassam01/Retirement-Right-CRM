/**
 * Migration Script: Migrate Legacy Phone/Email to New Tables
 * 
 * This script migrates existing client phone and email data from the
 * deprecated single fields to the new ClientPhone and ClientEmail tables.
 * 
 * Run with: npx tsx prisma/migrate-contacts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate Client ID in format CL-XXXX
async function generateClientId(): Promise<string> {
  const lastClient = await prisma.client.findFirst({
    where: {
      clientId: {
        startsWith: 'CL-'
      }
    },
    orderBy: {
      clientId: 'desc'
    },
    select: {
      clientId: true
    }
  });

  let nextNumber = 1;
  if (lastClient?.clientId) {
    const match = lastClient.clientId.match(/CL-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `CL-${nextNumber.toString().padStart(4, '0')}`;
}

async function migrateContacts() {
  console.log('🚀 Starting contact migration...\n');

  // Get all clients
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      clientId: true,
      name: true,
      email: true,
      phone: true,
    }
  });

  console.log(`📊 Found ${clients.length} clients to process\n`);

  let clientIdCount = 0;
  let phoneCount = 0;
  let emailCount = 0;
  let errorCount = 0;

  for (const client of clients) {
    try {
      const updates: any = {};

      // Generate clientId if missing
      if (!client.clientId) {
        updates.clientId = await generateClientId();
        clientIdCount++;
      }

      // Migrate phone to ClientPhone table
      if (client.phone && client.phone.trim()) {
        const existingPhone = await prisma.clientPhone.findFirst({
          where: {
            clientId: client.id,
            number: client.phone.trim()
          }
        });

        if (!existingPhone) {
          await prisma.clientPhone.create({
            data: {
              clientId: client.id,
              number: client.phone.trim(),
              type: 'MOBILE',
              isPrimary: true
            }
          });
          phoneCount++;
        }
      }

      // Migrate email to ClientEmail table
      if (client.email && client.email.trim()) {
        const existingEmail = await prisma.clientEmail.findFirst({
          where: {
            clientId: client.id,
            email: client.email.trim()
          }
        });

        if (!existingEmail) {
          await prisma.clientEmail.create({
            data: {
              clientId: client.id,
              email: client.email.trim(),
              type: 'PERSONAL',
              isPrimary: true
            }
          });
          emailCount++;
        }
      }

      // Update client with new clientId if needed
      if (Object.keys(updates).length > 0) {
        await prisma.client.update({
          where: { id: client.id },
          data: updates
        });
      }

      console.log(`✓ Processed: ${client.name}`);
    } catch (error) {
      console.error(`✗ Error processing ${client.name}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 Migration Summary:');
  console.log(`   - Client IDs generated: ${clientIdCount}`);
  console.log(`   - Phones migrated: ${phoneCount}`);
  console.log(`   - Emails migrated: ${emailCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log('='.repeat(50));
  console.log('\n✅ Migration complete!');
}

// Run migration
migrateContacts()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
