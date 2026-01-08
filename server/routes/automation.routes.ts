import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getAutomationLogs,
    sendEmails
} from '../controllers/automation.controller';

const router = express.Router();

// Templates Management
router.get('/templates', authenticateToken, getTemplates);
router.get('/templates/:id', authenticateToken, getTemplate);
router.post('/templates', authenticateToken, createTemplate);
router.put('/templates/:id', authenticateToken, updateTemplate);
router.delete('/templates/:id', authenticateToken, deleteTemplate);

// Automation Logs
router.get('/logs', authenticateToken, getAutomationLogs);

// Send Emails via n8n
router.post('/send', authenticateToken, sendEmails);

export default router;
