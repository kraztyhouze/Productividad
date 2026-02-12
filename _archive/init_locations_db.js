import 'dotenv/config';
import { pool } from './db.js';

export async function initLocations() {
    const client = await pool.connect();
    try {
        console.log('Initializing Locations DB...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS locations (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT CHECK (status IN ('libre', 'parcial', 'lleno')) DEFAULT 'libre',
                zone TEXT,
                store_id TEXT DEFAULT 'store_1'
            );
        `);

        // Check if empty, separate check for each store if we want, but for now global/default
        const res = await client.query('SELECT COUNT(*) FROM locations');
        if (parseInt(res.rows[0].count) === 0) {
            console.log('Seeding locations...');
            const seeds = [];
            // Generate A1-A5 (Estantería)
            for (let i = 1; i <= 5; i++) {
                seeds.push(`('Estantería A${i}', 'libre', 'Almacén A', 'store_1')`);
            }
            // Generate B1-B5 (Cajón)
            for (let i = 1; i <= 5; i++) {
                const status = Math.random() > 0.6 ? 'parcial' : (Math.random() > 0.8 ? 'lleno' : 'libre');
                seeds.push(`('Cajón B${i}', '${status}', 'Almacén B', 'store_1')`);
            }

            await client.query(`
                INSERT INTO locations (name, status, zone, store_id)
                VALUES ${seeds.join(', ')}
            `);
            console.log('Seeded 10 locations.');
        } else {
            console.log('Locations table already has data.');
        }

    } catch (err) {
        console.error('Error initializing Locations:', err);
    } finally {
        client.release();
    }
}

// Self-run if called directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    initLocations().then(() => process.exit(0));
}
