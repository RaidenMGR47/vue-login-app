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
        // Obtener todas las funciones
        try {
            $query = "SELECT s.*, m.title as movie_title, h.name as hall_name 
                     FROM screenings s
                     JOIN movies m ON s.movie_id = m.id
                     JOIN halls h ON s.hall_id = h.id
                     ORDER BY s.start_time";
            $stmt = $db->prepare($query);
            $stmt->execute();

            $screenings = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $row['startTime'] = $row['start_time'];
                $row['movieId'] = $row['movie_id'];
                $row['hallId'] = $row['hall_id'];
                $row['movieTitle'] = $row['movie_title'];
                $row['hallName'] = $row['hall_name'];
                unset($row['start_time'], $row['movie_id'], $row['hall_id'], $row['movie_title'], $row['hall_name']);
                $screenings[] = $row;
            }

            sendResponse(true, ['screenings' => $screenings]);
        } catch (Exception $e) {
            sendResponse(false, null, "Error al obtener funciones: " . $e->getMessage());
        }
        break;

    case 'POST':
        // Añadir nueva función
        $data = json_decode(file_get_contents("php://input"), true);

        if (!empty($data['movieId']) && !empty($data['hallId']) && !empty($data['startTime']) && !empty($data['duration'])) {
            try {
                $id = 's' . time();

                // Verificar conflictos (opcional, ya se hace en frontend pero es bueno tenerlo aquí)
                /*
                $newStart = $data['startTime'];
                $duration = intval($data['duration']);
                $newEnd = date('Y-m-d H:i:s', strtotime($newStart) + $duration * 60);

                $conflictQuery = "SELECT * FROM screenings 
                                 WHERE hall_id = :hall_id 
                                 AND (
                                     (start_time < :new_end AND DATE_ADD(start_time, INTERVAL duration MINUTE) > :new_start)
                                 )";
                // ... implementación de verificación de conflicto ...
                */

                $query = "INSERT INTO screenings (id, movie_id, hall_id, start_time, duration) 
                         VALUES (:id, :movie_id, :hall_id, :start_time, :duration)";

                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $id);
                $stmt->bindParam(":movie_id", $data['movieId']);
                $stmt->bindParam(":hall_id", $data['hallId']);
                $stmt->bindParam(":start_time", $data['startTime']);
                $stmt->bindParam(":duration", $data['duration']);

                if ($stmt->execute()) {
                    $newScreening = [
                        'id' => $id,
                        'movieId' => $data['movieId'],
                        'hallId' => $data['hallId'],
                        'startTime' => $data['startTime'],
                        'duration' => intval($data['duration'])
                    ];
                    sendResponse(true, ['screening' => $newScreening], "Función programada correctamente");
                } else {
                    sendResponse(false, null, "Error al programar función");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "Datos incompletos");
        }
        break;

    case 'DELETE':
        // Eliminar función
        $data = json_decode(file_get_contents("php://input"), true);

        if (!empty($data['id'])) {
            try {
                $query = "DELETE FROM screenings WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $data['id']);

                if ($stmt->execute()) {
                    sendResponse(true, null, "Función eliminada correctamente");
                } else {
                    sendResponse(false, null, "Error al eliminar función");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "ID de función no proporcionado");
        }
        break;

    default:
        sendResponse(false, null, "Método no permitido");
        break;
}
?>