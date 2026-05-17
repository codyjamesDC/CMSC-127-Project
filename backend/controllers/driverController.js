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
  const conn = await pool.getConnection(); 
  
  try {
    await conn.beginTransaction();

    const {
      license_no, fname, lname, mname, bday, sex, nationality, height_cm, weight_kg,
      eye_color, blood_type, contact_no, organ_donor, mother_fname, mother_lname, mother_mname,
      father_fname, father_lname, father_mname, emrg_contact_person, emrg_contact_no,
      license_type, license_status, issued_date, expiry_date, agency_code,
      conditions, license_codes, addresses // <-- Added missing destructuring here
    } = req.body;

    const values = [
      license_no, fname, lname, mname, bday, sex, nationality, height_cm, weight_kg,
      eye_color, blood_type, contact_no, organ_donor || 0, mother_fname, mother_lname, mother_mname,
      father_fname, father_lname, father_mname, emrg_contact_person, emrg_contact_no,
      license_type, license_status || 'Active', issued_date, expiry_date, agency_code
    ];

    // 1. Insert Driver
    await conn.query(driverQueries.insert, values);
    
    // 2. Insert Conditions
    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      for (const condition of conditions) {
        await conn.query(conditionQueries.insert, [license_no, condition]);
      }
    }

    // 3. Insert License Codes 
    if (license_codes && Array.isArray(license_codes) && license_codes.length > 0) {
      for (const code of license_codes) {
        await conn.query(licenseCodeQueries.insert, [license_no, code]);
      }
    }

    // 4. Insert Addresses (NEW)
    if (addresses && Array.isArray(addresses) && addresses.length > 0) {
      for (const address of addresses) {
        await conn.query(addressQueries.insert, [license_no, address]);
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Driver created successfully', data: { license_no } });

  } catch (error) {
    await conn.rollback(); 
    console.error('Error creating driver:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'License number already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
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
      fname, lname, mname, bday, sex, nationality, height_cm, weight_kg,
      eye_color, blood_type, contact_no, organ_donor, mother_fname, mother_lname, mother_mname,
      father_fname, father_lname, father_mname, emrg_contact_person, emrg_contact_no,
      license_type, license_status, issued_date, expiry_date, agency_code,
      conditions, license_codes, addresses
    } = req.body;

    const values = [
      fname, lname, mname, bday, sex, nationality, height_cm, weight_kg,
      eye_color, blood_type, contact_no, organ_donor, mother_fname, mother_lname, mother_mname,
      father_fname, father_lname, father_mname, emrg_contact_person, emrg_contact_no,
      license_type, license_status, issued_date, expiry_date, agency_code, 
      license_no
    ];

    // 1. Update Driver
    const [result] = await conn.query(driverQueries.update, values);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // 2. Wipe & Replace Conditions
    if (conditions && Array.isArray(conditions)) {
      await conn.query(conditionQueries.deleteAllForDriver, [license_no]);
      if (conditions.length > 0) {
        for (const condition of conditions) {
          await conn.query(conditionQueries.insert, [license_no, condition]);
        }
      }
    }

    // 3. Wipe & Replace License Codes
    if (license_codes && Array.isArray(license_codes)) {
      await conn.query(licenseCodeQueries.deleteAllForDriver, [license_no]);
      if (license_codes.length > 0) {
        for (const code of license_codes) {
          await conn.query(licenseCodeQueries.insert, [license_no, code]);
        }
      }
    }

    // 4. Wipe & Replace Addresses (NEW)
    if (addresses && Array.isArray(addresses)) {
      await conn.query(addressQueries.deleteAllForDriver, [license_no]);
      if (addresses.length > 0) {
        for (const address of addresses) {
          await conn.query(addressQueries.insert, [license_no, address]);
        }
      }
    }

    await conn.commit();
    res.status(200).json({ success: true, message: 'Driver updated successfully' });

  } catch (error) {
    await conn.rollback();
    console.error('Error updating driver:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
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