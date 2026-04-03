-- Insert dummy data here
-- Insert dummy data for vehiclemanager database
USE `vehiclemanager`;

-- ============================================================
-- DRIVER DATA
-- ============================================================
INSERT INTO `driver` VALUES
('N01-23-456789', 'Juan', 'Dela Cruz', 'Santos', '1990-05-15', 'M', 'Filipino', 168.50, 70.00, 'Brown', 'O+', '09171234567', 1, 'Maria', 'Dela Cruz', 'Reyes', 'Pedro', 'Dela Cruz', 'Miguel', 'Maria Dela Cruz', '09181234567', 'Non-Professional', 'Active', '2020-03-10', '2025-03-10', 'LTO-NCR'),

('P02-22-654321', 'Maria', 'Santos', 'Garcia', '1985-08-22', 'F', 'Filipino', 160.00, 55.00, 'Brown', 'A+', '09281234567', 0, 'Carmen', 'Santos', 'Torres', 'Jose', 'Santos', 'Ramos', 'Jose Santos', '09191234567', 'Professional', 'Active', '2019-06-15', '2024-06-15', 'LTO-R4A'),

('N03-21-789012', 'Carlos', 'Mendoza', 'Lopez', '1995-12-03', 'M', 'Filipino', 175.00, 80.00, 'Brown', 'B+', '09331234567', 1, 'Rosa', 'Mendoza', 'Cruz', 'Manuel', 'Mendoza', 'Diaz', 'Rosa Mendoza', '09201234567', 'Non-Professional', 'Active', '2021-01-20', '2026-01-20', 'LTO-R3'),

('P04-20-345678', 'Ana', 'Reyes', 'Fernandez', '1988-03-18', 'F', 'Filipino', 165.00, 58.00, 'Brown', 'AB+', '09451234567', 0, 'Lucia', 'Reyes', 'Martinez', 'Ramon', 'Reyes', 'Gonzales', 'Lucia Reyes', '09211234567', 'Professional', 'Active', '2018-09-05', '2023-09-05', 'LTO-R7'),

('N05-19-901234', 'Pedro', 'Aquino', 'Rivera', '1992-07-25', 'M', 'Filipino', 170.00, 75.00, 'Brown', 'O+', '09561234567', 1, 'Elena', 'Aquino', 'Morales', 'Luis', 'Aquino', 'Navarro', 'Elena Aquino', '09221234567', 'Non-Professional', 'Suspended', '2017-04-12', '2022-04-12', 'LTO-R1'),

('S06-24-567890', 'Sofia', 'Torres', 'Ramos', '2002-11-30', 'F', 'Filipino', 158.00, 50.00, 'Brown', 'A+', '09671234567', 0, 'Patricia', 'Torres', 'Castillo', 'Miguel', 'Torres', 'Ortiz', 'Patricia Torres', '09231234567', 'Student Permit', 'Active', '2024-02-01', '2025-02-01', 'LTO-NCR'),

('P07-21-234567', 'Roberto', 'Cruz', 'Gomez', '1987-04-09', 'M', 'Filipino', 172.00, 78.00, 'Brown', 'B+', '09781234567', 1, 'Teresa', 'Cruz', 'Flores', 'Antonio', 'Cruz', 'Silva', 'Teresa Cruz', '09241234567', 'Professional', 'Active', '2020-07-18', '2025-07-18', 'LTO-R4A'),

('N08-22-890123', 'Isabel', 'Gonzales', 'Vargas', '1993-09-14', 'F', 'Filipino', 162.00, 56.00, 'Brown', 'O+', '09891234567', 0, 'Angelica', 'Gonzales', 'Herrera', 'Francisco', 'Gonzales', 'Mendez', 'Francisco Gonzales', '09251234567', 'Non-Professional', 'Active', '2021-11-22', '2026-11-22', 'LTO-R6'),

