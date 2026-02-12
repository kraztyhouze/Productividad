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

console.log('🔄 RESTAURACIÓN COMPLETA DESDE BACKUP DE RAILWAY\n');
console.log('='.repeat(80));

const backupDir = './backup-railway';

// Orden de restauración (respetando dependencias de foreign keys)
const restoreOrder = [
    'roles',
    'employees',
    'store_settings',
    'tasks',
    'comments',
    'product_families',
    'active_sessions',
    'daily_records',
    'daily_groups',
    'closed_days',
    'day_incidents',
    'no_deal_details',
    'locations'
];

async function restoreTable(client, tableName) {
    // Buscar archivo de backup
    const backupFiles = fs.readdirSync(backupDir);
    const backupFile = backupFiles.find(f => f.startsWith(tableName + '_'));

    if (!backupFile) {
        console.log(`⚠️  ${tableName}: No hay archivo de backup`);
        return 0;
    }

    const filePath = path.join(backupDir, backupFile);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (data.length === 0) {
        console.log(`⚠️  ${tableName}: Sin datos en el backup`);
        return 0;
    }

    // Limpiar tabla actual
    await client.query(`DELETE FROM ${tableName}`);

    // Restaurar datos
    let restored = 0;
    for (const row of data) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            INSERT INTO ${tableName} (${columns.join(', ')})
            VALUES (${placeholders})
        `;

        try {
            await client.query(query, values);
            restored++;
        } catch (err) {
            // Mostrar solo errores que no sean de duplicados
            if (!err.message.includes('duplicate') && !err.message.includes('conflict')) {
                console.log(`   ⚠️  Error en ${tableName}: ${err.message}`);
            }
        }
    }

    console.log(`✅ ${tableName}: ${restored}/${data.length} registros restaurados`);
    return restored;
}

async function restoreAllData() {
    const client = await pool.connect();
    let totalRestored = 0;

    try {
        console.log('\n📊 Verificando estado actual...\n');

        // Mostrar conteo actual
        for (const table of restoreOrder) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`   ${table}: ${result.rows[0].count} registros`);
            } catch (err) {
                console.log(`   ${table}: tabla no existe o error`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('🚀 Iniciando restauración...\n');

        await client.query('BEGIN');

        for (const table of restoreOrder) {
            const restored = await restoreTable(client, table);
            totalRestored += restored;
        }

        await client.query('COMMIT');

        console.log('\n' + '='.repeat(80));
        console.log(`✅ RESTAURACIÓN COMPLETADA: ${totalRestored} registros totales`);
        console.log('='.repeat(80));

        // Verificar estado final
        console.log('\n📊 Estado final:\n');
        for (const table of restoreOrder) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`   ${table}: ${result.rows[0].count} registros`);
            } catch (err) {
                console.log(`   ${table}: error`);
            }
        }

        console.log('\n✅ Todos los datos han sido restaurados desde el backup de Railway\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR EN LA RESTAURACIÓN:', err.message);
        console.error(err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

restoreAllData().catch(err => {
    console.error(err);
    process.exit(1);
});
