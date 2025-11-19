<?php
require_once 'db_config.php';
header('Content-Type: application/json');

$database = new Database();
try {
    $db = $database->getConnection();
    if ($db) {
        echo json_encode(["ok" => true, "message" => "Conexión a la base de datos exitosa"]);
    } else {
        echo json_encode(["ok" => false, "message" => "No se obtuvo conexión (objeto nulo)"]);
    }
} catch (Exception $e) {
    echo json_encode(["ok" => false, "message" => "Error al conectar: " . $e->getMessage()]);
}
?>