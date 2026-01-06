import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createNotification } from './notifications.controller';

const prisma = new PrismaClient();

// --- Get All Clients ---
export const getClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                advisor: { select: { name: true } }
            }
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

// --- Get Single Client ---
export const getClientById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                activities: { orderBy: { date: 'desc' }, take: 10 },
                events: { orderBy: { startTime: 'desc' }, take: 5 },
                tasks: { where: { status: 'Pending' } },
                documents: true
            }
        });

        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};

// --- Create Client (or Lead) ---
export const createClient = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const data = req.body;
        const newClient = await prisma.client.create({
            data: {
                ...data,
                status: data.status || 'Lead',
                pipelineStage: data.pipelineStage || 'New Lead'
            }
        });

        // Create notification for new lead/client
        if (userId) {
            await createNotification(
                userId,
                'new_lead',
                'New Lead Added',
                `${newClient.name} has been added to your pipeline.`,
                `/clients/${newClient.id}`
            );
        }

        res.json(newClient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create client' });
    }
};

// --- Update Client ---
export const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const client = await prisma.client.update({
            where: { id },
            data: updates
        });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update client' });
    }
};

// --- Delete Client ---
export const deleteClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.client.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
