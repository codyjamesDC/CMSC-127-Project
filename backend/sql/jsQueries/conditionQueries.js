export const conditionQueries = {
  // Get all conditions for a specific driver
  selectByLicense: 'SELECT `condition` FROM driver_condition WHERE license_no = ?',
  
  // Add a new condition
  insert: 'INSERT INTO driver_condition (license_no, `condition`) VALUES (?, ?)',
  
  // Delete all conditions for a driver (very useful when updating a driver's conditions)
  deleteAllForDriver: 'DELETE FROM driver_condition WHERE license_no = ?',

  // Delete a specific condition
  deleteSpecific: 'DELETE FROM driver_condition WHERE license_no = ? AND `condition` = ?'
};