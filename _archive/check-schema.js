import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkSchema() {
    const client = await pool.connect();

    try {
        console.log('\n📋 ESQUEMA DE LA TABLA EMPLOYEES:\n');

        // Ver columnas
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);

        console.log('Columnas:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
        });

        // Ver constraints
        console.log('\n📌 Constraints:');
        const constraints = await client.query(`
            SELECT conname, contype, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'employees'::regclass
        `);

        constraints.rows.forEach(con => {
            const type = {
                'p': 'PRIMARY KEY',
                'f': 'FOREIGN KEY',
                'u': 'UNIQUE',
                'c': 'CHECK'
            }[con.contype] || con.contype;
            console.log(`  - ${con.conname} (${type}): ${con.definition}`);
        });

        // Ver empleados actuales
        console.log('\n👥 EMPLEADOS ACTUALES:\n');
        const employees = await client.query('SELECT id, first_name, last_name, username, store_id FROM employees ORDER BY id');
        console.log(`Total: ${employees.rows.length}\n`);
        employees.rows.forEach(emp => {
            console.log(`  ${emp.id}. ${emp.first_name} ${emp.last_name} (${emp.username}) - ${emp.store_id}`);
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
