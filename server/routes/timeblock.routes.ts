import { Router } from 'express';
import {
    getTimeBlocks,
    getTimeBlocksForUser,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock
} from '../controllers/timeblock.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user's time blocks
router.get('/', getTimeBlocks);

// Get another user's time blocks (for team scheduling)
router.get('/user/:userId', getTimeBlocksForUser);

// Create, update, delete
router.post('/', createTimeBlock);
router.put('/:id', updateTimeBlock);
router.delete('/:id', deleteTimeBlock);

export default router;
