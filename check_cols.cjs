const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function debug() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'employees'");
        console.table(res.rows.map(r => r.column_name));
    } finally {
        await pool.end();
    }
}

debug();
