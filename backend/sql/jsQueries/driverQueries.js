// backend/sql/jsQueries/driverQueries.js
export const driverQueries = {
  // READ
  selectAll: `
      SELECT *, CONCAT(fname, ' ', COALESCE(mname, ''), ' ', lname) AS full_name 
      FROM driver
    `,
    selectByLicense: `
      SELECT *, CONCAT(fname, ' ', COALESCE(mname, ''), ' ', lname) AS full_name 
      FROM driver WHERE license_no = ?
    `,
  
  // CREATE
  insert: `
    INSERT INTO driver (
      license_no, fname, lname, mname, bday, sex, nationality, height_cm, weight_kg, 
      eye_color, blood_type, contact_no, organ_donor, mother_fname, mother_lname, mother_mname, 
      father_fname, father_lname, father_mname, emrg_contact_person, emrg_contact_no, 
      license_type, license_status, issued_date, expiry_date, agency_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  
  // UPDATE
  update: `
    UPDATE driver SET 
      license_no=?, fname=?, lname=?, mname=?, bday=?, sex=?, nationality=?, height_cm=?, weight_kg=?, 
      eye_color=?, blood_type=?, contact_no=?, organ_donor=?, mother_fname=?, mother_lname=?, mother_mname=?, 
      father_fname=?, father_lname=?, father_mname=?, emrg_contact_person=?, emrg_contact_no=?, 
      license_type=?, license_status=?, issued_date=?, expiry_date=?, agency_code=?
    WHERE license_no = ?
  `,
  
  // DELETE
  delete: 'DELETE FROM driver WHERE license_no = ?'
};