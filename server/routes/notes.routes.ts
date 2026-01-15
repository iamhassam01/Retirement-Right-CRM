import { Router } from 'express';
import {
    getNotesByClient,
    createNote,
    updateNote,
    deleteNote,
    togglePin
} from '../controllers/notes.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// GET /api/notes/client/:clientId - Get all notes for a client
router.get('/client/:clientId', getNotesByClient);

// POST /api/notes - Create a new note
router.post('/', createNote);

// PUT /api/notes/:id - Update a note
router.put('/:id', updateNote);

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', deleteNote);

// PUT /api/notes/:id/pin - Toggle pin status
router.put('/:id/pin', togglePin);

export default router;
