import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function restoreEmployees() {
    const client = await pool.connect();

    try {
        console.log('\n🔄 RESTAURANDO EMPLEADOS DESDE BACKUP\n');
        console.log('='.repeat(80));

        // Leer backup
        const backup = JSON.parse(fs.readFileSync('./backup-railway/employees_2026-02-03T14-24-52.json', 'utf8'));
        console.log(`\n📦 Empleados en backup: ${backup.length}`);

        // Ver empleados actuales
        const current = await client.query('SELECT COUNT(*) as count FROM employees');
        console.log(`📊 Empleados actuales: ${current.rows[0].count}\n`);

        await client.query('BEGIN');

        // Eliminar empleados actuales
        console.log('🗑️  Eliminando empleados actuales...');
        await client.query('TRUNCATE TABLE employees CASCADE');
        console.log('✅ Empleados eliminados\n');

        // Restaurar desde backup
        console.log('📥 Restaurando empleados...\n');

        let restored = 0;
        for (const emp of backup) {
            try {
                await client.query(`
                    INSERT INTO employees (
                        id, first_name, last_name, alias, email, role, 
                        contract_hours, contract_type, username, password, 
                        is_buyer, phone, address, "order", avatar, store_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    emp.id, emp.first_name, emp.last_name, emp.alias, emp.email, emp.role,
                    emp.contract_hours, emp.contract_type, emp.username, emp.password,
                    emp.is_buyer, emp.phone, emp.address, emp.order, emp.avatar, emp.store_id
                ]);

                restored++;
                console.log(`  ✅ ${restored}. ${emp.first_name} ${emp.last_name} (${emp.username}) - ${emp.store_id}`);
            } catch (err) {
                console.log(`  ❌ Error con ${emp.first_name} ${emp.last_name}: ${err.message}`);
            }
        }

        // Resetear secuencia de IDs
        const maxId = Math.max(...backup.map(e => e.id));
        await client.query(`SELECT setval('employees_id_seq', $1)`, [maxId]);

        await client.query('COMMIT');

        console.log('\n' + '='.repeat(80));
        console.log(`✅ RESTAURACIÓN COMPLETADA: ${restored}/${backup.length} empleados`);
        console.log('='.repeat(80));

        // Verificar
        const final = await client.query('SELECT COUNT(*) as count FROM employees');
        console.log(`\n📊 Total final de empleados: ${final.rows[0].count}\n`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR:', err.message);
        console.error(err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

restoreEmployees();
