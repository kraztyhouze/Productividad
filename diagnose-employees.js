import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function main() {
    const client = await pool.connect();

    try {
        // 1. Ver empleados actuales
        console.log('\n📊 EMPLEADOS ACTUALES EN SUPABASE:\n');
        const current = await client.query('SELECT id, first_name, last_name, username, store_id FROM employees ORDER BY id');
        console.log(`Total: ${current.rows.length} empleados\n`);
        current.rows.forEach(emp => {
            console.log(`  ${emp.id}. ${emp.first_name} ${emp.last_name} (${emp.username}) - ${emp.store_id}`);
        });

        // 2. Ver empleados en backup
        console.log('\n📦 EMPLEADOS EN BACKUP:\n');
        const backup = JSON.parse(fs.readFileSync('./backup-railway/employees_2026-02-03T14-24-52.json', 'utf8'));
        console.log(`Total: ${backup.length} empleados\n`);

        // 3. Comparar
        console.log('\n🔍 ANÁLISIS:\n');
        console.log(`  - Empleados en Supabase: ${current.rows.length}`);
        console.log(`  - Empleados en Backup: ${backup.length}`);
        console.log(`  - Diferencia: ${backup.length - current.rows.length} empleados faltan\n`);

        if (current.rows.length < backup.length) {
            console.log('⚠️  PROBLEMA DETECTADO: Faltan empleados en Supabase');
            console.log('   Se necesita restaurar desde el backup.\n');

            // Preguntar si restaurar
            console.log('💡 Para restaurar, ejecuta:');
            console.log('   node restore-employees-only.js\n');
        } else {
            console.log('✅ Todos los empleados están en Supabase\n');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
