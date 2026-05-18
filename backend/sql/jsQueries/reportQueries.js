export const reportQueries = {
  // 1. Filtered drivers
  // Uses TIMESTAMPDIFF to calculate age dynamically from date_of_birth.
  // Checks if the parameter is an empty string first; if it is, it skips the filter.
  filteredDrivers: `
    SELECT * FROM driver 
    WHERE (? = '' OR license_type = ?)
      AND (? = '' OR license_status = ?)
      AND (? = '' OR sex = ?)
      AND (? = '' OR TIMESTAMPDIFF(YEAR, bday, CURDATE()) >= ?)
      AND (? = '' OR TIMESTAMPDIFF(YEAR, bday, CURDATE()) <= ?)
  `,
  
  // 2. Vehicles owned by driver
  vehiclesByDriver: `SELECT * FROM vw_vehicle_ownership WHERE license_no = ?`,
  
  // 3. Expired registrations as of a specific date
  expiredRegistrations: `SELECT * FROM vw_vehicle_registrations WHERE expiration_date <= ?`,
  
  // 4. Drivers with specific license statuses 
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