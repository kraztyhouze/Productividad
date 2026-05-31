const { pool } = require('./server/db.js');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    try {
        await pool.query("UPDATE employees SET password = $1 WHERE username = 'admin'", [hash]);
        console.log("Admin password reset to 'admin123'");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

resetAdmin();
