<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$target_dir = __DIR__ . "/uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file'])) {
        $file = $_FILES['file'];
        $fileName = basename($file["name"]);
        // Generate unique name to prevent overwrite
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        $newFileName = uniqid() . '.' . $extension;
        $target_file = $target_dir . $newFileName;
        
        $check = getimagesize($file["tmp_name"]);
        if($check !== false) {
            if (move_uploaded_file($file["tmp_name"], $target_file)) {
                // Return the URL relative to the server root
                // Assuming the server is running on the root of the project or appropriately mapped
                // We return a relative path that the frontend can use or prepend the base URL to
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                $host = $_SERVER['HTTP_HOST'];
                // Clean up path to be relative to web root if possible, or just return full URL
                // For simplicity in this setup, returning full URL is safer
                 
                // Determine the path relative to the script
                $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
                $url = "$protocol://$host$scriptDir/uploads/$newFileName";
                
                echo json_encode(["url" => $url]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Sorry, there was an error uploading your file."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "File is not an image."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded."]);
    }
}
?>