('N09-18-456780', 'Miguel', 'Fernandez', 'Castro', '1991-02-28', 'M', 'Filipino', 169.00, 72.00, 'Brown', 'A+', '09901234567', 1, 'Cristina', 'Fernandez', 'Jimenez', 'Rodrigo', 'Fernandez', 'Perez', 'Cristina Fernandez', '09261234567', 'Non-Professional', 'Expired', '2015-05-30', '2020-05-30', 'LTO-R2'),

('P10-23-678901', 'Carmen', 'Lopez', 'Sanchez', '1986-06-17', 'F', 'Filipino', 161.00, 54.00, 'Brown', 'AB+', '09011234567', 0, 'Gloria', 'Lopez', 'Ramirez', 'Eduardo', 'Lopez', 'Gutierrez', 'Eduardo Lopez', '09271234567', 'Professional', 'Active', '2022-03-25', '2027-03-25', 'LTO-R5');

-- ============================================================
-- DRIVER ADDRESS DATA
-- ============================================================
INSERT INTO `driver_address` VALUES
('N01-23-456789', '123 Rizal St., Makati City, Metro Manila'),
('N01-23-456789', '456 Luna Ave., Quezon City, Metro Manila'),
('P02-22-654321', '789 Bonifacio St., Bacoor, Cavite'),
('N03-21-789012', '321 Aguinaldo Rd., Baguio City, Benguet'),
('P04-20-345678', '654 Osmena Blvd., Cebu City, Cebu'),
('N05-19-901234', '987 Del Pilar St., San Fernando, Pampanga'),
('S06-24-567890', '147 Roxas Ave., Pasig City, Metro Manila'),
('P07-21-234567', '258 Mabini St., Imus, Cavite'),
('N08-22-890123', '369 Magallanes Dr., Davao City, Davao del Sur'),
('N09-18-456780', '741 Burgos St., Tuguegarao, Cagayan'),
('P10-23-678901', '852 Legaspi St., Iloilo City, Iloilo');

-- ============================================================
-- DRIVER LICENSE CODE DATA
-- ============================================================
INSERT INTO `driver_license_code` VALUES
('N01-23-456789', 'A'),
('N01-23-456789', 'B'),
('P02-22-654321', 'A'),
('P02-22-654321', 'B'),
('P02-22-654321', 'C'),
('N03-21-789012', 'A'),
('N03-21-789012', 'B'),
('P04-20-345678', 'A'),
('P04-20-345678', 'B'),
('P04-20-345678', 'C'),
('N05-19-901234', 'A'),
('S06-24-567890', 'A'),
('P07-21-234567', 'A'),
('P07-21-234567', 'B'),
('P07-21-234567', 'C'),
('P07-21-234567', 'D'),
('N08-22-890123', 'A'),
('N08-22-890123', 'B'),
('N09-18-456780', 'A'),
('P10-23-678901', 'A'),
('P10-23-678901', 'B'),
('P10-23-678901', 'C');

-- ============================================================
-- DRIVER CONDITION DATA
-- ============================================================
INSERT INTO `driver_condition` VALUES
-- Maria Santos (P02-22-654321) - 2 conditions
('P02-22-654321', 'Must wear corrective lenses'),
('P02-22-654321', 'Automatic transmission only'),

-- Ana Reyes (P04-20-345678) - 1 condition
('P04-20-345678', 'Must wear corrective lenses'),

-- Pedro Aquino (N05-19-901234) - 3 conditions
('N05-19-901234', 'Hearing aid required'),
('N05-19-901234', 'Daylight driving only'),
('N05-19-901234', 'Power steering required'),

-- Roberto Cruz (P07-21-234567) - 2 conditions
('P07-21-234567', 'Must wear corrective lenses'),
('P07-21-234567', 'Speed limit 60 kph maximum'),

-- Isabel Gonzales (N08-22-890123) - 1 condition
('N08-22-890123', 'Left arm prosthetic'),

