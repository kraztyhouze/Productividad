import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'task_batteries'
        `);
        console.log('Columns in task_batteries:');
        console.log(res.rows);
        
        const orphans = await pool.query('SELECT id, title, zone_id FROM task_batteries WHERE zone_id IS NULL');
        console.log('Orphan batteries (zone_id is NULL):');
        console.log(orphans.rows);

        const zones = await pool.query('SELECT id, name FROM store_zones');
        console.log('Available zones:');
        console.log(zones.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkSchema();
