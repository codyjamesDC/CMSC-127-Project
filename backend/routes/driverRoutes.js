import express from 'express';
import { 
  getAllDrivers, 
  getDriverByLicense, 
  createDriver, 
  updateDriver, 
  deleteDriver 
} from '../controllers/driverController.js';

const router = express.Router();

router.post('/drivers', createDriver);
router.get('/drivers', getAllDrivers);
router.get('/drivers/:license_no', getDriverByLicense);
router.put('/drivers/:license_no', updateDriver);
router.delete('/drivers/:license_no', deleteDriver);

export default router;