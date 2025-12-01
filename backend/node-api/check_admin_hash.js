const db = require('./config/db');

async function checkAdminHash() {
    try {
        const [users] = await db.query("SELECT username, password FROM users WHERE username = 'admin'");
        if (users.length > 0) {
            console.log('Admin user found.');
            console.log('Stored Password Hash:', users[0].password);
        } else {
            console.log('Admin user not found.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkAdminHash();
