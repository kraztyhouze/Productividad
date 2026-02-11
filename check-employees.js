import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkEmployees() {
    try {
        const result = await pool.query('SELECT id, first_name, last_name, username, store_id FROM employees ORDER BY id');

        console.log('\n📊 EMPLEADOS EN SUPABASE:');
        console.log('='.repeat(80));
        console.log(`Total: ${result.rows.length} empleados\n`);

        result.rows.forEach(emp => {
            console.log(`ID: ${emp.id} | ${emp.first_name} ${emp.last_name} | Username: ${emp.username} | Store: ${emp.store_id}`);
        });

        console.log('='.repeat(80));

        await pool.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        await pool.end();
        process.exit(1);
    }
}

checkEmployees();
