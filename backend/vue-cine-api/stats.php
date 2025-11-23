<?php
// Prevent PHP errors from corrupting JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stats = [];

        // 1. Sala más concurrida (por número de tickets vendidos)
        $queryHall = "SELECT h.name, SUM(p.tickets) as total_tickets 
                      FROM purchases p
                      JOIN halls h ON p.hall_id = h.id
                      GROUP BY p.hall_id 
                      ORDER BY total_tickets DESC 
                      LIMIT 1";
        $stmtHall = $db->prepare($queryHall);
        $stmtHall->execute();
        $stats['popularHall'] = $stmtHall->fetch(PDO::FETCH_ASSOC);

        // 2. Hora más concurrida (agrupado por hora de viewing_date)
        // viewing_date format: YYYY-MM-DDTHH:mm or similar
        $queryTime = "SELECT DATE_FORMAT(viewing_date, '%H:00') as hour_slot, SUM(tickets) as total_tickets
                      FROM purchases
                      GROUP BY hour_slot
                      ORDER BY total_tickets DESC
                      LIMIT 1";
        $stmtTime = $db->prepare($queryTime);
        $stmtTime->execute();
        $stats['popularTime'] = $stmtTime->fetch(PDO::FETCH_ASSOC);

        // 3. Género más visto
        $queryGenre = "SELECT m.genre, SUM(p.tickets) as total_tickets
                       FROM purchases p
                       JOIN movies m ON p.movie_id = m.id
                       GROUP BY m.genre
                       ORDER BY total_tickets DESC
                       LIMIT 1";
        $stmtGenre = $db->prepare($queryGenre);
        $stmtGenre->execute();
        $stats['popularGenre'] = $stmtGenre->fetch(PDO::FETCH_ASSOC);

        // 4. Película más vendida (por tickets)
        $queryMovieSold = "SELECT movie_title, SUM(tickets) as total_tickets
                           FROM purchases
                           GROUP BY movie_id
                           ORDER BY total_tickets DESC
                           LIMIT 1";
        $stmtMovieSold = $db->prepare($queryMovieSold);
        $stmtMovieSold->execute();
        $stats['bestSellingMovie'] = $stmtMovieSold->fetch(PDO::FETCH_ASSOC);

        // 5. Ingresos por película
        $queryRevenue = "SELECT movie_title, SUM(total_price) as total_revenue, SUM(tickets) as tickets_sold
                         FROM purchases
                         GROUP BY movie_id
                         ORDER BY total_revenue DESC";
        $stmtRevenue = $db->prepare($queryRevenue);
        $stmtRevenue->execute();
        $stats['revenuePerMovie'] = $stmtRevenue->fetchAll(PDO::FETCH_ASSOC);

        // Ensure we return valid JSON even if some stats are null (empty DB)
        echo json_encode(['success' => true, 'stats' => $stats]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => "Error al obtener estadísticas: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => "Método no permitido"]);
}
?>