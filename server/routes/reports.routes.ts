import { Router } from 'express';
import { getReportsOverview, getAcquisitionStats } from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/reports/overview - Get reports dashboard data
router.get('/overview', getReportsOverview);

// GET /api/reports/acquisition - Get client acquisition stats
router.get('/acquisition', getAcquisitionStats);

export default router;
