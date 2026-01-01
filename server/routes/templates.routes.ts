import { Router } from 'express';
import {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getCommunicationLogs,
    logCommunication
} from '../controllers/templates.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Template routes
router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Communication log routes
router.get('/logs/all', getCommunicationLogs);
router.post('/logs', logCommunication);

export default router;
