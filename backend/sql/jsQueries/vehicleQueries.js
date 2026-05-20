export const vehicleQueries = {
  selectAll: `
    SELECT v.*, CONCAT(d.fname, ' ', d.lname) AS owner_name
    FROM vehicle v
    LEFT JOIN driver d ON v.license_no = d.license_no
  `,
  selectByPlate: `
    SELECT v.*, CONCAT(d.fname, ' ', d.lname) AS owner_name
    FROM vehicle v
    LEFT JOIN driver d ON v.license_no = d.license_no
    WHERE v.plate_no = ?
  `,
  insert: `
    INSERT INTO vehicle (plate_no, engine_no, chassis_no, ownership, vehicle_type, color, make, model, year, license_no) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  update: `
    UPDATE vehicle SET 
      engine_no=?, chassis_no=?, ownership=?, vehicle_type=?, color=?, make=?, model=?, year=?, license_no=?
    WHERE plate_no = ?
  `,
  delete: `DELETE FROM vehicle WHERE plate_no = ?`
};