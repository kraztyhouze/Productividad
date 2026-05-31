import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: "postgres://postgres:postgres@localhost:5432/tiktak_db"
});

async function checkOrphanBatteries() {
    try {
        const res = await pool.query('SELECT * FROM task_batteries WHERE zone_id IS NULL');
        console.log('Batteries without zone:', res.rows.length);
        console.log(res.rows);
        
        const zoneRes = await pool.query('SELECT id FROM store_zones');
        const zoneIds = new Set(zoneRes.rows.map(z => String(z.id)));
        
        const allBatteries = await pool.query('SELECT id, zone_id, title FROM task_batteries');
        const orphans = allBatteries.rows.filter(b => b.zone_id && !zoneIds.has(String(b.zone_id)));
        console.log('Batteries with invalid zone:', orphans.length);
        console.log(orphans);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkOrphanBatteries();
