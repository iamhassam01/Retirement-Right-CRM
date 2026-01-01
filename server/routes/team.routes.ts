import { Router } from 'express';
import {
    getTeamMembers,
    getTeamMember,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember
} from '../controllers/team.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Team routes
router.get('/', getTeamMembers);
router.get('/:id', getTeamMember);
router.post('/', inviteTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
