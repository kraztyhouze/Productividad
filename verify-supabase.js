import pg from 'pg';

const { Pool } = pg;

// URL correcta (sin corchetes)
const SUPABASE_URL = 'postgresql://postgres:0qSKEQY2beYeNYdL@db.qbvrrjafxwidnjsdzqjs.supabase.co:5432/postgres';

console.log('🔌 PROBANDO CONEXIÓN A SUPABASE\n');
console.log('URL:', SUPABASE_URL.replace('0qSKEQY2beYeNYdL', '****'));
console.log('');

const pool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

pool.query('SELECT NOW() as time, version() as version, current_database() as db')
    .then(res => {
        console.log('✅ CONEXIÓN EXITOSA!\n');
        console.log('Base de datos:', res.rows[0].db);
        console.log('PostgreSQL:', res.rows[0].version.split(' ')[1]);
        console.log('Hora:', res.rows[0].time);
        console.log('');
        console.log('='.repeat(60));
        console.log('✅ URL VERIFICADA - Lista para migración');
        console.log('='.repeat(60));

        // Guardar URL para el script de migración
        import('fs').then(fs => {
            fs.writeFileSync('./.supabase-url.txt', SUPABASE_URL);
            console.log('\n💾 URL guardada en .supabase-url.txt');
            pool.end();
            process.exit(0);
        });
    })
    .catch(err => {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error('Código:', err.code);
        console.error('Mensaje:', err.message);
        pool.end();
        process.exit(1);
    });
