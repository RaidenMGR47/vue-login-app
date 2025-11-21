<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
        // Obtener compras por código o por usuario
        $code = $_GET['code'] ?? null;
        $username = $_GET['username'] ?? null;
        $action = $_GET['action'] ?? null;

        try {
            if ($action === 'get_occupied_seats') {
                $movieId = $_GET['movieId'] ?? null;
                $viewingDate = $_GET['viewingDate'] ?? null;
                $hallId = $_GET['hallId'] ?? null;

                if (!$movieId || !$viewingDate || !$hallId) {
                    sendResponse(false, null, "Faltan parámetros para buscar asientos");
                }

                // Buscar todas las compras para esa función y sala
                $query = "SELECT seats FROM purchases WHERE movie_id = :movie_id AND viewing_date = :viewing_date AND hall_id = :hall_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":movie_id", $movieId);
                $stmt->bindParam(":viewing_date", $viewingDate);
                $stmt->bindParam(":hall_id", $hallId);
                $stmt->execute();

                $occupiedSeats = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    if (!empty($row['seats'])) {
                        $seats = json_decode($row['seats'], true);
                        if (is_array($seats)) {
                            $occupiedSeats = array_merge($occupiedSeats, $seats);
                        }
                    }
                }
                // Eliminar duplicados si los hubiera
                $occupiedSeats = array_values(array_unique($occupiedSeats));

                sendResponse(true, ['occupiedSeats' => $occupiedSeats]);

            } elseif ($code) {
                // Buscar por código
                $query = "SELECT * FROM purchases WHERE code = :code";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":code", $code);
                $stmt->execute();

                $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($purchase) {
                    $purchase['totalPrice'] = floatval($purchase['total_price']);
                    $purchase['datePurchased'] = $purchase['date_purchased'];
                    $purchase['seats'] = !empty($purchase['seats']) ? json_decode($purchase['seats']) : [];
                    unset($purchase['total_price'], $purchase['date_purchased']);
                    sendResponse(true, ['purchase' => $purchase]);
                } else {
                    sendResponse(false, null, "Compra no encontrada");
                }
            } elseif ($username) {
                // Buscar por usuario
                $query = "SELECT * FROM purchases WHERE username = :username ORDER BY date_purchased DESC";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":username", $username);
                $stmt->execute();

                $purchases = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $row['totalPrice'] = floatval($row['total_price']);
                    $row['datePurchased'] = $row['date_purchased'];
                    $row['seats'] = !empty($row['seats']) ? json_decode($row['seats']) : [];
                    unset($row['total_price'], $row['date_purchased']);
                    $purchases[] = $row;
                }
                sendResponse(true, ['purchases' => $purchases]);
            } else {
                sendResponse(false, null, "Parámetros insuficientes");
            }
        } catch (Exception $e) {
            sendResponse(false, null, "Error: " . $e->getMessage());
        }
        break;

    case 'POST':
        // Crear nueva compra
        $data = json_decode(file_get_contents("php://input"), true);

        if (
            !empty($data['username']) && !empty($data['movieTitle']) && !empty($data['movieId']) &&
            !empty($data['tickets']) && !empty($data['viewingDate']) && !empty($data['totalPrice'])
        ) {
            try {
                $seats = $data['seats'] ?? [];
                $hallId = $data['hallId'] ?? null;

                // Validar que se hayan seleccionado asientos si es requerido (podríamos hacerlo opcional, pero el requerimiento implica selección)
                if (empty($seats) || count($seats) != $data['tickets']) {
                    sendResponse(false, null, "La cantidad de asientos seleccionados no coincide con los tickets");
                }

                // VERIFICAR DISPONIBILIDAD DE ASIENTOS (DOBLE CHECK)
                // Es importante bloquear o verificar antes de insertar para evitar race conditions (básico)
                $queryCheck = "SELECT seats FROM purchases WHERE movie_id = :movie_id AND viewing_date = :viewing_date AND hall_id = :hall_id";
                $stmtCheck = $db->prepare($queryCheck);
                $stmtCheck->bindParam(":movie_id", $data['movieId']);
                $stmtCheck->bindParam(":viewing_date", $data['viewingDate']);
                $stmtCheck->bindParam(":hall_id", $hallId);
                $stmtCheck->execute();

                $allOccupied = [];
                while ($row = $stmtCheck->fetch(PDO::FETCH_ASSOC)) {
                    if (!empty($row['seats'])) {
                        $s = json_decode($row['seats'], true);
                        if (is_array($s))
                            $allOccupied = array_merge($allOccupied, $s);
                    }
                }

                foreach ($seats as $seat) {
                    if (in_array($seat, $allOccupied)) {
                        sendResponse(false, null, "El asiento $seat ya ha sido ocupado por otro usuario. Por favor selecciona otro.");
                    }
                }

                $code = 'TCK-' . strtoupper(uniqid());
                $seatsJson = json_encode($seats);

                $query = "INSERT INTO purchases (code, username, movie_title, movie_id, tickets, viewing_date, total_price, hall_id, seats) 
                         VALUES (:code, :username, :movie_title, :movie_id, :tickets, :viewing_date, :total_price, :hall_id, :seats)";

                $stmt = $db->prepare($query);
                $stmt->bindParam(":code", $code);
                $stmt->bindParam(":username", $data['username']);
                $stmt->bindParam(":movie_title", $data['movieTitle']);
                $stmt->bindParam(":movie_id", $data['movieId']);
                $stmt->bindParam(":tickets", $data['tickets']);
                $stmt->bindParam(":viewing_date", $data['viewingDate']);
                $stmt->bindParam(":total_price", $data['totalPrice']);
                $stmt->bindParam(":hall_id", $data['hallId']);
                $stmt->bindParam(":seats", $seatsJson);

                if ($stmt->execute()) {
                    $newPurchase = [
                        'code' => $code,
                        'username' => $data['username'],
                        'movieTitle' => $data['movieTitle'],
                        'movieId' => $data['movieId'],
                        'tickets' => $data['tickets'],
                        'viewingDate' => $data['viewingDate'],
                        'totalPrice' => floatval($data['totalPrice']),
                        'hallId' => $data['hallId'],
                        'seats' => $seats,
                        'datePurchased' => date('Y-m-d H:i:s')
                    ];
                    sendResponse(true, ['purchase' => $newPurchase], "Compra registrada correctamente");
                } else {
                    sendResponse(false, null, "Error al registrar compra");
                }
            } catch (Exception $e) {
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "Datos incompletos");
        }
        break;

    default:
        sendResponse(false, null, "Método no permitido");
        break;
}
?>