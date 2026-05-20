import pool from '../config/db.js';
import { ticketQueries } from '../sql/jsQueries/ticketQueries.js';
import { violationQueries } from '../sql/jsQueries/violationQueries.js';

// ==========================================
// READ: Get all tickets
// ==========================================
export const getAllTickets = async (req, res) => {
  try {
    // 1. Get all basic tickets
    const [tickets] = await pool.query(ticketQueries.selectAll);
    
    // 2. Loop through tickets and fetch their violations
    for (let ticket of tickets) {
      const [violations] = await pool.query(violationQueries.selectByTicketId, [ticket.ticket_id]);
      ticket.violations = violations; 
    }

    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==========================================
// READ: Get a single ticket (with its violations)
// ==========================================
export const getTicketById = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    
    // 1. Get Ticket
    const [ticketRows] = await pool.query(ticketQueries.selectById, [ticket_id]);
    if (ticketRows.length === 0) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const ticket = ticketRows[0];

    // 2. Get Violations
    const [violationRows] = await pool.query(violationQueries.selectByTicketId, [ticket_id]);
    ticket.violations = violationRows; // Array of objects: [{ violation_name: 'Speeding', fine_amount: 2000 }]
    
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==========================================
// CREATE: Add a new ticket (with multiple violations)
// ==========================================
export const createTicket = async (req, res) => {
  const conn = await pool.getConnection(); 
  
  try {
    await conn.beginTransaction();

    const {
      location, date, violation_status, apprehending_officer, license_no, plate_no, engine_no, chassis_no,
      violations 
    } = req.body;

    // 🛑 FIX: Strip the ISO timestamp
    const cleanDate = date ? date.split('T')[0] : null;

    if (!location || !cleanDate || !license_no || !plate_no || !apprehending_officer || apprehending_officer.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: location, date, driver, vehicle, apprehending officer' 
      });
    }

    const checkDuplicateSql = `
      SELECT ticket_id FROM violation_ticket 
      WHERE license_no = ? AND plate_no = ? AND date = ?
    `;
    // Use cleanDate here
    const [existingTicket] = await conn.query(checkDuplicateSql, [license_no, plate_no, cleanDate]);
    
    if (existingTicket.length > 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'A ticket for this driver and vehicle was already recorded on this date.' });
    }

    // Use cleanDate here
    const ticketValues = [
      location, cleanDate, violation_status || 'Unpaid', apprehending_officer, license_no, plate_no, engine_no, chassis_no
    ];

    // 1. Insert Ticket
    const [ticketResult] = await conn.query(ticketQueries.insert, ticketValues);
    const newTicketId = ticketResult.insertId;
    
    // 2. Insert Violations
    if (violations && Array.isArray(violations) && violations.length > 0) {
      for (const v of violations) {
        await conn.query(violationQueries.insert, [v.violation_name, v.fine_amount, newTicketId]);
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Ticket created successfully', data: { ticket_id: newTicketId } });

  } catch (error) {
    await conn.rollback(); 
    console.error('Error creating ticket:', error);
    
    // Foreign key constraint failure
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Invalid Driver License or Vehicle details provided.' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    conn.release(); 
  }
};

// ==========================================
// UPDATE: Modify an existing ticket
// ==========================================
export const updateTicket = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { ticket_id } = req.params;
    const {
      location, date, violation_status, apprehending_officer, license_no, plate_no, engine_no, chassis_no,
      violations 
    } = req.body;

    // 🛑 FIX: Strip the ISO timestamp so MySQL accepts it
    const cleanDate = date ? date.split('T')[0] : null;

    if (!location || !cleanDate || !license_no || !plate_no || !apprehending_officer || apprehending_officer.trim() === '') {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: location, date, driver, vehicle, apprehending officer' 
      });
    }

    const checkDuplicateSql = `
      SELECT ticket_id FROM violation_ticket 
      WHERE license_no = ? AND plate_no = ? AND date = ? AND ticket_id != ?
    `;
    // Use cleanDate here
    const [existingTicket] = await conn.query(checkDuplicateSql, [license_no, plate_no, cleanDate, ticket_id]);
    
    if (existingTicket.length > 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Another ticket for this driver and vehicle already exists on this date.' });
    }

    // Use cleanDate here
    const ticketValues = [
      location, cleanDate, violation_status, apprehending_officer, license_no, plate_no, engine_no, chassis_no, ticket_id
    ];

    const [result] = await conn.query(ticketQueries.update, ticketValues);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // 2. Wipe & Replace Violations array
    if (violations && Array.isArray(violations)) {
      await conn.query(violationQueries.deleteAllForTicket, [ticket_id]);
      
      if (violations.length > 0) {
        for (const v of violations) {
          await conn.query(violationQueries.insert, [v.violation_name, v.fine_amount, ticket_id]);
        }
      }
    }

    await conn.commit();
    res.status(200).json({ success: true, message: 'Ticket updated successfully' });

  } catch (error) {
    await conn.rollback();
    console.error('Error updating ticket:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Invalid Driver License or Vehicle details provided.' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    conn.release();
  }
};

// ==========================================
// DELETE: Remove a ticket
// ==========================================
export const deleteTicket = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { ticket_id } = req.params;

    // 1. Delete associated violations first!
    await conn.query(violationQueries.deleteAllForTicket, [ticket_id]);

    // 2. Delete the ticket
    const [result] = await conn.query(ticketQueries.delete, [ticket_id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await conn.commit();
    res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error deleting ticket:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    conn.release();
  }
};