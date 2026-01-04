import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all notifications for current user
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { unreadOnly } = req.query;

        const where: any = { userId };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to recent 50
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        const notification = await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        await prisma.notification.deleteMany({
            where: { id, userId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// Create notification (internal use / triggered by other events)
export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) => {
    try {
        return await prisma.notification.create({
            data: { userId, type, title, message, link }
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// API endpoint to create notification (for testing/admin)
export const createNotificationAPI = async (req: Request, res: Response) => {
    try {
        const { userId, type, title, message, link } = req.body;

        if (!userId || !type || !title || !message) {
            return res.status(400).json({ error: 'userId, type, title, and message are required' });
        }

        const notification = await prisma.notification.create({
            data: { userId, type, title, message, link }
        });

        res.json({ success: true, notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};
