import { Router } from 'express';
import {
    getTeamMembers,
    getTeamMember,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember,
    getAvailability,
    setAvailability,
    getMyAvailability
} from '../controllers/team.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// --- PUBLIC ROUTE (no auth) for Vapi to check availability ---
router.get('/availability', getAvailability);

// --- Protected Routes (require authentication) ---
router.use(authenticateToken);

// Current user's availability
router.get('/my-availability', getMyAvailability);
router.put('/availability', setAvailability);

// Team CRUD routes
router.get('/', getTeamMembers);
router.get('/:id', getTeamMember);
router.post('/', inviteTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
