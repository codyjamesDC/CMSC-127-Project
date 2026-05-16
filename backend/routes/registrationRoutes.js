import express from 'express';
import {
  createRegistration,
  deleteRegistration,
  getAllRegistrations,
  getRegistrationByNumber,
  getRegistrationsByVehicle,
  updateRegistration,
} from '../controllers/registrationController.js';

const router = express.Router();

router.post('/', createRegistration);
router.get('/', getAllRegistrations);
router.get('/vehicle/:plate_no', getRegistrationsByVehicle);
router.get('/:registration_no', getRegistrationByNumber);
router.put('/:registration_no', updateRegistration);
router.delete('/:registration_no', deleteRegistration);

export default router;