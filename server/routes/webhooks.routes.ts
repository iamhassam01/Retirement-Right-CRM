import { Router } from 'express';
import { handleVapiWebhook, handleN8nWebhook } from '../controllers/webhooks.controller';

const router = Router();

// POST /api/webhooks/vapi
router.post('/vapi', handleVapiWebhook);

// POST /api/webhooks/n8n
router.post('/n8n', handleN8nWebhook);

export default router;
