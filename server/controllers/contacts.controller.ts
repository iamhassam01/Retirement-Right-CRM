import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// PHONE MANAGEMENT
// ==========================================

// --- Add Phone to Client ---
export const addPhone = async (req: Request, res: Response) => {
    try {
        const { clientId } = req.params;
        const { number, type, label, isPrimary } = req.body;

        // If setting as primary, clear other primary phones first
        if (isPrimary) {
            await prisma.clientPhone.updateMany({
                where: { clientId },
                data: { isPrimary: false }
            });
        }

        const phone = await prisma.clientPhone.create({
            data: {
                clientId,
                number,
                type: type || 'MOBILE',
                label,
                isPrimary: isPrimary ?? false
            }
        });

        res.json(phone);
    } catch (error) {
        console.error('Failed to add phone:', error);
        res.status(500).json({ error: 'Failed to add phone' });
    }
};

// --- Update Phone ---
export const updatePhone = async (req: Request, res: Response) => {
    try {
        const { phoneId } = req.params;
        const { number, type, label, isPrimary } = req.body;

        // Get current phone to get clientId
        const currentPhone = await prisma.clientPhone.findUnique({
            where: { id: phoneId }
        });

        if (!currentPhone) {
            return res.status(404).json({ error: 'Phone not found' });
        }

        // If setting as primary, clear other primary phones first
        if (isPrimary && !currentPhone.isPrimary) {
            await prisma.clientPhone.updateMany({
                where: {
                    clientId: currentPhone.clientId,
                    id: { not: phoneId }
                },
                data: { isPrimary: false }
            });
        }

        const phone = await prisma.clientPhone.update({
            where: { id: phoneId },
            data: {
                number,
                type,
                label,
                isPrimary
            }
        });

        res.json(phone);
    } catch (error) {
        console.error('Failed to update phone:', error);
        res.status(500).json({ error: 'Failed to update phone' });
    }
};

// --- Delete Phone ---
export const deletePhone = async (req: Request, res: Response) => {
    try {
        const { phoneId } = req.params;

        // Check if this is the primary phone
        const phone = await prisma.clientPhone.findUnique({
            where: { id: phoneId }
        });

        if (!phone) {
            return res.status(404).json({ error: 'Phone not found' });
        }

        await prisma.clientPhone.delete({
            where: { id: phoneId }
        });

        // If deleted phone was primary, set another one as primary
        if (phone.isPrimary) {
            const nextPhone = await prisma.clientPhone.findFirst({
                where: { clientId: phone.clientId },
                orderBy: { createdAt: 'asc' }
            });

            if (nextPhone) {
                await prisma.clientPhone.update({
                    where: { id: nextPhone.id },
                    data: { isPrimary: true }
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete phone:', error);
        res.status(500).json({ error: 'Failed to delete phone' });
    }
};

// --- Set Primary Phone ---
export const setPrimaryPhone = async (req: Request, res: Response) => {
    try {
        const { clientId, phoneId } = req.params;

        // Clear all primary flags for this client
        await prisma.clientPhone.updateMany({
            where: { clientId },
            data: { isPrimary: false }
        });

        // Set the new primary
        const phone = await prisma.clientPhone.update({
            where: { id: phoneId },
            data: { isPrimary: true }
        });

        res.json(phone);
    } catch (error) {
        console.error('Failed to set primary phone:', error);
        res.status(500).json({ error: 'Failed to set primary phone' });
    }
};

// ==========================================
// EMAIL MANAGEMENT
// ==========================================

// --- Add Email to Client ---
export const addEmail = async (req: Request, res: Response) => {
    try {
        const { clientId } = req.params;
        const { email, type, label, isPrimary } = req.body;

        // If setting as primary, clear other primary emails first
        if (isPrimary) {
            await prisma.clientEmail.updateMany({
                where: { clientId },
                data: { isPrimary: false }
            });
        }

        const newEmail = await prisma.clientEmail.create({
            data: {
                clientId,
                email,
                type: type || 'PERSONAL',
                label,
                isPrimary: isPrimary ?? false
            }
        });

        res.json(newEmail);
    } catch (error) {
        console.error('Failed to add email:', error);
        res.status(500).json({ error: 'Failed to add email' });
    }
};

// --- Update Email ---
export const updateEmail = async (req: Request, res: Response) => {
    try {
        const { emailId } = req.params;
        const { email, type, label, isPrimary } = req.body;

        // Get current email to get clientId
        const currentEmail = await prisma.clientEmail.findUnique({
            where: { id: emailId }
        });

        if (!currentEmail) {
            return res.status(404).json({ error: 'Email not found' });
        }

        // If setting as primary, clear other primary emails first
        if (isPrimary && !currentEmail.isPrimary) {
            await prisma.clientEmail.updateMany({
                where: {
                    clientId: currentEmail.clientId,
                    id: { not: emailId }
                },
                data: { isPrimary: false }
            });
        }

        const updatedEmail = await prisma.clientEmail.update({
            where: { id: emailId },
            data: {
                email,
                type,
                label,
                isPrimary
            }
        });

        res.json(updatedEmail);
    } catch (error) {
        console.error('Failed to update email:', error);
        res.status(500).json({ error: 'Failed to update email' });
    }
};

// --- Delete Email ---
export const deleteEmail = async (req: Request, res: Response) => {
    try {
        const { emailId } = req.params;

        // Check if this is the primary email
        const email = await prisma.clientEmail.findUnique({
            where: { id: emailId }
        });

        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }

        await prisma.clientEmail.delete({
            where: { id: emailId }
        });

        // If deleted email was primary, set another one as primary
        if (email.isPrimary) {
            const nextEmail = await prisma.clientEmail.findFirst({
                where: { clientId: email.clientId },
                orderBy: { createdAt: 'asc' }
            });

            if (nextEmail) {
                await prisma.clientEmail.update({
                    where: { id: nextEmail.id },
                    data: { isPrimary: true }
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete email:', error);
        res.status(500).json({ error: 'Failed to delete email' });
    }
};

// --- Set Primary Email ---
export const setPrimaryEmail = async (req: Request, res: Response) => {
    try {
        const { clientId, emailId } = req.params;

        // Clear all primary flags for this client
        await prisma.clientEmail.updateMany({
            where: { clientId },
            data: { isPrimary: false }
        });

        // Set the new primary
        const email = await prisma.clientEmail.update({
            where: { id: emailId },
            data: { isPrimary: true }
        });

        res.json(email);
    } catch (error) {
        console.error('Failed to set primary email:', error);
        res.status(500).json({ error: 'Failed to set primary email' });
    }
};
