import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getActivitiesByClient = async (req: Request, res: Response) => {
    try {
        const { clientId } = req.params;
        const activities = await prisma.activity.findMany({
            where: { clientId },
            orderBy: { date: 'desc' },
            take: 50
        });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

export const getAllActivities = async (req: Request, res: Response) => {
    try {
        const activities = await prisma.activity.findMany({
            orderBy: { date: 'desc' },
            take: 100,
            include: {
                client: {
                    select: { name: true }
                }
            }
        });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

export const createActivity = async (req: Request, res: Response) => {
    try {
        const { clientId, type, content, notes, metadata } = req.body;

        if (!clientId || !type) {
            return res.status(400).json({ error: 'clientId and type are required' });
        }

        const activity = await prisma.activity.create({
            data: {
                clientId,
                type,
                description: content || notes,
                date: new Date()
            }
        });

        res.status(201).json(activity);
    } catch (error) {
        console.error('Failed to create activity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
};
