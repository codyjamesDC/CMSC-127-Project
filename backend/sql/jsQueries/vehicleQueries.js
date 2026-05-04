export const vehicleQueries = {
  selectAll: 'SELECT * FROM vehicle',
  selectByPlate: 'SELECT * FROM vehicle WHERE plate_no = ?',
  
  insert: `
    INSERT INTO vehicle 
    (plate_no, engine_no, chassis_no, ownership, vehicle_type, color, make, model, year, license_no) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  
  // Note: We typically don't update Primary Keys (plate_no, engine_no, chassis_no) once set.
  update: `
    UPDATE vehicle SET 
      ownership=?, vehicle_type=?, color=?, make=?, model=?, year=?, license_no=? 
    WHERE plate_no = ?
  `,
  
  delete: 'DELETE FROM vehicle WHERE plate_no = ?'
};