-- Create User and Databases here
DROP USER IF EXISTS 'ltomgr'@'localhost';
CREATE USER 'ltomgr'@'localhost' IDENTIFIED BY 'lto'; 
-- password: lto

DROP DATABASE IF EXISTS `vehiclemanager`;
CREATE DATABASE IF NOT EXISTS `vehiclemanager`;
GRANT ALL ON vehiclemanager.* TO 'ltomgr'@'localhost';
USE `vehiclemanager`;