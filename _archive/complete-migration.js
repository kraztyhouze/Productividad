import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Configuración de Supabase
const SUPABASE_PROJECT_ID = 'qbvrrjafxwidnjsdzqjs';
const SUPABASE_PASSWORD = process.argv[2]; // Pasado como argumento

if (!SUPABASE_PASSWORD) {
    console.error('❌ ERROR: Debes proporcionar la contraseña de Supabase');
    console.error('');
    console.error('Uso:');
    console.error('  node complete-migration.js [TU-PASSWORD-DE-SUPABASE]');
    console.error('');
    console.error('Ejemplo:');
    console.error('  node complete-migration.js MiPassword123');
    console.error('');
    console.error('💡 La contraseña es la que creaste al crear el proyecto en Supabase');
    process.exit(1);
}

const supabaseUrl = `postgresql://postgres.${SUPABASE_PROJECT_ID}:${SUPABASE_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`;

console.log('🚀 MIGRACIÓN COMPLETA DE RAILWAY A SUPABASE\n');
console.log('='.repeat(60));

// Verificar que existe el backup
const backupDir = './backup-railway';
if (!fs.existsSync(backupDir)) {
    console.error('❌ No se encontró el directorio de backup');
    console.error('   Ejecuta primero: node backup-railway.js');
    process.exit(1);
}

const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
if (backupFiles.length === 0) {
    console.error('❌ No se encontraron archivos de backup');
    console.error('   Ejecuta primero: node backup-railway.js');
    process.exit(1);
}

console.log(`✅ Backup encontrado: ${backupFiles.length} archivos\n`);

// Conectar a Supabase
console.log('🔌 Conectando a Supabase...');
const supabasePool = new Pool({
    connectionString: supabaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

async function testSupabaseConnection() {
    try {
        const result = await supabasePool.query('SELECT NOW() as time, version() as version');
        console.log('✅ Conectado a Supabase');
        console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
        console.log(`   Hora: ${result.rows[0].time}\n`);
        return true;
    } catch (err) {
        console.error('❌ Error conectando a Supabase:');
        console.error(`   ${err.message}`);

        if (err.code === '28P01') {
            console.error('\n💡 La contraseña es incorrecta');
            console.error('   Verifica la contraseña en Supabase → Settings → Database');
        } else if (err.code === 'ENOTFOUND') {
            console.error('\n💡 No se puede encontrar el servidor');
            console.error('   Verifica el ID del proyecto');
        }

        return false;
    }
}

async function createTables() {
    console.log('📋 Creando tablas en Supabase...\n');

    const client = await supabasePool.connect();

    try {
        // Leer el script SQL
        const sqlScript = fs.readFileSync('./server/supabase-setup.sql', 'utf8');

        // Ejecutar el script (dividir por punto y coma y ejecutar cada statement)
        const statements = sqlScript
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                await client.query(statement);
            } catch (err) {
                // Ignorar errores de "ya existe"
                if (!err.message.includes('already exists')) {
                    console.log(`⚠️  ${err.message}`);
                }
            }
        }

        console.log('✅ Tablas creadas\n');
    } catch (err) {
        console.error('❌ Error creando tablas:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

async function migrateData() {
    console.log('📦 Migrando datos...\n');

    const client = await supabasePool.connect();
    let totalRecords = 0;

    try {
        await client.query('BEGIN');

        // Orden de migración (respetando dependencias)
        const migrationOrder = [
            'roles',
            'employees',
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

        for (const tableName of migrationOrder) {
            const backupFile = backupFiles.find(f => f.startsWith(tableName + '_'));

            if (!backupFile) {
                console.log(`⚠️  ${tableName}: No hay backup, saltando...`);
                continue;
            }

            const filePath = path.join(backupDir, backupFile);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (data.length === 0) {
                console.log(`⚠️  ${tableName}: Sin datos`);
                continue;
            }

            // Insertar datos
            let inserted = 0;
            for (const row of data) {
                const columns = Object.keys(row);
                const values = Object.values(row);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

                const query = `
                    INSERT INTO ${tableName} (${columns.join(', ')})
                    VALUES (${placeholders})
                    ON CONFLICT DO NOTHING
                `;

                try {
                    await client.query(query, values);
                    inserted++;
                } catch (err) {
                    // Ignorar conflictos
                    if (!err.message.includes('duplicate') && !err.message.includes('conflict')) {
                        console.log(`   ⚠️  Error en registro: ${err.message}`);
                    }
                }
            }

            console.log(`✅ ${tableName}: ${inserted}/${data.length} registros migrados`);
            totalRecords += inserted;
        }

        await client.query('COMMIT');
        console.log(`\n✅ Total migrado: ${totalRecords} registros\n`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error migrando datos:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

async function updateEnvFile() {
    console.log('📝 Actualizando archivo .env...\n');

    const envPath = './.env';
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Reemplazar la línea DATABASE_URL
    const newDatabaseUrl = `DATABASE_URL=${supabaseUrl}`;

    if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(/DATABASE_URL=.+/, newDatabaseUrl);
    } else {
        envContent += `\n${newDatabaseUrl}\n`;
    }

    // Hacer backup del .env anterior
    fs.writeFileSync('./.env.railway.backup', fs.readFileSync(envPath));
    console.log('✅ Backup de .env guardado en .env.railway.backup');

    // Escribir nuevo .env
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env actualizado con Supabase\n');
}

async function verifyMigration() {
    console.log('🔍 Verificando migración...\n');

    const checks = [
        { table: 'employees', expected: 'empleados' },
        { table: 'tasks', expected: 'tareas' },
        { table: 'daily_records', expected: 'registros diarios' },
        { table: 'roles', expected: 'roles' },
    ];

    for (const check of checks) {
        const result = await supabasePool.query(`SELECT COUNT(*) as count FROM ${check.table}`);
        console.log(`✅ ${check.table}: ${result.rows[0].count} ${check.expected}`);
    }

    console.log('\n✅ Verificación completada\n');
}

// Ejecutar migración
(async () => {
    try {
        // 1. Test conexión
        const connected = await testSupabaseConnection();
        if (!connected) {
            process.exit(1);
        }

        // 2. Crear tablas
        await createTables();

        // 3. Migrar datos
        await migrateData();

        // 4. Actualizar .env
        await updateEnvFile();

        // 5. Verificar
        await verifyMigration();

        console.log('='.repeat(60));
        console.log('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
        console.log('Próximos pasos:');
        console.log('  1. Ejecuta: npm run dev:all');
        console.log('  2. Abre: http://localhost:5173');
        console.log('  3. Inicia sesión con tus credenciales habituales');
        console.log('\n💡 Tu .env anterior se guardó en .env.railway.backup');
        console.log('='.repeat(60));

        await supabasePool.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ ERROR EN LA MIGRACIÓN:');
        console.error(err);
        await supabasePool.end();
        process.exit(1);
    }
})();
