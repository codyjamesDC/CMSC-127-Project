import pool from '../config/db.js';
import { driverQueries } from '../sql/jsQueries/driverQueries.js';
import { conditionQueries } from '../sql/jsQueries/conditionQueries.js';
import { licenseCodeQueries } from '../sql/jsQueries/licenseCodeQueries.js';
import { addressQueries } from '../sql/jsQueries/addressQueries.js';

// ==========================================
// READ: Get all drivers
// ==========================================
export const getAllDrivers = async (req, res) => {
  try {
    const [rows] = await pool.query(driverQueries.selectAll);
    
    // Grouping rows by license_no to handle potential multiple addresses
    const drivers = rows.reduce((acc, current) => {
      const x = acc.find(item => item.license_no === current.license_no);
      if (!x) {
        // If driver doesn't exist in accumulator, add them
        acc.push({ ...current });
      } else if (current.address) {
        // If driver exists, append additional address if available
        x.address = `${x.address} / ${current.address}`;
      }
      return acc;
    }, []);

    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// READ: Get a single driver
// ==========================================
export const getDriverByLicense = async (req, res) => {
  try {
    const { license_no } = req.params;
    
    // 1. Get Driver
    const [driverRows] = await pool.query(driverQueries.selectByLicense, [license_no]);
    if (driverRows.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
    const driver = driverRows[0];

    // 2. Get Conditions
    const [conditionRows] = await pool.query(conditionQueries.selectByLicense, [license_no]);
    driver.conditions = conditionRows.map(row => row.condition);

    // 3. Get License Codes 
    const [codeRows] = await pool.query(licenseCodeQueries.selectByLicense, [license_no]);
    driver.license_codes = codeRows.map(row => row.license_code);

    // 4. Get Addresses (NEW)
    const [addressRows] = await pool.query(addressQueries.selectByLicense, [license_no]);
    driver.addresses = addressRows.map(row => row.address);
    
    res.status(200).json({ success: true, data: driver });

  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==========================================
// CREATE: Add a new driver
// ==========================================

export const createDriver = async (req, res) => {
  const conn = await pool.getConnection(); // Use a connection for transactions
  try {
    await conn.beginTransaction();
    
    // Extract address along with other fields
    const {
      license_number, full_name, date_of_birth, sex, address,
      license_type, license_status, issue_date, expiration_date
    } = req.body;

    const nameParts = full_name.split(' ');
    const fname = nameParts[0] || 'Unknown';
    const lname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

    // 1. Insert into 'driver' table
    // Note: providing defaults for required fields not in your current form
    const driverValues = [
      license_number, fname, lname, '', date_of_birth, sex, 
      'Filipino', 0, 0, 'Brown', 'O+', '09000000000', 0, 
      'Mother', 'Name', '', 'Father', 'Name', '', 
      'Emergency', '09000000000', license_type, license_status, 
      issue_date, expiration_date, 'LTO-NCR'
    ];
    await conn.query(driverQueries.insert, driverValues);

    // 2. Insert into 'driver_address' table
    if (address) {
      await conn.query('INSERT INTO driver_address (license_no, address) VALUES (?, ?)', [license_number, address]);
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Driver and Address created' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// ==========================================
// UPDATE: Modify an existing driver
// ==========================================

export const updateDriver = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { license_no } = req.params;
    const {
      full_name, date_of_birth, sex, address,
      license_type, license_status, issue_date, expiration_date
    } = req.body;

    // Helper to strip ISO time (T00:00:00.000Z) so MariaDB accepts the date
    const formatDate = (dateStr) => dateStr ? dateStr.split('T')[0] : null;

    const nameParts = (full_name || '').split(' ');
    const fname = nameParts[0] || 'Unknown';
    const lname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

    const values = [
      fname, lname, '', 
      formatDate(date_of_birth), sex, // Cleaned date
      'Filipino', 0, 0, 'Brown', 'O+', '09000000000', 0, 
      'Mother', 'Name', '', 'Father', 'Name', '', 
      'Emergency', '09000000000', 
      license_type, license_status, 
      formatDate(issue_date),        // Cleaned date
      formatDate(expiration_date),   // Cleaned date
      'LTO-NCR',
      license_no 
    ];

    const [result] = await conn.query(driverQueries.update, values);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // 2. Update Address (Wipe and replace for simplicity)
    if (address) {
      await conn.query('DELETE FROM driver_address WHERE license_no = ?', [license_no]);
      await conn.query('INSERT INTO driver_address (license_no, address) VALUES (?, ?)', [license_no, address]);
    }

    await conn.commit();
    res.status(200).json({ success: true, message: 'Driver updated successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// ==========================================
// DELETE: Remove a driver
// ==========================================
export const deleteDriver = async (req, res) => {
  try {
    const { license_no } = req.params;
    const [result] = await pool.query(driverQueries.delete, [license_no]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(200).json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete this driver because they have associated vehicles or violation tickets.' 
      });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};