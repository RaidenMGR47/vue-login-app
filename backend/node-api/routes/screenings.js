const express = require('express');
const router = express.Router();
const db = require('../config/db');

const sendResponse = (res, success, data = null, message = "") => {
    res.json({ success, data, message });
};

// GET /screenings
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT s.*, m.title as movie_title, h.name as hall_name
            FROM screenings s
            JOIN movies m ON s.movie_id = m.id
            JOIN halls h ON s.hall_id = h.id
            ORDER BY s.start_time
        `;
        const [rows] = await db.query(query);

        const screenings = rows.map(row => ({
            id: row.id,
            startTime: row.start_time,
            duration: row.duration,
            movieId: row.movie_id,
            hallId: row.hall_id,
            movieTitle: row.movie_title,
            hallName: row.hall_name
        }));

        sendResponse(res, true, { screenings });
    } catch (error) {
        sendResponse(res, false, null, "Error al obtener funciones: " + error.message);
    }
});

// POST /screenings
router.post('/', async (req, res) => {
    const { movieId, hallId, startTime, duration } = req.body;

    if (movieId && hallId && startTime && duration) {
        try {
            const id = 's' + Math.floor(Date.now() / 1000);

            const query = "INSERT INTO screenings (id, movie_id, hall_id, start_time, duration) VALUES (?, ?, ?, ?, ?)";
            const [result] = await db.query(query, [id, movieId, hallId, startTime, duration]);

            if (result.affectedRows > 0) {
                const newScreening = {
                    id,
                    movieId,
                    hallId,
                    startTime,
                    duration: parseInt(duration)
                };
                sendResponse(res, true, { screening: newScreening }, "Función programada correctamente");
            } else {
                sendResponse(res, false, null, "Error al programar función");
            }
        } catch (error) {
            sendResponse(res, false, null, "Error: " + error.message);
        }
    } else {
        sendResponse(res, false, null, "Datos incompletos");
    }
});

// DELETE /screenings
router.delete('/', async (req, res) => {
    const { id } = req.body;

    if (id) {
        try {
            const [result] = await db.query("DELETE FROM screenings WHERE id = ?", [id]);
            if (result.affectedRows > 0) {
                sendResponse(res, true, null, "Función eliminada correctamente");
            } else {
                sendResponse(res, false, null, "Error al eliminar función");
            }
        } catch (error) {
            sendResponse(res, false, null, "Error: " + error.message);
        }
    } else {
        sendResponse(res, false, null, "ID de función no proporcionado");
    }
});

module.exports = router;
