import { Router } from 'express';
import {
    getOccurrences,
    getOccurrence,
    createOccurrence,
    updateOccurrence,
    deleteOccurrence,
    syncOccurrence,
    bulkCreateOccurrences,
    getUpcomingOccurrences,
} from '../controllers/eventOccurrences.controller';

const router = Router();

// Get upcoming occurrences across all templates
router.get('/upcoming', getUpcomingOccurrences);

// Single occurrence operations
router.get('/:id', getOccurrence);
router.put('/:id', updateOccurrence);
router.delete('/:id', deleteOccurrence);
router.post('/:id/sync', syncOccurrence);

// Template-scoped occurrence operations
router.get('/template/:templateId', getOccurrences);
router.post('/template/:templateId', createOccurrence);
router.post('/template/:templateId/bulk', bulkCreateOccurrences);

export default router;
