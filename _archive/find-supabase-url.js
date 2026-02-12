import pg from 'pg';

const { Pool } = pg;

const PROJECT_REF = 'qbvrrjafxwidnjsdzqjs';
const PASSWORD = '0qSKEQY2beYeNYdL';

console.log('🔍 PROBANDO CONEXIÓN A SUPABASE\n');
console.log('Project: https://qbvrrjafxwidnjsdzqjs.supabase.co');
console.log('');

// Formatos basados en la URL del proyecto
const urlFormats = [
    // Direct connection (más común)
    `postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,

    // Pooler mode
    `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@db.${PROJECT_REF}.supabase.co:6543/postgres`,

    // Alternative pooler
    `postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:6543/postgres`,
];

async function testConnection(url, name) {
    console.log(`Probando: ${name}...`);
    const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        const result = await pool.query('SELECT NOW() as time, version() as version, current_database() as db');
        console.log(`✅ ÉXITO!\n`);
        console.log(`Base de datos: ${result.rows[0].db}`);
        console.log(`PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
        console.log(`Hora: ${result.rows[0].time}`);
        console.log('');
        console.log('='.repeat(60));
        console.log('✅ URL CORRECTA ENCONTRADA:\n');
        console.log(`DATABASE_URL=${url}`);
        console.log('');
        console.log('='.repeat(60));
        await pool.end();
        return url;
    } catch (err) {
        console.log(`❌ Error: ${err.message}\n`);
        await pool.end();
        return null;
    }
}

(async () => {
    for (let i = 0; i < urlFormats.length; i++) {
        const workingUrl = await testConnection(urlFormats[i], `Formato ${i + 1}`);
        if (workingUrl) {

            // Guardar en archivo para referencia
            const fs = await import('fs');
            fs.writeFileSync('./.supabase-url.txt', workingUrl);
            console.log('💾 URL guardada en .supabase-url.txt\n');

            process.exit(0);
        }
    }

    console.log('❌ No se pudo conectar con ningún formato');
    console.log('\n💡 Por favor, ve a Supabase y copia la Connection String exacta:');
    console.log('   Settings → Database → Connection string (URI mode)');
    process.exit(1);
})();
