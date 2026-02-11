import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

console.log('🔄 RESTAURACIÓN DE DATOS DESDE BACKUP\n');
console.log('='.repeat(60));

async function restoreData() {
    const client = await pool.connect();

    try {
        // Verificar empleados actuales
        const currentEmployees = await client.query('SELECT COUNT(*) as count FROM employees');
        console.log(`\n📊 Empleados actuales en Supabase: ${currentEmployees.rows[0].count}`);

        // Leer backup de empleados
        const backupFile = './backup-railway/employees_2026-02-03T14-24-52.json';
        const employeesBackup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        console.log(`📦 Empleados en backup: ${employeesBackup.length}\n`);

        if (currentEmployees.rows[0].count >= employeesBackup.length) {
            console.log('✅ La base de datos ya tiene todos los empleados del backup');
            console.log('   No es necesario restaurar.\n');
            return;
        }

        console.log('⚠️  ADVERTENCIA: Se van a restaurar los empleados del backup');
        console.log('   Esto eliminará los empleados actuales y restaurará los del backup.\n');

        await client.query('BEGIN');

        // Eliminar empleados actuales
        console.log('🗑️  Eliminando empleados actuales...');
        await client.query('DELETE FROM employees');

        // Restaurar empleados del backup
        console.log('📥 Restaurando empleados del backup...\n');

        let restored = 0;
        for (const emp of employeesBackup) {
            const columns = Object.keys(emp);
            const values = Object.values(emp);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            const query = `
                INSERT INTO employees (${columns.join(', ')})
                VALUES (${placeholders})
            `;

            try {
                await client.query(query, values);
                restored++;
                console.log(`   ✅ ${emp.first_name} ${emp.last_name} (${emp.username}) - ${emp.store_id}`);
            } catch (err) {
                console.log(`   ❌ Error con ${emp.first_name} ${emp.last_name}: ${err.message}`);
            }
        }

        await client.query('COMMIT');

        console.log('\n' + '='.repeat(60));
        console.log(`✅ RESTAURACIÓN COMPLETADA: ${restored}/${employeesBackup.length} empleados`);
        console.log('='.repeat(60));

        // Verificar
        const finalCount = await client.query('SELECT COUNT(*) as count FROM employees');
        console.log(`\n📊 Total de empleados en Supabase: ${finalCount.rows[0].count}\n`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

restoreData().catch(err => {
    console.error(err);
    process.exit(1);
});
