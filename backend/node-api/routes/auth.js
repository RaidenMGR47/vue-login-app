const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// Helper to send response
const sendResponse = (res, success, data = null, message = "") => {
    res.json({ success, data, message });
};

// POST /auth
router.post('/', async (req, res) => {
    const { action } = req.body;

    try {
        if (action === 'login') {
            const { username, password } = req.body;
            if (!username || !password) {
                return sendResponse(res, false, null, "Usuario y contraseña requeridos");
            }

            const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
            const user = users[0];

            if (user) {
                // Fix for PHP password_hash compatibility ($2y$ vs $2b$)
                let storedHash = user.password;
                if (storedHash.startsWith('$2y$')) {
                    storedHash = storedHash.replace(/^\$2y\$/, '$2b$');
                }

                const match = await bcrypt.compare(password, storedHash);

                if (match) {
                    req.session.username = user.username;
                    req.session.is_admin = !!user.is_admin;

                    return sendResponse(res, true, {
                        isAdmin: !!user.is_admin,
                        avatar: user.avatar || null
                    }, "Login exitoso");
                } else {
                    return sendResponse(res, false, null, "Usuario o contraseña incorrectos");
                }
            } else {
                return sendResponse(res, false, null, "Usuario o contraseña incorrectos");
            }

        } else if (action === 'register') {
            const { username, password, avatar } = req.body;
            if (!username || !password) {
                return sendResponse(res, false, null, "Usuario y contraseña requeridos");
            }

            const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
            if (existing.length > 0) {
                return sendResponse(res, false, null, "El nombre de usuario ya existe");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const isAdmin = (username === 'admin') ? 1 : 0;

            const [result] = await db.query(
                "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
                [username, hashedPassword, isAdmin]
            );

            if (result.affectedRows > 0) {
                if (avatar) {
                    await db.query("UPDATE users SET avatar = ? WHERE username = ?", [avatar, username]);
                }
                return sendResponse(res, true, null, "Usuario registrado correctamente");
            } else {
                return sendResponse(res, false, null, "Error al registrar usuario");
            }

        } else if (action === 'updateAvatar') {
            const sessionUser = req.session.username;
            const { avatar, username } = req.body; // PHP allowed passing username, but preferred session. We'll stick to session if available, or body if not (to match PHP logic roughly, though PHP logic was a bit mixed in two blocks).
            // Actually PHP block 1: used session. Block 2: used body.
            // Let's use session if authenticated, otherwise fail or check logic.
            // The PHP code had two blocks for updateAvatar. One used session, one used body.
            // We should support both or prioritize session.

            const targetUser = sessionUser || username;

            if (!targetUser) return sendResponse(res, false, null, "No autenticado");

            if (avatar) {
                const [result] = await db.query("UPDATE users SET avatar = ? WHERE username = ?", [avatar, targetUser]);
                if (result.affectedRows > 0) {
                    return sendResponse(res, true, null, "Avatar actualizado");
                } else {
                    return sendResponse(res, false, null, "Error al actualizar avatar");
                }
            } else {
                return sendResponse(res, false, null, "Datos insuficientes");
            }

        } else if (action === 'changePassword') {
            const sessionUser = req.session.username;
            const { username, currentPassword, newPassword } = req.body;
            const targetUser = sessionUser || username;

            if (!targetUser) return sendResponse(res, false, null, "No autenticado");

            if (currentPassword && newPassword) {
                const [users] = await db.query("SELECT password FROM users WHERE username = ?", [targetUser]);
                const user = users[0];

                if (user && await bcrypt.compare(currentPassword, user.password)) {
                    const newHashed = await bcrypt.hash(newPassword, 10);
                    const [result] = await db.query("UPDATE users SET password = ? WHERE username = ?", [newHashed, targetUser]);

                    if (result.affectedRows > 0) {
                        return sendResponse(res, true, null, "Contraseña actualizada correctamente");
                    } else {
                        return sendResponse(res, false, null, "Error al actualizar contraseña");
                    }
                } else {
                    return sendResponse(res, false, null, "Contraseña actual incorrecta");
                }
            } else {
                return sendResponse(res, false, null, "Datos insuficientes");
            }

        } else if (action === 'logout') {
            req.session.destroy();
            return sendResponse(res, true, null, "Sesión cerrada");
        } else {
            return sendResponse(res, false, null, "Acción no válida");
        }

    } catch (error) {
        return sendResponse(res, false, null, "Error: " + error.message);
    }
});

// DELETE /auth (Delete user)
router.delete('/', async (req, res) => {
    const { action, username } = req.body;
    const sessionUser = req.session.username;
    const targetUser = sessionUser || username;

    if (!targetUser) {
        return sendResponse(res, false, null, "No autenticado o usuario no especificado");
    }

    if (action === 'delete') {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Delete purchases
            await connection.query("DELETE FROM purchases WHERE username = ?", [targetUser]);

            // Delete user (not admin)
            const [result] = await connection.query("DELETE FROM users WHERE username = ? AND is_admin = 0", [targetUser]);

            if (result.affectedRows > 0) {
                await connection.commit();
                if (sessionUser === targetUser) {
                    req.session.destroy();
                }
                sendResponse(res, true, null, "Usuario eliminado correctamente");
            } else {
                await connection.rollback();
                sendResponse(res, false, null, "No se puede eliminar el usuario o no existe");
            }
        } catch (error) {
            await connection.rollback();
            sendResponse(res, false, null, "Error: " + error.message);
        } finally {
            connection.release();
        }
    } else {
        sendResponse(res, false, null, "Datos insuficientes o no permitido");
    }
});

module.exports = router;
