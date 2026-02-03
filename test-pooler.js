import pg from 'pg';

const { Pool } = pg;

const PROJECT_ID = 'qbvrrjafxwidnjsdzqjs';
const PASSWORD = '0qSKEQY2beYeNYdL';

console.log('🔍 PROBANDO CONEXIÓN CON POOLER (IPv4)\n');
console.log('='.repeat(60));

// URLs con Pooler (soportan IPv4)
const poolerUrls = [
    // Transaction mode (puerto 6543) - RECOMENDADO
    `postgresql://postgres.${PROJECT_ID}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,

    // Session mode (puerto 5432)
    `postgresql://postgres.${PROJECT_ID}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,

    // Alternativa con user diferente
    `postgresql://postgres:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
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
        console.log('✅ URL CORRECTA (CON POOLER IPv4):\n');
        console.log(`DATABASE_URL=${url}`);
        console.log('');
        console.log('='.repeat(60));
        await pool.end();
        return url;
    } catch (err) {
        console.log(`❌ Error: ${err.code || 'UNKNOWN'} - ${err.message}\n`);
        await pool.end();
        return null;
    }
}

(async () => {
    for (let i = 0; i < poolerUrls.length; i++) {
        const workingUrl = await testConnection(poolerUrls[i], `Pooler ${i + 1}`);
        if (workingUrl) {

            // Guardar en archivo
            const fs = await import('fs');
            fs.writeFileSync('./.supabase-url.txt', workingUrl);
            console.log('💾 URL guardada en .supabase-url.txt\n');

            // Actualizar .env automáticamente
            let envContent = fs.readFileSync('./.env', 'utf8');
            envContent = envContent.replace(/DATABASE_URL=.+/, `DATABASE_URL=${workingUrl}`);
            fs.writeFileSync('./.env', envContent);
            console.log('✅ Archivo .env actualizado automáticamente\n');

            console.log('🎉 ¡Listo! Ahora ejecuta: npm run dev:all');

            process.exit(0);
        }
    }

    console.log('❌ No se pudo conectar con ningún formato de Pooler');
    console.log('\n💡 Solución:');
    console.log('   1. Ve a Supabase → Settings → Database');
    console.log('   2. Busca "Connection Pooling"');
    console.log('   3. Copia la URL del Pooler (Transaction mode)');
    console.log('   4. Pégala aquí');
    process.exit(1);
})();
