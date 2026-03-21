import { pool } from './server/db.js';

async function check() {
    try {
        const res = await pool.query('SELECT username, role, first_name FROM employees WHERE role IS NOT NULL LIMIT 5');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}

check();