-- Miguel Fernandez (N09-18-456780) - 2 conditions
('N09-18-456780', 'Color blind - red-green'),
('N09-18-456780', 'Must wear corrective lenses');

-- ============================================================
-- VEHICLE DATA
-- ============================================================
INSERT INTO `vehicle` VALUES
('ABC1234', 'ENG123456789', 'CHS987654321', 'Private', 'Sedan', 'White', 'Toyota', 'Vios', 2020, 'N01-23-456789'),
('XYZ5678', 'ENG234567890', 'CHS876543210', 'Private', 'SUV', 'Black', 'Honda', 'CR-V', 2019, 'P02-22-654321'),
('DEF9012', 'ENG345678901', 'CHS765432109', 'Private', 'Hatchback', 'Red', 'Mitsubishi', 'Mirage', 2021, 'N03-21-789012'),
('GHI3456', 'ENG456789012', 'CHS654321098', 'For Hire', 'Van', 'Silver', 'Nissan', 'Urvan', 2018, 'P04-20-345678'),
('JKL7890', 'ENG567890123', 'CHS543210987', 'Private', 'Pickup', 'Blue', 'Ford', 'Ranger', 2022, 'N05-19-901234'),
('MNO2345', 'ENG678901234', 'CHS432109876', 'Private', 'Sedan', 'Gray', 'Mazda', 'Mazda3', 2023, 'S06-24-567890'),
('PQR6789', 'ENG789012345', 'CHS321098765', 'For Hire', 'Bus', 'Yellow', 'Hino', 'RK8', 2017, 'P07-21-234567'),
('STU1234', 'ENG890123456', 'CHS210987654', 'Private', 'SUV', 'White', 'Toyota', 'Fortuner', 2020, 'N08-22-890123'),
('VWX5678', 'ENG901234567', 'CHS109876543', 'Private', 'Sedan', 'Black', 'Hyundai', 'Accent', 2019, 'N09-18-456780'),
('YZA9012', 'ENG012345678', 'CHS098765432', 'For Hire', 'Truck', 'Green', 'Isuzu', 'NHR', 2021, 'P10-23-678901');

-- ============================================================
-- VEHICLE REGISTRATION DATA
-- ============================================================
INSERT INTO `vehicle_registration` VALUES
('REG2020-ABC1234', '2025-06-30', '2020-06-15', 'ABC1234', 'ENG123456789', 'CHS987654321'),
('REG2019-XYZ5678', '2024-08-15', '2019-08-01', 'XYZ5678', 'ENG234567890', 'CHS876543210'),
('REG2021-DEF9012', '2026-02-28', '2021-02-10', 'DEF9012', 'ENG345678901', 'CHS765432109'),
('REG2018-GHI3456', '2024-12-31', '2018-12-15', 'GHI3456', 'ENG456789012', 'CHS654321098'),
('REG2022-JKL7890', '2027-03-31', '2022-03-20', 'JKL7890', 'ENG567890123', 'CHS543210987'),
('REG2023-MNO2345', '2028-04-30', '2023-04-15', 'MNO2345', 'ENG678901234', 'CHS432109876'),
('REG2017-PQR6789', '2024-07-31', '2017-07-10', 'PQR6789', 'ENG789012345', 'CHS321098765'),
('REG2020-STU1234', '2025-09-30', '2020-09-05', 'STU1234', 'ENG890123456', 'CHS210987654'),
('REG2019-VWX5678', '2024-11-30', '2019-11-20', 'VWX5678', 'ENG901234567', 'CHS109876543'),
('REG2021-YZA9012', '2026-05-31', '2021-05-25', 'YZA9012', 'ENG012345678', 'CHS098765432');

