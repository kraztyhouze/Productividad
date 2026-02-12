import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function quickCheck() {
    const client = await pool.connect();

    try {
        console.log('\n🔍 VERIFICACIÓN RÁPIDA DE BASE DE DATOS\n');
        console.log('='.repeat(60));

        // Empleados
        const employees = await client.query('SELECT COUNT(*) as count FROM employees');
        console.log(`\n👥 Empleados: ${employees.rows[0].count}`);

        // Por tienda
        const byStore = await client.query(`
            SELECT store_id, COUNT(*) as count 
            FROM employees 
            GROUP BY store_id 
            ORDER BY store_id
        `);
        byStore.rows.forEach(row => {
            console.log(`   - ${row.store_id}: ${row.count} empleados`);
        });

        // Registros diarios
        const dailyRecords = await client.query('SELECT COUNT(*) as count FROM daily_records');
        console.log(`\n📊 Registros diarios: ${dailyRecords.rows[0].count}`);

        // Días cerrados
        const closedDays = await client.query('SELECT COUNT(*) as count FROM closed_days');
        console.log(`📅 Días cerrados: ${closedDays.rows[0].count}`);

        // Roles
        const roles = await client.query('SELECT COUNT(*) as count FROM roles');
        console.log(`🎭 Roles: ${roles.rows[0].count}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ Base de datos operativa\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

quickCheck();
