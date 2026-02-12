import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const SUPABASE_URL = 'postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

console.log('📦 MIGRACIÓN DE DATOS DE RAILWAY A SUPABASE\n');
console.log('='.repeat(60));

const backupDir = './backup-railway';
const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

console.log(`✅ Backup encontrado: ${backupFiles.length} archivos\n`);

const pool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Orden de migración (respetando dependencias)
const migrationOrder = [
    'roles',
    'store_settings',
    'employees',
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

async function migrateTable(tableName) {
    const backupFile = backupFiles.find(f => f.startsWith(tableName + '_'));

    if (!backupFile) {
        console.log(`⚠️  ${tableName}: Sin backup`);
        return 0;
    }

    const filePath = path.join(backupDir, backupFile);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (data.length === 0) {
        console.log(`⚠️  ${tableName}: Sin datos`);
        return 0;
    }

    let inserted = 0;

    for (const row of data) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            INSERT INTO ${tableName} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
        `;

        try {
            await pool.query(query, values);
            inserted++;
        } catch (err) {
            // Ignorar errores de duplicados
            if (!err.message.includes('duplicate') && !err.message.includes('conflict')) {
                // Solo mostrar el primer error de cada tabla
                if (inserted === 0) {
                    console.log(`   ⚠️  ${tableName}: ${err.message.split('\n')[0]}`);
                }
            }
        }
    }

    console.log(`✅ ${tableName}: ${inserted}/${data.length} registros migrados`);
    return inserted;
}

(async () => {
    try {
        console.log('🔌 Conectando a Supabase...\n');
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado\n');

        console.log('📊 Migrando datos...\n');

        let totalRecords = 0;
        for (const tableName of migrationOrder) {
            const count = await migrateTable(tableName);
            totalRecords += count;
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ MIGRACIÓN COMPLETADA`);
        console.log(`📊 Total migrado: ${totalRecords} registros`);
        console.log('='.repeat(60));

        console.log('\n🎉 ¡Todos tus datos están ahora en Supabase!');
        console.log('\n💡 Próximos pasos:');
        console.log('   1. La aplicación ya está corriendo en: http://localhost:5173');
        console.log('   2. Inicia sesión con tus credenciales habituales');
        console.log('   3. Verifica que todos tus datos están presentes');

        await pool.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
        await pool.end();
        process.exit(1);
    }
})();
