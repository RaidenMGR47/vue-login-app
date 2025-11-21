<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener todas las salas
        try {
            $query = "SELECT * FROM halls ORDER BY name";
            $stmt = $db->prepare($query);
            $stmt->execute();

            $halls = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendResponse(true, ['halls' => $halls]);
        } catch (Exception $e) {
            sendResponse(false, null, "Error al obtener salas: " . $e->getMessage());
        }
        break;

    case 'POST':
        // Añadir nueva sala
        $data = json_decode(file_get_contents("php://input"), true);

        if (!empty($data['name']) && !empty($data['capacity'])) {
            try {
                $id = 'h' . time();

                $query = "INSERT INTO halls (id, name, capacity) VALUES (:id, :name, :capacity)";

                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $id);
                $stmt->bindParam(":name", $data['name']);
                $stmt->bindParam(":capacity", $data['capacity']);

                if ($stmt->execute()) {
                    $newHall = [
                        'id' => $id,
                        'name' => $data['name'],
                        'capacity' => intval($data['capacity'])
                    ];
                    sendResponse(true, ['hall' => $newHall], "Sala añadida correctamente");
                } else {
                    sendResponse(false, null, "Error al añadir sala");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "Datos incompletos");
        }
        break;

    case 'DELETE':
        // Eliminar sala
        $data = json_decode(file_get_contents("php://input"), true);

        if (!empty($data['id'])) {
            try {
                $query = "DELETE FROM halls WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $data['id']);

                if ($stmt->execute()) {
                    sendResponse(true, null, "Sala eliminada correctamente");
                } else {
                    sendResponse(false, null, "Error al eliminar sala");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "ID de sala no proporcionado");
        }
        break;

    default:
        sendResponse(false, null, "Método no permitido");
        break;
}
?>