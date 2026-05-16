import express from 'express';
import { 
  getAllVehicles, getVehicleByPlate, createVehicle, updateVehicle, deleteVehicle 
} from '../controllers/vehicleController.js';

const router = express.Router();

router.post('/', createVehicle);
router.get('/', getAllVehicles);
router.get('/:plate_no', getVehicleByPlate);
router.put('/:plate_no', updateVehicle);
router.delete('/:plate_no', deleteVehicle);

export default router;