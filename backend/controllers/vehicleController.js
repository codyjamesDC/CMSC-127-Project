import pool from '../config/db.js';
import { vehicleQueries } from '../sql/jsQueries/vehicleQueries.js';
import { registrationQueries } from '../sql/jsQueries/registrationQueries.js';

// ==========================================
// READ: Get all vehicles
// ==========================================
export const getAllVehicles = async (req, res) => {
  try {
    const { vehicle_type, ownership } = req.query; // Extract both filters
    let sql = vehicleQueries.selectAll;
    const params = [];

    // Check if we need to add WHERE or AND
    if (vehicle_type || ownership) {
      sql += " WHERE 1=1"; // Base for appending filters
      
      if (vehicle_type) {
        sql += " AND v.vehicle_type = ?";
        params.push(vehicle_type);
      }
      
      if (ownership) {
        sql += " AND v.ownership = ?";
        params.push(ownership);
      }
    }

    const [rows] = await pool.query(sql, params);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// READ: Get a single vehicle (with registration)
// ==========================================
export const getVehicleByPlate = async (req, res) => {
  try {
    const { plate_no } = req.params;
    
    // 1. Get Vehicle
    const [vehicleRows] = await pool.query(vehicleQueries.selectByPlate, [plate_no]);
    if (vehicleRows.length === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const vehicle = vehicleRows[0];

    // 2. Get Registration details
    const [registrationRows] = await pool.query(registrationQueries.selectByPlate, [plate_no]);
    vehicle.registrations = registrationRows; // Attach the registrations array
    
    res.status(200).json({ success: true, data: vehicle });

  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==========================================
// CREATE: Add a new vehicle
// ==========================================
export const createVehicle = async (req, res) => {
  const conn = await pool.getConnection(); 
  
  try {
    await conn.beginTransaction();

    const {
      plate_no, engine_no, chassis_no, ownership, vehicle_type, color, make, model, year, license_no,
      registrations
    } = req.body;

    if (!plate_no || !engine_no || !chassis_no || !license_no) {
      return res.status(400).json({ success: false, message: 'Missing required fields: plate_no, engine_no, chassis_no, license_no' });
    }

    // 🛑 NEW VALIDATION: Check for duplicate Plate Number
    const [existing] = await conn.query(vehicleQueries.selectByPlate, [plate_no]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Vehicle with this plate number already exists.' });
    }

    const vehicleValues = [
      plate_no, engine_no, chassis_no, ownership, vehicle_type, color, make, model, year, license_no
    ];

    // 1. Insert Vehicle
    await conn.query(vehicleQueries.insert, vehicleValues);
    
    // 2. Insert Registrations (if provided)
    if (registrations && Array.isArray(registrations) && registrations.length > 0) {
      for (const reg of registrations) {
        await conn.query(registrationQueries.insert, [
          reg.registration_no, reg.expiration_date, reg.registration_date, 
          plate_no, engine_no, chassis_no 
        ]);
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Vehicle created successfully', data: { plate_no } });

  } catch (error) {
    await conn.rollback(); 
    console.error('Error creating vehicle:', error);
    
    // Fallback for engine/chassis duplicates
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Engine or Chassis number already exists' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'The provided driver license_no does not exist' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    conn.release(); 
  }
};

// ==========================================
// UPDATE: Modify an existing vehicle
// ==========================================
export const updateVehicle = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { plate_no } = req.params; // The OLD plate number
    const { 
      plate_number, ownership, vehicle_type, color, make, model, year, license_no,
      registrations, engine_no, chassis_no 
    } = req.body;

    const newPlateNo = plate_number || plate_no;

    // 🛑 VALIDATION: Check if they changed the plate and if the new one exists
    if (newPlateNo !== plate_no) {
      const [existing] = await conn.query(vehicleQueries.selectByPlate, [newPlateNo]);
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'This Plate Number is already registered to another vehicle.' });
      }
    }

    const vehicleValues = [
      newPlateNo, engine_no, chassis_no, ownership, vehicle_type, color, make, model, year, license_no,
      plate_no // OLD plate number for the WHERE clause
    ];

    const [result] = await conn.query(vehicleQueries.update, vehicleValues);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Wipe & Replace Registrations using the NEW plate number
    if (registrations && Array.isArray(registrations)) {
      await conn.query(registrationQueries.deleteAllForVehicle, [newPlateNo]);
      if (registrations.length > 0) {
        for (const reg of registrations) {
          await conn.query(registrationQueries.insert, [
            reg.registration_no, reg.expiration_date, reg.registration_date, 
            newPlateNo, engine_no, chassis_no
          ]);
        }
      }
    }

    await conn.commit();
    res.status(200).json({ success: true, message: 'Vehicle updated successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error updating vehicle:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    conn.release();
  }
};

// ==========================================
// DELETE: Remove a vehicle
// ==========================================
export const deleteVehicle = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { plate_no } = req.params;

    // 1. Delete associated registrations first to avoid foreign key constraints
    await conn.query(registrationQueries.deleteAllForVehicle, [plate_no]);

    // 2. Delete the vehicle
    const [result] = await conn.query(vehicleQueries.delete, [plate_no]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await conn.commit();
    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error deleting vehicle:', error);
    // If the vehicle is tied to violation tickets
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete this vehicle because it has associated violation tickets.' 
      });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    conn.release();
  }
};