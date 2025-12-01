const express = require('express');
const router = express.Router();
const db = require('../config/db');

const sendResponse = (res, success, data = null, message = "") => {
    res.json({ success, data, message });
};

// GET /purchases
router.get('/', async (req, res) => {
    const { code, username, action, movieId, viewingDate, hallId } = req.query;

    try {
        if (action === 'get_occupied_seats') {
            if (!movieId || !viewingDate || !hallId) {
                return sendResponse(res, false, null, "Faltan parámetros para buscar asientos");
            }

            const query = "SELECT seats FROM purchases WHERE movie_id = ? AND viewing_date = ? AND hall_id = ?";
            const [rows] = await db.query(query, [movieId, viewingDate, hallId]);

            let occupiedSeats = [];
            rows.forEach(row => {
                if (row.seats) {
                    try {
                        // row.seats is stored as JSON string in DB
                        // In Node mysql2, JSON columns are automatically parsed if the column type is JSON.
                        // But here it seems it's a TEXT/VARCHAR column containing JSON, or we inserted it as string.
                        // Let's assume it comes out as string or object depending on driver.
                        // Safest is to check type.
                        const seats = (typeof row.seats === 'string') ? JSON.parse(row.seats) : row.seats;
                        if (Array.isArray(seats)) {
                            occupiedSeats = occupiedSeats.concat(seats);
                        }
                    } catch (e) {
                        // ignore parse error
                    }
                }
            });
            // Unique
            occupiedSeats = [...new Set(occupiedSeats)];

            return sendResponse(res, true, { occupiedSeats });

        } else if (code) {
            const query = `
                SELECT p.*, h.name as hall_name
                FROM purchases p
                LEFT JOIN halls h ON p.hall_id = h.id
                WHERE p.code = ?
            `;
            const [rows] = await db.query(query, [code]);
            const purchase = rows[0];

            if (purchase) {
                const formattedPurchase = {
                    ...purchase,
                    movieTitle: purchase.movie_title,
                    viewingDate: purchase.viewing_date,
                    hallId: purchase.hall_id,
                    hallName: purchase.hall_name || 'Desconocida',
                    totalPrice: parseFloat(purchase.total_price),
                    datePurchased: purchase.date_purchased,
                    seats: purchase.seats ? ((typeof purchase.seats === 'string') ? JSON.parse(purchase.seats) : purchase.seats) : []
                };
                delete formattedPurchase.total_price;
                delete formattedPurchase.date_purchased;
                delete formattedPurchase.movie_title;
                delete formattedPurchase.viewing_date;
                delete formattedPurchase.hall_id;
                delete formattedPurchase.hall_name;

                return sendResponse(res, true, { purchase: formattedPurchase });
            } else {
                return sendResponse(res, false, null, "Compra no encontrada");
            }

        } else if (username) {
            const query = `
                SELECT p.*, h.name as hall_name
                FROM purchases p
                LEFT JOIN halls h ON p.hall_id = h.id
                WHERE p.username = ?
                ORDER BY p.date_purchased DESC
            `;
            const [rows] = await db.query(query, [username]);

            const purchases = rows.map(row => {
                const p = {
                    ...row,
                    movieTitle: row.movie_title,
                    viewingDate: row.viewing_date,
                    hallId: row.hall_id,
                    hallName: row.hall_name || 'Desconocida',
                    totalPrice: parseFloat(row.total_price),
                    datePurchased: row.date_purchased,
                    seats: row.seats ? ((typeof row.seats === 'string') ? JSON.parse(row.seats) : row.seats) : []
                };
                delete p.total_price;
                delete p.date_purchased;
                delete p.movie_title;
                delete p.viewing_date;
                delete p.hall_id;
                delete p.hall_name;
                return p;
            });

            return sendResponse(res, true, { purchases });
        } else {
            return sendResponse(res, false, null, "Parámetros insuficientes");
        }
    } catch (error) {
        return sendResponse(res, false, null, "Error: " + error.message);
    }
});

// POST /purchases
router.post('/', async (req, res) => {
    const { username, movieTitle, movieId, tickets, viewingDate, totalPrice, hallId, seats } = req.body;

    if (username && movieTitle && movieId && tickets && viewingDate && totalPrice) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Validate seats count
            const seatsArray = seats || [];
            if (seatsArray.length != tickets) {
                await connection.rollback();
                return sendResponse(res, false, null, "La cantidad de asientos seleccionados no coincide con los tickets");
            }

            // Check availability (Double check)
            const queryCheck = "SELECT seats FROM purchases WHERE movie_id = ? AND viewing_date = ? AND hall_id = ? FOR UPDATE";
            const [rows] = await connection.query(queryCheck, [movieId, viewingDate, hallId]);

            let allOccupied = [];
            rows.forEach(row => {
                if (row.seats) {
                    const s = (typeof row.seats === 'string') ? JSON.parse(row.seats) : row.seats;
                    if (Array.isArray(s)) allOccupied = allOccupied.concat(s);
                }
            });

            for (const seat of seatsArray) {
                if (allOccupied.includes(seat)) {
                    await connection.rollback();
                    return sendResponse(res, false, null, `El asiento ${seat} ya ha sido ocupado por otro usuario. Por favor selecciona otro.`);
                }
            }

            const code = 'TCK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const seatsJson = JSON.stringify(seatsArray);

            const query = `INSERT INTO purchases (code, username, movie_title, movie_id, tickets, viewing_date, total_price, hall_id, seats)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const [result] = await connection.query(query, [code, username, movieTitle, movieId, tickets, viewingDate, totalPrice, hallId, seatsJson]);

            if (result.affectedRows > 0) {
                await connection.commit();
                const newPurchase = {
                    code,
                    username,
                    movieTitle,
                    movieId,
                    tickets,
                    viewingDate,
                    totalPrice: parseFloat(totalPrice),
                    hallId,
                    seats: seatsArray,
                    datePurchased: new Date()
                };
                sendResponse(res, true, { purchase: newPurchase }, "Compra registrada correctamente");
            } else {
                await connection.rollback();
                sendResponse(res, false, null, "Error al registrar compra");
            }

        } catch (error) {
            await connection.rollback();
            sendResponse(res, false, null, "Error: " + error.message);
        } finally {
            connection.release();
        }
    } else {
        sendResponse(res, false, null, "Datos incompletos");
    }
});

module.exports = router;
