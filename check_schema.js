import { pool } from './server/db.js';

async function check() {
    try {
        const res = await pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('employees', 'excel_metrics') AND column_name IN ('id', 'employee_id')");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
