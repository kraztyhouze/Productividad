import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function verifyAllData() {
    const client = await pool.connect();

    try {
        console.log('\n📊 VERIFICACIÓN COMPLETA DE DATOS\n');
        console.log('='.repeat(80));

        const tables = [
            'employees',
            'roles',
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

        console.log('\n📦 DATOS EN SUPABASE vs BACKUP:\n');

        const backupDir = './backup-railway';
        const backupFiles = fs.readdirSync(backupDir);

        for (const table of tables) {
            try {
                // Contar en Supabase
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                const supabaseCount = parseInt(result.rows[0].count);

                // Contar en backup
                const backupFile = backupFiles.find(f => f.startsWith(table + '_'));
                let backupCount = 0;
                if (backupFile) {
                    const data = JSON.parse(fs.readFileSync(`${backupDir}/${backupFile}`, 'utf8'));
                    backupCount = data.length;
                }

                const status = supabaseCount >= backupCount ? '✅' : '⚠️ ';
                const diff = supabaseCount - backupCount;
                const diffStr = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '';

                console.log(`${status} ${table.padEnd(20)} Supabase: ${supabaseCount.toString().padStart(4)} | Backup: ${backupCount.toString().padStart(4)} ${diffStr}`);

            } catch (err) {
                console.log(`❌ ${table.padEnd(20)} Error: ${err.message}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n💡 Leyenda:');
        console.log('  ✅ = Datos correctos (Supabase >= Backup)');
        console.log('  ⚠️  = Faltan datos (Supabase < Backup)');
        console.log('  (+N) = N registros más que en el backup');
        console.log('  (-N) = N registros menos que en el backup\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyAllData();
