export const registrationQueries = {
  selectByPlate: 'SELECT * FROM vehicle_registration WHERE plate_no = ?',
  
  insert: `
    INSERT INTO vehicle_registration 
    (registration_no, expiration_date, registration_date, plate_no, engine_no, chassis_no) 
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  
  deleteAllForVehicle: 'DELETE FROM vehicle_registration WHERE plate_no = ?'
};