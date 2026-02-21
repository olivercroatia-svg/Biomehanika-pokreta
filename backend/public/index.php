<?php
/**
 * Biomehanika Pokreta API Entry Point - MariaDB Integration
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load .env manually since we are in simple PHP
$env = [];
$envFile = __DIR__ . '/../.env';
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

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // Second attempt with 127.0.0.1 if host was localhost
     if ($host === 'localhost') {
         try {
             $dsn2 = "mysql:host=127.0.0.1;port=$port;dbname=$db;charset=$charset";
             $pdo = new PDO($dsn2, $user, $pass, $options);
             goto connected;
         } catch (\Exception $e2) {
             // Fall through to error
         }
     }
     
     http_response_code(500);
     echo json_encode([
         "message" => "Database connection failed", 
         "error" => $e->getMessage()
     ]);
     exit;
}
connected:

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Router: /api/v1/[endpoint]
$endpoint = '';
foreach($uri as $key => $part) {
    if ($part === 'v1') {
        $endpoint = $uri[$key + 1] ?? '';
        break;
    }
}

switch ($endpoint) {
    case 'services':
        handleServices($pdo);
        break;
    case 'staff':
        handleStaff($pdo);
        break;
    case 'bookings':
        handleBookings($pdo);
        break;
    case 'clients':
        handleClients($pdo);
        break;
    case 'shifts':
        handleShifts($pdo);
        break;
    case 'test':
        echo json_encode(["status" => "Database connected successfully", "database" => $db]);
        break;
    default:
        http_response_code(404);
        echo json_encode(["message" => "Endpoint '$endpoint' not found"]);
        break;
}

function handleServices($pdo) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch categories with their sub-services
        $stmt = $pdo->query("SELECT * FROM service_categories");
        $categories = $stmt->fetchAll();

        foreach ($categories as &$cat) {
            $stmtSub = $pdo->prepare("SELECT id, name, price, duration_minutes as duration FROM services WHERE category_id = ?");
            $stmtSub->execute([$cat['id']]);
            $subServices = $stmtSub->fetchAll();
            
            // Fetch staff for each sub-service
            foreach ($subServices as &$sub) {
                $stmtStaff = $pdo->prepare("SELECT staff_id FROM staff_services WHERE service_id = ?");
                $stmtStaff->execute([$sub['id']]);
                $sub['staffIds'] = $stmtStaff->fetchAll(PDO::FETCH_COLUMN);
            }
            
            $cat['subServices'] = $subServices;
            $cat['images'] = [$cat['image_url']];
        }

        echo json_encode($categories);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        try {
            $pdo->beginTransaction();
            
            // 1. Service Category
            $categoryId = $data['id'] ?? null;
            $name = $data['name'];
            $desc = $data['description'] ?? '';
            $imageUrl = $data['images'][0] ?? '';
            
            // Check if ID is a timestamp (large number) -> treat as new
            if ($categoryId && $categoryId > 2000000000) { 
                $categoryId = null; 
            }

            if ($categoryId) {
                // Update
                $stmt = $pdo->prepare("UPDATE service_categories SET name=?, description=?, image_url=? WHERE id=?");
                $stmt->execute([$name, $desc, $imageUrl, $categoryId]);
            } else {
                // Insert
                $stmt = $pdo->prepare("INSERT INTO service_categories (name, description, image_url) VALUES (?, ?, ?)");
                $stmt->execute([$name, $desc, $imageUrl]);
                $categoryId = $pdo->lastInsertId();
            }

            // 2. Clear old Sub Services and Staff connections
            // Delete staff_services linked to sub-services of this category
            $stmt = $pdo->prepare("DELETE FROM staff_services WHERE service_id IN (SELECT id FROM services WHERE category_id = ?)");
            $stmt->execute([$categoryId]);

            // Delete sub-services
            $stmt = $pdo->prepare("DELETE FROM services WHERE category_id = ?");
            $stmt->execute([$categoryId]);
            
            // 3. Insert new Sub Services and Staff connections
            if (!empty($data['subServices'])) {
                $stmtSub = $pdo->prepare("INSERT INTO services (category_id, name, price, duration_minutes) VALUES (?, ?, ?, ?)");
                $stmtStaff = $pdo->prepare("INSERT INTO staff_services (service_id, staff_id) VALUES (?, ?)");

                foreach ($data['subServices'] as $sub) {
                    $stmtSub->execute([$categoryId, $sub['name'], $sub['price'], $sub['duration']]);
                    $subId = $pdo->lastInsertId();

                    if (!empty($sub['staffIds'])) {
                        foreach ($sub['staffIds'] as $staffId) {
                            $stmtStaff->execute([$subId, $staffId]);
                        }
                    }
                }
            }

            $pdo->commit();
            echo json_encode(["message" => "Service saved", "id" => $categoryId]);

        } catch (\Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Failed to save service", "error" => $e->getMessage()]);
        }
    }
}

function handleStaff($pdo) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("SELECT id, first_name, last_name, role, education, bio, image_url as image FROM users WHERE role = 'staff'");
        $staff = $stmt->fetchAll();
        
        foreach ($staff as &$member) {
            $member['name'] = $member['first_name'] . ' ' . $member['last_name'];
            $member['specialty'] = explode(', ', $member['education']); 
        }
        
        echo json_encode($staff);
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        // Ensure data is array of objects
        $data = (isset($input['id']) || isset($input['name'])) ? [$input] : $input;

        try {
            $pdo->beginTransaction();
            foreach ($data as $m) {
                // Parse Name
                $nameParts = explode(' ', $m['name'], 2);
                $firstName = $nameParts[0];
                $lastName = $nameParts[1] ?? '';
                $specialtyStr = (isset($m['specialty']) && is_array($m['specialty'])) ? implode(', ', $m['specialty']) : ($m['specialty'] ?? '');
                // generate a fake phone if missing, or use existing
                $phone = $m['phone_number'] ?? ('000' . substr((string)($m['id'] ?? time()), -6));
                
                // Allow ID to be auto-generated if it's large (timestamp)
                $dbId = (!empty($m['id']) && $m['id'] > 2000000000) ? null : ($m['id'] ?? null);
                
                $lastId = $dbId;

                if ($dbId) {
                    $stmt = $pdo->prepare("INSERT INTO users 
                        (id, first_name, last_name, role, education, bio, image_url, phone_number) 
                        VALUES (?, ?, ?, 'staff', ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                        first_name = VALUES(first_name),
                        last_name = VALUES(last_name),
                        education = VALUES(education),
                        bio = VALUES(bio),
                        image_url = VALUES(image_url)");
                    $stmt->execute([ $dbId, $firstName, $lastName, $m['education'] ?? $specialtyStr, $m['bio'] ?? '', $m['image'] ?? '', $phone ]);
                } else {
                     $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, role, education, bio, image_url, phone_number) 
                        VALUES (?, ?, 'staff', ?, ?, ?, ?)");
                     $stmt->execute([$firstName, $lastName, $m['education'] ?? $specialtyStr, $m['bio'] ?? '', $m['image'] ?? '', $phone]);
                     $lastId = $pdo->lastInsertId();
                }
            }
            $pdo->commit();
            
            $result = ["message" => "Staff sync success"];
            if (count($data) === 1 && $lastId) {
                $result['id'] = $lastId;
            }
            echo json_encode($result);
        } catch (\Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Sync failed", "error" => $e->getMessage()]);
            error_log("Staff Sync Error: " . $e->getMessage());
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'staff'");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Staff deleted"]);
        } else {
             http_response_code(400);
             echo json_encode(["message" => "Missing ID"]);
        }
    }
}

function handleClients($pdo) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("SELECT id, first_name, last_name, email, phone_number, created_at, profile_data FROM users WHERE role = 'client'");
        $clients = $stmt->fetchAll();
        
        // Map to frontend structure
        $mapped = array_map(function($c) {
            $profile = !empty($c['profile_data']) ? json_decode($c['profile_data'], true) : [];
            
            // Base identification from DB columns, merged with profile extras
            $identification = array_merge(
                $profile['identification'] ?? [],
                [
                    'id' => (string)$c['id'],
                    'ime_prezime' => $c['first_name'] . ' ' . $c['last_name'],
                    'email' => $c['email'],
                    'kontakt_broj' => $c['phone_number']
                ]
            );

            return [
                'id' => (string)$c['id'],
                'identification' => $identification,
                'anamnesis' => $profile['anamnesis'] ?? [
                    'glavna_tegoba' => '',
                    'kontraindikacije' => [],
                    'lijekovi' => '',
                    'prethodne_operacije' => ''
                ],
                'physicalStatus' => $profile['physicalStatus'] ?? [
                    'bol_vas_skala' => 0,
                    'opseg_pokreta' => '',
                    'misicna_snaga' => 5,
                    'neuroloski_ispad' => false,
                    'napomene_terapeuta' => ''
                ],
                'status' => 'active',
                'registrationDate' => $c['created_at']
            ];
        }, $clients);
        
        echo json_encode($mapped);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        try {
            // Check if user exists
            $nameParts = explode(' ', $data['identification']['ime_prezime'], 2);
            $firstName = $nameParts[0];
            $lastName = $nameParts[1] ?? '';
            $email = $data['identification']['email'];
            $phone = $data['identification']['kontakt_broj'];
            
            // Store full data in profile_data
            $profileData = json_encode([
                'identification' => $data['identification'],
                'anamnesis' => $data['anamnesis'],
                'physicalStatus' => $data['physicalStatus']
            ]);
            
            // Check if email or phone already exists to avoid duplicate error
            // (Basic check, ideal would be ON DUPLICATE KEY UPDATE)
            
            $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, email, phone_number, role, profile_data) VALUES (?, ?, ?, ?, 'client', ?)");
            $stmt->execute([$firstName, $lastName, $email, $phone, $profileData]);
            
            echo json_encode(["message" => "Client added", "id" => $pdo->lastInsertId()]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to add client", "error" => $e->getMessage()]);
        }
    }
}

function handleShifts($pdo) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("SELECT * FROM work_shifts");
        $shifts = $stmt->fetchAll();
        $mapped = array_map(function($s) {
            return [
                'id' => $s['id'],
                'staffId' => $s['staff_id'],
                'dateString' => $s['date'],
                'start' => substr($s['start_time'], 0, 5),
                'end' => substr($s['end_time'], 0, 5),
                'type' => $s['type'] ?? 'morning',
                'secondStart' => $s['second_start_time'] ? substr($s['second_start_time'], 0, 5) : null,
                'secondEnd' => $s['second_end_time'] ? substr($s['second_end_time'], 0, 5) : null
            ];
        }, $shifts);
        echo json_encode($mapped);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        try {
             // Validate ID - if coming from frontend as generated string (e.g. "12-2023-01-01") or numeric DB ID
             // Since we switched DB to use INT AUTO_INCREMENT, we should handle this.
             // If ID is a string like "12-2023...", it's a temp ID from frontend. We should INSERT.
             // If ID is numeric, it might be an UPDATE.
             
             $isNumericId = isset($data['id']) && is_numeric($data['id']);
             
             $staffId = $data['staffId'];
             $dateStr = $data['dateString'];
             $start = $data['start'];
             $end = $data['end'];
             $type = $data['type'] ?? 'morning';
             $secondStart = $data['secondStart'] ?? null;
             $secondEnd = $data['secondEnd'] ?? null;

             if ($isNumericId) {
                 // Update existing
                 $stmt = $pdo->prepare("UPDATE work_shifts SET staff_id=?, date=?, start_time=?, end_time=?, type=?, second_start_time=?, second_end_time=? WHERE id=?");
                 $stmt->execute([$staffId, $dateStr, $start, $end, $type, $secondStart, $secondEnd, $data['id']]);
                 echo json_encode(["message" => "Shift updated", "id" => $data['id']]);
             } else {
                 // Insert new (ignores frontend's temp ID)
                 $stmt = $pdo->prepare("INSERT INTO work_shifts (staff_id, date, start_time, end_time, type, second_start_time, second_end_time) VALUES (?, ?, ?, ?, ?, ?, ?)");
                 $stmt->execute([$staffId, $dateStr, $start, $end, $type, $secondStart, $secondEnd]);
                 echo json_encode(["message" => "Shift saved", "id" => $pdo->lastInsertId()]);
             }
        } catch (\Exception $e) {
             http_response_code(500);
             echo json_encode(["message" => "Failed to save shift", "error" => $e->getMessage()]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM work_shifts WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Shift deleted"]);
        }
    }
}

function handleBookings($pdo) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $sql = "SELECT 
                        a.id, 
                        a.client_id, 
                        a.staff_id, 
                        a.service_id, 
                        a.appointment_time, 
                        a.duration_minutes, 
                        a.notes,
                        u.first_name, u.last_name,
                        s.name as service_name
                    FROM appointments a
                    LEFT JOIN users u ON a.client_id = u.id
                    LEFT JOIN services s ON a.service_id = s.id
                    ORDER BY a.appointment_time ASC";
            
            $stmt = $pdo->query($sql);
            $appointments = $stmt->fetchAll();
            
            $mapped = array_map(function($app) {
                $dt = new DateTime($app['appointment_time']);
                return [
                    'id' => $app['id'],
                    'clientName' => $app['first_name'] . ' ' . $app['last_name'],
                    'clientId' => $app['client_id'],
                    'staffId' => $app['staff_id'],
                    'serviceId' => $app['service_id'],
                    'serviceName' => $app['service_name'] ?? 'Terapija',
                    'dateString' => $dt->format('Y-m-d'),
                    'time' => $dt->format('H:i'),
                    'duration' => $app['duration_minutes']
                ];
            }, $appointments);

            echo json_encode($mapped);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to fetch bookings", "error" => $e->getMessage()]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        try {
             if (empty($data['clientId'])) {
                 http_response_code(400); 
                 echo json_encode(["message" => "Client ID is required"]);
                 exit;
             }

            $stmt = $pdo->prepare("INSERT INTO appointments (client_id, staff_id, service_id, appointment_time, duration_minutes, notes) VALUES (?, ?, ?, ?, ?, ?)");
            $dateTime = $data['dateString'] . ' ' . $data['time'] . ':00';
            
            $stmt->execute([
                $data['clientId'],
                $data['staffId'],
                $data['serviceId'],
                $dateTime,
                $data['duration'],
                "Client Name: " . ($data['clientName'] ?? 'Unknown')
            ]);
            
            echo json_encode(["message" => "Booking saved successfully", "id" => $pdo->lastInsertId()]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to save booking", "error" => $e->getMessage()]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        try {
            $stmt = $pdo->prepare("UPDATE appointments SET appointment_time=?, duration_minutes=?, staff_id=?, service_id=? WHERE id=?");
            $dateTime = $data['dateString'] . ' ' . $data['time'] . ':00';
            $stmt->execute([
                $dateTime, 
                $data['duration'], 
                $data['staffId'], 
                $data['serviceId'], 
                $data['id']
            ]);
            echo json_encode(["message" => "Booking updated"]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update booking", "error" => $e->getMessage()]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Booking deleted"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Missing ID"]);
        }
    }
}
