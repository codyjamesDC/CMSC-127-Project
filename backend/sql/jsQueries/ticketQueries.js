export const ticketQueries = {
  selectAll: 'SELECT * FROM violation_ticket',
  selectById: 'SELECT * FROM violation_ticket WHERE ticket_id = ?',
  
  insert: `
    INSERT INTO violation_ticket 
    (location, date, violation_status, apprehending_officer, license_no, plate_no, engine_no, chassis_no) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  
  update: `
    UPDATE violation_ticket SET 
      location=?, date=?, violation_status=?, apprehending_officer=?, license_no=?, plate_no=?, engine_no=?, chassis_no=? 
    WHERE ticket_id = ?
  `,
  
  delete: 'DELETE FROM violation_ticket WHERE ticket_id = ?'
};