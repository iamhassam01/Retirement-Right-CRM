import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkAvailability = async (req: Request, res: Response) => {
    try {
        const { query, type } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        console.log(`Checking availability for: ${query} (Type: ${type || 'any'})`);

        // Build search condition
        let whereCondition: any = {
            isAvailable: true, // Respect the Calendar toggle
            role: 'ADVISOR'    // Only check advisors
        };

        if (type === 'name') {
            whereCondition.name = { contains: query, mode: 'insensitive' };
        } else if (type === 'title') {
            whereCondition.title = { contains: query, mode: 'insensitive' };
        } else {
            // Search both if no type specified
            whereCondition.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { title: { contains: query, mode: 'insensitive' } }
            ];
        }

        const advisor = await prisma.user.findFirst({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                phone: true,
                title: true,
                email: true,
                isAvailable: true
            }
        });

        if (advisor) {
            console.log(`Found available advisor: ${advisor.name}`);
            return res.json({
                found: true,
                isAvailable: true,
                available: true,
                name: advisor.name,
                phone: advisor.phone,
                title: advisor.title,
                email: advisor.email,
                id: advisor.id
            });
        } else {
            console.log('No available advisor found.');
            return res.json({
                found: false,
                available: false,
                message: 'No available advisor found matching criteria.'
            });
        }

    } catch (error) {
        console.error('Vapi availability check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
