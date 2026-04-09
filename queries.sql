-- ============================================================
-- QUERIES TO VIEW ALL TABLES
-- ============================================================

-- View all Registered Drivers
SELECT * FROM `driver`;

-- View all Driver Addresses (Multi-valued attribute)
SELECT * FROM `driver_address`;

-- View all Driver License Restriction Codes
SELECT * FROM `driver_license_code`;

-- View all Driver Conditions (e.g., corrective lenses)
SELECT * FROM `driver_condition`;

-- View all Registered Vehicles and their Owners
SELECT * FROM `vehicle`;

-- View all Vehicle Registration Records
SELECT * FROM `vehicle_registration`;

-- View all Violation Tickets issued
SELECT * FROM `violation_ticket`;

-- View specific Violations and Fine Amounts associated with tickets
SELECT * FROM `violation`;

-- ============================================================
-- JOIN QUERIES (SAMPLES)
-- ============================================================

-- View Driver Full Names and their corresponding Vehicle Plate Numbers
SELECT d.fname, d.lname, v.plate_no, v.make, v.model FROM `driver` d JOIN `vehicle` v ON d.license_no = v.license_no;

-- View all Unpaid Tickets with the Driver's Name and Violation Type
SELECT vt.ticket_id, d.fname, d.lname, vn.violation_name, vn.fine_amount, vt.violation_status FROM `violation_ticket` vt JOIN `driver` d ON vt.license_no = d.license_no JOIN `violation` vn ON vt.ticket_id = vn.ticket_id WHERE vt.violation_status = 'Unpaid';