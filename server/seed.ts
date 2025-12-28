import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// This script populates the database with the MOCK_CLIENTS from your constants
// Run this once after setting up the database.

async function main() {
  console.log('Start seeding ...');

  // Mock data replicated here to avoid importing frontend Types/Constants in Node directly
  // (Simplifies TS configuration for this specific VPS setup)
  
  // 1. Clear existing data
  await prisma.activity.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.client.deleteMany({});

  // 2. Create Sterling Client
  const sterling = await prisma.client.create({
    data: {
      name: 'Robert & Martha Sterling',
      email: 'robert.sterling@example.com',
      phone: '(555) 123-4567',
      status: 'Active',
      advisor: 'John Jenkins',
      aum: 1250000,
      lastContact: 'Today',
      nextStep: 'Quarterly Review',
      pipelineStage: 'Client Onboarded',
      riskProfile: 'Conservative',
      tags: ['Retiree', 'High Net Worth', 'Golf'],
      imageUrl: 'https://picsum.photos/200/200?random=1',
      portfolioHealth: 'On Track',
      activities: {
        create: [
          {
            type: 'call',
            subType: 'ai',
            direction: 'inbound',
            date: new Date(),
            description: 'Client asked about RMD distribution timeline.',
            user: 'AI Assistant',
            duration: '4m 12s',
            status: 'Completed',
            tags: ['RMD', 'Tax', 'Urgent'],
            transcript: [
              { speaker: 'Client', text: 'Hi, I was reading about the new RMD rules. Do I need to withdraw by year-end?', time: '00:15' },
              { speaker: 'AI', text: 'Yes, Robert. For your account type, the deadline is December 31st.', time: '00:22' }
            ],
            aiAnalysis: {
              summary: ['Robert asked about RMD deadline.', 'AI confirmed Dec 31st.'],
              intent: 'Compliance',
              sentiment: 'Concerned',
              nextAction: 'Schedule Tax Strategy Review'
            }
          }
        ]
      }
    }
  });

  console.log(`Created client: ${sterling.name}`);

  // 3. Create Event for Sterling
  await prisma.event.create({
    data: {
      title: 'Review with Robert & Martha',
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 30, 0, 0)),
      type: 'Meeting',
      status: 'Scheduled',
      clientId: sterling.id
    }
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    (process as any).exit(1);
  });