-- ============================================================
-- AUTO-EXPIRE DRIVER LICENSES
-- Run this once against your database to install the event.
-- Requires the MySQL Event Scheduler to be enabled.
-- ============================================================

-- 1. Enable the Event Scheduler (if not already on)
--    You can also set this permanently in my.cnf: event_scheduler = ON
SET GLOBAL event_scheduler = ON;

-- 2. Drop existing event if re-running this script
DROP EVENT IF EXISTS auto_expire_driver_licenses;

-- 3. Create the scheduled event
CREATE EVENT auto_expire_driver_licenses
  ON SCHEDULE EVERY 1 DAY
  STARTS CURRENT_DATE + INTERVAL 1 DAY  -- first run: start of tomorrow
  DO
    UPDATE driver
    SET    license_status = 'Expired'
    WHERE  expiry_date < CURDATE()
      AND  license_status = 'Active';   -- NEVER touches Suspended or Revoked

-- ============================================================
-- VERIFY
-- ============================================================
-- Check the event was created:
--   SHOW EVENTS;
--
-- Check the scheduler is running:
--   SHOW VARIABLES LIKE 'event_scheduler';
--
-- To manually trigger it right now (e.g. to fix existing data):
  -- UPDATE driver
  -- SET    license_status = 'Expired'
  -- WHERE  expiry_date < CURDATE()
  --   AND  license_status = 'Active';
-- ============================================================