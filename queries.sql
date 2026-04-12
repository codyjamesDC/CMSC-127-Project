-- ============================================================
-- PROJECT REPORTS 
-- ============================================================

-- 1. View all registered drivers filtered by: License type, License status, Age range, Sex
SELECT *, 
       TIMESTAMPDIFF(YEAR, bday, CURDATE()) AS age 
FROM `driver`
WHERE license_type = 'Non-Professional' 
  AND license_status = 'Active' 
  AND sex = 'M'
  AND TIMESTAMPDIFF(YEAR, bday, CURDATE()) BETWEEN 20 AND 40;

-- 2. View all vehicles owned by a given driver
SELECT * FROM `vehicle` 
WHERE license_no = 'P02-22-654321';

-- 3. View all vehicles with expired registrations as of a given date
SELECT v.plate_no, v.make, v.model, vr.expiration_date 
FROM `vehicle` v
JOIN `vehicle_registration` vr ON v.plate_no = vr.plate_no 
                              AND v.engine_no = vr.engine_no 
                              AND v.chassis_no = vr.chassis_no
WHERE vr.expiration_date <= '2024-12-31';

-- 4. View all drivers with expired or suspended licenses
SELECT license_no, fname, lname, license_status 
FROM `driver` 
WHERE license_status IN ('Expired', 'Suspended');

-- 5. View all traffic violations committed by a given driver within a specified date range
SELECT vt.ticket_id, vt.date, vt.location, v.violation_name, v.fine_amount 
FROM `violation_ticket` vt
JOIN `violation` v ON vt.ticket_id = v.ticket_id
WHERE vt.license_no = 'N01-23-456789'
  AND vt.date BETWEEN '2024-01-01' AND '2024-04-30';

-- 6. View the total number of violations per violation type for the year 2024
SELECT v.violation_name, COUNT(*) AS total_count
FROM `violation` v
JOIN `violation_ticket` vt ON v.ticket_id = vt.ticket_id
WHERE YEAR(vt.date) = 2024
GROUP BY v.violation_name;

-- 7. View all vehicles involved in violations within a given city or region
SELECT DISTINCT v.plate_no, v.make, v.model, vt.location, vt.date
FROM `vehicle` v
JOIN `violation_ticket` vt ON v.plate_no = vt.plate_no 
                          AND v.engine_no = vt.engine_no 
                          AND v.chassis_no = vt.chassis_no
WHERE vt.location LIKE '%Makati%';