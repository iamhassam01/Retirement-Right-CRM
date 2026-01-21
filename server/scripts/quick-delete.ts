import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const result = await prisma.client.deleteMany({
        where: { name: { contains: '+14805558888' } }
    });
    console.log('Deleted:', result.count);
}
main().finally(() => prisma.$disconnect());
