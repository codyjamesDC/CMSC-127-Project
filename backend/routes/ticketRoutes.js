import express from 'express';
import { 
  getAllTickets, getTicketById, createTicket, updateTicket, deleteTicket 
} from '../controllers/ticketController.js';

const router = express.Router();

router.post('/tickets', createTicket);
router.get('/tickets', getAllTickets);
router.get('/tickets/:ticket_id', getTicketById);
router.put('/tickets/:ticket_id', updateTicket);
router.delete('/tickets/:ticket_id', deleteTicket);

export default router;