import pg from 'pg';
import dotenv from 'dotenv';
import net from 'net';

dotenv.config();

const { Pool } = pg;

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS\n');
console.log('='.repeat(60));

// Parsear la URL de conexión
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL no está definida en .env');
    process.exit(1);
}

// Extraer componentes de la URL
const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
    console.error('❌ ERROR: Formato de DATABASE_URL inválido');
    process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

console.log('\n📋 CONFIGURACIÓN:');
console.log('  Usuario:', user);
console.log('  Host:', host);
console.log('  Puerto:', port);
console.log('  Base de datos:', database);
console.log('  Contraseña:', password.substring(0, 4) + '****');

// Test 1: Conectividad de red
console.log('\n🌐 TEST 1: Conectividad de red al host...');
const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
    console.log('  ✅ Puerto accesible');
    socket.destroy();
    testDatabaseConnection();
});

socket.on('timeout', () => {
    console.error('  ❌ TIMEOUT: No se puede alcanzar el servidor');
    console.error('  💡 Posibles causas:');
    console.error('     - Railway puede estar suspendido (plan gratuito)');
    console.error('     - Firewall bloqueando la conexión');
    console.error('     - Problemas de red');
    socket.destroy();
    process.exit(1);
});

socket.on('error', (err) => {
    console.error('  ❌ ERROR de red:', err.message);
    console.error('  💡 Verifica tu conexión a internet');
    process.exit(1);
});

socket.connect(parseInt(port), host);

// Test 2: Conexión a PostgreSQL
function testDatabaseConnection() {
    console.log('\n🗄️  TEST 2: Autenticación PostgreSQL...');

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        max: 1
    });

    pool.query('SELECT NOW() as time, current_database() as db, version() as version')
        .then(res => {
            console.log('  ✅ CONEXIÓN EXITOSA');
            console.log('\n📊 INFORMACIÓN DEL SERVIDOR:');
            console.log('  Hora:', res.rows[0].time);
            console.log('  Base de datos:', res.rows[0].db);
            console.log('  Versión:', res.rows[0].version.split('\n')[0]);

            return pool.query(`
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                ORDER BY tablename
            `);
        })
        .then(res => {
            console.log('\n📋 TABLAS ENCONTRADAS:', res.rows.length);
            if (res.rows.length === 0) {
                console.log('  ⚠️  No hay tablas - La base de datos está vacía');
            } else {
                res.rows.forEach(row => console.log('  -', row.tablename));
            }

            return pool.query('SELECT store_id, COUNT(*) as count FROM employees GROUP BY store_id');
        })
        .then(res => {
            console.log('\n👥 EMPLEADOS POR TIENDA:');
            if (res.rows.length === 0) {
                console.log('  ⚠️  No hay empleados registrados');
            } else {
                res.rows.forEach(row => console.log(`  ${row.store_id}: ${row.count} empleados`));
            }

            console.log('\n✅ DIAGNÓSTICO COMPLETADO - TODO FUNCIONA CORRECTAMENTE');
            pool.end();
            process.exit(0);
        })
        .catch(err => {
            console.error('\n❌ ERROR DE BASE DE DATOS:');
            console.error('  Código:', err.code);
            console.error('  Mensaje:', err.message);

            if (err.code === 'ECONNRESET') {
                console.error('\n💡 DIAGNÓSTICO:');
                console.error('  El servidor cerró la conexión inesperadamente.');
                console.error('  Posibles causas:');
                console.error('  1. Railway está en modo "sleep" (plan gratuito)');
                console.error('  2. La base de datos fue eliminada o movida');
                console.error('  3. Credenciales incorrectas o expiradas');
                console.error('\n🔧 SOLUCIONES:');
                console.error('  1. Accede a Railway.app y verifica el estado del proyecto');
                console.error('  2. Regenera las credenciales de la base de datos');
                console.error('  3. Considera usar una base de datos local para desarrollo');
            } else if (err.code === 'ENOTFOUND') {
                console.error('\n💡 El host no existe o no es accesible');
            } else if (err.code === '28P01') {
                console.error('\n💡 Credenciales incorrectas (usuario/contraseña)');
            }

            pool.end();
            process.exit(1);
        });
}
