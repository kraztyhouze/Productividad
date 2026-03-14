import pg from 'pg';
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function testSync() {
    const storeId = 'store_1';
    try {
        console.log("Testing Sync Queries...");
        const [sessions, records, groups, closed, incidents, families, logs] = await Promise.all([
            pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions WHERE store_id = $1', [storeId]),
            pool.query("SELECT id, employee_id as \"employeeId\", employee_name as \"employeeName\", start_time as \"startTime\", end_time as \"endTime\", duration_seconds as \"durationSeconds\", date, groups_count as \"groups\" FROM daily_records WHERE store_id = $1 AND start_time > (NOW() - INTERVAL '15 days')::text ORDER BY start_time DESC", [storeId]),
            pool.query("SELECT key, standard, jewelry, recoverable, no_deal as \"noDeal\", client_seconds as \"clientSeconds\" FROM daily_groups WHERE store_id = $1 AND RIGHT(key, 10) >= to_char(NOW() - INTERVAL '15 days', 'YYYY-MM-DD')", [storeId]),
            pool.query("SELECT date FROM closed_days WHERE store_id = $1 AND date >= to_char(NOW() - INTERVAL '30 days', 'YYYY-MM-DD')", [storeId]),
            pool.query("SELECT date, text FROM day_incidents WHERE store_id = $1 AND date >= to_char(NOW() - INTERVAL '30 days', 'YYYY-MM-DD')", [storeId]),
            pool.query("SELECT id, name, type, date FROM product_families WHERE store_id = $1 AND date >= to_char(NOW() - INTERVAL '30 days', 'YYYY-MM-DD') ORDER BY id DESC", [storeId]),
            pool.query("SELECT * FROM transaction_logs WHERE store_id = $1 AND start_time > (NOW() - INTERVAL '7 days')::text ORDER BY start_time DESC", [storeId])
        ]);

        console.log("Sessions:", sessions.rows.length);
        console.log("Records:", records.rows.length);
        console.log("Groups:", Object.keys(groups.rows).length);
        console.log("Closed:", closed.rows.length);

        if (records.rows.length > 0) {
            console.log("Sample Record Start Time:", records.rows[0].startTime);
        }

    } catch (err) {
        console.error("SYNC QUERY FAILED:", err);
    } finally {
        await pool.end();
    }
}

testSync();
