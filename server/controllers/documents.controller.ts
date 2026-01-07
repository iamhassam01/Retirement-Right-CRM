import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

export const uploadMiddleware = upload.single('file');

// Get all documents with optional filtering
export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { category, clientId } = req.query;

        const where: any = {};
        if (category) where.category = category;
        if (clientId) where.clientId = clientId;

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

// Get single document
export const getDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                client: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
};

// Upload new document
export const createDocument = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { category, clientId } = req.body;

        // Calculate file size string
        const fileSizeBytes = req.file.size;
        let sizeStr = '';
        if (fileSizeBytes < 1024) {
            sizeStr = `${fileSizeBytes} B`;
        } else if (fileSizeBytes < 1024 * 1024) {
            sizeStr = `${(fileSizeBytes / 1024).toFixed(1)} KB`;
        } else {
            sizeStr = `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        }

        // Determine file type
        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

        const document = await prisma.document.create({
            data: {
                name: req.file.originalname,
                type: ext,
                size: sizeStr,
                url: `/uploads/${req.file.filename}`,
                category: category || 'Internal',
                clientId: clientId || null
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

// Download document
export const downloadDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const { inline } = req.query;

        // Get absolute file path
        const filePath = path.join(process.cwd(), document.url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        const filename = document.name || 'document.pdf';

        if (inline === 'true') {
            // Force inline for preview (iframe)
            // Manually set content-disposition to ensure spaces/special chars are handled securely is better, 
            // but standard header is fine for now. Quotes are important.
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

            // Allow content-type to be auto-detected by sendFile based on extension
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error sending file (inline):', err);
                    if (!res.headersSent) res.status(500).json({ error: 'Failed to preview document' });
                }
            });
        } else {
            // Force attachment for download
            res.download(filePath, filename, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Failed to download document' });
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
};

// Delete document
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete file from disk
        const filePath = path.join(process.cwd(), document.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await prisma.document.delete({
            where: { id }
        });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};
