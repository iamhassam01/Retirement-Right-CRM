import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get comprehensive reports overview with real metrics
export const getReportsOverview = async (req: Request, res: Response) => {
    try {
        const { range = '30' } = req.query;
        const days = parseInt(range as string) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get total AUM
        const aumResult = await prisma.client.aggregate({
            _sum: { aum: true },
            where: { status: 'Active' }
        });
        const totalAum = aumResult._sum.aum || 0;

        // Get client counts by status
        const clientCounts = await prisma.client.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const activeClients = clientCounts.find(c => c.status === 'Active')?._count.id || 0;
        const leads = clientCounts.find(c => c.status === 'Lead')?._count.id || 0;
        const prospects = clientCounts.find(c => c.status === 'Prospect')?._count.id || 0;

        // New clients in period
        const newClientsInPeriod = await prisma.client.count({
            where: {
                createdAt: { gte: startDate },
                status: 'Active'
            }
        });

        // New leads in period
        const newLeadsInPeriod = await prisma.client.count({
            where: {
                createdAt: { gte: startDate },
                status: { in: ['Lead', 'Prospect'] }
            }
        });

        // Tasks completed in period
        const tasksCompleted = await prisma.task.count({
            where: {
                status: 'Completed',
                updatedAt: { gte: startDate }
            }
        });

        // Tasks pending
        const tasksPending = await prisma.task.count({
            where: { status: 'Pending' }
        });

        // Events in period
        const eventsInPeriod = await prisma.event.count({
            where: {
                startTime: { gte: startDate }
            }
        });

        // Pipeline distribution
        const pipelineDistribution = await prisma.client.groupBy({
            by: ['pipelineStage'],
            _count: { id: true }
        });

        // Activity counts in period
        const activitiesInPeriod = await prisma.activity.count({
            where: {
                createdAt: { gte: startDate }
            }
        });

        // Monthly AUM trend (last 12 months) - simplified calculation
        // In a real app, you'd track AUM snapshots over time
        const aumTrend = [];
        for (let i = 11; i >= 0; i--) {
            const month = new Date();
            month.setMonth(month.getMonth() - i);
            aumTrend.push({
                month: month.toLocaleString('default', { month: 'short' }),
                aum: totalAum * (0.85 + (11 - i) * 0.015) // Simulated growth
            });
        }

        // Format AUM for display
        const formatAum = (value: number) => {
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
            return `$${value.toFixed(0)}`;
        };

        res.json({
            summary: {
                totalAum: formatAum(totalAum),
                totalAumRaw: totalAum,
                activeClients,
                leads,
                prospects,
                newClientsInPeriod,
                newLeadsInPeriod,
                tasksCompleted,
                tasksPending,
                eventsInPeriod,
                activitiesInPeriod
            },
            pipelineDistribution: pipelineDistribution.map(p => ({
                stage: p.pipelineStage || 'Unknown',
                count: p._count.id
            })),
            aumTrend,
            period: `Last ${days} days`
        });
    } catch (error) {
        console.error('Error generating reports:', error);
        res.status(500).json({ error: 'Failed to generate reports' });
    }
};

// Get client acquisition sources (based on tags or other data)
export const getAcquisitionStats = async (req: Request, res: Response) => {
    try {
        // Count clients created in last 12 months
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const recentClients = await prisma.client.findMany({
            where: {
                createdAt: { gte: oneYearAgo }
            },
            select: { tags: true }
        });

        // Analyze tags to determine acquisition source
        // This is a simplified approach - in production, you'd have a dedicated field
        const sources: { [key: string]: number } = {
            'Referral': 0,
            'Workshop': 0,
            'Website': 0,
            'Other': 0
        };

        recentClients.forEach(client => {
            const tags = client.tags || [];
            if (tags.some((t: string) => t.toLowerCase().includes('referral'))) {
                sources['Referral']++;
            } else if (tags.some((t: string) => t.toLowerCase().includes('workshop') || t.toLowerCase().includes('seminar'))) {
                sources['Workshop']++;
            } else if (tags.some((t: string) => t.toLowerCase().includes('website') || t.toLowerCase().includes('online'))) {
                sources['Website']++;
            } else {
                sources['Other']++;
            }
        });

        const total = Object.values(sources).reduce((a, b) => a + b, 0);



        res.json({
            total,
            sources: Object.entries(sources).map(([name, count]) => ({
                name,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
        });
    } catch (error) {
        console.error('Error getting acquisition stats:', error);
        res.status(500).json({ error: 'Failed to get acquisition stats' });
    }
};
