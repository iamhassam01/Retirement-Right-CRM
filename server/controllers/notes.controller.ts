import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/notes/client/:clientId - Get all notes for a client
export const getNotesByClient = async (req: Request, res: Response) => {
    try {
        const { clientId } = req.params;

        const notes = await prisma.note.findMany({
            where: { clientId },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        res.json(notes);
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
};

// POST /api/notes - Create a new note
export const createNote = async (req: Request, res: Response) => {
    try {
        const { clientId, title, content, category } = req.body;
        const authorId = (req as any).user?.id;

        if (!clientId || !content) {
            return res.status(400).json({ error: 'clientId and content are required' });
        }

        const note = await prisma.note.create({
            data: {
                clientId,
                authorId,
                title: title || null,
                content,
                category: category || 'General'
            },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Failed to create note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
};

// PUT /api/notes/:id - Update a note
export const updateNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, category } = req.body;

        const note = await prisma.note.update({
            where: { id },
            data: {
                title,
                content,
                category
            },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        res.json(note);
    } catch (error) {
        console.error('Failed to update note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
};

// DELETE /api/notes/:id - Delete a note
export const deleteNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.note.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        console.error('Failed to delete note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
};

// PUT /api/notes/:id/pin - Toggle pin status
export const togglePin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Get current pin status
        const existingNote = await prisma.note.findUnique({
            where: { id }
        });

        if (!existingNote) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const note = await prisma.note.update({
            where: { id },
            data: {
                isPinned: !existingNote.isPinned
            },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        res.json(note);
    } catch (error) {
        console.error('Failed to toggle pin:', error);
        res.status(500).json({ error: 'Failed to toggle pin' });
    }
};
