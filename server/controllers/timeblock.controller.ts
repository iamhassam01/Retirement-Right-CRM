import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all time blocks for current user (with optional date range)
export const getTimeBlocks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { startDate, endDate } = req.query;

        const where: any = { userId };

        if (startDate && endDate) {
            where.OR = [
                {
                    startTime: {
                        gte: new Date(startDate as string),
                        lte: new Date(endDate as string)
                    }
                },
                {
                    endTime: {
                        gte: new Date(startDate as string),
                        lte: new Date(endDate as string)
                    }
                }
            ];
        }

        const timeBlocks = await prisma.timeBlock.findMany({
            where,
            orderBy: { startTime: 'asc' }
        });

        res.json(timeBlocks);
    } catch (error) {
        console.error('Failed to fetch time blocks:', error);
        res.status(500).json({ error: 'Failed to fetch time blocks' });
    }
};

// Get time blocks for a specific user (for team visibility - shows as "Blocked" without details)
export const getTimeBlocksForUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        const currentUserId = (req as any).user?.id;

        const where: any = { userId };

        if (startDate && endDate) {
            where.startTime = { gte: new Date(startDate as string) };
            where.endTime = { lte: new Date(endDate as string) };
        }

        const timeBlocks = await prisma.timeBlock.findMany({
            where,
            orderBy: { startTime: 'asc' },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                type: true,
                // Only show title if viewing own blocks (privacy)
                title: currentUserId === userId,
                isRecurring: true
            }
        });

        // For other users, mask the title
        const maskedBlocks = timeBlocks.map(block => ({
            ...block,
            title: currentUserId === userId ? block.title : 'Blocked'
        }));

        res.json(maskedBlocks);
    } catch (error) {
        console.error('Failed to fetch time blocks for user:', error);
        res.status(500).json({ error: 'Failed to fetch time blocks' });
    }
};

// Create a new time block
export const createTimeBlock = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { title, type, startTime, endTime, isRecurring, recurrenceRule } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({ error: 'startTime and endTime are required' });
        }

        const timeBlock = await prisma.timeBlock.create({
            data: {
                userId,
                title: title || null,
                type: type || 'busy',
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                isRecurring: isRecurring || false,
                recurrenceRule: recurrenceRule || null
            }
        });

        res.status(201).json(timeBlock);
    } catch (error) {
        console.error('Failed to create time block:', error);
        res.status(500).json({ error: 'Failed to create time block' });
    }
};

// Update a time block
export const updateTimeBlock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;
        const { title, type, startTime, endTime, isRecurring, recurrenceRule } = req.body;

        // Verify ownership
        const existing = await prisma.timeBlock.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Time block not found' });
        }

        const timeBlock = await prisma.timeBlock.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existing.title,
                type: type || existing.type,
                startTime: startTime ? new Date(startTime) : existing.startTime,
                endTime: endTime ? new Date(endTime) : existing.endTime,
                isRecurring: isRecurring !== undefined ? isRecurring : existing.isRecurring,
                recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : existing.recurrenceRule
            }
        });

        res.json(timeBlock);
    } catch (error) {
        console.error('Failed to update time block:', error);
        res.status(500).json({ error: 'Failed to update time block' });
    }
};

// Delete a time block
export const deleteTimeBlock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        // Verify ownership
        const existing = await prisma.timeBlock.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Time block not found' });
        }

        await prisma.timeBlock.delete({ where: { id } });

        res.json({ message: 'Time block deleted' });
    } catch (error) {
        console.error('Failed to delete time block:', error);
        res.status(500).json({ error: 'Failed to delete time block' });
    }
};
