import { Router } from 'express';
import {
    getEventTemplates,
    getEventTemplate,
    createEventTemplate,
    updateEventTemplate,
    deleteEventTemplate,
    syncTemplateToWordPress,
} from '../controllers/eventTemplates.controller';

const router = Router();

// Template CRUD
router.get('/', getEventTemplates);
router.get('/:id', getEventTemplate);
router.post('/', createEventTemplate);
router.put('/:id', updateEventTemplate);
router.delete('/:id', deleteEventTemplate);

// WordPress sync
router.post('/:id/sync', syncTemplateToWordPress);

export default router;
