-- Database Schema for Biomehanika pokreta (bmhpokreta)
-- Optimized for MariaDB (Hetzner Standard)
-- This script safely updates the database without using complex procedures or delimiters.
-- 1. Users table (Staff and Clients)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role ENUM('admin', 'staff', 'client') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Safely add missing columns if they don't exist (MariaDB specific syntax)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS education VARCHAR(255);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
-- 2. Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 3. Services / Sub-services
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 4. Staff Services (Mapping which therapist does which therapy)
CREATE TABLE IF NOT EXISTS staff_services (
    staff_id INT,
    service_id INT,
    PRIMARY KEY (staff_id, service_id),
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 5. Work Shifts
CREATE TABLE IF NOT EXISTS work_shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT,
    date DATE NOT NULL,
    shift_type ENUM('morning', 'afternoon', 'custom', 'split') DEFAULT 'morning',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    second_start_time TIME,
    second_end_time TIME,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 6. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    staff_id INT,
    service_id INT,
    appointment_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE
    SET NULL,
        FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE
    SET NULL,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE
    SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 7. Seed Default Data (INSERT IGNORE avoids duplicates if data already exists)
INSERT IGNORE INTO service_categories (id, name, description)
VALUES (
        1,
        '1. Dijagnostika i individualna procjena',
        'Uvid u stanje klijenta...'
    ),
    (
        2,
        '2. Fizikalne procedure i tehnologija',
        'Primjena suvremenih aparata...'
    ),
    (
        3,
        '3. Specijalizirane manualne tehnike i koncepti',
        'Specijalizirani terapijski koncepti...'
    ),
    (
        4,
        '4. Prevencija, trening i edukacija',
        'Dugoročno zdravlje i otpornost...'
    );
INSERT IGNORE INTO services (id, category_id, name, price, duration_minutes)
VALUES (1, 1, 'Cjelovita klinička procjena', 45, 60),
    (2, 1, 'Analiza biomehanike tijela', 45, 45),
    (3, 2, 'TECAR terapija', 40, 30),
    (4, 2, 'Magnetoterapija', 30, 30),
    (5, 3, 'Maitland koncept', 45, 45),
    (6, 3, 'DNS rehabilitacija', 45, 45);