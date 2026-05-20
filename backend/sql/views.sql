USE `vehiclemanager`;

CREATE OR REPLACE VIEW vw_driver_info AS
SELECT *,
    TIMESTAMPDIFF(YEAR, bday, CURDATE()) AS age
FROM `driver`;

CREATE OR REPLACE VIEW vw_vehicle_ownership AS
SELECT * FROM `vehicle`;

CREATE OR REPLACE VIEW vw_vehicle_registrations AS
SELECT 
    vr.registration_no,
    v.plate_no,
    v.make,
    v.model,
    v.year,
    v.vehicle_type,
    v.color,
    CONCAT(d.fname, ' ', d.lname) AS owner_name,
    vr.registration_date,
    vr.expiration_date
FROM vehicle v
JOIN vehicle_registration vr 
    ON  v.plate_no   = vr.plate_no 
    AND v.engine_no  = vr.engine_no 
    AND v.chassis_no = vr.chassis_no
JOIN driver d ON v.license_no = d.license_no;

CREATE OR REPLACE VIEW vw_violation_history AS
SELECT 
    vt.license_no,
    CONCAT(d.fname, ' ', d.lname) AS driver_name,
    vt.ticket_id,
    vt.date         AS violation_date,
    vt.location,
    vt.violation_status,
    vt.apprehending_officer,
    v.violation_name,
    v.fine_amount
FROM violation_ticket vt
JOIN violation v ON vt.ticket_id  = v.ticket_id
JOIN driver    d ON vt.license_no = d.license_no;

CREATE OR REPLACE VIEW vw_driver_license_status AS
SELECT license_no, fname, lname, license_status
FROM `driver`;

CREATE OR REPLACE VIEW vw_violation_summary AS
SELECT v.violation_name, vt.date
FROM `violation` v
JOIN `violation_ticket` vt ON v.ticket_id = vt.ticket_id;

CREATE OR REPLACE VIEW vw_vehicle_violation_locations AS
SELECT DISTINCT v.plate_no, v.make, v.model, vt.location, vt.date
FROM `vehicle` v
JOIN `violation_ticket` vt ON v.plate_no = vt.plate_no
                        AND v.engine_no = vt.engine_no
                        AND v.chassis_no = vt.chassis_no;