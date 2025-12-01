const express = require('express');
const router = express.Router();
const db = require('../config/db');

const sendResponse = (res, success, data = null, message = "") => {
    res.json({ success, data, message });
};

// GET /movies
router.get('/', async (req, res) => {
    try {
        const [movies] = await db.query("SELECT * FROM movies ORDER BY title");
        // Convert types to match PHP output
        const formattedMovies = movies.map(m => ({
            ...m,
            price: parseFloat(m.price),
            duration: parseInt(m.duration)
        }));
        sendResponse(res, true, { movies: formattedMovies });
    } catch (error) {
        sendResponse(res, false, null, "Error al obtener películas: " + error.message);
    }
});

// POST /movies
router.post('/', async (req, res) => {
    const { title, year, genre, price, poster, duration } = req.body;

    if (title && year && genre && price) {
        // Validate price and duration
        if (price <= 0) {
            return sendResponse(res, false, null, "El precio debe ser mayor a 0");
        }
        if (duration && duration <= 0) {
            return sendResponse(res, false, null, "La duración debe ser mayor a 0");
        }

        try {
            const id = 'm' + Math.floor(Date.now() / 1000);
            const posterVal = poster || '';

            const query = "INSERT INTO movies (id, title, year, genre, price, poster, duration) VALUES (?, ?, ?, ?, ?, ?, ?)";
            const [result] = await db.query(query, [id, title, year, genre, price, posterVal, duration]);

            if (result.affectedRows > 0) {
                const newMovie = {
                    id,
                    title,
                    year,
                    genre,
                    price: parseFloat(price),
                    poster: posterVal,
                    duration: parseInt(duration || 0)
                };
                sendResponse(res, true, { movie: newMovie }, "Película añadida correctamente");
            } else {
                sendResponse(res, false, null, "Error al añadir película");
            }
        } catch (error) {
            sendResponse(res, false, null, "Error: " + error.message);
        }
    } else {
        sendResponse(res, false, null, "Datos incompletos");
    }
});

// PUT /movies
router.put('/', async (req, res) => {
    const { id, title, year, genre, price, poster, duration } = req.body;

    if (id && title && year && genre && price) {
        // Validate price and duration
        if (price <= 0) {
            return sendResponse(res, false, null, "El precio debe ser mayor a 0");
        }
        if (duration && duration <= 0) {
            return sendResponse(res, false, null, "La duración debe ser mayor a 0");
        }

        try {
            const query = "UPDATE movies SET title = ?, year = ?, genre = ?, price = ?, poster = ?, duration = ? WHERE id = ?";
            const [result] = await db.query(query, [title, year, genre, price, poster, duration, id]);

            if (result.affectedRows > 0) {
                sendResponse(res, true, null, "Película actualizada correctamente");
            } else {
                sendResponse(res, false, null, "Error al actualizar película");
            }
        } catch (error) {
            sendResponse(res, false, null, "Error: " + error.message);
        }
    } else {
        sendResponse(res, false, null, "Datos incompletos");
    }
});

// DELETE /movies
router.delete('/', async (req, res) => {
    const { id } = req.body;

    if (id) {
        try {
            const [result] = await db.query("DELETE FROM movies WHERE id = ?", [id]);
            if (result.affectedRows > 0) {
                sendResponse(res, true, null, "Película eliminada correctamente");
            } else {
                sendResponse(res, false, null, "Error al eliminar película");
            }
        } catch (error) {
            sendResponse(res, false, null, "Error: " + error.message);
        }
    } else {
        sendResponse(res, false, null, "ID de película no proporcionado");
    }
});

module.exports = router;
