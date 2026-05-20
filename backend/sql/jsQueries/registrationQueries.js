export const registrationQueries = {
  selectAll: `
    SELECT
      vr.registration_no,
      vr.registration_no AS registration_number,
      vr.plate_no AS plate_number,
      vr.registration_date,
      vr.expiration_date,
      vr.plate_no,
      vr.engine_no,
      vr.chassis_no,
      v.vehicle_type,
      v.make,
      v.model,
      v.year,
      CASE
        WHEN vr.expiration_date < CURDATE() THEN 'expired'
        ELSE 'active'
      END AS registration_status
    FROM vehicle_registration vr
    LEFT JOIN vehicle v
      ON v.plate_no = vr.plate_no
     AND v.engine_no = vr.engine_no
     AND v.chassis_no = vr.chassis_no
  `,
  selectByNumber: `
    SELECT
      vr.registration_no,
      vr.registration_no AS registration_number,
      vr.registration_date,
      vr.expiration_date,
      vr.plate_no,
      vr.engine_no,
      vr.chassis_no,
      v.vehicle_type,
      v.make,
      v.model,
      v.year,
      CASE
        WHEN vr.expiration_date < CURDATE() THEN 'expired'
        ELSE 'active'
      END AS registration_status
    FROM vehicle_registration vr
    LEFT JOIN vehicle v
      ON v.plate_no = vr.plate_no
     AND v.engine_no = vr.engine_no
     AND v.chassis_no = vr.chassis_no
    WHERE vr.registration_no = ?
  `,
  selectByPlate: 'SELECT * FROM vehicle_registration WHERE plate_no = ?',
  
  insert: `
    INSERT INTO vehicle_registration 
    (registration_no, expiration_date, registration_date, plate_no, engine_no, chassis_no) 
    VALUES (?, ?, ?, ?, ?, ?)
  `,

  update: `
    UPDATE vehicle_registration SET
      registration_no = ?,
      expiration_date = ?,
      registration_date = ?,
      plate_no = ?,
      engine_no = ?,
      chassis_no = ?
    WHERE registration_no = ?
  `,

  delete: 'DELETE FROM vehicle_registration WHERE registration_no = ?',
  
  deleteAllForVehicle: 'DELETE FROM vehicle_registration WHERE plate_no = ?'
};