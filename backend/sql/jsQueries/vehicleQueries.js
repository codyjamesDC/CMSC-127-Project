export const vehicleQueries = {
  selectAll: `SELECT v.*, CONCAT(d.fname, ' ', d.lname) AS owner_name FROM vehicle v JOIN driver d ON v.license_no = d.license_no`,
  selectByPlate: 'SELECT * FROM vehicle WHERE plate_no = ?',
  
  insert: `
    INSERT INTO vehicle 
    (plate_no, engine_no, chassis_no, ownership, vehicle_type, color, make, model, year, license_no) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  
  // Note: We typically don't update Primary Keys (plate_no, engine_no, chassis_no) once set.
  update: `
    UPDATE vehicle SET 
      plate_no=?, engine_no=?, chassis_no=?, ownership=?, vehicle_type=?, color=?, make=?, model=?, year=?, license_no=?
    WHERE plate_no = ?
  `,
  
  delete: 'DELETE FROM vehicle WHERE plate_no = ?'
};