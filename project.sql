CREATE OR REPLACE USER 'ltomgr'@'localhost' IDENTIFIED BY 'SHAN'; --password: shanmykel

DROP DATABASE IF EXISTS `vehiclemanager`;
CREATE DATABASE IF NOT EXISTS `vehiclemanager`;
GRANT ALL ON vehiclemanager.* TO 'ltomgr'@'localhost';
USE `vehiclemanager`;

--DEFINE DATABASES HERE
-- ============================================================
-- DRIVER
-- ============================================================
CREATE TABLE IF NOT EXISTS `driver` (
    license_no              VARCHAR(15)     NOT NULL,
    fname                   VARCHAR(20)     NOT NULL,
    lname                   VARCHAR(20)     NOT NULL,
    mname                   VARCHAR(20)     NOT NULL,
    bday                    DATE            NOT NULL,
    sex                     VARCHAR(1)      NOT NULL,
    nationality             VARCHAR(30)     NOT NULL,
    height_cm               DECIMAL(5,2)    NOT NULL,
    weight_kg               DECIMAL(5,2)    NOT NULL,
    eye_color               VARCHAR(15)     NOT NULL,
    blood_type              VARCHAR(3)      NOT NULL,
    contact_no              VARCHAR(15)     NOT NULL,
    organ_donor             TINYINT(1)      NOT NULL DEFAULT 0,
    mother_fname            VARCHAR(20)     NOT NULL,
    mother_lname            VARCHAR(20)     NOT NULL,
    mother_mname            VARCHAR(20),
    father_fname            VARCHAR(20)     NOT NULL,
    father_lname            VARCHAR(20)     NOT NULL,
    father_mname            VARCHAR(20),
    emrg_contact_person     VARCHAR(60)     NOT NULL,
    emrg_contact_no         VARCHAR(15)     NOT NULL,
    license_type            VARCHAR(10)     NOT NULL,
    license_status          VARCHAR(10)     NOT NULL DEFAULT 'Active',
    issued_date             DATE            NOT NULL,
    expiry_date             DATE            NOT NULL,
    agency_code             VARCHAR(10)     NOT NULL,
    PRIMARY KEY (`license_no`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================================
-- DRIVER SUPPORTING TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS `driver_address` (
    license_no      VARCHAR(15)     NOT NULL,
    address         VARCHAR(100)    NOT NULL,
    PRIMARY KEY (`license_no`, `address`),
    FOREIGN KEY (`license_no`) REFERENCES `driver`(`license_no`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `driver_license_code` (
    license_no      VARCHAR(15)     NOT NULL,
    license_code    VARCHAR(10)     NOT NULL,
    PRIMARY KEY (`license_no`, `license_code`),
    FOREIGN KEY (`license_no`) REFERENCES `driver`(`license_no`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `driver_condition` (
    license_no      VARCHAR(15)     NOT NULL,
    condition       VARCHAR(60)     NOT NULL,
    PRIMARY KEY (`license_no`, `condition`),
    FOREIGN KEY (`license_no`) REFERENCES `driver`(`license_no`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================================
-- VEHICLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `vehicle` (
    plate_no        VARCHAR(10)     NOT NULL,
    engine_no       VARCHAR(20)     NOT NULL,
    chassis_no      VARCHAR(20)     NOT NULL,
    ownership       VARCHAR(20)     NOT NULL,
    vehicle_type    VARCHAR(20)     NOT NULL,
    color           VARCHAR(20)     NOT NULL,
    make            VARCHAR(30)     NOT NULL,
    model           VARCHAR(30)     NOT NULL,
    year            YEAR            NOT NULL,
    license_no      VARCHAR(15)     NOT NULL,
    PRIMARY KEY (`plate_no`, `engine_no`, `chassis_no`),
    FOREIGN KEY (`license_no`) REFERENCES `driver`(`license_no`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================================
-- VEHICLE REGISTRATION
-- ============================================================
CREATE TABLE IF NOT EXISTS `vehicle_registration` (
    registration_no     VARCHAR(20)     NOT NULL,
    expiration_date     DATE            NOT NULL,
    registration_date   DATE            NOT NULL,
    plate_no            VARCHAR(10)     NOT NULL,
    engine_no           VARCHAR(20)     NOT NULL,
    chassis_no          VARCHAR(20)     NOT NULL,
    PRIMARY KEY (`registration_no`),
    FOREIGN KEY (`plate_no`, `engine_no`, `chassis_no`)
        REFERENCES `vehicle`(`plate_no`, `engine_no`, `chassis_no`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================================
-- VIOLATION TICKET
-- ============================================================
CREATE TABLE IF NOT EXISTS `violation_ticket` (
    ticket_id               INT(10)         NOT NULL AUTO_INCREMENT,
    location                VARCHAR(100)    NOT NULL,
    date                    DATE            NOT NULL,
    violation_status        VARCHAR(20)     NOT NULL DEFAULT 'Unpaid',
    apprehending_officer    VARCHAR(60)     NOT NULL,
    license_no              VARCHAR(15)     NOT NULL,
    plate_no                VARCHAR(10)     NOT NULL,
    PRIMARY KEY (`ticket_id`),
    FOREIGN KEY (`license_no`) REFERENCES `driver`(`license_no`),
    FOREIGN KEY (`plate_no`) REFERENCES `vehicle`(`plate_no`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================================
-- VIOLATION
-- ============================================================
CREATE TABLE IF NOT EXISTS `violation` (
    violation_id    INT(10)         NOT NULL AUTO_INCREMENT,
    violation_name  VARCHAR(60)     NOT NULL,
    fine_amount     DECIMAL(10,2)   NOT NULL,
    ticket_id       INT(10)         NOT NULL,
    PRIMARY KEY (`violation_id`),
    FOREIGN KEY (`ticket_id`) REFERENCES `violation_ticket`(`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;