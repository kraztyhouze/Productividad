import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Intentar conectar a Railway para hacer backup
const railwayUrl = 'postgresql://postgres:ZCSDHEECDFqRRExkbdWYgWmlCVLoeqVW@gondola.proxy.rlwy.net:33540/railway';

console.log('🔄 INTENTANDO BACKUP DE RAILWAY...\n');

const pool = new Pool({
    connectionString: railwayUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

const backupDir = './backup-railway';
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

async function backupTable(tableName) {
    try {
        const result = await pool.query(`SELECT * FROM ${tableName}`);
        const filename = path.join(backupDir, `${tableName}_${timestamp}.json`);
        fs.writeFileSync(filename, JSON.stringify(result.rows, null, 2));
        console.log(`✅ ${tableName}: ${result.rows.length} registros → ${filename}`);
        return result.rows.length;
    } catch (err) {
        console.log(`⚠️  ${tableName}: No existe o error (${err.message})`);
        return 0;
    }
}

const tables = [
    'employees',
    'roles',
    'tasks',
    'comments',
    'active_sessions',
    'daily_records',
    'daily_groups',
    'closed_days',
    'day_incidents',
    'no_deal_details',
    'product_families',
    'store_settings',
    'locations'
];

console.log('📦 Exportando tablas de Railway...\n');

pool.query('SELECT NOW()')
    .then(async () => {
        console.log('✅ Conectado a Railway\n');

        let totalRecords = 0;
        for (const table of tables) {
            const count = await backupTable(table);
            totalRecords += count;
        }

        console.log(`\n✅ BACKUP COMPLETADO`);
        console.log(`📊 Total de registros: ${totalRecords}`);
        console.log(`📁 Ubicación: ${path.resolve(backupDir)}`);
        console.log(`\n💡 Estos archivos JSON pueden usarse para restaurar datos si es necesario`);

        pool.end();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ No se pudo conectar a Railway');
        console.error('Código:', err.code);
        console.error('Mensaje:', err.message);
        console.log('\n💡 Esto es normal si Railway ya no está disponible');
        console.log('   Puedes continuar con la migración a Supabase sin problemas');
        console.log('   Los datos se crearán frescos en Supabase');

        pool.end();
        process.exit(1);
    });
