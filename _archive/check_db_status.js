import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Use the same connection logic as likely present in db.js or implied env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("ERROR: DATABASE_URL is obscure/missing!");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Checking DB Connection to:', connectionString.split('@')[1]); // Hide password
        const res = await pool.query('SELECT count(*) FROM employees');
        console.log('Employees count:', res.rows[0].count);

        const storeRes = await pool.query('SELECT * FROM employees LIMIT 1');
        if (storeRes.rows.length > 0) {
            console.log('First Employee Store ID:', storeRes.rows[0].store_id);
        }
        process.exit(0);
    } catch (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
}
check();
