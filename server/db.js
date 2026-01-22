import pg from 'pg';

const { Pool } = pg;

// Use DATABASE_URL from environment (Railway provides this)
// Fallback to a local connection string if needed (for dev)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/productivity';

export const pool = new Pool({
    connectionString,
    // SSL is required for Railway deployments, but we need to disable it for local dev if not set up
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    keepAlive: true, // Prevent Railway proxy from killing idle connections
    connectionTimeoutMillis: 5000, // Fail fast if connection is bad
});

// Prevent app crash on idle client errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process, just log it. The pool will discard the client.
});

export const query = (text, params) => pool.query(text, params);

export async function initDb() {
    const client = await pool.connect();
    try {

        await client.query(`
        CREATE TABLE IF NOT EXISTS active_sessions (
            employee_id TEXT PRIMARY KEY,
            employee_name TEXT,
            start_time TEXT,
            client_start_time TEXT,
            store_id TEXT DEFAULT 'store_1'
        );
    `);

        // Ensure column exists for existing tables
        await client.query(`ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS client_start_time TEXT;`);
        await client.query(`ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        await client.query(`
        CREATE TABLE IF NOT EXISTS daily_records (
            id BIGINT PRIMARY KEY,
            employee_id TEXT,
            employee_name TEXT,
            start_time TEXT,
            end_time TEXT,
            duration_seconds REAL,
            date TEXT,
            groups_count INTEGER DEFAULT 0,
            store_id TEXT DEFAULT 'store_1'
        );
    `);
        await client.query(`ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        await client.query(`
        CREATE TABLE IF NOT EXISTS daily_groups (
            key TEXT PRIMARY KEY,
            standard INTEGER DEFAULT 0,
            jewelry INTEGER DEFAULT 0,
            recoverable INTEGER DEFAULT 0,
            store_id TEXT DEFAULT 'store_1'
        );
    `);
        await client.query(`ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        await client.query(`
        CREATE TABLE IF NOT EXISTS closed_days (
            date TEXT PRIMARY KEY,
            store_id TEXT DEFAULT 'store_1' -- Note: PK might need change if same date on diff stores? Yes.
        );
    `);
        await client.query(`ALTER TABLE closed_days ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        // Fix Primary Key for closed_days to be composite (date + store_id)
        // complex migration, skip for now or handle via software logic (date_store)

        await client.query(`
        CREATE TABLE IF NOT EXISTS day_incidents (
            date TEXT PRIMARY KEY,
            text TEXT,
            store_id TEXT DEFAULT 'store_1'
        );
    `);
        await client.query(`ALTER TABLE day_incidents ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        // Migration for closed_days details
        await client.query(`ALTER TABLE closed_days ADD COLUMN IF NOT EXISTS total_groups INTEGER DEFAULT 0;`);
        await client.query(`ALTER TABLE closed_days ADD COLUMN IF NOT EXISTS users_report TEXT;`); // JSON String
        await client.query(`ALTER TABLE closed_days ADD COLUMN IF NOT EXISTS observation TEXT;`);
        await client.query(`ALTER TABLE closed_days ADD COLUMN IF NOT EXISTS max_concurrent INTEGER DEFAULT 0;`);


        await client.query(`
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            avatar TEXT,
            first_name TEXT,
            last_name TEXT,
            alias TEXT,
            email TEXT,
            role TEXT,
            contract_hours REAL,
            contract_type TEXT,
            username TEXT, -- Removed UNIQUE constraint here in CREATE (handled by index)
            password TEXT,
            is_buyer BOOLEAN DEFAULT FALSE,
            phone TEXT,
            address TEXT,
            "order" INTEGER DEFAULT 0,
            store_id TEXT DEFAULT 'store_1' -- Default to store_1 for legacy data
        );
    `);

        // Migrations for existing tables (in case they were created before these columns were added)
        await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar TEXT;`);
        await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;`);
        await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS alias TEXT;`);
        await client.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        await client.query(`
        CREATE TABLE IF NOT EXISTS product_families (
            id SERIAL PRIMARY KEY,
            name TEXT,
            type TEXT, -- 'need' or 'overstock'
            date TEXT,
            store_id TEXT DEFAULT 'store_1'
        );
    `);
        await client.query(`ALTER TABLE product_families ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        // Migrations
        await client.query(`ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS no_deal INTEGER DEFAULT 0;`);
        await client.query(`ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS client_seconds INTEGER DEFAULT 0;`);


        await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name TEXT,
            color TEXT,
            permissions TEXT
            -- Roles remain GLOBAL for now
        );
    `);

        await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT,
            date TEXT,
            priority TEXT,
            status TEXT,
            assigned_to TEXT,
            description TEXT,
            recurring BOOLEAN DEFAULT FALSE,
            recurring_frequency TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            store_id TEXT DEFAULT 'store_1'
        );
    `);
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            task_id INTEGER,
            user_id INTEGER,
            text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            store_id TEXT DEFAULT 'store_1'
        );
    `);
        await client.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);

        await client.query(`
        CREATE TABLE IF NOT EXISTS no_deal_details (

            id SERIAL PRIMARY KEY,
            date TEXT,
            employee_id INTEGER,
            reason TEXT,
            brand TEXT,
            model TEXT,
            price_asked TEXT,
            price_offered TEXT,
            price_sale TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            store_id TEXT DEFAULT 'store_1'
        );
    `);
        await client.query(`ALTER TABLE no_deal_details ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT 'store_1';`);
        // --- CRITICAL MIGRATION: Fix Unique Constraint for Multi-Store ---
        try {
            // 1. Drop the old global unique constraint if it exists
            await client.query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_username_key`);

            // 2. Add new composite unique constraint via Index
            await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS employees_username_store_key ON employees (username, store_id)`);
        } catch (e) {
            console.log("Migration Note: " + e.message);
        }

        // Ensure 'admin' user exists for BOTH stores (Emergency Access)
        const stores = ['store_1', 'store_2'];
        for (const storeId of stores) {
            const checkAdmin = await client.query('SELECT id FROM employees WHERE username = $1 AND store_id = $2', ['admin', storeId]);
            if (checkAdmin.rows.length === 0) {
                console.log(`Creating default admin for ${storeId}...`);
                await client.query(`
                    INSERT INTO employees (
                        first_name, last_name, alias, email, role, contract_hours, contract_type, 
                        username, password, is_buyer, phone, address, avatar, store_id, "order"
                    ) VALUES (
                        'Admin', 'Sistema', 'ADMIN', 'admin@tiktak.com', 'Gerente', 40, 'Indefinido',
                        'admin', 'admin', true, '000000000', 'Sistema', 'A', $1, 0
                    )
                `, [storeId]);
            }
        }

        // 5. Store Settings (Gold Price, etc.)
        await client.query(`
        CREATE TABLE IF NOT EXISTS store_settings (
            store_id TEXT PRIMARY KEY,
            gold_price NUMERIC DEFAULT 77.00,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

        // Ensure default settings exist for known stores
        for (const storeId of stores) {
            await client.query(`
            INSERT INTO store_settings (store_id, gold_price) VALUES ($1, 77.00)
            ON CONFLICT (store_id) DO NOTHING
        `, [storeId]);
        }

        console.log("Database tables initialized (PostgreSQL)");
    } catch (err) {
        console.error("Error initializing DB:", err);
    } finally {
        client.release();
    }
}
