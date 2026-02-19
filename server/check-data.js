
import 'dotenv/config';
import { pool } from './db.js';

async function checkData() {
    console.log("--- DATA DIAGNOSTIC ---");
    console.log(`Time: ${new Date().toISOString()}`);

    try {
        const client = await pool.connect();

        // 1. Stores
        const stores = await client.query('SELECT DISTINCT store_id FROM daily_groups');
        console.log("Stores:", JSON.stringify(stores.rows));

        // 2. Recent Keys
        const keys = await client.query('SELECT key FROM daily_groups ORDER BY key DESC LIMIT 5');
        console.log("Recent Keys:", JSON.stringify(keys.rows));

        // 3. Count Today (2026-02-19)
        const todayCount = await client.query("SELECT count(*) FROM daily_groups WHERE key LIKE '%-2026-02-19%'");
        console.log(`Count matching 2026-02-19: ${todayCount.rows[0].count}`);

        // 4. Count Yesterday (2026-02-18)
        const yestCount = await client.query("SELECT count(*) FROM daily_groups WHERE key LIKE '%-2026-02-18%'");
        console.log(`Count matching 2026-02-18: ${yestCount.rows[0].count}`);

        // 5. RLS Check
        const rls = await client.query("SELECT * FROM employees LIMIT 1");
        console.log("Employees Access:", rls.rowCount > 0 ? "YES" : "NO (or empty)");

        client.release();
    } catch (e) {
        console.error("ERROR:", e.message);
    } finally {
        process.exit();
    }
}
checkData();
