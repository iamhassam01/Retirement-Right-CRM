import { Router } from 'express';
import {
    getWorkshops,
    getWorkshop,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    registerForWorkshop
} from '../controllers/workshops.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Workshop routes
router.get('/', getWorkshops);
router.get('/:id', getWorkshop);
router.post('/', createWorkshop);
router.put('/:id', updateWorkshop);
router.delete('/:id', deleteWorkshop);
router.post('/:id/register', registerForWorkshop);

export default router;
