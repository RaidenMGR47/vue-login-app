<?php
require_once 'db_config.php';

$database = new Database();
$db = $database->getConnection();

echo "<h1>Database Setup</h1>";

// 1. Add duration to movies
try {
    $check = $db->query("SHOW COLUMNS FROM movies LIKE 'duration'");
    if ($check->rowCount() == 0) {
        $sql = "ALTER TABLE movies ADD COLUMN duration INT DEFAULT 0";
        $db->exec($sql);
        echo "<p>Added 'duration' column to 'movies' table.</p>";
    } else {
        echo "<p>'duration' column already exists in 'movies' table.</p>";
    }
} catch (PDOException $e) {
    echo "<p>Error updating 'movies' table: " . $e->getMessage() . "</p>";
}

// 2. Add hall_id to purchases
try {
    $check = $db->query("SHOW COLUMNS FROM purchases LIKE 'hall_id'");
    if ($check->rowCount() == 0) {
        $sql = "ALTER TABLE purchases ADD COLUMN hall_id VARCHAR(50) DEFAULT NULL";
        $db->exec($sql);
        echo "<p>Added 'hall_id' column to 'purchases' table.</p>";
    } else {
        echo "<p>'hall_id' column already exists in 'purchases' table.</p>";
    }
} catch (PDOException $e) {
    echo "<p>Error updating 'purchases' table: " . $e->getMessage() . "</p>";
}

// 3. Create halls table
try {
    $sql = "CREATE TABLE IF NOT EXISTS halls (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        capacity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $db->exec($sql);
    echo "<p>Created 'halls' table (if it didn't exist).</p>";
} catch (PDOException $e) {
    echo "<p>Error creating 'halls' table: " . $e->getMessage() . "</p>";
}

// 4. Create screenings table
try {
    $sql = "CREATE TABLE IF NOT EXISTS screenings (
        id VARCHAR(50) PRIMARY KEY,
        movie_id VARCHAR(50) NOT NULL,
        hall_id VARCHAR(50) NOT NULL,
        start_time DATETIME NOT NULL,
        duration INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $db->exec($sql);
    echo "<p>Created 'screenings' table (if it didn't exist).</p>";
} catch (PDOException $e) {
    echo "<p>Error creating 'screenings' table: " . $e->getMessage() . "</p>";
}

echo "<h2>Setup Complete</h2>";
?>
