const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findMany({
    select: { email: true, name: true, role: true }
}).then(users => {
    console.log('=== USERS IN DATABASE ===');
    users.forEach(u => console.log(`Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`));
    prisma.$disconnect();
}).catch(e => {
    console.error(e);
    prisma.$disconnect();
});
