export const reportQueries = {
  // 1. Filtered drivers
  // Uses TIMESTAMPDIFF to calculate age dynamically from date_of_birth.
  // Checks if the parameter is an empty string first; if it is, it skips the filter.
//Query Builder
  buildFilteredDriversQuery: (filters) => {
    const conditions = ['1 = 1'];
    const params = [];
    if (filters.license_type)  { conditions.push('license_type = ?');  params.push(filters.license_type); }
    if (filters.license_status){ conditions.push('license_status = ?'); params.push(filters.license_status); }
    if (filters.sex)           { conditions.push('sex = ?');            params.push(filters.sex); }
    if (filters.age_min)       { conditions.push('TIMESTAMPDIFF(YEAR, bday, CURDATE()) >= ?'); params.push(parseInt(filters.age_min)); }
    if (filters.age_max)       { conditions.push('TIMESTAMPDIFF(YEAR, bday, CURDATE()) <= ?'); params.push(parseInt(filters.age_max)); }
    
    return {
      sql: `SELECT * FROM vw_driver_info WHERE ${conditions.join(' AND ')}`,
      params
    };
  }, 
  
  // 2. Vehicles owned by driver
  vehiclesByDriver: `SELECT * FROM vw_vehicle_ownership WHERE license_no = ?`,
  
  // 3. Expired registrations as of a specific date
  expiredRegistrations: `SELECT * FROM vw_vehicle_registrations WHERE expiration_date <= ?`,
  
  // 4. Drivers with specific license statuses 
  driversByStatus: `SELECT * FROM vw_driver_license_status WHERE license_status IN (?)`,
  
  // 5. Driver violations within a date range
driverViolationsByDate: `
  SELECT
    vt.ticket_id,
    vt.location,
    vt.date,
    vt.violation_status,
    vt.apprehending_officer,
    vt.plate_no,
    v.violation_name,
    v.fine_amount
  FROM violation_ticket vt
  JOIN violation v ON v.ticket_id = vt.ticket_id
  WHERE vt.license_no = ?
    AND vt.date BETWEEN ? AND ?
  ORDER BY vt.date ASC
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