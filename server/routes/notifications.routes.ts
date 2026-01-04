import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotificationAPI
} from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.post('/', createNotificationAPI); // For admin/testing

export default router;
