import { Router } from 'express';
import {
    getSettings,
    getSetting,
    updateSetting,
    updateSettings,
    initializeDefaults
} from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Settings routes
router.get('/', getSettings);
router.get('/:key', getSetting);
router.put('/:key', updateSetting);
router.post('/bulk', updateSettings);
router.post('/init', initializeDefaults);

export default router;
