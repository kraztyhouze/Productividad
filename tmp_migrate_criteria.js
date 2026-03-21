import { pool } from './server/db.js';

async function migrate() {
    try {
        await pool.query('ALTER TABLE evaluation_criteria ADD COLUMN IF NOT EXISTS store_id VARCHAR(50) DEFAULT \'store_1\'');
        console.log('Migration successful: evaluation_criteria now has store_id');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
