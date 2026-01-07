import { Router } from 'express';
import { checkAvailability } from '../controllers/vapi.controller';

const router = Router();

// POST /api/vapi/availability
router.post('/availability', checkAvailability);

export default router;
