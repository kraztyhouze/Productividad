import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

console.log('🔍 Probando conexión a la base de datos...');
console.log('📍 URL:', connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : 'NO DEFINIDA');

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
});

pool.query('SELECT NOW() as current_time, version() as db_version')
    .then(res => {
        console.log('✅ CONEXIÓN EXITOSA');
        console.log('⏰ Hora del servidor:', res.rows[0].current_time);
        console.log('📦 Versión PostgreSQL:', res.rows[0].db_version);

        // Verificar tablas
        return pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
    })
    .then(res => {
        console.log('\n📊 Tablas en la base de datos:');
        res.rows.forEach(row => console.log('  -', row.table_name));

        // Verificar empleados
        return pool.query('SELECT COUNT(*) as count FROM employees');
    })
    .then(res => {
        console.log('\n👥 Total de empleados:', res.rows[0].count);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error('Código:', err.code);
        console.error('Mensaje:', err.message);
        console.error('\nDetalles completos:', err);
        process.exit(1);
    });
