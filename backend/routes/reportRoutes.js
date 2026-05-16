
import express from 'express';
import {
  getFilteredDrivers,
  getVehiclesByDriver,
  getExpiredRegistrations,
  getDriversByLicenseStatus,
  getDriverViolationsByDate,
  getViolationSummaryByYear,
  getViolationsByLocation
} from '../controllers/reportController.js';

const router = express.Router();

router.get('/reports/drivers', getFilteredDrivers);
router.get('/reports/vehicles/driver/:license_no', getVehiclesByDriver);
router.get('/reports/registrations/expired', getExpiredRegistrations);
router.get('/reports/drivers/expired-licenses', getDriversByLicenseStatus);
router.get('/reports/violations/driver/:license_no', getDriverViolationsByDate);
router.get('/reports/violations/by-type', getViolationSummaryByYear);
router.get('/reports/vehicles/violations', getViolationsByLocation);

export default router;