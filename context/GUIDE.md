# LTO Vehicle Manager — Improvement Guide

> **CMSC 127 · AY 2025–2026**
> Based on rubric analysis of the current codebase. Follow this guide top-to-bottom; critical fixes first.

---

## Table of Contents

1. [Critical Fixes (Do These First)](#1-critical-fixes-do-these-first)
2. [Database Design Improvements](#2-database-design-improvements)
3. [CRUD Operation Fixes](#3-crud-operation-fixes)
4. [Edge Case Handling](#4-edge-case-handling)
5. [Reports Fixes](#5-reports-fixes)
6. [Code Quality Improvements](#6-code-quality-improvements)
7. [Quick Reference: Field Name Mapping](#7-quick-reference-field-name-mapping)

---

## 1. Critical Fixes (Do These First)

These issues will cause **visible failures** during grading if tested through the UI.

---

### 1.1 Frontend ↔ Backend Field Name Mismatch

This is the single most damaging issue. The frontend sends field names that the backend does not recognize, causing silent `null` inserts or HTTP 400/500 errors.

#### Driver — `frontend/src/pages/Drivers.jsx`

The form currently uses wrong field names. Update the `emptyForm` and all references:

```js
// CURRENT (wrong)
const emptyForm = {
  full_name: '', date_of_birth: '', license_number: '',
  issue_date: '', expiration_date: '', ...
};

// FIXED — match backend driverQueries.insert parameter order
const emptyForm = {
  license_no: '', fname: '', lname: '', mname: '',
  bday: '', sex: 'M', nationality: 'Filipino',
  height_cm: '', weight_kg: '', eye_color: 'Brown',
  blood_type: 'O+', contact_no: '', organ_donor: 0,
  mother_fname: '', mother_lname: '', mother_mname: '',
  father_fname: '', father_lname: '', father_mname: '',
  emrg_contact_person: '', emrg_contact_no: '',
  license_type: 'Non-Professional', license_status: 'Active',
  issued_date: '', expiry_date: '', agency_code: '',
  conditions: [], license_codes: [], addresses: []
};
```

Update every form field `name=` attribute to match (e.g., `name="fname"`, `name="license_no"`, `name="issued_date"`).

#### Vehicle — `frontend/src/pages/Vehicles.jsx`

```js
// CURRENT (wrong)
{ plate_number: '', engine_number: '', chassis_number: '', driver_id: '' }

// FIXED
{ plate_no: '', engine_no: '', chassis_no: '',
  ownership: 'Private', vehicle_type: 'Sedan',
  color: '', make: '', model: '', year: '', license_no: '' }
```

Update all `name=` attributes in the form fields accordingly.

#### Registration — `frontend/src/pages/Registrations.jsx`

```js
// CURRENT (wrong) — sends vehicle_id
<select name="vehicle_id" ...>

// FIXED — backend reads req.body.plate_no
<select name="plate_no" ...>
```

Also update `emptyForm`:

```js
const emptyForm = {
  registration_number: '', plate_no: '',
  registration_date: '', expiration_date: ''
};
```

#### Violation (Ticket) — `frontend/src/pages/Violations.jsx`

The backend `createTicket` expects a specific shape. The frontend form must be restructured:

```js
// CURRENT (wrong shape sent to API)
{ violation_type: '', date_of_violation: '', driver_id: '', vehicle_id: '', fine_amount: '' }

// FIXED — match ticketController createTicket expectations
{
  location: '', date: '', violation_status: 'Unpaid',
  apprehending_officer: '', license_no: '', plate_no: '',
  engine_no: '', chassis_no: '',
  violations: [{ violation_name: '', fine_amount: 0 }]
}
```

Update the form fields and the `handleSave` function to build the correct payload before calling `violationsApi.create(payload)`.

---

### 1.2 Status Value Case Mismatch

The database seeds use **Title Case** (`'Active'`, `'Expired'`, `'Suspended'`, `'Paid'`, `'Unpaid'`) but the frontend dropdowns use **lowercase** (`'valid'`, `'expired'`, `'paid'`, `'unpaid'`). This breaks filters and report queries.

**Fix Option A — Change the frontend to match the DB (recommended):**

```js
// Drivers.jsx
const LICENSE_STATUSES = ['Active', 'Suspended', 'Expired', 'Revoked'];

// Violations.jsx
const STATUSES = ['Unpaid', 'Paid', 'Contested'];

// Registrations.jsx — registration_status is computed by the backend (CASE WHEN),
// so the filter select should pass 'active' or 'expired' to the query param only,
// which the registrationController already handles correctly. No change needed here.
```

**Fix Option B — Normalize the DB to lowercase:**

Run this once on the database, then update seeds in `data.sql`:

```sql
UPDATE driver SET license_status = LOWER(license_status);
UPDATE violation_ticket SET violation_status = LOWER(violation_status);
```

Then update `data.sql` seeds to use lowercase from the start.

---

## 2. Database Design Improvements

### 2.1 Add CHECK Constraints

Strengthen data integrity by constraining known-value columns. Add to `schema.sql`:

```sql
-- In the driver table definition, add:
CONSTRAINT chk_sex         CHECK (sex IN ('M', 'F')),
CONSTRAINT chk_organ_donor CHECK (organ_donor IN (0, 1)),
CONSTRAINT chk_lic_status  CHECK (license_status IN ('Active','Suspended','Expired','Revoked')),
CONSTRAINT chk_lic_type    CHECK (license_type IN ('Student Permit','Non-Professional','Professional')),

-- In violation_ticket:
CONSTRAINT chk_vio_status  CHECK (violation_status IN ('Paid','Unpaid','Contested')),

-- In vehicle:
CONSTRAINT chk_ownership   CHECK (ownership IN ('Private','For Hire','Government'))
```

### 2.2 Fix organ_donor Type Inconsistency

`schema.sql` uses `TINYINT(1)` but `delacruz_odon_reyes_milestone.sql` uses `BOOLEAN`. Standardize to one:

```sql
-- In schema.sql, change to:
organ_donor   BOOLEAN   NOT NULL DEFAULT FALSE,
```

### 2.3 Add Indexes for Frequent Lookups

Report queries filter by `license_no` on `vehicle` and `violation_ticket` frequently. Add indexes:

```sql
-- Add to schema.sql after table definitions:
CREATE INDEX idx_vehicle_license    ON vehicle (license_no);
CREATE INDEX idx_ticket_license     ON violation_ticket (license_no);
CREATE INDEX idx_ticket_date        ON violation_ticket (date);
CREATE INDEX idx_registration_exp   ON vehicle_registration (expiration_date);
```

### 2.4 Align the Milestone SQL File

`delacruz_odon_reyes_milestone.sql` is a compiled copy but it is out of sync with `schema.sql` (missing indexes, different types). After all schema fixes, regenerate this file by concatenating:

```
setup.sql + schema.sql + data.sql + views.sql + queries.sql
```

---

## 3. CRUD Operation Fixes

### 3.1 Driver — Display Full Name in getAllDrivers

`driverQueries.selectAll` returns raw columns. The frontend tries to display `d.full_name` but no such column exists. Fix the query:

```js
// backend/sql/jsQueries/driverQueries.js
selectAll: `
  SELECT *,
    CONCAT(fname, ' ', COALESCE(mname, ''), ' ', lname) AS full_name
  FROM driver
`,
selectByLicense: `
  SELECT *,
    CONCAT(fname, ' ', COALESCE(mname, ''), ' ', lname) AS full_name
  FROM driver WHERE license_no = ?
`,
```

### 3.2 Vehicle — Return Owner Name in selectAll

The frontend displays `v.owner_name` but the vehicle query does not join the driver table:

```js
// backend/sql/jsQueries/vehicleQueries.js
selectAll: `
  SELECT v.*,
    CONCAT(d.fname, ' ', d.lname) AS owner_name
  FROM vehicle v
  LEFT JOIN driver d ON v.license_no = d.license_no
`,
selectByPlate: `
  SELECT v.*,
    CONCAT(d.fname, ' ', d.lname) AS owner_name
  FROM vehicle v
  LEFT JOIN driver d ON v.license_no = d.license_no
  WHERE v.plate_no = ?
`,
```

### 3.3 Ticket — Return Driver Name and Plate in selectAll

The frontend `Violations.jsx` displays `v.driver_name`, `v.plate_number`, `v.violation_type`, and `v.date_of_violation` — none of which are returned by the current `selectAll`:

```js
// backend/sql/jsQueries/ticketQueries.js
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
`,
```

### 3.4 Registration — Return plate_number Alias

The frontend displays `r.plate_number` but the query returns `plate_no`. Add an alias in `registrationQueries.js`:

```js
// In selectAll and selectByNumber, add:
vr.plate_no AS plate_number,
```

### 3.5 Vehicle Delete — Improve FK Error Message

Currently `vehicleController.deleteVehicle` deletes registrations first but hits a FK error if violation tickets exist. Make the message actionable:

```js
// backend/controllers/vehicleController.js — deleteVehicle catch block
if (error.code === 'ER_ROW_IS_REFERENCED_2') {
  return res.status(409).json({
    success: false,
    message: 'Cannot delete vehicle: it has associated violation tickets. Remove the tickets first.'
  });
}
```

---

## 4. Edge Case Handling

### 4.1 Add Required Field Validation in Controllers

Currently missing required field checks. Add guard clauses at the top of each create handler:

```js
// backend/controllers/driverController.js — createDriver
const { license_no, fname, lname, bday, sex } = req.body;
if (!license_no || !fname || !lname || !bday || !sex) {
  return res.status(400).json({
    success: false,
    message: 'Missing required fields: license_no, fname, lname, bday, sex'
  });
}

// backend/controllers/vehicleController.js — createVehicle
const { plate_no, engine_no, chassis_no, license_no } = req.body;
if (!plate_no || !engine_no || !chassis_no || !license_no) {
  return res.status(400).json({
    success: false,
    message: 'Missing required fields: plate_no, engine_no, chassis_no, license_no'
  });
}

// backend/controllers/ticketController.js — createTicket
const { location, date, license_no, plate_no, violations } = req.body;
if (!location || !date || !license_no || !plate_no) {
  return res.status(400).json({
    success: false,
    message: 'Missing required fields: location, date, license_no, plate_no'
  });
}
if (!violations || !Array.isArray(violations) || violations.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'At least one violation must be provided in the violations array'
  });
}
```

### 4.2 Document the Wipe-and-Replace Behavior

When updating a driver, if `conditions`, `license_codes`, or `addresses` are sent as empty arrays `[]`, all existing records for that field are deleted. Add a comment so future developers understand this is intentional:

```js
// backend/controllers/driverController.js — updateDriver
// Note: sending conditions: [] will CLEAR all conditions for this driver.
// To leave conditions unchanged, omit the field entirely from the request body.
if (conditions && Array.isArray(conditions)) { ... }
```

### 4.3 Prevent Changing Primary Key on Update

Add a guard in `vehicleController.updateVehicle` to reject attempts to change `plate_no`:

```js
// backend/controllers/vehicleController.js — updateVehicle
if (req.body.plate_no && req.body.plate_no !== plate_no) {
  return res.status(400).json({
    success: false,
    message: 'Plate number (primary key) cannot be changed. Delete and re-create the vehicle instead.'
  });
}
```

---

## 5. Reports Fixes

### 5.1 Report 1 — Move Query Builder to reportQueries.js

`reportController.js` builds raw SQL via string concatenation. Move the builder into `reportQueries.js` to keep controllers thin:

```js
// backend/sql/jsQueries/reportQueries.js
buildFilteredDriversQuery: (filters) => {
  const conditions = ['1 = 1'];
  const params = [];
  if (filters.license_type)  { conditions.push('license_type = ?');  params.push(filters.license_type); }
  if (filters.license_status){ conditions.push('license_status = ?'); params.push(filters.license_status); }
  if (filters.sex)           { conditions.push('sex = ?');            params.push(filters.sex); }
  if (filters.age_min)       { conditions.push('age >= ?');           params.push(parseInt(filters.age_min)); }
  if (filters.age_max)       { conditions.push('age <= ?');           params.push(parseInt(filters.age_max)); }
  return {
    sql: `SELECT * FROM vw_driver_info WHERE ${conditions.join(' AND ')}`,
    params
  };
},
```

Then in the controller:

```js
const { sql, params } = reportQueries.buildFilteredDriversQuery(req.query);
const [rows] = await pool.query(sql, params);
```

### 5.2 Report 4 — Fix Route Ordering to Prevent Conflicts

The route `/reports/drivers/expired-licenses` may be shadowed by `/reports/drivers/:license_no` depending on Express route registration order. Fix `reportRoutes.js` so specific routes appear before parameterized ones:

```js
// backend/routes/reportRoutes.js
router.get('/reports/drivers',                    getFilteredDrivers);
router.get('/reports/drivers/expired-licenses',   getDriversByLicenseStatus);   // before :license_no
router.get('/reports/violations/driver/:license_no', getDriverViolationsByDate);
router.get('/reports/vehicles/driver/:license_no',   getVehiclesByDriver);
router.get('/reports/registrations/expired',      getExpiredRegistrations);
router.get('/reports/violations/by-type',         getViolationSummaryByYear);
router.get('/reports/vehicles/violations',        getViolationsByLocation);
```

### 5.3 Report 3 — Expand vw_vehicle_registrations Columns

The current view only shows `plate_no, make, model, expiration_date`. Update `views.sql` to include the owner and registration number:

```sql
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
```

### 5.4 Report 5 — Enrich vw_violation_history

Add driver name and violation status to make the report more useful:

```sql
-- views.sql
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
```

---

## 6. Code Quality Improvements

### 6.1 Remove Duplicate Route Registrations

`backend/routes/router.js` registers each route twice, which is unnecessary:

```js
// CURRENT (redundant lines — remove the second entry for each)
app.use('/api/drivers', driverRoutes);
app.use('/api/drivers/drivers', driverRoutes);   // remove

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicles/vehicles', vehicleRoutes); // remove

app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets/tickets', ticketRoutes);    // remove

app.use('/api/registrations', registrationRoutes);
app.use('/api/registrations/registrations', registrationRoutes); // remove

// FIXED
export default (app) => {
  app.use('/api/drivers',       driverRoutes);
  app.use('/api/vehicles',      vehicleRoutes);
  app.use('/api/tickets',       ticketRoutes);
  app.use('/api/registrations', registrationRoutes);
  app.use('/api',               reportRoutes);
};
```

### 6.2 Add a Centralized Error Handler

Instead of repeating `res.status(500).json(...)` in every controller, register a global error middleware in `server.js`:

```js
// backend/server.js — add AFTER routes(app)
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});
```

### 6.3 Add an API Health Check Route

Useful for verifying the server is up during demos:

```js
// backend/routes/router.js
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LTO API is running', timestamp: new Date() });
});
```

### 6.4 Expand the Terminal Menu to All 7 Reports

`terminal/main.py` only implements 4 of the 7 required reports. Expand `ui.py` and `main.py`:

```python
# terminal/ui.py — update print_menu()
def print_menu():
    print("\nMAIN MENU — REPORTS")
    print("  [1]  View All Registered Drivers")
    print("  [2]  Filter Drivers by Type / Status / Age / Sex")
    print("  [3]  Vehicles Owned by a Driver")
    print("  [4]  Vehicles with Expired Registrations as of Date")
    print("  [5]  Drivers with Expired or Suspended Licenses")
    print("  [6]  Violations by Driver within Date Range")
    print("  [7]  Total Violations per Type for a Given Year")
    print("  [8]  Vehicles Involved in Violations by City")
    print("  [9]  Exit Application")
    print("=" * 100)
```

Add the corresponding `elif` blocks in `main.py` using the SQL already defined in `queries.sql`.

### 6.5 Consistent SQL Formatting in jsQueries

All queries should follow the same style: keywords uppercase, clauses on separate lines, backtick-quoted reserved words:

```js
// BEFORE (inconsistent)
selectAll: 'SELECT * FROM violation_ticket',

// AFTER (consistent)
selectAll: `
  SELECT *
  FROM violation_ticket
  ORDER BY \`date\` DESC
`,
```

---

## 7. Quick Reference: Field Name Mapping

Use this table when fixing the frontend forms. Left = what the frontend currently sends. Right = what the backend expects.

### Driver

| Frontend (wrong)          | Backend (correct)                              |
|---------------------------|------------------------------------------------|
| `full_name`               | `fname` + `lname` + `mname` (separate fields) |
| `license_number`          | `license_no`                                   |
| `date_of_birth`           | `bday`                                         |
| `issue_date`              | `issued_date`                                  |
| `expiration_date`         | `expiry_date`                                  |
| `address` (single string) | `addresses` (array of strings)                 |

### Vehicle

| Frontend (wrong) | Backend (correct) |
|-----------------|-------------------|
| `plate_number`  | `plate_no`        |
| `engine_number` | `engine_no`       |
| `chassis_number`| `chassis_no`      |
| `driver_id`     | `license_no`      |

### Registration

| Frontend (wrong)      | Backend (correct)        |
|-----------------------|--------------------------|
| `vehicle_id`          | `plate_no`               |
| `registration_number` | `registration_number` ✅ |

### Violation (Ticket)

| Frontend (wrong)              | Backend (correct)                              |
|-------------------------------|------------------------------------------------|
| `violation_type` (string)     | `violations: [{ violation_name, fine_amount }]` (array) |
| `date_of_violation`           | `date`                                         |
| `driver_id`                   | `license_no`                                   |
| `vehicle_id`                  | `plate_no` + `engine_no` + `chassis_no`        |
| `fine_amount` (top-level)     | inside `violations[]` array                    |

---

## Priority Order for Implementation

```
[P0 — Breaks grading if tested via UI]
  1.1  Fix all frontend ↔ backend field name mismatches
  1.2  Fix status value casing (Active vs active)

[P1 — Loses CRUD points]
  3.1  Add full_name alias to driver selectAll
  3.2  Add owner_name join to vehicle selectAll
  3.3  Add driver_name + violation_type to ticket selectAll
  3.4  Add plate_number alias to registration selectAll

[P2 — Loses report points]
  5.3  Expand vw_vehicle_registrations columns
  5.4  Enrich vw_violation_history with driver_name
  5.2  Fix route ordering for report 4

[P3 — Loses edge case / code quality points]
  4.1  Add required field validation in controllers
  6.1  Remove duplicate route registrations
  6.4  Expand terminal menu to all 7 reports

[P4 — Nice to have / bonus robustness]
  2.1  Add CHECK constraints to schema
  2.3  Add database indexes
  6.2  Add centralized error handler
  6.3  Add health check route
```

---

*End of GUIDE.md — Last updated for CMSC 127 AY 2025–2026 Final Submission*