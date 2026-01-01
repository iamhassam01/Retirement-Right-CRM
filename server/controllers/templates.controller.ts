import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all templates
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await prisma.template.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { logs: true }
                }
            }
        });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

// Get single template
export const getTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const template = await prisma.template.findUnique({
            where: { id },
            include: {
                logs: {
                    take: 10,
                    orderBy: { sentAt: 'desc' },
                    include: {
                        recipient: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
};

// Create template
export const createTemplate = async (req: Request, res: Response) => {
    try {
        const { name, type, subject, body, variables } = req.body;

        if (!name || !type || !body) {
            return res.status(400).json({ error: 'Name, type, and body are required' });
        }

        const template = await prisma.template.create({
            data: {
                name,
                type, // "Email" or "SMS"
                subject,
                body,
                variables: variables || []
            }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
};

// Update template
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, subject, body, variables } = req.body;

        const template = await prisma.template.update({
            where: { id },
            data: {
                name,
                type,
                subject,
                body,
                variables
            }
        });

        res.json(template);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};

// Delete template
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.template.delete({ where: { id } });
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
};

// Get communication logs
export const getCommunicationLogs = async (req: Request, res: Response) => {
    try {
        const { limit = 50 } = req.query;

        const logs = await prisma.communicationLog.findMany({
            take: parseInt(limit as string),
            orderBy: { sentAt: 'desc' },
            include: {
                recipient: {
                    select: { id: true, name: true, email: true }
                },
                template: {
                    select: { id: true, name: true, type: true }
                }
            }
        });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// Log a communication (when sending)
export const logCommunication = async (req: Request, res: Response) => {
    try {
        const { recipientId, templateId, channel, status, metadata } = req.body;

        // Update template usage count
        if (templateId) {
            await prisma.template.update({
                where: { id: templateId },
                data: {
                    usageCount: { increment: 1 },
                    lastUsedAt: new Date()
                }
            });
        }

        const log = await prisma.communicationLog.create({
            data: {
                recipientId,
                templateId,
                channel,
                status: status || 'Delivered',
                metadata
            },
            include: {
                recipient: { select: { id: true, name: true } },
                template: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(log);
    } catch (error) {
        console.error('Error logging communication:', error);
        res.status(500).json({ error: 'Failed to log communication' });
    }
};
