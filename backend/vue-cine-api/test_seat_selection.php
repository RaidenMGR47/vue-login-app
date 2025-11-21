<?php
require_once 'db_config.php';

function makeRequest($url, $method = 'GET', $data = null)
{
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => $method,
            'content' => $data ? json_encode($data) : null,
            'ignore_errors' => true
        ]
    ];
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    return json_decode($result, true);
}

$baseUrl = "http://localhost/vue-login-app/backend/vue-cine-api/purchases.php";
$movieId = "test_movie_" . time();
$viewingDate = "2025-12-01";
$hallId = "test_hall_1";

echo "1. Testing Get Occupied Seats (Should be empty)\n";
$params = http_build_query([
    'action' => 'get_occupied_seats',
    'movieId' => $movieId,
    'viewingDate' => $viewingDate,
    'hallId' => $hallId
]);
$response = makeRequest($baseUrl . "?" . $params);
print_r($response);

echo "\n2. Testing Booking Seats 1A, 1B\n";
$bookingData = [
    'username' => 'tester',
    'movieTitle' => 'Test Movie',
    'movieId' => $movieId,
    'tickets' => 2,
    'viewingDate' => $viewingDate,
    'hallId' => $hallId,
    'totalPrice' => 20.00,
    'seats' => ['1A', '1B']
];
$response = makeRequest($baseUrl, 'POST', $bookingData);
print_r($response);

echo "\n3. Testing Get Occupied Seats (Should have 1A, 1B)\n";
$response = makeRequest($baseUrl . "?" . $params);
print_r($response);

echo "\n4. Testing Double Booking 1A (Should fail)\n";
$failBookingData = $bookingData;
$failBookingData['seats'] = ['1A', '1C']; // 1A is taken
$response = makeRequest($baseUrl, 'POST', $failBookingData);
print_r($response);

echo "\n5. Testing Booking Different Seats 1C (Should success)\n";
$successBookingData = $bookingData;
$successBookingData['tickets'] = 1;
$successBookingData['seats'] = ['1C'];
$response = makeRequest($baseUrl, 'POST', $successBookingData);
print_r($response);

?>