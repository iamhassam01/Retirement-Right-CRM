import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { wordpressService } from '../services/wordpress.service';

const prisma = new PrismaClient();

// --- Get All Event Templates ---
export const getEventTemplates = async (req: Request, res: Response) => {
    try {
        const { includeInactive } = req.query;

        const templates = await prisma.eventTemplate.findMany({
            where: includeInactive === 'true' ? {} : { isActive: true },
            include: {
                occurrences: {
                    orderBy: { eventDate: 'asc' },
                    select: {
                        id: true,
                        eventDate: true,
                        venueName: true,
                        city: true,
                        status: true,
                        wpSyncStatus: true,
                    }
                },
                _count: {
                    select: { occurrences: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Add computed fields
        const templatesWithStats = templates.map(template => {
            const upcomingCount = template.occurrences.filter(
                o => new Date(o.eventDate) >= new Date() && o.status === 'scheduled'
            ).length;
            const syncedCount = template.occurrences.filter(
                o => o.wpSyncStatus === 'synced'
            ).length;

            return {
                ...template,
                upcomingCount,
                syncedCount,
                totalOccurrences: template._count.occurrences
            };
        });

        res.json(templatesWithStats);
    } catch (error) {
        console.error('Error fetching event templates:', error);
        res.status(500).json({ error: 'Failed to fetch event templates' });
    }
};

// --- Get Single Event Template with Occurrences ---
export const getEventTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const template = await prisma.eventTemplate.findUnique({
            where: { id },
            include: {
                occurrences: {
                    orderBy: { eventDate: 'asc' }
                }
            }
        });

        if (!template) {
            return res.status(404).json({ error: 'Event template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Error fetching event template:', error);
        res.status(500).json({ error: 'Failed to fetch event template' });
    }
};

// --- Create Event Template ---
export const createEventTemplate = async (req: Request, res: Response) => {
    try {
        const {
            name,
            slug,
            subtitle,
            description,
            learnings,
            whyAttend,
            faqs,
            hostName,
            hostTitle,
            hostEmail,
            hostPhone,
            guideUrl,
            disclaimer,
            defaultCapacity,
            defaultDuration,
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Template name is required' });
        }

        // Generate slug if not provided
        const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const template = await prisma.eventTemplate.create({
            data: {
                name,
                slug: generatedSlug,
                subtitle,
                description,
                learnings: learnings || [],
                whyAttend,
                faqs,
                hostName,
                hostTitle,
                hostEmail,
                hostPhone,
                guideUrl,
                disclaimer,
                defaultCapacity,
                defaultDuration,
            }
        });

        res.status(201).json(template);
    } catch (error: any) {
        console.error('Error creating event template:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A template with this slug already exists' });
        }
        res.status(500).json({ error: 'Failed to create event template' });
    }
};

// --- Update Event Template ---
export const updateEventTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            subtitle,
            description,
            learnings,
            whyAttend,
            faqs,
            hostName,
            hostTitle,
            hostEmail,
            hostPhone,
            guideUrl,
            disclaimer,
            defaultCapacity,
            defaultDuration,
            isActive,
        } = req.body;

        const template = await prisma.eventTemplate.update({
            where: { id },
            data: {
                name,
                slug,
                subtitle,
                description,
                learnings,
                whyAttend,
                faqs,
                hostName,
                hostTitle,
                hostEmail,
                hostPhone,
                guideUrl,
                disclaimer,
                defaultCapacity,
                defaultDuration,
                isActive,
            }
        });

        res.json(template);
    } catch (error: any) {
        console.error('Error updating event template:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Event template not found' });
        }
        res.status(500).json({ error: 'Failed to update event template' });
    }
};

// --- Delete Event Template ---
export const deleteEventTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // First, delete all related WordPress posts
        const occurrences = await prisma.eventOccurrence.findMany({
            where: { templateId: id, wpPostId: { not: null } }
        });

        for (const occurrence of occurrences) {
            await wordpressService.deleteOccurrenceFromWP(occurrence.id);
        }

        // Then delete the template (cascades to occurrences)
        await prisma.eventTemplate.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Template and all occurrences deleted' });
    } catch (error: any) {
        console.error('Error deleting event template:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Event template not found' });
        }
        res.status(500).json({ error: 'Failed to delete event template' });
    }
};

// --- Sync All Template Occurrences to WordPress ---
export const syncTemplateToWordPress = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'draft' or 'publish'

        if (!wordpressService.isConfigured()) {
            return res.status(503).json({
                error: 'WordPress not configured',
                message: 'Please configure WP_USERNAME and WP_APP_PASSWORD in environment variables'
            });
        }

        const template = await prisma.eventTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return res.status(404).json({ error: 'Event template not found' });
        }

        const wpStatus = status === 'publish' ? 'publish' : 'draft';
        const results = await wordpressService.syncAllOccurrences(id, wpStatus);

        res.json({
            success: results.failed === 0,
            ...results
        });
    } catch (error) {
        console.error('Error syncing template to WordPress:', error);
        res.status(500).json({ error: 'Failed to sync to WordPress' });
    }
};
