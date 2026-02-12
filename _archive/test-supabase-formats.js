import pg from 'pg';

const { Pool } = pg;

const PROJECT_ID = 'qbvrrjafxwidnjsdzqjs';
const PASSWORD = '0qSKEQY2beYeNYdL';

console.log('🔍 PROBANDO DIFERENTES FORMATOS DE URL DE SUPABASE\n');
console.log('='.repeat(60));

// Diferentes formatos posibles de URL de Supabase
const urlFormats = [
    // Formato 1: Pooler (Transaction mode) - Puerto 6543
    `postgresql://postgres.${PROJECT_ID}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,

    // Formato 2: Pooler (Session mode) - Puerto 5432
    `postgresql://postgres.${PROJECT_ID}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,

    // Formato 3: Direct connection - Puerto 5432
    `postgresql://postgres:${PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres`,

    // Formato 4: Pooler alternativo
    `postgresql://postgres:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,

    // Formato 5: IPv6 pooler
    `postgresql://postgres.${PROJECT_ID}:${PASSWORD}@[2a05:d014:1c06:4b03:49f5:d0ff:fe4a:27cf]:6543/postgres`,
];

async function testConnection(url, index) {
    const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const result = await pool.query('SELECT NOW() as time, current_database() as db');
        console.log(`✅ FORMATO ${index + 1} FUNCIONA:`);
        console.log(`   URL: ${url.replace(PASSWORD, '****')}`);
        console.log(`   Base de datos: ${result.rows[0].db}`);
        console.log(`   Hora: ${result.rows[0].time}`);
        console.log('');
        await pool.end();
        return url;
    } catch (err) {
        console.log(`❌ Formato ${index + 1}: ${err.message}`);
        await pool.end();
        return null;
    }
}

(async () => {
    let workingUrl = null;

    for (let i = 0; i < urlFormats.length; i++) {
        workingUrl = await testConnection(urlFormats[i], i);
        if (workingUrl) {
            console.log('='.repeat(60));
            console.log('🎉 CONEXIÓN EXITOSA\n');
            console.log('Usa esta URL en tu .env:');
            console.log('');
            console.log(`DATABASE_URL=${workingUrl}`);
            console.log('');
            console.log('='.repeat(60));
            process.exit(0);
        }
    }

    console.log('\n❌ Ningún formato funcionó');
    console.log('\n💡 Soluciones:');
    console.log('1. Ve a Supabase → Settings → Database');
    console.log('2. Copia la "Connection string" exacta (modo URI)');
    console.log('3. Reemplaza [YOUR-PASSWORD] con: 0qSKEQY2beYeNYdL');
    console.log('4. Pégala aquí para que la pruebe');
    process.exit(1);
})();
