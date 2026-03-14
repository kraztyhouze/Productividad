import 'dotenv/config';
import { pool } from './server/db.js';

async function check() {
    try {
        console.log("Checking DB Content...");

        const empCount = await pool.query('SELECT count(*) FROM employees');
        console.log(`Employees: ${empCount.rows[0].count}`);

        const recordsCount = await pool.query('SELECT count(*) FROM daily_records');
        console.log(`Daily Records: ${recordsCount.rows[0].count}`);

        const sessionsCount = await pool.query('SELECT count(*) FROM active_sessions');
        console.log(`Active Sessions: ${sessionsCount.rows[0].count}`);

        // Sample Employee
        const emp = await pool.query('SELECT * FROM employees LIMIT 1');
        if (emp.rows.length > 0) {
            console.log("Sample Employee:", emp.rows[0].first_name, emp.rows[0].role, emp.rows[0].store_id);
        } else {
            console.log("NO EMPLOYEES FOUND.");
        }

    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        pool.end();
    }
}
check();
