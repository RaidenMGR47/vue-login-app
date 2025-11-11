<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Obtener todas las películas
        try {
            $query = "SELECT * FROM movies ORDER BY title";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $movies = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $row['daysAvailable'] = json_decode($row['days_available'], true) ?: [];
                $row['price'] = floatval($row['price']);
                unset($row['days_available']);
                $movies[] = $row;
            }
            
            sendResponse(true, ['movies' => $movies]);
        } catch (Exception $e) {
            sendResponse(false, null, "Error al obtener películas: " . $e->getMessage());
        }
        break;

    case 'POST':
        // Añadir nueva película
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!empty($data['title']) && !empty($data['year']) && !empty($data['genre']) && !empty($data['price'])) {
            try {
                $id = 'm' . time();
                $days_available = json_encode($data['daysAvailable'] ?? []);
                
                // Procesar la imagen - ahora aceptamos data URLs base64 completas
                $poster = $data['poster'] ?? '';
                
                $query = "INSERT INTO movies (id, title, year, genre, price, poster, days_available) 
                         VALUES (:id, :title, :year, :genre, :price, :poster, :days_available)";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $id);
                $stmt->bindParam(":title", $data['title']);
                $stmt->bindParam(":year", $data['year']);
                $stmt->bindParam(":genre", $data['genre']);
                $stmt->bindParam(":price", $data['price']);
                $stmt->bindParam(":poster", $poster);
                $stmt->bindParam(":days_available", $days_available);
                
                if ($stmt->execute()) {
                    $newMovie = [
                        'id' => $id,
                        'title' => $data['title'],
                        'year' => $data['year'],
                        'genre' => $data['genre'],
                        'price' => floatval($data['price']),
                        'poster' => $poster,
                        'daysAvailable' => $data['daysAvailable'] ?? []
                    ];
                    sendResponse(true, ['movie' => $newMovie], "Película añadida correctamente");
                } else {
                    sendResponse(false, null, "Error al añadir película");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "Datos incompletos");
        }
        break;

    case 'PUT':
        // Actualizar película
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!empty($data['id']) && !empty($data['title']) && !empty($data['year']) && !empty($data['genre']) && !empty($data['price'])) {
            try {
                $days_available = json_encode($data['daysAvailable'] ?? []);
                
                $query = "UPDATE movies SET title = :title, year = :year, genre = :genre, 
                         price = :price, poster = :poster, days_available = :days_available 
                         WHERE id = :id";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $data['id']);
                $stmt->bindParam(":title", $data['title']);
                $stmt->bindParam(":year", $data['year']);
                $stmt->bindParam(":genre", $data['genre']);
                $stmt->bindParam(":price", $data['price']);
                $stmt->bindParam(":poster", $data['poster']);
                $stmt->bindParam(":days_available", $days_available);
                
                if ($stmt->execute()) {
                    sendResponse(true, null, "Película actualizada correctamente");
                } else {
                    sendResponse(false, null, "Error al actualizar película");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "Datos incompletos");
        }
        break;

    case 'DELETE':
        // Eliminar película
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!empty($data['id'])) {
            try {
                $query = "DELETE FROM movies WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $data['id']);
                
                if ($stmt->execute()) {
                    sendResponse(true, null, "Película eliminada correctamente");
                } else {
                    sendResponse(false, null, "Error al eliminar película");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "ID de película no proporcionado");
        }
        break;

    default:
        sendResponse(false, null, "Método no permitido");
        break;
}
?>