-- ============================================================
-- VIOLATION TICKET DATA
-- ============================================================
INSERT INTO `violation_ticket` VALUES
(NULL, 'EDSA-Guadalupe, Makati City', '2024-01-15', 'Paid', 'PO1 Juan Mercado', 'N01-23-456789', 'ABC1234', 'ENG123456789', 'CHS987654321'),
(NULL, 'C5 Road, Taguig City', '2024-02-20', 'Unpaid', 'PO2 Maria Santos', 'P02-22-654321', 'XYZ5678', 'ENG234567890', 'CHS876543210'),
(NULL, 'Session Road, Baguio City', '2024-03-10', 'Unpaid', 'PO3 Carlos Reyes', 'N03-21-789012', 'DEF9012', 'ENG345678901', 'CHS765432109'),
(NULL, 'Osmeña Boulevard, Cebu City', '2024-03-25', 'Paid', 'PO1 Ana Garcia', 'P04-20-345678', 'GHI3456', 'ENG456789012', 'CHS654321098'),
(NULL, 'MacArthur Highway, San Fernando', '2023-12-05', 'Paid', 'PO2 Pedro Cruz', 'N05-19-901234', 'JKL7890', 'ENG567890123', 'CHS543210987'),
(NULL, 'Ortigas Avenue, Pasig City', '2024-04-01', 'Unpaid', 'PO1 Sofia Lopez', 'S06-24-567890', 'MNO2345', 'ENG678901234', 'CHS432109876'),
(NULL, 'Aguinaldo Highway, Imus', '2024-02-14', 'Paid', 'PO3 Roberto Mendoza', 'P07-21-234567', 'PQR6789', 'ENG789012345', 'CHS321098765'),
(NULL, 'JP Laurel Avenue, Davao City', '2024-01-30', 'Unpaid', 'PO2 Isabel Torres', 'N08-22-890123', 'STU1234', 'ENG890123456', 'CHS210987654'),
(NULL, 'Maharlika Highway, Tuguegarao', '2023-11-20', 'Paid', 'PO1 Miguel Aquino', 'N09-18-456780', 'VWX5678', 'ENG901234567', 'CHS109876543'),
(NULL, 'Diversion Road, Iloilo City', '2024-03-18', 'Unpaid', 'PO2 Carmen Reyes', 'P10-23-678901', 'YZA9012', 'ENG012345678', 'CHS098765432'),
(NULL, 'Commonwealth Avenue, Quezon City', '2024-04-05', 'Unpaid', 'PO1 Juan Mercado', 'N01-23-456789', 'ABC1234', 'ENG123456789', 'CHS987654321'),
(NULL, 'SLEX Southbound, Biñan', '2024-03-28', 'Paid', 'PO3 Maria Santos', 'P02-22-654321', 'XYZ5678', 'ENG234567890', 'CHS876543210');

-- ============================================================
-- VIOLATION DATA
-- ============================================================
INSERT INTO `violation` VALUES
(NULL, 'Illegal Parking', 1000.00, 1),
(NULL, 'Over Speeding (21-30 kph over limit)', 2000.00, 2),
(NULL, 'Running Red Light', 1500.00, 3),
(NULL, 'No Valid Registration', 10000.00, 4),
(NULL, 'Expired License', 3000.00, 5),
(NULL, 'Reckless Driving', 2500.00, 6),
(NULL, 'Overloading Passengers', 5000.00, 7),
(NULL, 'Illegal Overtaking', 1200.00, 8),
(NULL, 'No Seatbelt', 1000.00, 9),
(NULL, 'Obstruction', 1500.00, 10),
(NULL, 'Counterflowing', 3000.00, 11),
(NULL, 'Driving Under Influence', 15000.00, 11),
(NULL, 'Using Mobile Phone While Driving', 2000.00, 12);

-- ============================================================
-- Verify data insertion
-- ============================================================
SELECT 'Data insertion completed!' AS Status;
SELECT 
    (SELECT COUNT(*) FROM driver) AS drivers,
    (SELECT COUNT(*) FROM vehicle) AS vehicles,
    (SELECT COUNT(*) FROM violation_ticket) AS tickets,
    (SELECT COUNT(*) FROM violation) AS violations;