import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Get all team members
export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        const members = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { name: 'asc' }
        });

        res.json(members);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
};

// Get single team member
export const getTeamMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const member = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!member) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        res.json(member);
    } catch (error) {
        console.error('Error fetching team member:', error);
        res.status(500).json({ error: 'Failed to fetch team member' });
    }
};

// Invite new team member (create user)
export const inviteTeamMember = async (req: Request, res: Response) => {
    try {
        const { name, email, role } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Create user with temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const member = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'STAFF'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        // In production, send invitation email with temp password
        console.log(`Invited ${email} with temporary password: ${tempPassword}`);

        res.status(201).json({
            ...member,
            message: 'User created. In production, an invitation email would be sent.'
        });
    } catch (error) {
        console.error('Error inviting team member:', error);
        res.status(500).json({ error: 'Failed to invite team member' });
    }
};

// Update team member role
export const updateTeamMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, role } = req.body;

        const member = await prisma.user.update({
            where: { id },
            data: {
                name,
                role
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                updatedAt: true
            }
        });

        res.json(member);
    } catch (error) {
        console.error('Error updating team member:', error);
        res.status(500).json({ error: 'Failed to update team member' });
    }
};

// Delete team member
export const deleteTeamMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = (req as any).user?.userId;

        // Prevent self-deletion
        if (id === currentUserId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({ where: { id } });
        res.json({ message: 'Team member removed successfully' });
    } catch (error) {
        console.error('Error deleting team member:', error);
        res.status(500).json({ error: 'Failed to delete team member' });
    }
};
