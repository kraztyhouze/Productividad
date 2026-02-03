import pg from 'pg';

const { Pool } = pg;

// URL correcta del Transaction Pooler
const SUPABASE_URL = 'postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

console.log('🔌 PROBANDO CONEXIÓN AL TRANSACTION POOLER\n');
console.log('Host: aws-1-eu-west-1.pooler.supabase.com');
console.log('Puerto: 6543');
console.log('Modo: Transaction Pooler');
console.log('');

const pool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

pool.query('SELECT NOW() as time, version() as version, current_database() as db, current_user as user')
    .then(res => {
        console.log('✅ CONEXIÓN EXITOSA!\n');
        console.log('='.repeat(60));
        console.log('Base de datos:', res.rows[0].db);
        console.log('Usuario:', res.rows[0].user);
        console.log('PostgreSQL:', res.rows[0].version.split(' ')[1]);
        console.log('Hora del servidor:', res.rows[0].time);
        console.log('='.repeat(60));
        console.log('\n🎉 ¡Supabase está funcionando con IPv4!\n');

        pool.end();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error('Código:', err.code);
        console.error('Mensaje:', err.message);
        pool.end();
        process.exit(1);
    });
