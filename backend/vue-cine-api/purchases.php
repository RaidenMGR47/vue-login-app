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

switch($method) {
    case 'GET':
        // Obtener compras por código o por usuario
        $code = $_GET['code'] ?? null;
        $username = $_GET['username'] ?? null;
        
        try {
            if ($code) {
                // Buscar por código
                $query = "SELECT * FROM purchases WHERE code = :code";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":code", $code);
                $stmt->execute();
                
                $purchase = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($purchase) {
                    $purchase['totalPrice'] = floatval($purchase['total_price']);
                    $purchase['datePurchased'] = $purchase['date_purchased'];
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
        
        if (!empty($data['username']) && !empty($data['movieTitle']) && !empty($data['movieId']) && 
            !empty($data['tickets']) && !empty($data['viewingDate']) && !empty($data['totalPrice'])) {
            try {
                $code = 'TCK-' . strtoupper(uniqid());
                
                $query = "INSERT INTO purchases (code, username, movie_title, movie_id, tickets, viewing_date, total_price) 
                         VALUES (:code, :username, :movie_title, :movie_id, :tickets, :viewing_date, :total_price)";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(":code", $code);
                $stmt->bindParam(":username", $data['username']);
                $stmt->bindParam(":movie_title", $data['movieTitle']);
                $stmt->bindParam(":movie_id", $data['movieId']);
                $stmt->bindParam(":tickets", $data['tickets']);
                $stmt->bindParam(":viewing_date", $data['viewingDate']);
                $stmt->bindParam(":total_price", $data['totalPrice']);
                
                if ($stmt->execute()) {
                    $newPurchase = [
                        'code' => $code,
                        'username' => $data['username'],
                        'movieTitle' => $data['movieTitle'],
                        'movieId' => $data['movieId'],
                        'tickets' => $data['tickets'],
                        'viewingDate' => $data['viewingDate'],
                        'totalPrice' => floatval($data['totalPrice']),
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