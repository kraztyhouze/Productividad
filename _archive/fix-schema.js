
import 'dotenv/config';
import { pool } from './db.js';

async function fixSchema() {
    console.log("--- SCHEMA REPAIR ---");
    const client = await pool.connect();
    try {
        console.log("Checking 'daily_groups' columns...");

        await client.query("ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS no_deal INTEGER DEFAULT 0;");
        console.log("✅ verified: no_deal");

        await client.query("ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS client_seconds INTEGER DEFAULT 0;");
        console.log("✅ verified: client_seconds");

        await client.query("ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS standard INTEGER DEFAULT 0;");
        await client.query("ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS jewelry INTEGER DEFAULT 0;");
        await client.query("ALTER TABLE daily_groups ADD COLUMN IF NOT EXISTS recoverable INTEGER DEFAULT 0;");

        console.log("--- SCHEMA OK ---");

    } catch (e) {
        console.error("SCHEMA ERROR:", e.message);
    } finally {
        client.release();
        process.exit();
    }
}
fixSchema();
