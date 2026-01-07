import { Router } from 'express';
import {
    getDocuments,
    getDocument,
    createDocument,
    downloadDocument,
    deleteDocument,
    uploadMiddleware
} from '../controllers/documents.controller';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/documents - List all documents
router.get('/', getDocuments);

// GET /api/documents/:id - Get single document
router.get('/:id', getDocument);

// POST /api/documents - Upload new document
router.post('/', uploadMiddleware, createDocument);

// GET /api/documents/:id/download - Download document (legacy)
router.get('/:id/download', downloadDocument);

// GET /api/documents/:id/download/:filename - Download document with filename in URL
// This is required because Chrome's PDF viewer ignores Content-Disposition headers
// and extracts filenames from the URL path instead
router.get('/:id/download/:filename', downloadDocument);

// DELETE /api/documents/:id - Delete document
router.delete('/:id', deleteDocument);

export default router;
