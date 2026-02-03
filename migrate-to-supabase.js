import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;

console.log('🔄 ASISTENTE DE MIGRACIÓN A SUPABASE\n');
console.log('='.repeat(60));

// Verificar si ya hay una URL de Supabase configurada
const currentUrl = process.env.DATABASE_URL;
const isSupabase = currentUrl && currentUrl.includes('supabase.co');
const isRailway = currentUrl && currentUrl.includes('railway.app');

if (isSupabase) {
    console.log('✅ Ya estás usando Supabase!');
    console.log('📍 Host:', currentUrl.match(/@([^:]+)/)?.[1] || 'unknown');
    testConnection();
} else if (isRailway) {
    console.log('⚠️  Actualmente usando Railway');
    console.log('📍 Host:', currentUrl.match(/@([^:]+)/)?.[1] || 'unknown');
    console.log('\n🔧 PASOS PARA MIGRAR:\n');
    showMigrationSteps();
} else {
    console.log('⚠️  No se detectó configuración de base de datos');
    showMigrationSteps();
}

function showMigrationSteps() {
    console.log('1️⃣  Ve a https://supabase.com y crea una cuenta');
    console.log('2️⃣  Crea un nuevo proyecto:');
    console.log('    - Name: TikTak-Productividad');
    console.log('    - Region: Europe West (Frankfurt)');
    console.log('    - Database Password: (¡Guárdala!)');
    console.log('    - Plan: Free');
    console.log('');
    console.log('3️⃣  Una vez creado, ve a Settings → Database');
    console.log('4️⃣  Copia la "Connection string" en modo URI');
    console.log('5️⃣  Actualiza el archivo .env con:');
    console.log('');
    console.log('    DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres');
    console.log('');
    console.log('6️⃣  Ejecuta: npm run dev:all');
    console.log('');
    console.log('📖 Más detalles en: MIGRACION_SUPABASE.md');
    console.log('');
    process.exit(0);
}

function testConnection() {
    console.log('\n🧪 Probando conexión a Supabase...\n');

    const pool = new Pool({
        connectionString: currentUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    pool.query('SELECT NOW() as time, version() as version, current_database() as db')
        .then(res => {
            console.log('✅ CONEXIÓN EXITOSA');
            console.log('⏰ Hora del servidor:', res.rows[0].time);
            console.log('🗄️  Base de datos:', res.rows[0].db);
            console.log('📦 PostgreSQL:', res.rows[0].version.split(' ')[1]);

            return pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `);
        })
        .then(res => {
            console.log('\n📊 TABLAS EN LA BASE DE DATOS:', res.rows.length);

            if (res.rows.length === 0) {
                console.log('\n⚠️  La base de datos está vacía');
                console.log('💡 Inicia el servidor con: npm run dev:all');
                console.log('   El sistema creará todas las tablas automáticamente');
            } else {
                console.log('\nTablas encontradas:');
                res.rows.forEach(row => console.log('  ✓', row.table_name));

                // Verificar datos
                return pool.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM employees) as employees,
                        (SELECT COUNT(*) FROM tasks) as tasks,
                        (SELECT COUNT(*) FROM daily_records) as records,
                        (SELECT COUNT(*) FROM roles) as roles
                `);
            }
        })
        .then(res => {
            if (res && res.rows) {
                console.log('\n📈 ESTADÍSTICAS:');
                console.log('  👥 Empleados:', res.rows[0].employees);
                console.log('  📋 Tareas:', res.rows[0].tasks);
                console.log('  📊 Registros diarios:', res.rows[0].records);
                console.log('  🏷️  Roles:', res.rows[0].roles);
            }

            console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
            console.log('🚀 Tu aplicación está lista para usar Supabase');
            console.log('\n💡 Próximos pasos:');
            console.log('   1. Ejecuta: npm run dev:all');
            console.log('   2. Abre: http://localhost:5173');
            console.log('   3. Inicia sesión con: admin / admin');

            pool.end();
            process.exit(0);
        })
        .catch(err => {
            console.error('\n❌ ERROR DE CONEXIÓN:');
            console.error('Código:', err.code);
            console.error('Mensaje:', err.message);

            if (err.code === 'ECONNREFUSED') {
                console.error('\n💡 El servidor no está accesible');
                console.error('   Verifica que la URL sea correcta');
            } else if (err.code === '28P01') {
                console.error('\n💡 Contraseña incorrecta');
                console.error('   Verifica la contraseña en el .env');
            } else if (err.code === 'ENOTFOUND') {
                console.error('\n💡 Host no encontrado');
                console.error('   Verifica la URL de Supabase');
            }

            pool.end();
            process.exit(1);
        });
}
