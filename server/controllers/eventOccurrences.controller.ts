import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { wordpressService } from '../services/wordpress.service';

const prisma = new PrismaClient();

// --- Get all occurrences for a template ---
export const getOccurrences = async (req: Request, res: Response) => {
    try {
        const { templateId } = req.params;
        const { status, upcoming } = req.query;

        const where: any = { templateId };

        if (status) {
            where.status = status;
        }

        if (upcoming === 'true') {
            where.eventDate = { gte: new Date() };
        }

        const occurrences = await prisma.eventOccurrence.findMany({
            where,
            orderBy: { eventDate: 'asc' },
            include: {
                template: {
                    select: { name: true, slug: true }
                }
            }
        });

        res.json(occurrences);
    } catch (error) {
        console.error('Error fetching occurrences:', error);
        res.status(500).json({ error: 'Failed to fetch occurrences' });
    }
};

// --- Get single occurrence ---
export const getOccurrence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const occurrence = await prisma.eventOccurrence.findUnique({
            where: { id },
            include: {
                template: true
            }
        });

        if (!occurrence) {
            return res.status(404).json({ error: 'Occurrence not found' });
        }

        res.json(occurrence);
    } catch (error) {
        console.error('Error fetching occurrence:', error);
        res.status(500).json({ error: 'Failed to fetch occurrence' });
    }
};

// --- Create occurrence ---
export const createOccurrence = async (req: Request, res: Response) => {
    try {
        const { templateId } = req.params;
        const {
            eventDate,
            startTime,
            endTime,
            venueName,
            room,
            address,
            city,
            state,
            zipCode,
            mapUrl,
            capacity,
            heroImage,
            wpStatus, // 'draft' or 'publish'
        } = req.body;

        // Validate required fields
        if (!eventDate || !venueName || !address) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['eventDate', 'venueName', 'address']
            });
        }

        // Verify template exists
        const template = await prisma.eventTemplate.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({ error: 'Event template not found' });
        }

        // Create occurrence
        const occurrence = await prisma.eventOccurrence.create({
            data: {
                templateId,
                eventDate: new Date(eventDate),
                startTime,
                endTime,
                venueName,
                room,
                address,
                city,
                state,
                zipCode,
                mapUrl,
                capacity: capacity || template.defaultCapacity,
                heroImage,
                status: 'scheduled',
                wpStatus: wpStatus || 'draft',
                wpSyncStatus: 'pending',
            },
            include: {
                template: {
                    select: { name: true }
                }
            }
        });

        // Auto-sync to WordPress if configured
        if (wordpressService.isConfigured()) {
            const syncResult = await wordpressService.syncOccurrence(
                occurrence.id,
                wpStatus === 'publish' ? 'publish' : 'draft'
            );

            // Refetch to get updated sync status
            const updatedOccurrence = await prisma.eventOccurrence.findUnique({
                where: { id: occurrence.id },
                include: { template: { select: { name: true } } }
            });

            return res.status(201).json({
                ...updatedOccurrence,
                syncResult
            });
        }

        res.status(201).json(occurrence);
    } catch (error) {
        console.error('Error creating occurrence:', error);
        res.status(500).json({ error: 'Failed to create occurrence' });
    }
};

// --- Update occurrence ---
export const updateOccurrence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            eventDate,
            startTime,
            endTime,
            venueName,
            room,
            address,
            city,
            state,
            zipCode,
            mapUrl,
            capacity,
            heroImage,
            status,
            wpStatus,
        } = req.body;

        // Check if occurrence exists
        const existing = await prisma.eventOccurrence.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Occurrence not found' });
        }

        // Update occurrence
        const occurrence = await prisma.eventOccurrence.update({
            where: { id },
            data: {
                eventDate: eventDate ? new Date(eventDate) : undefined,
                startTime,
                endTime,
                venueName,
                room,
                address,
                city,
                state,
                zipCode,
                mapUrl,
                capacity,
                heroImage,
                status,
                wpStatus,
                // Mark as needing sync if content changed
                wpSyncStatus: existing.wpPostId ? 'pending' : existing.wpSyncStatus,
            },
            include: {
                template: {
                    select: { name: true }
                }
            }
        });

        // Auto-sync to WordPress if already synced before
        if (wordpressService.isConfigured() && existing.wpPostId) {
            const syncResult = await wordpressService.syncOccurrence(
                occurrence.id,
                (wpStatus || existing.wpStatus) === 'publish' ? 'publish' : 'draft'
            );

            const updatedOccurrence = await prisma.eventOccurrence.findUnique({
                where: { id: occurrence.id },
                include: { template: { select: { name: true } } }
            });

            return res.json({
                ...updatedOccurrence,
                syncResult
            });
        }

        res.json(occurrence);
    } catch (error) {
        console.error('Error updating occurrence:', error);
        res.status(500).json({ error: 'Failed to update occurrence' });
    }
};

