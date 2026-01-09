import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
    uploadPreview,
    executeImport,
    getImportJob,
    getImportHistory,
    downloadTemplate,
    uploadMiddleware
} from '../controllers/import.controller';

const router = Router();

// All import routes require authentication
router.use(authenticateToken);

// --- Import Operations ---
router.post('/upload-preview', uploadMiddleware, uploadPreview);
router.post('/execute/:jobId', executeImport);
router.get('/job/:jobId', getImportJob);
router.get('/history', getImportHistory);
router.get('/template/:format', downloadTemplate);

export default router;
