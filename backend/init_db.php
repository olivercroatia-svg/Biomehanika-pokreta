<?php
// Load .env manually to avoid parse_ini_file issues
$env = [];
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (!$line || strpos($line, '#') === 0) continue;
        $pos = strpos($line, '=');
        if ($pos !== false) {
            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));
            // Remove surrounding quotes if they exist
            if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                $value = substr($value, 1, -1);
            }
            $env[$key] = $value;
        }
    }
}

$host = $env['DB_HOST'] ?? 'localhost';
$db   = $env['DB_NAME'] ?? '';
$user = $env['DB_USER'] ?? '';
$pass = $env['DB_PASS'] ?? '';
$port = !empty($env['DB_PORT']) ? $env['DB_PORT'] : '3306';
$charset = 'utf8mb4';

echo "Attempting connection to $host with user $user...\n";

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Connected to database successfully.\n";

     // 1. Users Table
     $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150),
        phone_number VARCHAR(50),
        role ENUM('admin', 'staff', 'client') DEFAULT 'client',
        bio TEXT,
        education TEXT,
        image_url VARCHAR(255),
        profile_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )");
     echo "Table 'users' checked.\n";

     // 2. Service Categories
     $pdo->exec("CREATE TABLE IF NOT EXISTS service_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(255)
     )");
     echo "Table 'service_categories' checked.\n";

     // 3. Services
     $pdo->exec("CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration_minutes INT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
     )");
     echo "Table 'services' checked.\n";

     // 4. Staff Services (Junction)
     $pdo->exec("CREATE TABLE IF NOT EXISTS staff_services (
        staff_id INT,
        service_id INT,
        PRIMARY KEY(staff_id, service_id),
        FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
     )");
     echo "Table 'staff_services' checked.\n";

     // 5. Work Shifts
     // Note: Changing ID to INT AUTO_INCREMENT for simplicity if strictly new. 
     // But to avoid breaking existing data if any, let's keep VARCHAR if it exists, but usually we prefer INT.
     // For this fix, IF table exists, we assume it's okay, but we ensure columns.
     
     // Let's DROP existing work_shifts if it has the wrong structure to force strict schema? 
     // User said they can't find data, so dropping is likely safe/beneficial to fix structure.
     // But safer to just creation if not exists.
     $pdo->exec("CREATE TABLE IF NOT EXISTS work_shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        second_start_time TIME NULL,
        second_end_time TIME NULL,
        type VARCHAR(20) DEFAULT 'morning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    // Add columns if missing (logic for updates)
    try { $pdo->exec("ALTER TABLE work_shifts ADD COLUMN second_start_time TIME NULL"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE work_shifts ADD COLUMN second_end_time TIME NULL"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE work_shifts ADD COLUMN type VARCHAR(20) DEFAULT 'morning'"); } catch(Exception $e){}
    
    echo "Table 'work_shifts' checked.\n";

    // 6. Appointments
    $pdo->exec("CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        staff_id INT NOT NULL,
        service_id INT NOT NULL,
        appointment_time DATETIME NOT NULL,
        duration_minutes INT DEFAULT 30,
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    )");
    echo "Table 'appointments' checked.\n";

} catch (\PDOException $e) {
     echo "Error: " . $e->getMessage() . "\n";
}
?>
