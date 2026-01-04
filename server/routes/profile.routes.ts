import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    changePassword,
    updateAvatar
} from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.put('/avatar', updateAvatar);

export default router;
