import pool from '../config/db.js';
import { reportQueries } from '../sql/jsQueries/reportQueries.js';

// 1. View all registered drivers filtered by: License type, License status, Age range, Sex
// Example: GET /reports/drivers?type=Non-Professional&status=Active&sex=M&minAge=20&maxAge=40
// Inside your reportsController.js

export const getFilteredDrivers = async (req, res) => {
  try {
    const { sql, params } = reportQueries.buildFilteredDriversQuery(req.query);
    const [rows] = await pool.query(sql, params);
    
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching filtered drivers:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// 2. View all vehicles owned by a given driver
// Example: GET /reports/drivers/P02-22-654321/vehicles
export const getVehiclesByDriver = async (req, res) => {
  try {
    const { license_no } = req.params;
    const [rows] = await pool.query(reportQueries.vehiclesByDriver, [license_no]);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// 3. View all vehicles with expired registrations as of a given date
// Example: GET /reports/vehicles/expired-registrations?date=2024-12-31
export const getExpiredRegistrations = async (req, res) => {
  try {
    // If no date is provided, default to today's date
    const targetDate = req.query.date || new Date().toISOString().split('T')[0]; 
    const [rows] = await pool.query(reportQueries.expiredRegistrations, [targetDate]);
    res.status(200).json({ success: true, count: rows.length, targetDate, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// 4. View all drivers with expired or suspended licenses
// Example: GET /reports/drivers/license-status?statuses=Expired,Suspended
export const getDriversByLicenseStatus = async (req, res) => {
  try {
    // Expects a comma-separated string like "Expired,Suspended"
    const statusesString = req.query.statuses || 'Expired,Suspended'; 
    const statusesArray = statusesString.split(',');

    // We use pool.query formatting feature for arrays in IN clauses
    const [rows] = await pool.query('SELECT * FROM vw_driver_license_status WHERE license_status IN (?)', [statusesArray]);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// 5. View all traffic violations committed by a given driver within a specified date range
// Example: GET /reports/drivers/N01-23-456789/violations?startDate=2024-01-01&endDate=2024-04-30
export const getDriverViolationsByDate = async (req, res) => {
  try {
    const { license_no } = req.params;
    const startDate = req.query.startDate || req.query.from;
    const endDate = req.query.endDate || req.query.to;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing startDate or endDate query parameters' });
    }

    const [rows] = await pool.query(reportQueries.driverViolationsByDate, [license_no, startDate, endDate]);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// 6. View the total number of violations per violation type for a given year
// Example: GET /reports/violations/summary?year=2024
export const getViolationSummaryByYear = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const [rows] = await pool.query(reportQueries.violationSummaryByYear, [year]);
    res.status(200).json({ success: true, year, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// 7. View all vehicles involved in violations within a given city or region
// Example: GET /reports/violations/locations?city=Makati
export const getViolationsByLocation = async (req, res) => {
  try {
    const city = req.query.city || req.query.location;
    if (!city) {
      return res.status(400).json({ success: false, message: 'Missing city or location query parameter' });
    }

    // Add SQL wildcards to search for the city anywhere in the location string
    const searchString = `%${city}%`; 
    const [rows] = await pool.query(reportQueries.violationsByLocation, [searchString]);
    
    res.status(200).json({ success: true, count: rows.length, searchString: city, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};