export const violationQueries = {
  selectByTicketId: 'SELECT violation_name, fine_amount FROM violation WHERE ticket_id = ?',
  
  insert: `
    INSERT INTO violation (violation_name, fine_amount, ticket_id) 
    VALUES (?, ?, ?)
  `,
  
  deleteAllForTicket: 'DELETE FROM violation WHERE ticket_id = ?'
};