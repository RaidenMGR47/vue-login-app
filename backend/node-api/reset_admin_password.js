const db = require('./config/db');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    const username = 'admin';
    const newPassword = 'admin'; // Default temporary password

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await db.query("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, username]);

        if (result.affectedRows > 0) {
            console.log(`Password for user '${username}' has been reset to '${newPassword}'`);
        } else {
            console.log(`User '${username}' not found. Creating it...`);
            // If admin doesn't exist, create it
            await db.query("INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)", [username, hashedPassword]);
            console.log(`User '${username}' created with password '${newPassword}'`);
        }
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        process.exit();
    }
}

resetAdminPassword();
