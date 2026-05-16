import express from 'express';
import { 
  getAllDrivers, 
  getDriverByLicense, 
  createDriver, 
  updateDriver, 
  deleteDriver 
} from '../controllers/driverController.js';

const router = express.Router();

router.post('/', createDriver);
router.get('/', getAllDrivers);
router.get('/:license_no', getDriverByLicense);
router.put('/:license_no', updateDriver);
router.delete('/:license_no', deleteDriver);

export default router;