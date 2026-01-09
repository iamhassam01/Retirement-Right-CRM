import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createNotification, broadcastNotification } from './notifications.controller';

const prisma = new PrismaClient();

// --- Generate Client ID ---
async function generateClientId(): Promise<string> {
    const lastClient = await prisma.client.findFirst({
        where: {
            clientId: {
                startsWith: 'CL-'
            }
        },
        orderBy: {
            clientId: 'desc'
        },
        select: {
            clientId: true
        }
    });

    let nextNumber = 1;
    if (lastClient?.clientId) {
        const match = lastClient.clientId.match(/CL-(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    return `CL-${nextNumber.toString().padStart(4, '0')}`;
}

// --- Validate Client ID Format ---
function isValidClientIdFormat(clientId: string): boolean {
    return /^CL-\d{4,}$/.test(clientId);
}

// --- Get All Clients ---
export const getClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                advisor: { select: { name: true } },
                phones: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'asc' }
                    ]
                },
                emails: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'asc' }
                    ]
                }
            }
        });

        // Transform to include computed primary contact fields
        const transformedClients = clients.map(client => ({
            ...client,
            primaryPhone: client.phones.find(p => p.isPrimary)?.number || client.phones[0]?.number || client.phone,
            primaryEmail: client.emails.find(e => e.isPrimary)?.email || client.emails[0]?.email || client.email,
            advisor: client.advisor?.name || null
        }));

        res.json(transformedClients);
    } catch (error) {
        console.error('Failed to fetch clients:', error);
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
                advisor: { select: { id: true, name: true } },
                phones: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'asc' }
                    ]
                },
                emails: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'asc' }
                    ]
                },
                activities: { orderBy: { date: 'desc' }, take: 10 },
                events: { orderBy: { startTime: 'desc' }, take: 5 },
                tasks: { where: { status: 'Pending' } },
                documents: true
            }
        });

        if (!client) return res.status(404).json({ error: 'Client not found' });

        // Transform to include computed fields
        const transformedClient = {
            ...client,
            primaryPhone: client.phones.find(p => p.isPrimary)?.number || client.phones[0]?.number || client.phone,
            primaryEmail: client.emails.find(e => e.isPrimary)?.email || client.emails[0]?.email || client.email,
            advisor: client.advisor?.name || null,
            advisorId: client.advisor?.id || client.advisorId
        };

        res.json(transformedClient);
    } catch (error) {
        console.error('Failed to fetch client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};

// --- Create Client (or Lead) ---
export const createClient = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { phones, emails, ...data } = req.body;

        // Generate clientId if not provided
        let clientId = data.clientId;
        if (!clientId) {
            clientId = await generateClientId();
        } else {
            // Validate format
            if (!isValidClientIdFormat(clientId)) {
                return res.status(400).json({
                    error: 'Invalid Client ID format. Must be CL-XXXX (e.g., CL-0001)'
                });
            }
            // Check uniqueness
            const existing = await prisma.client.findUnique({
                where: { clientId }
            });
            if (existing) {
                return res.status(400).json({
                    error: 'Client ID already exists. Please use a different ID.'
                });
            }
        }

        const newClient = await prisma.client.create({
            data: {
                ...data,
                clientId,
                status: data.status || 'Lead',
                pipelineStage: data.pipelineStage || 'New Lead',
                // Create phones if provided
                phones: phones?.length ? {
                    create: phones.map((phone: any, index: number) => ({
                        number: phone.number,
                        type: phone.type || 'MOBILE',
                        label: phone.label,
                        isPrimary: phone.isPrimary ?? index === 0
                    }))
                } : undefined,
                // Create emails if provided
                emails: emails?.length ? {
                    create: emails.map((email: any, index: number) => ({
                        email: email.email,
                        type: email.type || 'PERSONAL',
                        label: email.label,
                        isPrimary: email.isPrimary ?? index === 0
                    }))
                } : undefined
            },
            include: {
                phones: true,
                emails: true,
                advisor: { select: { name: true } }
            }
        });

        // Broadcast notification for new lead/client to all advisors
        await broadcastNotification(
            'new_lead',
            data.status === 'Active' ? 'New Client Added' : 'New Lead Added',
            `${newClient.name} (${newClient.clientId}) has been added to the pipeline.`,
            `/clients/${newClient.id}`
        );

        res.json(newClient);
    } catch (error) {
        console.error('Failed to create client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

// --- Update Client ---
export const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { phones, emails, ...updates } = req.body;

        // Get current client to check if status is changing
        const currentClient = await prisma.client.findUnique({ where: { id } });
        if (!currentClient) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const isConverting = currentClient &&
            (currentClient.status === 'Lead' || currentClient.status === 'Prospect') &&
            updates.status === 'Active';

        // Auto-update pipeline stage if status becomes Active
        if (updates.status === 'Active' || updates.status === 'Client') {
            updates.pipelineStage = 'Client Onboarded';
        }

        // Validate clientId if being updated
        if (updates.clientId && updates.clientId !== currentClient.clientId) {
            if (!isValidClientIdFormat(updates.clientId)) {
                return res.status(400).json({
                    error: 'Invalid Client ID format. Must be CL-XXXX (e.g., CL-0001)'
                });
            }
            const existing = await prisma.client.findUnique({
                where: { clientId: updates.clientId }
            });
            if (existing && existing.id !== id) {
                return res.status(400).json({
                    error: 'Client ID already exists. Please use a different ID.'
                });
            }
        }

        const client = await prisma.client.update({
            where: { id },
            data: updates,
            include: {
                phones: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'asc' }
                    ]
                },
                emails: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { createdAt: 'asc' }
                    ]
                },
                advisor: { select: { name: true } }
            }
        });

        // Broadcast conversion notification to all advisors
        if (isConverting) {
            await broadcastNotification(
                'conversion',
                'Lead Converted to Client',
                `${client.name} (${client.clientId}) has been promoted to an active client!`,
                `/clients/${client.id}`
            );
        }

        res.json(client);
    } catch (error) {
        console.error('Failed to update client:', error);
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
        console.error('Failed to delete client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
};

// --- Generate New Client ID (for frontend auto-generate button) ---
export const getNextClientId = async (req: Request, res: Response) => {
    try {
        const nextId = await generateClientId();
        res.json({ clientId: nextId });
    } catch (error) {
        console.error('Failed to generate client ID:', error);
        res.status(500).json({ error: 'Failed to generate client ID' });
    }
};

// --- Validate Client ID ---
export const validateClientId = async (req: Request, res: Response) => {
    try {
        const { clientId } = req.params;
        const { excludeId } = req.query;

        // Check format
        if (!isValidClientIdFormat(clientId)) {
            return res.json({
                valid: false,
                message: 'Invalid format. Must be CL-XXXX (e.g., CL-0001)'
            });
        }

        // Check uniqueness
        const existing = await prisma.client.findUnique({
            where: { clientId }
        });

        if (existing && existing.id !== excludeId) {
            return res.json({
                valid: false,
                message: 'This Client ID already exists'
            });
        }

        res.json({ valid: true });
    } catch (error) {
        console.error('Failed to validate client ID:', error);
        res.status(500).json({ error: 'Failed to validate client ID' });
    }
};
