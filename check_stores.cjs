const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function debug() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const res = await pool.query("SELECT id, store_id FROM employees WHERE id IN (29, 30)");
        console.table(res.rows);
    } finally {
        await pool.end();
    }
}

debug();
