import pg from 'pg';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);
const { Pool } = pg;

const PROJECT_ID = 'qbvrrjafxwidnjsdzqjs';
const PASSWORD = '0qSKEQY2beYeNYdL';

console.log('🔍 DIAGNÓSTICO COMPLETO DE SUPABASE\n');
console.log('='.repeat(60));

// Diferentes hosts posibles
const hosts = [
    `db.${PROJECT_ID}.supabase.co`,
    `${PROJECT_ID}.supabase.co`,
    `aws-0-eu-central-1.pooler.supabase.com`,
];

console.log('1️⃣ Probando resolución DNS...\n');

for (const host of hosts) {
    try {
        const address = await lookup(host);
        console.log(`✅ ${host}`);
        console.log(`   IP: ${address.address}\n`);
    } catch (err) {
        console.log(`❌ ${host}`);
        console.log(`   Error: ${err.message}\n`);
    }
}

console.log('2️⃣ Probando conexiones PostgreSQL...\n');

const urls = [
    `postgresql://postgres:${PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres`,
    `postgresql://postgres:${PASSWORD}@db.${PROJECT_ID}.supabase.co:6543/postgres`,
    `postgresql://postgres.${PROJECT_ID}:${PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres`,
];

for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`Probando URL ${i + 1}...`);

    const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
    });

    try {
        const result = await pool.query('SELECT NOW() as time');
        console.log(`✅ ÉXITO!`);
        console.log(`   Hora del servidor: ${result.rows[0].time}`);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ URL CORRECTA:\n`);
        console.log(`${url}`);
        console.log(`${'='.repeat(60)}\n`);

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.log(`❌ Error: ${err.code} - ${err.message}\n`);
        await pool.end();
    }
}

console.log('❌ Ninguna URL funcionó\n');
console.log('💡 Posibles causas:');
console.log('   1. El proyecto aún se está inicializando (espera 2-3 min)');
console.log('   2. La contraseña es incorrecta');
console.log('   3. El proyecto está en una región diferente');
console.log('\n📋 Por favor, ve a Supabase y verifica:');
console.log('   - Settings → Database → Connection string');
console.log('   - Copia la URL EXACTA (pestaña URI)');
console.log('   - Asegúrate de que el proyecto esté "Active"');

process.exit(1);
