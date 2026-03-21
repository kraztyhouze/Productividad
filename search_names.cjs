const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function debug() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        console.log('--- Searching for clear-text names for ID 29 & 30 ---');
        
        const resRecs = await pool.query("SELECT DISTINCT employee_id, employee_name FROM daily_records WHERE employee_id::text IN ('29', '30')");
        console.log('\nFrom daily_records:');
        console.table(resRecs.rows);

        const resSessions = await pool.query("SELECT DISTINCT employee_id, employee_name FROM active_sessions WHERE employee_id::text IN ('29', '30')");
        console.log('\nFrom active_sessions:');
        console.table(resSessions.rows);

        const resLogs = await pool.query("SELECT DISTINCT employee_id, details FROM transaction_logs WHERE employee_id::text IN ('29', '30')");
        console.log('\nFrom transaction_logs (check names in details):');
        resLogs.rows.forEach(r => {
            console.log(`ID: ${r.employee_id}, Details: ${r.details}`);
        });

    } finally {
        await pool.end();
    }
}

debug();
