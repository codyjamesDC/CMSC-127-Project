export const ticketQueries = {
  selectAll: `
    SELECT 
      vt.*, 
      vt.date                                        AS date_of_violation, 
      vt.plate_no                                    AS plate_number, 
      CONCAT(d.fname, ' ', d.lname)                  AS driver_name, 
      GROUP_CONCAT(v.violation_name SEPARATOR ', ')  AS violation_type, 
      SUM(v.fine_amount)                             AS fine_amount
    FROM violation_ticket vt
    LEFT JOIN driver d    ON vt.license_no = d.license_no
    LEFT JOIN violation v ON vt.ticket_id  = v.ticket_id
    GROUP BY vt.ticket_id
    ORDER BY vt.date DESC
  `,
  selectById: `SELECT * FROM violation_ticket WHERE ticket_id = ?`,
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
  delete: `DELETE FROM violation_ticket WHERE ticket_id = ?`
};