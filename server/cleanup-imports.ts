
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up ALL new/imported clients...');

    try {
        // Delete clients that have a clientId (legacy data has null)
        const { count } = await prisma.client.deleteMany({
            where: {
                clientId: { not: null }
            }
        });

        // Also clear import jobs to reset the wizard history
        const jobs = await prisma.importJob.deleteMany({});

        console.log(`✅ Deleted ${count} clients.`);
        console.log(`✅ Cleared ${jobs.count} import jobs.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
