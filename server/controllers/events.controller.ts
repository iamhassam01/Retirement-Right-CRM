import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Get Events (with filters) ---
export const getEvents = async (req: Request, res: Response) => {
    try {
        const { start, end, type } = req.query;

        const events = await prisma.event.findMany({
            where: {
                startTime: {
                    gte: start ? new Date(String(start)) : undefined,
                },
                endTime: {
                    lte: end ? new Date(String(end)) : undefined,
                },
                type: type ? String(type) : undefined
            },
            include: {
                client: { select: { name: true } },
                advisor: { select: { name: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        console.log(`Fetched ${events.length} events for calendar`);

        // Transform for frontend (FullCalendar format often used)
        const formatted = events.map(e => ({
            id: e.id,
            title: e.title,
            start: e.startTime,
            end: e.endTime,
            type: e.type,
            status: e.status,
            clientName: e.client?.name,
            advisorName: e.advisor?.name,
            extendedProps: {
                clientId: e.clientId,
                advisorId: e.advisorId
            }
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// --- Create Event ---
export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, start, end, type, clientId, advisorId } = req.body;
        const currentUserId = (req as any).user?.userId;

        console.log('Creating event:', { title, start, type, clientId, advisorId, currentUserId });

        const event = await prisma.event.create({
            data: {
                title,
                startTime: new Date(start),
                endTime: new Date(end),
                type,
                status: 'Scheduled',
                clientId: clientId || null,
                advisorId: advisorId || currentUserId || null
            }
        });
        res.json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// --- Update Event ---
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Handle date conversions if present
        if (updates.start) updates.startTime = new Date(updates.start);
        if (updates.end) updates.endTime = new Date(updates.end);
        delete updates.start;
        delete updates.end;

        const event = await prisma.event.update({
            where: { id },
            data: updates
        });
        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// --- Delete Event ---
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};
