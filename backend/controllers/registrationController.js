import pool from '../config/db.js';
import { registrationQueries } from '../sql/jsQueries/registrationQueries.js';
import { vehicleQueries } from '../sql/jsQueries/vehicleQueries.js';

const buildRegistrationRow = (row) => ({
  ...row,
  registration_number: row.registration_number ?? row.registration_no,
});

export const getAllRegistrations = async (req, res) => {
  try {
    const { registration_status } = req.query;
    let sql = registrationQueries.selectAll;

    if (registration_status === 'expired') {
      sql += ' WHERE vr.expiration_date <= CURDATE()';
    } else if (registration_status === 'active') {
      sql += ' WHERE vr.expiration_date > CURDATE()';
    } else if (registration_status) {
      sql += ' WHERE 1 = 0';
    }

    const [rows] = await pool.query(sql);
    res.status(200).json({ success: true, count: rows.length, data: rows.map(buildRegistrationRow) });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getRegistrationByNumber = async (req, res) => {
  try {
    const { registration_no } = req.params;
    const [rows] = await pool.query(registrationQueries.selectByNumber, [registration_no]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.status(200).json({ success: true, data: buildRegistrationRow(rows[0]) });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getRegistrationsByVehicle = async (req, res) => {
  try {
    const { plate_no } = req.params;
    const [rows] = await pool.query(registrationQueries.selectByPlate, [plate_no]);
    res.status(200).json({ success: true, count: rows.length, data: rows.map(buildRegistrationRow) });
  } catch (error) {
    console.error('Error fetching vehicle registrations:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const createRegistration = async (req, res) => {
  try {
    const {
      registration_number,
      registration_date,
      expiration_date,
      plate_no,
    } = req.body;

    if (!registration_number || !plate_no) {
      return res.status(400).json({ success: false, message: 'registration_number and plate_no are required' });
    }

    const [vehicleRows] = await pool.query(vehicleQueries.selectByPlate, [plate_no]);
    if (vehicleRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = vehicleRows[0];
    await pool.query(registrationQueries.insert, [
      registration_number,
      expiration_date,
      registration_date,
      plate_no,
      vehicle.engine_no,
      vehicle.chassis_no,
    ]);

    res.status(201).json({ success: true, message: 'Registration created successfully', data: { registration_number } });
  } catch (error) {
    console.error('Error creating registration:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Registration number already exists' });
    }

    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const updateRegistration = async (req, res) => {
  try {
    const { registration_no } = req.params;
    const {
      registration_number,
      registration_date,
      expiration_date,
      plate_no,
    } = req.body;

    const effectiveRegistrationNumber = registration_number || registration_no;
    const effectivePlateNo = plate_no || null;

    if (!effectivePlateNo) {
      return res.status(400).json({ success: false, message: 'plate_no is required' });
    }

    const [vehicleRows] = await pool.query(vehicleQueries.selectByPlate, [effectivePlateNo]);
    if (vehicleRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = vehicleRows[0];
    const [result] = await pool.query(registrationQueries.update, [
      effectiveRegistrationNumber,
      expiration_date,
      registration_date,
      effectivePlateNo,
      vehicle.engine_no,
      vehicle.chassis_no,
      registration_no,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.status(200).json({ success: true, message: 'Registration updated successfully' });
  } catch (error) {
    console.error('Error updating registration:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Registration number already exists' });
    }

    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { registration_no } = req.params;
    const [result] = await pool.query(registrationQueries.delete, [registration_no]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.status(200).json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};