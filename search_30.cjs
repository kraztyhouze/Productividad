const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function debug() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        console.log('--- Searching for ID 30 ---');
        const resLogs = await pool.query("SELECT * FROM transaction_logs WHERE employee_id::text = '30'");
        console.log(`Found ${resLogs.rows.length} logs for 30.`);
        resLogs.rows.forEach(r => {
            console.log(`LOG ID ${r.id}: Type=${r.type}, Details=${JSON.stringify(r.details)}`);
        });

        const resRecs = await pool.query("SELECT * FROM daily_records WHERE employee_id::text = '30'");
        console.log(`Found ${resRecs.rows.length} daily records for 30.`);
        resRecs.rows.forEach(r => {
            console.log(`RECORD ID ${r.id}: Name=${r.employee_name}`);
        });

        const resSess = await pool.query("SELECT * FROM active_sessions WHERE employee_id::text = '30'");
        console.log(`Found ${resSess.rows.length} active sessions for 30.`);
        resSess.rows.forEach(r => {
            console.log(`SESSION ID ${r.id}: Name=${r.employee_name}`);
        });

    } finally {
        await pool.end();
    }
}

debug();
