const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// POST /upload
router.post('/', upload.single('avatar'), async (req, res) => {
    // Prefer session user
    const sessionUser = req.session.username;
    const postedUser = req.body.username;
    const username = sessionUser || postedUser;

    if (!username || !req.file) {
        return res.json({ success: false, message: 'Faltan parámetros o archivo' });
    }

    try {
        const file = req.file;
        const base64 = file.buffer.toString('base64');
        const dataUri = `data:${file.mimetype};base64,${base64}`;

        const [result] = await db.query("UPDATE users SET avatar = ? WHERE username = ?", [dataUri, username]);

        if (result.affectedRows > 0) { // Or result.changedRows, but affected is safer if it's same value
             // Actually if value is same, affectedRows is 1 but changedRows is 0.
             // We just want to know if query ran.
             res.json({ success: true, data: { avatar: dataUri }, message: 'Avatar subido' });
        } else {
            // Maybe user doesn't exist
             res.json({ success: false, message: 'Error al actualizar avatar (usuario no encontrado)' });
        }

    } catch (error) {
        res.json({ success: false, message: 'Error: ' + error.message });
    }
});

// Error handling for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.json({ success: false, message: 'Error de subida: ' + err.message });
    } else if (err) {
        res.json({ success: false, message: err.message });
    } else {
        next();
    }
});

module.exports = router;
