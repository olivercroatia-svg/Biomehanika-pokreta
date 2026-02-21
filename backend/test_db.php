<?php
$env = parse_ini_file('.env');
$host = $env['DB_HOST'];
$db   = $env['DB_NAME'];
$user = $env['DB_USER'];
$pass = $env['DB_PASS'];
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
echo "Attempting connection to $host (Database: $db) as user: $user ...\n";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Connection successful!\n";
     
     $stmt = $pdo->query("SELECT id, name FROM service_categories LIMIT 1");
     $row = $stmt->fetch();
     if ($row) {
         echo "Data check: Found category " . $row['name'] . "\n";
     } else {
         echo "Data check: No categories found.\n";
     }
} catch (\PDOException $e) {
     echo "Connection failed: " . $e->getMessage() . "\n";
}
