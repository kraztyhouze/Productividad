import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database persistence file
// Points to project root: server/../database.sqlite
const DB_PATH = path.join(__dirname, '../database.sqlite');

let db;

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      employee_id TEXT PRIMARY KEY,
      employee_name TEXT,
      start_time TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_records (
      id REAL PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      start_time TEXT,
      end_time TEXT,
      duration_seconds REAL,
      date TEXT,
      groups_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_groups (
      key TEXT PRIMARY KEY, -- format: "employeeId-date"
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

  return db;
}
