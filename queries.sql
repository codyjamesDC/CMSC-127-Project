-- ============================================================
-- PROJECT REPORTS (Using Views)
-- ============================================================

-- 1. View all registered drivers filtered by: License type, License status, Age range, Sex
SELECT * 
FROM `vw_driver_info`
WHERE license_type = 'Non-Professional' 
    AND license_status = 'Active' 
    AND sex = 'M'
    AND age BETWEEN 20 AND 40;

-- 2. View all vehicles owned by a given driver
SELECT * 
FROM `vw_vehicle_ownership` 
WHERE license_no = 'P02-22-654321';

-- 3. View all vehicles with expired registrations as of a given date
SELECT * 
FROM `vw_vehicle_registrations`
WHERE expiration_date <= '2024-12-31';

-- 4. View all drivers with expired or suspended licenses
SELECT * 
FROM `vw_driver_license_status` 
WHERE license_status IN ('Expired', 'Suspended');

-- 5. View all traffic violations committed by a given driver within a specified date range
SELECT * 
FROM `vw_violation_history`
WHERE license_no = 'N01-23-456789'
    AND date BETWEEN '2024-01-01' AND '2024-04-30';

-- 6. View the total number of violations per violation type for the year 2024
SELECT violation_name, COUNT(*) AS total_count
FROM `vw_violation_summary`
WHERE YEAR(date) = 2024
GROUP BY violation_name;

-- 7. View all vehicles involved in violations within a given city or region
SELECT * 
FROM `vw_vehicle_violation_locations`
WHERE location LIKE '%Makati%';