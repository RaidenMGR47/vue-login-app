<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';



$database = new Database();
$db = $database->getConnection();

$username = $_POST['username'] ?? null;

if (!$username || empty($_FILES['avatar'])) {
    sendResponse(false, null, 'Faltan parámetros o archivo');
}

$file = $_FILES['avatar'];

// Validaciones básicas
$maxSize = 2 * 1024 * 1024; // 2MB
$allowed = ['image/jpeg', 'image/png', 'image/webp'];

if ($file['size'] > $maxSize) {
    sendResponse(false, null, 'El archivo es demasiado grande (máx 2MB)');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed)) {
    sendResponse(false, null, 'Tipo de archivo no permitido');
}

$ext = '';
switch ($mime) {
    case 'image/jpeg':
        $ext = 'jpg';
        break;
    case 'image/png':
        $ext = 'png';
        break;
    case 'image/webp':
        $ext = 'webp';
        break;
}

$uploadDir = __DIR__ . '/uploads/users';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$filename = preg_replace('/[^a-z0-9_-]/i', '', $username) . '_' . time() . '.' . $ext;
$destination = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    sendResponse(false, null, 'Error al mover el archivo');
}

$avatarPath = 'uploads/users/' . $filename; // ruta relativa al directorio del API

try {
    $query = "UPDATE users SET avatar = :avatar WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":avatar", $avatarPath);
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    sendResponse(true, ['avatar' => $avatarPath], 'Avatar subido');
} catch (Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage());
}

?>