// backend/controllers/driverController.js
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
    // 1. Fetch base drivers
    const [drivers] = await pool.query(driverQueries.selectAll);
    
    // 2. Fetch all supporting data concurrently
    const [[addresses], [conditions], [codes]] = await Promise.all([
      pool.query('SELECT * FROM driver_address'),
      pool.query('SELECT * FROM driver_condition'),
      pool.query('SELECT * FROM driver_license_code')
    ]);

    // 3. Map the supporting arrays into the drivers
    const mappedDrivers = drivers.map(d => ({
      ...d,
      addresses: addresses.filter(a => a.license_no === d.license_no).map(a => a.address),
      conditions: conditions.filter(c => c.license_no === d.license_no).map(c => c.condition),
      license_codes: codes.filter(c => c.license_no === d.license_no).map(c => c.license_code)
    }));

    res.status(200).json({ success: true, count: mappedDrivers.length, data: mappedDrivers });
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
    
    const [driverRows] = await pool.query(driverQueries.selectByLicense, [license_no]);
    if (driverRows.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
    const driver = driverRows[0];

    const [conditionRows] = await pool.query(conditionQueries.selectByLicense, [license_no]);
    driver.conditions = conditionRows.map(row => row.condition);

    const [codeRows] = await pool.query(licenseCodeQueries.selectByLicense, [license_no]);
    driver.license_codes = codeRows.map(row => row.license_code);

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
  const conn = await pool.getConnection(); 
  try {
    await conn.beginTransaction();
    
    const {
      license_number, full_name, date_of_birth, sex, 
      addresses, conditions, license_codes,
      license_type, license_status, issue_date, expiration_date
    } = req.body;

    // 🛑 NEW VALIDATION: Check for duplicate License Number
    const [existing] = await conn.query(driverQueries.selectByLicense, [license_number]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Driver with this license number already exists.' });
    }

    const nameParts = full_name.split(' ');
    const fname = nameParts[0] || 'Unknown';
    const lname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

    // 1. Insert Driver
    const driverValues = [
      license_number, fname, lname, '', date_of_birth, sex, 
      'Filipino', 0, 0, 'Brown', 'O+', '09000000000', 0, 
      'Mother', 'Name', '', 'Father', 'Name', '', 
      'Emergency', '09000000000', license_type, license_status, 
      issue_date, expiration_date, 'LTO-NCR'
    ];
    await conn.query(driverQueries.insert, driverValues);

    // 2. Insert Arrays (ignoring empty strings)
    if (addresses?.length) {
      for (const addr of addresses) {
        if (addr.trim()) await conn.query(addressQueries.insert, [license_number, addr]);
      }
    }
    if (conditions?.length) {
      for (const cond of conditions) {
        if (cond.trim()) await conn.query(conditionQueries.insert, [license_number, cond]);
      }
    }
    if (license_codes?.length) {
      for (const code of license_codes) {
        if (code.trim()) await conn.query(licenseCodeQueries.insert, [license_number, code]);
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Driver created successfully' });
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
    const { license_no } = req.params; // The OLD license number
    const {
      license_number, full_name, date_of_birth, sex, 
      addresses, conditions, license_codes,
      license_type, license_status, issue_date, expiration_date
    } = req.body;

    // 🛑 VALIDATION: If they changed the license number, check if the NEW one is already taken
    if (license_number && license_number !== license_no) {
      const [existing] = await conn.query(driverQueries.selectByLicense, [license_number]);
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'This License Number is already taken by another driver.' });
      }
    }

    const formatDate = (dateStr) => dateStr ? dateStr.split('T')[0] : null;
    const nameParts = (full_name || '').split(' ');
    const fname = nameParts[0] || 'Unknown';
    const lname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

    const values = [
      license_number || license_no, // NEW license number (or keep old)
      fname, lname, '', 
      formatDate(date_of_birth), sex, 
      'Filipino', 0, 0, 'Brown', 'O+', '09000000000', 0, 
      'Mother', 'Name', '', 'Father', 'Name', '', 
      'Emergency', '09000000000', 
      license_type, license_status, 
      formatDate(issue_date), 
      formatDate(expiration_date), 
      'LTO-NCR',
      license_no // The OLD license number for the WHERE clause
    ];

    const [result] = await conn.query(driverQueries.update, values);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Because of ON UPDATE CASCADE, we must use the NEW license number to update the arrays
    const effectiveLicense = license_number || license_no;

    await conn.query(addressQueries.deleteAllForDriver, [effectiveLicense]);
    if (addresses?.length) {
      for (const addr of addresses) {
        if (addr.trim()) await conn.query(addressQueries.insert, [effectiveLicense, addr]);
      }
    }

    await conn.query(conditionQueries.deleteAllForDriver, [effectiveLicense]);
    if (conditions?.length) {
      for (const cond of conditions) {
        if (cond.trim()) await conn.query(conditionQueries.insert, [effectiveLicense, cond]);
      }
    }

    await conn.query(licenseCodeQueries.deleteAllForDriver, [effectiveLicense]);
    if (license_codes?.length) {
      for (const code of license_codes) {
        if (code.trim()) await conn.query(licenseCodeQueries.insert, [effectiveLicense, code]);
      }
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
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { license_no } = req.params;

    // 1. Delete associated arrays first to prevent foreign key blocks
    await conn.query(addressQueries.deleteAllForDriver, [license_no]);
    await conn.query(conditionQueries.deleteAllForDriver, [license_no]);
    await conn.query(licenseCodeQueries.deleteAllForDriver, [license_no]);

    // 2. Delete the driver
    const [result] = await conn.query(driverQueries.delete, [license_no]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await conn.commit();
    res.status(200).json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error deleting driver:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete this driver because they have associated vehicles or violation tickets.' 
      });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    conn.release();
  }
};