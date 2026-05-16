import express from 'express';
import { 
  getAllTickets, getTicketById, createTicket, updateTicket, deleteTicket 
} from '../controllers/ticketController.js';

const router = express.Router();

router.post('/', createTicket);
router.get('/', getAllTickets);
router.get('/:ticket_id', getTicketById);
router.put('/:ticket_id', updateTicket);
router.delete('/:ticket_id', deleteTicket);

export default router;