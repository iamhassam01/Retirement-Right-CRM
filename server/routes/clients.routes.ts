import { Router } from 'express';
import {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getNextClientId,
    validateClientId
} from '../controllers/clients.controller';
import {
    addPhone,
    updatePhone,
    deletePhone,
    setPrimaryPhone,
    addEmail,
    updateEmail,
    deleteEmail,
    setPrimaryEmail
} from '../controllers/contacts.controller';

const router = Router();

// --- Client CRUD ---
router.get('/', getClients);
router.get('/next-id', getNextClientId);
router.get('/validate-id/:clientId', validateClientId);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// --- Phone Management ---
router.post('/:clientId/phones', addPhone);
router.put('/phones/:phoneId', updatePhone);
router.delete('/phones/:phoneId', deletePhone);
router.put('/:clientId/phones/:phoneId/primary', setPrimaryPhone);

// --- Email Management ---
router.post('/:clientId/emails', addEmail);
router.put('/emails/:emailId', updateEmail);
router.delete('/emails/:emailId', deleteEmail);
router.put('/:clientId/emails/:emailId/primary', setPrimaryEmail);

export default router;
