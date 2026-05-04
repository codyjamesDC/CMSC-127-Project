export const licenseCodeQueries = {
  // Get all codes for a specific driver
  selectByLicense: 'SELECT license_code FROM driver_license_code WHERE license_no = ?',
  
  // Add a new code
  insert: 'INSERT INTO driver_license_code (license_no, license_code) VALUES (?, ?)',
  
  // Delete all codes for a driver (for updates)
  deleteAllForDriver: 'DELETE FROM driver_license_code WHERE license_no = ?'
};