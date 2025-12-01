const express = require('express');
const router = express.Router();
const db = require('../config/db');

const sendResponse = (res, success, data = null, message = "") => {
    res.json({ success, data, message });
};

// GET /halls
router.get('/', async (req, res) => {
    try {
        const [halls] = await db.query("SELECT * FROM halls ORDER BY name");
        sendResponse(res, true, { halls });
    } catch (error) {
        sendResponse(res, false, null, "Error al obtener salas: " + error.message);
    }
});

// POST /halls
router.post('/', async (req, res) => {
    const { name, capacity } = req.body;

    if (name && capacity) {
        try {
            const id = 'h' + Math.floor(Date.now() / 1000);

            const query = "INSERT INTO halls (id, name, capacity) VALUES (?, ?, ?)";
            const [result] = await db.query(query, [id, name, capacity]);

            if (result.affectedRows > 0) {
                const newHall = {
                    id,
                    name,
                    capacity: parseInt(capacity)
                };
                sendResponse(res, true, { hall: newHall }, "Sala añadida correctamente");
            } else {
                sendResponse(res, false, null, "Error al añadir sala");
            }
        } catch (error) {
            sendResponse(res, false, null, "Error: " + error.message);
        }
    } else {
        sendResponse(res, false, null, "Datos incompletos");
    }
});

// DELETE /halls
router.delete('/', async (req, res) => {
    const { id } = req.body;

    if (id) {
        try {
            const [result] = await db.query("DELETE FROM halls WHERE id = ?", [id]);
            if (result.affectedRows > 0) {
                sendResponse(res, true, null, "Sala eliminada correctamente");
            } else {
                sendResponse(res, false, null, "Error al eliminar sala");
            }
        } catch (error) {
            sendResponse(res, false, null, "Error: " + error.message);
        }
    } else {
        sendResponse(res, false, null, "ID de sala no proporcionado");
    }
});

module.exports = router;
