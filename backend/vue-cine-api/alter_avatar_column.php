<?php
require_once 'db_config.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "ALTER TABLE users MODIFY avatar LONGTEXT DEFAULT NULL";
    $stmt = $db->prepare($query);

    if ($stmt->execute()) {
        echo "Success: Avatar column altered to LONGTEXT.\n";
    } else {
        echo "Error: Could not alter table.\n";
        print_r($stmt->errorInfo());
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
?>