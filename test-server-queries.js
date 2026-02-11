import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function testServerQueries() {
    const client = await pool.connect();

    try {
        console.log('\n🧪 PRUEBA DE QUERIES DEL SERVIDOR\n');
        console.log('='.repeat(60));

        // Test 1: Query de empleados (como lo hace el servidor)
        console.log('\n1️⃣ Test: GET /api/employees (store_1)\n');
        const employees = await client.query(`
            SELECT 
                id, first_name, last_name, alias, email, role,
                contract_hours, contract_type, username, is_buyer,
                phone, address, "order", avatar, store_id
            FROM employees 
            WHERE store_id = $1
            ORDER BY "order" ASC, id ASC
        `, ['store_1']);

        console.log(`✅ Encontrados: ${employees.rows.length} empleados en store_1`);
        console.log('\nPrimeros 5 empleados:');
        employees.rows.slice(0, 5).forEach((emp, i) => {
            console.log(`  ${i + 1}. ${emp.first_name} ${emp.last_name} (${emp.username}) - ${emp.role}`);
        });

        // Test 2: Login test
        console.log('\n\n2️⃣ Test: POST /api/login (usuario: jmh, store_1)\n');
        const loginTest = await client.query(`
            SELECT id, first_name, last_name, username, password, role, store_id
            FROM employees
            WHERE username = $1 AND store_id = $2
        `, ['jmh', 'store_1']);

        if (loginTest.rows.length > 0) {
            const user = loginTest.rows[0];
            console.log(`✅ Usuario encontrado: ${user.first_name} ${user.last_name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Store: ${user.store_id}`);
            console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
        } else {
            console.log('❌ Usuario no encontrado');
        }

        // Test 3: Contar empleados por tienda
        console.log('\n\n3️⃣ Test: Empleados por tienda\n');
        const byStore = await client.query(`
            SELECT store_id, COUNT(*) as count
            FROM employees
            GROUP BY store_id
            ORDER BY store_id
        `);

        byStore.rows.forEach(row => {
            console.log(`   ${row.store_id}: ${row.count} empleados`);
        });

        // Test 4: Roles
        console.log('\n\n4️⃣ Test: GET /api/roles\n');
        const roles = await client.query('SELECT * FROM roles ORDER BY id ASC');
        console.log(`✅ Roles encontrados: ${roles.rows.length}`);
        roles.rows.forEach(role => {
            console.log(`   - ${role.name}`);
        });

        // Test 5: Store settings
        console.log('\n\n5️⃣ Test: Store Settings\n');
        const settings = await client.query('SELECT * FROM store_settings');
        console.log(`✅ Configuraciones: ${settings.rows.length}`);
        settings.rows.forEach(setting => {
            console.log(`   - ${setting.store_id}: Precio oro = ${setting.gold_price_18k}€/g`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ TODAS LAS QUERIES DEL SERVIDOR FUNCIONAN CORRECTAMENTE\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

testServerQueries();
