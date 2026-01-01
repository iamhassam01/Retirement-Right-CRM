import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all settings
export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.settings.findMany();

        // Convert to key-value object
        const settingsObj: Record<string, any> = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });

        res.json(settingsObj);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// Get single setting by key
export const getSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;

        const setting = await prisma.settings.findUnique({
            where: { key }
        });

        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        res.json(setting.value);
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ error: 'Failed to fetch setting' });
    }
};

// Update or create setting
export const updateSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const setting = await prisma.settings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        res.json(setting);
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
};

// Bulk update settings
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body;

        if (typeof updates !== 'object') {
            return res.status(400).json({ error: 'Request body must be an object' });
        }

        const results = await Promise.all(
            Object.entries(updates).map(([key, value]) =>
                prisma.settings.upsert({
                    where: { key },
                    update: { value: value as any },
                    create: { key, value: value as any }
                })
            )
        );

        res.json({ message: 'Settings updated successfully', count: results.length });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

// Initialize default settings
export const initializeDefaults = async (req: Request, res: Response) => {
    try {
        const defaults = {
            pipeline_stages: ['New Lead', 'Contacted', 'Meeting Set', 'Proposal', 'Negotiation', 'Client Onboarded'],
            deal_rotting_days: 14,
            notifications: {
                new_lead: true,
                portfolio_drop: true,
                workshop_registration: true,
                daily_digest: false
            },
            branding: {
                company_name: 'Retirement Right',
                primary_color: '#0f172a'
            }
        };

        const results = await Promise.all(
            Object.entries(defaults).map(([key, value]) =>
                prisma.settings.upsert({
                    where: { key },
                    update: {},
                    create: { key, value: value as any }
                })
            )
        );

        res.json({ message: 'Default settings initialized', count: results.length });
    } catch (error) {
        console.error('Error initializing defaults:', error);
        res.status(500).json({ error: 'Failed to initialize defaults' });
    }
};