// --- Delete occurrence ---
export const deleteOccurrence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const occurrence = await prisma.eventOccurrence.findUnique({
            where: { id }
        });

        if (!occurrence) {
            return res.status(404).json({ error: 'Occurrence not found' });
        }

        // Delete from WordPress first if synced
        if (occurrence.wpPostId && wordpressService.isConfigured()) {
            const deleteResult = await wordpressService.deleteOccurrenceFromWP(id);
            if (!deleteResult.success) {
                console.warn('Failed to delete from WordPress:', deleteResult.error);
                // Continue with local deletion anyway
            }
        }

        // Delete from database
        await prisma.eventOccurrence.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Occurrence deleted' });
    } catch (error) {
        console.error('Error deleting occurrence:', error);
        res.status(500).json({ error: 'Failed to delete occurrence' });
    }
};

// --- Sync single occurrence to WordPress ---
export const syncOccurrence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'draft' or 'publish'

        if (!wordpressService.isConfigured()) {
            return res.status(503).json({
                error: 'WordPress not configured',
                message: 'Please configure WP_USERNAME and WP_APP_PASSWORD in environment variables'
            });
        }

        const wpStatus = status === 'publish' ? 'publish' : 'draft';
        const result = await wordpressService.syncOccurrence(id, wpStatus);

        if (result.success) {
            const occurrence = await prisma.eventOccurrence.findUnique({
                where: { id },
                include: { template: { select: { name: true } } }
            });
            res.json({ success: true, occurrence });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error syncing occurrence:', error);
        res.status(500).json({ error: 'Failed to sync occurrence' });
    }
};

// --- Bulk create occurrences ---
export const bulkCreateOccurrences = async (req: Request, res: Response) => {
    try {
        const { templateId } = req.params;
        const { occurrences, wpStatus } = req.body;

        if (!Array.isArray(occurrences) || occurrences.length === 0) {
            return res.status(400).json({ error: 'occurrences array is required' });
        }

        // Verify template exists
        const template = await prisma.eventTemplate.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({ error: 'Event template not found' });
        }

        const results = {
            created: 0,
            synced: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const occ of occurrences) {
            try {
                const created = await prisma.eventOccurrence.create({
                    data: {
                        templateId,
                        eventDate: new Date(occ.eventDate),
                        startTime: occ.startTime,
                        endTime: occ.endTime,
                        venueName: occ.venueName,
                        room: occ.room,
                        address: occ.address,
                        city: occ.city,
                        state: occ.state,
                        zipCode: occ.zipCode,
                        mapUrl: occ.mapUrl,
                        capacity: occ.capacity || template.defaultCapacity,
                        heroImage: occ.heroImage,
                        status: 'scheduled',
                        wpStatus: wpStatus || 'draft',
                        wpSyncStatus: 'pending',
                    }
                });
                results.created++;

                // Auto-sync if configured
                if (wordpressService.isConfigured()) {
                    const syncResult = await wordpressService.syncOccurrence(
                        created.id,
                        wpStatus === 'publish' ? 'publish' : 'draft'
                    );
                    if (syncResult.success) {
                        results.synced++;
                    }
                }
            } catch (err: any) {
                results.failed++;
                results.errors.push(err.message);
            }
        }

        res.status(201).json(results);
    } catch (error) {
        console.error('Error bulk creating occurrences:', error);
        res.status(500).json({ error: 'Failed to bulk create occurrences' });
    }
};

// --- Get upcoming occurrences across all templates ---
export const getUpcomingOccurrences = async (req: Request, res: Response) => {
    try {
        const { limit } = req.query;

        const occurrences = await prisma.eventOccurrence.findMany({
            where: {
                eventDate: { gte: new Date() },
                status: 'scheduled',
                template: { isActive: true }
            },
            include: {
                template: {
                    select: { name: true, subtitle: true, slug: true }
                }
            },
            orderBy: { eventDate: 'asc' },
            take: limit ? parseInt(limit as string) : 20
        });

        res.json(occurrences);
    } catch (error) {
        console.error('Error fetching upcoming occurrences:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming occurrences' });
    }
};
