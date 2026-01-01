import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const taskSchema = z.object({
    title: z.string().min(1),
    due: z.string().optional(), // ISO Date string
    type: z.string().optional(),
    priority: z.enum(['High', 'Medium', 'Low']).optional(),
    clientName: z.string().optional(), // For display
    clientId: z.string().optional(), // Link to client
    status: z.string().optional(),
});

export const getTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit for now
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const data = taskSchema.parse(req.body);
        // Ensure user is linked if needed, for now just create
        // Note: Schema might need userId if tasks are user-specific
        const task = await prisma.task.create({
            data: {
                ...data,
                assignedToId: (req as any).user?.id, // Assuming auth middleware adds user
                status: 'Pending'
            }
        });
        res.status(201).json(task);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const task = await prisma.task.update({
            where: { id },
            data
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id } });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
