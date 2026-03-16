import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const initDb = async () => {
    const client = await pool.connect();
    try {
        console.log("Initializing database tables...");
        
        // Employees & Auth
        await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                first_name TEXT,
                last_name TEXT,
                role TEXT DEFAULT 'Empleado',
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        // Productivity Sessions
        await client.query(`
            CREATE TABLE IF NOT EXISTS active_sessions (
                id SERIAL PRIMARY KEY,
                employee_id TEXT REFERENCES employees(id),
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS daily_records (
                id SERIAL PRIMARY KEY,
                employee_id TEXT REFERENCES employees(id),
                date TEXT,
                store_id TEXT DEFAULT 'store_1',
                total_purchases INTEGER DEFAULT 0,
                total_earnings NUMERIC DEFAULT 0,
                total_hours NUMERIC DEFAULT 0,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tasks & Agenda
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title TEXT,
                date TEXT,
                priority TEXT DEFAULT 'Media',
                status TEXT DEFAULT 'Pendiente',
                assigned_to TEXT,
                description TEXT,
                recurring BOOLEAN DEFAULT FALSE,
                periodicity TEXT DEFAULT 'Manual',
                recurring_days JSONB DEFAULT '[]',
                recurring_month_day INTEGER,
                last_done_date TEXT,
                start_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        // Comments
        await client.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                user_id TEXT,
                text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        // Goldsmith / Joyería
        await client.query(`
            CREATE TABLE IF NOT EXISTS goldsmith_partners (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                contact_info TEXT,
                phone TEXT,
                email TEXT,
                debt_grams NUMERIC DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS goldsmith_movements (
                id SERIAL PRIMARY KEY,
                partner_id INTEGER REFERENCES goldsmith_partners(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                weight NUMERIC DEFAULT 0,
                cost NUMERIC DEFAULT 0,
                date TEXT NOT NULL,
                acquisition_cost NUMERIC DEFAULT 0,
                refining_percentage NUMERIC DEFAULT 0,
                received_amount NUMERIC DEFAULT 0,
                karats_data JSONB DEFAULT '[]',
                status TEXT DEFAULT 'Completado',
                is_debt_adjustment BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        // Cash Control / Fondos
        await client.query(`
            CREATE TABLE IF NOT EXISTS cash_control_logs (
                id SERIAL PRIMARY KEY,
                date TEXT NOT NULL,
                denominations JSONB DEFAULT '{}', 
                others JSONB DEFAULT '{}', 
                observations TEXT,
                total NUMERIC DEFAULT 0,
                is_closed BOOLEAN DEFAULT FALSE,
                closed_at TIMESTAMP,
                closed_by TEXT, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        // Task Batteries (New)
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_batteries (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                store_id TEXT DEFAULT 'store_1',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS battery_items (
                id SERIAL PRIMARY KEY,
                battery_id INTEGER REFERENCES task_batteries(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                is_done BOOLEAN DEFAULT FALSE,
                completed_by TEXT,
                completed_at TIMESTAMP
            );
        `);

        // Migrations / Alters (Safe to run multiple times)
        const alters = [
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_days JSONB DEFAULT '[]';",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_month_day INTEGER;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_interval INTEGER DEFAULT 1;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_end_date TEXT;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_type TEXT DEFAULT 'simple';",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS periodicity TEXT DEFAULT 'Manual';",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendiente';",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE goldsmith_movements ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "ALTER TABLE goldsmith_movements ADD COLUMN IF NOT EXISTS karats_data JSONB DEFAULT '[]';",
            "ALTER TABLE goldsmith_movements ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC DEFAULT 0;",
            "ALTER TABLE goldsmith_movements ADD COLUMN IF NOT EXISTS refining_percentage NUMERIC DEFAULT 0;",
            "ALTER TABLE goldsmith_movements ADD COLUMN IF NOT EXISTS received_amount NUMERIC DEFAULT 0;",
            "ALTER TABLE goldsmith_movements ADD COLUMN IF NOT EXISTS is_debt_adjustment BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE cash_control_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "ALTER TABLE goldsmith_partners ADD COLUMN IF NOT EXISTS phone TEXT;",
            "ALTER TABLE goldsmith_partners ADD COLUMN IF NOT EXISTS email TEXT;",
            "ALTER TABLE employees ADD COLUMN IF NOT EXISTS can_count_cash BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE cash_control_logs ADD COLUMN IF NOT EXISTS expected_total NUMERIC DEFAULT 0;",
            "ALTER TABLE cash_control_logs ADD COLUMN IF NOT EXISTS responsible_1 TEXT;",
            "ALTER TABLE cash_control_logs ADD COLUMN IF NOT EXISTS responsible_2 TEXT;",
            "ALTER TABLE goldsmith_partners ADD COLUMN IF NOT EXISTS debt_type TEXT DEFAULT '18k';",
            "ALTER TABLE goldsmith_partners ADD COLUMN IF NOT EXISTS debt_formula TEXT;"
        ];
        for (const sql of alters) {
            try { await client.query(sql); } catch (e) { /* ignore already exists */ }
        }

        console.log("Database schema synchronized successfully.");
    } catch (err) {
        console.error("Critical error during DB initialization:", err);
    } finally {
        client.release();
    }
};
