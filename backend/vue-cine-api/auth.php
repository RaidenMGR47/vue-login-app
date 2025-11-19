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
                        // Devolver isAdmin y avatar si existe
                        sendResponse(true, [
                            'isAdmin' => (bool)$user['is_admin'],
                            'avatar' => $user['avatar'] ?? null
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
                        // Si se envió avatar en el registro, guardarlo
                        if (!empty($data['avatar'])) {
                            $update = "UPDATE users SET avatar = :avatar WHERE username = :username";
                            $uStmt = $db->prepare($update);
                            $uStmt->bindParam(":avatar", $data['avatar']);
                            $uStmt->bindParam(":username", $data['username']);
                            $uStmt->execute();
                        }
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
        } elseif ($action === 'updateAvatar') {
            // Actualizar avatar del usuario
            if (!empty($data['username']) && isset($data['avatar'])) {
                try {
                    $query = "UPDATE users SET avatar = :avatar WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":avatar", $data['avatar']);
                    $stmt->bindParam(":username", $data['username']);
                    if ($stmt->execute()) {
                        sendResponse(true, null, "Avatar actualizado");
                    } else {
                        sendResponse(false, null, "Error al actualizar avatar");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
            }
        } elseif ($action === 'changePassword') {
            // Cambiar contraseña: se espera username, currentPassword, newPassword
            if (!empty($data['username']) && !empty($data['currentPassword']) && !empty($data['newPassword'])) {
                try {
                    $query = "SELECT password FROM users WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":username", $data['username']);
                    $stmt->execute();

                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($user && password_verify($data['currentPassword'], $user['password'])) {
                        $newHashed = password_hash($data['newPassword'], PASSWORD_DEFAULT);
                        $update = "UPDATE users SET password = :password WHERE username = :username";
                        $uStmt = $db->prepare($update);
                        $uStmt->bindParam(":password", $newHashed);
                        $uStmt->bindParam(":username", $data['username']);
                        if ($uStmt->execute()) {
                            sendResponse(true, null, "Contraseña actualizada correctamente");
                        } else {
                            sendResponse(false, null, "Error al actualizar contraseña");
                        }
                    } else {
                        sendResponse(false, null, "Contraseña actual incorrecta");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
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
                        // Devolver isAdmin y avatar si existe
                        sendResponse(true, [
                            'isAdmin' => (bool)$user['is_admin'],
                            'avatar' => $user['avatar'] ?? null
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
                        // Si se envió avatar en el registro, guardarlo
                        if (!empty($data['avatar'])) {
                            $update = "UPDATE users SET avatar = :avatar WHERE username = :username";
                            $uStmt = $db->prepare($update);
                            $uStmt->bindParam(":avatar", $data['avatar']);
                            $uStmt->bindParam(":username", $data['username']);
                            $uStmt->execute();
                        }
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
        } elseif ($action === 'updateAvatar') {
            // Actualizar avatar del usuario
            if (!empty($data['username']) && isset($data['avatar'])) {
                try {
                    $query = "UPDATE users SET avatar = :avatar WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":avatar", $data['avatar']);
                    $stmt->bindParam(":username", $data['username']);
                    if ($stmt->execute()) {
                        sendResponse(true, null, "Avatar actualizado");
                    } else {
                        sendResponse(false, null, "Error al actualizar avatar");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
            }
        } elseif ($action === 'changePassword') {
            // Cambiar contraseña: se espera username, currentPassword, newPassword
            if (!empty($data['username']) && !empty($data['currentPassword']) && !empty($data['newPassword'])) {
                try {
                    $query = "SELECT password FROM users WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":username", $data['username']);
                    $stmt->execute();

                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($user && password_verify($data['currentPassword'], $user['password'])) {
                        $newHashed = password_hash($data['newPassword'], PASSWORD_DEFAULT);
                        $update = "UPDATE users SET password = :password WHERE username = :username";
                        $uStmt = $db->prepare($update);
                        $uStmt->bindParam(":password", $newHashed);
                        $uStmt->bindParam(":username", $data['username']);
                        if ($uStmt->execute()) {
                            sendResponse(true, null, "Contraseña actualizada correctamente");
                        } else {
                            sendResponse(false, null, "Error al actualizar contraseña");
                        }
                    } else {
                        sendResponse(false, null, "Contraseña actual incorrecta");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
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
                        // Devolver isAdmin y avatar si existe
                        sendResponse(true, [
                            'isAdmin' => (bool)$user['is_admin'],
                            'avatar' => $user['avatar'] ?? null
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
                        // Si se envió avatar en el registro, guardarlo
                        if (!empty($data['avatar'])) {
                            $update = "UPDATE users SET avatar = :avatar WHERE username = :username";
                            $uStmt = $db->prepare($update);
                            $uStmt->bindParam(":avatar", $data['avatar']);
                            $uStmt->bindParam(":username", $data['username']);
                            $uStmt->execute();
                        }
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
        } elseif ($action === 'updateAvatar') {
            // Actualizar avatar del usuario
            if (!empty($data['username']) && isset($data['avatar'])) {
                try {
                    $query = "UPDATE users SET avatar = :avatar WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":avatar", $data['avatar']);
                    $stmt->bindParam(":username", $data['username']);
                    if ($stmt->execute()) {
                        sendResponse(true, null, "Avatar actualizado");
                    } else {
                        sendResponse(false, null, "Error al actualizar avatar");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
            }
        } elseif ($action === 'changePassword') {
            // Cambiar contraseña: se espera username, currentPassword, newPassword
            if (!empty($data['username']) && !empty($data['currentPassword']) && !empty($data['newPassword'])) {
                try {
                    $query = "SELECT password FROM users WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":username", $data['username']);
                    $stmt->execute();

                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($user && password_verify($data['currentPassword'], $user['password'])) {
                        $newHashed = password_hash($data['newPassword'], PASSWORD_DEFAULT);
                        $update = "UPDATE users SET password = :password WHERE username = :username";
                        $uStmt = $db->prepare($update);
                        $uStmt->bindParam(":password", $newHashed);
                        $uStmt->bindParam(":username", $data['username']);
                        if ($uStmt->execute()) {
                            sendResponse(true, null, "Contraseña actualizada correctamente");
                        } else {
                            sendResponse(false, null, "Error al actualizar contraseña");
                        }
                    } else {
                        sendResponse(false, null, "Contraseña actual incorrecta");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
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
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

// Iniciar sesión para operaciones autenticadas
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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
                        // Guardar usuario en la sesión
                        $_SESSION['username'] = $user['username'];
                        $_SESSION['is_admin'] = (bool)$user['is_admin'];

                        // Devolver isAdmin y avatar si existe
                        sendResponse(true, [
                            'isAdmin' => (bool)$user['is_admin'],
                            'avatar' => $user['avatar'] ?? null
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
                        // Si se envió avatar en el registro, guardarlo
                        if (!empty($data['avatar'])) {
                            $update = "UPDATE users SET avatar = :avatar WHERE username = :username";
                            $uStmt = $db->prepare($update);
                            $uStmt->bindParam(":avatar", $data['avatar']);
                            $uStmt->bindParam(":username", $data['username']);
                            $uStmt->execute();
                        }
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
        } elseif ($action === 'updateAvatar') {
            // Actualizar avatar del usuario (se usa usuario de la sesión)
            $sessionUser = $_SESSION['username'] ?? null;
            if (!$sessionUser) {
                sendResponse(false, null, "No autenticado");
            }
            if (isset($data['avatar'])) {
                try {
                    $query = "UPDATE users SET avatar = :avatar WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":avatar", $data['avatar']);
                    $stmt->bindParam(":username", $sessionUser);
                    if ($stmt->execute()) {
                        sendResponse(true, null, "Avatar actualizado");
                    } else {
                        sendResponse(false, null, "Error al actualizar avatar");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
            }
        } elseif ($action === 'changePassword') {
            // Cambiar contraseña: se usa usuario de la sesión
            $sessionUser = $_SESSION['username'] ?? null;
            if (!$sessionUser) {
                sendResponse(false, null, "No autenticado");
            }
            if (!empty($data['currentPassword']) && !empty($data['newPassword'])) {
                try {
                    $query = "SELECT password FROM users WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":username", $sessionUser);
                    $stmt->execute();

                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($user && password_verify($data['currentPassword'], $user['password'])) {
                        $newHashed = password_hash($data['newPassword'], PASSWORD_DEFAULT);
                        $update = "UPDATE users SET password = :password WHERE username = :username";
                        $uStmt = $db->prepare($update);
                        $uStmt->bindParam(":password", $newHashed);
                        $uStmt->bindParam(":username", $sessionUser);
                        if ($uStmt->execute()) {
                            sendResponse(true, null, "Contraseña actualizada correctamente");
                        } else {
                            sendResponse(false, null, "Error al actualizar contraseña");
                        }
                    } else {
                        sendResponse(false, null, "Contraseña actual incorrecta");
                    }
                } catch (Exception $e) {
                    sendResponse(false, null, "Error: " . $e->getMessage());
                }
            } else {
                sendResponse(false, null, "Datos insuficientes");
            }
        } elseif ($action === 'logout') {
            // Cerrar sesión
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_unset();
                session_destroy();
            }
            sendResponse(true, null, "Sesión cerrada");
        } else {
            sendResponse(false, null, "Acción no válida");
        }
        break;

    case 'DELETE':
        // Eliminar usuario (usa usuario de la sesión)
        $data = json_decode(file_get_contents("php://input"), true);
        $sessionUser = $_SESSION['username'] ?? null;
        if (!$sessionUser) {
            sendResponse(false, null, "No autenticado");
        }

        if ($data['action'] === 'delete') {
            try {
                // Iniciar transacción
                $db->beginTransaction();

                // Eliminar compras del usuario
                $deletePurchases = "DELETE FROM purchases WHERE username = :username";
                $stmt1 = $db->prepare($deletePurchases);
                $stmt1->bindParam(":username", $sessionUser);
                $stmt1->execute();

                // Eliminar usuario (no permitir eliminar admin)
                $deleteUser = "DELETE FROM users WHERE username = :username AND is_admin = 0";
                $stmt2 = $db->prepare($deleteUser);
                $stmt2->bindParam(":username", $sessionUser);
                $stmt2->execute();

                if ($stmt2->rowCount() > 0) {
                    $db->commit();
                    // Limpiar sesión
                    session_unset();
                    session_destroy();
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