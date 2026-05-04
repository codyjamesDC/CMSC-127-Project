import { 
  getAllVehicles, getVehicleByPlate, createVehicle, updateVehicle, deleteVehicle 
} from '../controllers/vehicleController.js';

const router = express.Router();

router.post('/vehicles', createVehicle);
router.get('/vehicles', getAllVehicles);
router.get('/vehicles/:plate_no', getVehicleByPlate);
router.put('/vehicles/:plate_no', updateVehicle);
router.delete('/vehicles/:plate_no', deleteVehicle);

export default router;