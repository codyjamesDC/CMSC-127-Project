
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
router.get('/reports/drivers/:license_no/vehicles', getVehiclesByDriver);
router.get('/reports/vehicles/expired-registrations', getExpiredRegistrations);
router.get('/reports/drivers/license-status', getDriversByLicenseStatus);
router.get('/reports/drivers/:license_no/violations', getDriverViolationsByDate);
router.get('/reports/violations/summary', getViolationSummaryByYear);
router.get('/reports/violations/locations', getViolationsByLocation);

export default router;