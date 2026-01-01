import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all workshops/events (type='Workshop')
export const getWorkshops = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = { type: 'Workshop' };
        if (status) where.status = status;

        const workshops = await prisma.event.findMany({
            where,
            orderBy: { startTime: 'asc' },
            include: {
                advisor: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(workshops);
    } catch (error) {
        console.error('Error fetching workshops:', error);
        res.status(500).json({ error: 'Failed to fetch workshops' });
    }
};

// Get single workshop with attendees
export const getWorkshop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const workshop = await prisma.event.findUnique({
            where: { id },
            include: {
                advisor: {
                    select: { id: true, name: true }
                },
                client: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!workshop) {
            return res.status(404).json({ error: 'Workshop not found' });
        }

        res.json(workshop);
    } catch (error) {
        console.error('Error fetching workshop:', error);
        res.status(500).json({ error: 'Failed to fetch workshop' });
    }
};

// Create workshop
export const createWorkshop = async (req: Request, res: Response) => {
    try {
        const { title, startTime, endTime, location, capacity, status } = req.body;
        const userId = (req as any).user?.userId;

        if (!title || !startTime) {
            return res.status(400).json({ error: 'Title and start time are required' });
        }

        const workshop = await prisma.event.create({
            data: {
                title,
                type: 'Workshop',
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000), // Default 2 hours
                location,
                capacity: capacity || 20,
                registered: 0,
                status: status || 'Scheduled',
                advisorId: userId
            }
        });

        res.status(201).json(workshop);
    } catch (error) {
        console.error('Error creating workshop:', error);
        res.status(500).json({ error: 'Failed to create workshop' });
    }
};

// Update workshop
export const updateWorkshop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, startTime, endTime, location, capacity, status } = req.body;

        const workshop = await prisma.event.update({
            where: { id },
            data: {
                title,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                location,
                capacity,
                status
            }
        });

        res.json(workshop);
    } catch (error) {
        console.error('Error updating workshop:', error);
        res.status(500).json({ error: 'Failed to update workshop' });
    }
};

// Delete workshop
export const deleteWorkshop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({ where: { id } });
        res.json({ message: 'Workshop deleted successfully' });
    } catch (error) {
        console.error('Error deleting workshop:', error);
        res.status(500).json({ error: 'Failed to delete workshop' });
    }
};

// Register for workshop (increment registered count)
export const registerForWorkshop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const workshop = await prisma.event.findUnique({ where: { id } });
        if (!workshop) {
            return res.status(404).json({ error: 'Workshop not found' });
        }

        if (workshop.registered !== null && workshop.capacity !== null &&
            workshop.registered >= workshop.capacity) {
            return res.status(400).json({ error: 'Workshop is at capacity' });
        }

        const updated = await prisma.event.update({
            where: { id },
            data: {
                registered: { increment: 1 }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error registering for workshop:', error);
        res.status(500).json({ error: 'Failed to register' });
    }
};
