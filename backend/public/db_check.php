<?php
// db_check.php - Script for diagnosing database connection issues
header('Content-Type: text/plain');

echo "=== Database Connection Diagnostics ===\n";
echo "Server Time: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Loaded Extensions: " . implode(", ", get_loaded_extensions()) . "\n";
echo "PDO MySQL Driver: " . (extension_loaded('pdo_mysql') ? 'INSTALLED' : 'MISSING') . "\n\n";

// 1. Manually Load .env
echo "--- Loading .env Configuration ---\n";
$envPath = __DIR__ . '/../.env';
echo "Looking for .env at: $envPath\n";

if (!file_exists($envPath)) {
    echo "ERROR: .env file NOT FOUND at $envPath\n";
    exit;
}

echo ".env file found. Parsing...\n";
$env = [];
$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    
    // Simple split
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) {
        $key = trim($parts[0]);
        $val = trim($parts[1]);
        // Remove quotes if present
        $val = trim($val, "\"'");
        $env[$key] = $val;
    }
}

$host = $env['DB_HOST'] ?? 'undefined';
$name = $env['DB_NAME'] ?? 'undefined';
$user = $env['DB_USER'] ?? 'undefined';
$pass = $env['DB_PASS'] ?? 'undefined';
$port = $env['DB_PORT'] ?? '3306';

echo "DB_HOST: " . $host . "\n";
echo "DB_PORT: " . $port . "\n";
echo "DB_NAME: " . $name . "\n";
echo "DB_USER: " . $user . "\n";
echo "DB_PASS: " . (strlen($pass) > 0 ? "****** (Length: " . strlen($pass) . ")" : "EMPTY") . "\n\n";

// 2. Attempt Connection
echo "--- Attempting Connection ---\n";

function try_connect($h, $p, $d, $u, $pw) {
    $dsn = "mysql:host=$h;port=$p;dbname=$d;charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $u, $pw, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        return ["success" => true, "pdo" => $pdo, "msg" => "Connected successfully to $h"];
    } catch (PDOException $e) {
        return ["success" => false, "msg" => $e->getMessage()];
    }
}

// Attempt 1: As Configured
echo "Attempt 1 (Configured Host: $host): ";
$res1 = try_connect($host, $port, $name, $user, $pass);
if ($res1['success']) {
    echo "SUCCESS! \n";
    $pdo = $res1['pdo'];
} else {
    echo "FAILED. Error: " . $res1['msg'] . "\n";
    
    // Attempt 2: Force 127.0.0.1 if localhost failed
    if ($host === 'localhost') {
        echo "Attempt 2 (Force 127.0.0.1): ";
        $res2 = try_connect('127.0.0.1', $port, $name, $user, $pass);
        if ($res2['success']) {
             echo "SUCCESS! (Note: 'localhost' failed but '127.0.0.1' worked. Please update .env to DB_HOST=127.0.0.1)\n";
             $pdo = $res2['pdo'];
        } else {
             echo "FAILED. Error: " . $res2['msg'] . "\n";
             $pdo = null;
        }
    } else {
        $pdo = null;
    }
}

// 3. Test Query
if ($pdo) {
    echo "\n--- Database content check ---\n";
    try {
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Tables found (" . count($tables) . "): " . implode(", ", $tables) . "\n";
        
        // Check Users
        if (in_array('users', $tables)) {
            $stmt = $pdo->query("SELECT count(*) FROM users");
            echo "Users count: " . $stmt->fetchColumn() . "\n";
        }
    } catch (Exception $e) {
        echo "Query failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "\nFATAL: Could not connect to database.\n";
    echo "Troubleshooting suggestions:\n";
    echo "1. Password Check: Ensure DB_PASS in .env matches EXACTLY what you set in Hetzner panel.\n";
    echo "2. User Check: Ensure DB_USER is correct (e.g., check for prefixes like 'usr_').\n";
    echo "3. Host Check: Try DB_HOST=127.0.0.1 vs localhost.\n";
}
