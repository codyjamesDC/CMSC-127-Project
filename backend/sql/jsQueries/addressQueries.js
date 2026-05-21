export const addressQueries = {
  selectByLicense: 'SELECT street, barangay, city, province, zip_code FROM driver_address WHERE license_no = ?',
  insert: 'INSERT INTO driver_address (license_no, street, barangay, city, province, zip_code) VALUES (?, ?, ?, ?, ?, ?)',
  deleteAllForDriver: 'DELETE FROM driver_address WHERE license_no = ?'
};