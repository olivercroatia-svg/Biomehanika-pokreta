<?php
$env = parse_ini_file('.env');
$host = $env['DB_HOST'];
$db   = $env['DB_NAME'];
$user = $env['DB_USER'];
$pass = $env['DB_PASS'];
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Connected.\n";
     
     $stmt = $pdo->query("SHOW TABLES");
     $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
     echo "Tables:\n";
     foreach ($tables as $table) {
         echo "- $table\n";
         
         if ($table === 'users' || $table === 'appointments' || $table === 'staff_schedule' || $table === 'work_shifts') {
             echo "  Columns for $table:\n";
             $stmt2 = $pdo->query("DESCRIBE $table");
             $columns = $stmt2->fetchAll(PDO::FETCH_COLUMN);
             foreach ($columns as $col) {
                 echo "    - $col\n";
             }
         }
     }
} catch (\PDOException $e) {
     echo "Connection failed: " . $e->getMessage() . "\n";
}
