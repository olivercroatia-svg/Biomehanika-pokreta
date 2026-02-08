<?php
/**
 * Biomehanika Pokreta API Entry Point
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Simple Router logic
// Expected path: /api/v1/[endpoint]
if ($uri[1] !== 'api' || $uri[2] !== 'v1') {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint not found"]);
    exit();
}

$endpoint = $uri[3] ?? '';

switch ($endpoint) {
    case 'services':
        handleServices();
        break;
    case 'availability':
        handleAvailability();
        break;
    case 'bookings':
        handleBookings();
        break;
    case 'whatsapp-webhook':
        handleWhatsAppWebhook();
        break;
    default:
        http_response_code(404);
        echo json_encode(["message" => "Endpoint $endpoint not found"]);
        break;
}

function handleServices() {
    // Stub for services
    echo json_encode([
        ["id" => 1, "name" => "Manualna Terapija", "price" => 50, "duration" => 45],
        ["id" => 2, "name" => "DNS Rehabilitacija", "price" => 60, "duration" => 60],
        ["id" => 3, "name" => "Kinesiotaping", "price" => 20, "duration" => 15]
    ]);
}

function handleAvailability() {
    // Logic to check DB and Google Calendar
    echo json_encode([
        "available_slots" => ["2024-05-10 10:00", "2024-05-10 14:00", "2024-05-11 09:00"]
    ]);
}

function handleBookings() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        echo json_encode(["message" => "Booking received", "data" => $data]);
    } else {
        http_response_code(405);
    }
}

function handleWhatsAppWebhook() {
    // Logic for Meta Cloud API Webhook
    $data = json_decode(file_get_contents("php://input"), true);
    // 1. Process Message
    // 2. Call OpenAI API
    // 3. Respond via WhatsApp API
    echo json_encode(["status" => "success"]);
}
