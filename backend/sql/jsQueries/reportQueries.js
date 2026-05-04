export const reportQueries = {
  // 1. Filtered drivers
  filteredDrivers: `
    SELECT * FROM vw_driver_info 
    WHERE license_type = ? AND license_status = ? AND sex = ? AND age BETWEEN ? AND ?
  `,
  
  // 2. Vehicles owned by driver
  vehiclesByDriver: `SELECT * FROM vw_vehicle_ownership WHERE license_no = ?`,
  
  // 3. Expired registrations as of a specific date
  expiredRegistrations: `SELECT * FROM vw_vehicle_registrations WHERE expiration_date <= ?`,
  
  // 4. Drivers with specific license statuses (using FIND_IN_SET for flexibility, or just an IN clause built dynamically)
  // For simplicity, we'll check against a single status or build the IN clause in the controller.
  driversByStatus: `SELECT * FROM vw_driver_license_status WHERE license_status IN (?)`,
  
  // 5. Driver violations within a date range
  driverViolationsByDate: `
    SELECT * FROM vw_violation_history 
    WHERE license_no = ? AND date BETWEEN ? AND ?
  `,
  
  // 6. Violation summary by year
  violationSummaryByYear: `
    SELECT violation_name, COUNT(*) AS total_count 
    FROM vw_violation_summary 
    WHERE YEAR(date) = ? 
    GROUP BY violation_name
  `,
  
  // 7. Vehicles involved in violations in a specific location
  violationsByLocation: `
    SELECT * FROM vw_vehicle_violation_locations 
    WHERE location LIKE ?
  `
};