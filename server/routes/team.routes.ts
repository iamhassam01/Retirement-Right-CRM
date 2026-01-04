import { Router } from 'express';
import {
    getTeamMembers,
    getTeamMember,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember,
    getAvailability,
    setAvailability,
    getMyAvailability,
    getAdvisorByName
} from '../controllers/team.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// --- PUBLIC ROUTES (no auth) for Vapi/n8n integration ---
router.get('/availability', getAvailability);
router.get('/advisor', getAdvisorByName);  // For transfer call: lookup advisor by name

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
