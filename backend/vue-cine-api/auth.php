<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        // Login o Register
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? '';
        
        if ($action === 'login') {
            // Login
            if (!empty($data['username']) && !empty($data['password'])) {
                try {
                    $query = "SELECT * FROM users WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":username", $data['username']);
                    $stmt->execute();
                    
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($user && password_verify($data['password'], $user['password'])) {
                        // CORRECCIÓN: Devolver isAdmin correctamente
                        sendResponse(true, [
                            'isAdmin' => (bool)$user['is_admin']
                        ], "Login exitoso");
                    } else {
                        sendResponse(false, null, "Usuario o contraseña incorrectos");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Usuario y contraseña requeridos");
            }
        } elseif ($action === 'register') {
            // Register
            if (!empty($data['username']) && !empty($data['password'])) {
                try {
                    // Verificar si el usuario ya existe
                    $checkQuery = "SELECT id FROM users WHERE username = :username";
                    $checkStmt = $db->prepare($checkQuery);
                    $checkStmt->bindParam(":username", $data['username']);
                    $checkStmt->execute();
                    
                    if ($checkStmt->rowCount() > 0) {
                        sendResponse(false, null, "El nombre de usuario ya existe");
                        exit;
                    }
                    
                    // Crear nuevo usuario
                    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
                    $isAdmin = ($data['username'] === 'admin') ? 1 : 0;
                    
                    $query = "INSERT INTO users (username, password, is_admin) VALUES (:username, :password, :is_admin)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":username", $data['username']);
                    $stmt->bindParam(":password", $hashedPassword);
                    $stmt->bindParam(":is_admin", $isAdmin);
                    
                    if ($stmt->execute()) {
                        sendResponse(true, null, "Usuario registrado correctamente");
                    } else {
                        sendResponse(false, null, "Error al registrar usuario");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Usuario y contraseña requeridos");
            }
        } else {
            sendResponse(false, null, "Acción no válida");
        }
        break;

    case 'DELETE':
        // Eliminar usuario
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!empty($data['username']) && $data['action'] === 'delete') {
            try {
                // Iniciar transacción
                $db->beginTransaction();
                
                // Eliminar compras del usuario
                $deletePurchases = "DELETE FROM purchases WHERE username = :username";
                $stmt1 = $db->prepare($deletePurchases);
                $stmt1->bindParam(":username", $data['username']);
                $stmt1->execute();
                
                // Eliminar usuario
                $deleteUser = "DELETE FROM users WHERE username = :username AND is_admin = 0";
                $stmt2 = $db->prepare($deleteUser);
                $stmt2->bindParam(":username", $data['username']);
                $stmt2->execute();
                
                if ($stmt2->rowCount() > 0) {
                    $db->commit();
                    sendResponse(true, null, "Usuario eliminado correctamente");
                } else {
                    $db->rollBack();
                    sendResponse(false, null, "No se puede eliminar el usuario o no existe");
                }
            } catch (Exception $e) {
                $db->rollBack();
                sendResponse(false, null, "Error: " . $e->getMessage());
            }
        } else {
            sendResponse(false, null, "Datos insuficientes o no permitido");
        }
        break;

    default:
        sendResponse(false, null, "Método no permitido");
        break;
}
?>