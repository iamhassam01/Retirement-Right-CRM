import { Router } from 'express';
import { getActivitiesByClient, getAllActivities, createActivity } from '../controllers/activities.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllActivities);
router.get('/client/:clientId', getActivitiesByClient);
router.post('/', createActivity);

export default router;
