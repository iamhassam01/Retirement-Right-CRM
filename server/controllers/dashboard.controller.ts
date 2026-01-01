import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Total AUM (Sum of all clients)
        const clients = await prisma.client.findMany({ select: { aum: true } });
        const totalAum = clients.reduce((sum, client) => sum + (client.aum || 0), 0);

        // 2. Active Clients Count
        const activeClientsCount = await prisma.client.count({
            where: { status: 'Active' }
        });

        // 3. Appointments Today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const appointmentsToday = await prisma.event.count({
            where: {
                startTime: { gte: todayStart, lte: todayEnd },
                type: 'Meeting' // Assuming 'Meeting' is the type for appointments
            }
        });

        // 4. Pending Follow-ups (Tasks)
        const pendingTasks = await prisma.task.count({
            where: { status: 'Pending' }
        });

        const stats = [
            { label: 'Total AUM', value: `$${(totalAum / 1000000).toFixed(1)}M`, change: '+0%', isPositive: true },
            { label: 'Active Clients', value: activeClientsCount.toString(), change: '+0', isPositive: true },
            { label: 'Appointments Today', value: appointmentsToday.toString() },
            { label: 'Pending Follow-ups', value: pendingTasks.toString(), change: 'Check overdue', isPositive: false },
        ];

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
