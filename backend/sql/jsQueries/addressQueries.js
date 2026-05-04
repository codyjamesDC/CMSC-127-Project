export const addressQueries = {
  selectByLicense: 'SELECT address FROM driver_address WHERE license_no = ?',
  insert: 'INSERT INTO driver_address (license_no, address) VALUES (?, ?)',
  deleteAllForDriver: 'DELETE FROM driver_address WHERE license_no = ?'
};