import pg from 'pg';

const { Pool } = pg;

// Use DATABASE_URL from environment (Railway provides this)
// Fallback to a local connection string if needed (for dev)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/productivity';

const pool = new Pool({
  connectionString,
  // SSL is required for Railway deployments, but we need to disable it for local dev if not set up
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

export const query = (text, params) => pool.query(text, params);

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS active_sessions (
            employee_id TEXT PRIMARY KEY,
            employee_name TEXT,
            start_time TEXT
        );

        CREATE TABLE IF NOT EXISTS daily_records (
            id BIGINT PRIMARY KEY,
            employee_id TEXT,
            employee_name TEXT,
            start_time TEXT,
            end_time TEXT,
            duration_seconds REAL,
            date TEXT,
            groups_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS daily_groups (
            key TEXT PRIMARY KEY,
            standard INTEGER DEFAULT 0,
            jewelry INTEGER DEFAULT 0,
            recoverable INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS closed_days (
            date TEXT PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS day_incidents (
            date TEXT PRIMARY KEY,
            text TEXT
        );
    `);
    console.log("Database tables initialized (PostgreSQL)");
  } catch (err) {
    console.error("Error initializing DB:", err);
  } finally {
    client.release();
  }
}
