<?php
require_once 'db_config.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Check if column exists first to avoid error
    $check = $db->query("SHOW COLUMNS FROM purchases LIKE 'seats'");
    if ($check->rowCount() == 0) {
        $sql = "ALTER TABLE purchases ADD COLUMN seats TEXT DEFAULT NULL";
        $db->exec($sql);
        echo "Column 'seats' added successfully.\n";
    } else {
        echo "Column 'seats' already exists.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>