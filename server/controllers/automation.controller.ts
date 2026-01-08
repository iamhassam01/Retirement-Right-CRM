import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// ============== TEMPLATES CRUD ==============

// Get all templates
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await prisma.template.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { automationLogs: true }
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
            where: { id }
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
        const template = await prisma.template.create({
            data: {
                name,
                type: type || 'Email',
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
            data: { name, type, subject, body, variables }
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
        res.json({ message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
};

// ============== AUTOMATION LOGS ==============

// Get automation logs
export const getAutomationLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.automationLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                template: {
                    select: { name: true, subject: true }
                }
            }
        });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching automation logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// ============== SEND EMAIL VIA N8N ==============

export const sendEmails = async (req: Request, res: Response) => {
    try {
        const { templateId, recipients } = req.body;
        // recipients: [{ clientId, email, client_name, first_name, ... }]

        if (!templateId || !recipients || recipients.length === 0) {
            return res.status(400).json({ error: 'Template and recipients required' });
        }

        // Get template
        const template = await prisma.template.findUnique({
            where: { id: templateId }
        });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Create automation log entry
        const automationLog = await prisma.automationLog.create({
            data: {
                templateId,
                recipientCount: recipients.length,
                status: 'sending'
            }
        });

        // Update template usage
        await prisma.template.update({
            where: { id: templateId },
            data: {
                usageCount: { increment: 1 },
                lastUsedAt: new Date()
            }
        });

        // Get n8n webhook URL from environment
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

        if (!n8nWebhookUrl) {
            // No n8n configured - return error
            await prisma.automationLog.update({
                where: { id: automationLog.id },
                data: {
                    status: 'failed',
                    errorDetails: { error: 'N8N_WEBHOOK_URL not configured' },
                    completedAt: new Date()
                }
            });
            return res.status(500).json({ error: 'Email service not configured' });
        }

        // Send to n8n webhook
        try {
            const n8nResponse = await axios.post(n8nWebhookUrl, {
                logId: automationLog.id,
                template: {
                    subject: template.subject,
                    body: template.body
                },
                recipients
            }, {
                timeout: 60000 // 60 second timeout
            });

            // Update log with results
            const result = n8nResponse.data;
            await prisma.automationLog.update({
                where: { id: automationLog.id },
                data: {
                    status: result.sent === recipients.length ? 'completed' :
                        result.sent > 0 ? 'partial' : 'failed',
                    sentCount: result.sent || 0,
                    failedCount: result.failed || 0,
                    errorDetails: result.errors?.length > 0 ? result.errors : null,
                    completedAt: new Date()
                }
            });

            res.json({
                success: true,
                logId: automationLog.id,
                sent: result.sent,
                failed: result.failed
            });

        } catch (n8nError: any) {
            console.error('n8n webhook error:', n8nError.message);
            await prisma.automationLog.update({
                where: { id: automationLog.id },
                data: {
                    status: 'failed',
                    errorDetails: { error: n8nError.message },
                    completedAt: new Date()
                }
            });
            res.status(500).json({ error: 'Email sending failed', details: n8nError.message });
        }

    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ error: 'Failed to send emails' });
    }
};
