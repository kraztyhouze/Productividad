import express from 'express';
import { pool } from '../db.js';
import fs from 'fs';

const router = express.Router();

function logError(err, route) {
    const msg = `[${new Date().toISOString()}] ERROR in ${route}: ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync('server_error_log.txt', msg);
    console.error(msg);
}

// GET all batteries with items
router.get('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const batteries = await pool.query(
            'SELECT * FROM task_batteries WHERE store_id = $1 ORDER BY start_date ASC',
            [storeId]
        );
        
        // Fetch items for each battery
        const enrichedBatteries = await Promise.all(batteries.rows.map(async (b) => {
            const items = await pool.query(
                'SELECT * FROM battery_items WHERE battery_id = $1 ORDER BY id ASC',
                [b.id]
            );
            return { ...b, items: items.rows };
        }));
        
        res.json(enrichedBatteries);
    } catch (err) {
        logError(err, 'GET /api/task-batteries');
        res.status(500).json({ error: err.message });
    }
});

// POST create a new battery with items
router.post('/', async (req, res) => {
    const { title, start_date, end_date, items } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const batteryRes = await client.query(
            'INSERT INTO task_batteries (title, start_date, end_date, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, start_date, end_date, storeId]
        );
        
        const batteryId = batteryRes.rows[0].id;
        
        if (Array.isArray(items) && items.length > 0) {
            for (const itemDesc of items) {
                await client.query(
                    'INSERT INTO battery_items (battery_id, description) VALUES ($1, $2)',
                    [batteryId, itemDesc]
                );
            }
        }
        
        await client.query('COMMIT');
        
        // Return full battery with items
        const finalItems = await client.query('SELECT * FROM battery_items WHERE battery_id = $1', [batteryId]);
        res.json({ ...batteryRes.rows[0], items: finalItems.rows });
        
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, 'POST /api/task-batteries');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PUT update battery status (toggle item)
router.put('/items/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { is_done, completed_by } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE battery_items SET is_done = $1, completed_by = $2, completed_at = $3 WHERE id = $4 RETURNING *',
            [is_done, completed_by, is_done ? new Date() : null, itemId]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(result.rows[0]);
        
    } catch (err) {
        logError(err, `PUT /api/task-batteries/items/${itemId}`);
        res.status(500).json({ error: err.message });
    }
});

// PUT update battery metadata and sync items
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, start_date, end_date, items } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            'UPDATE task_batteries SET title = $1, start_date = $2, end_date = $3 WHERE id = $4',
            [title, start_date, end_date, id]
        );
        
        if (Array.isArray(items)) {
            // Simple sync: get existing items
            const existingRes = await client.query('SELECT description FROM battery_items WHERE battery_id = $1', [id]);
            const existingDescs = existingRes.rows.map(r => r.description);
            
            // Add new ones
            for (const itemDesc of items) {
                if (!existingDescs.includes(itemDesc)) {
                    await client.query(
                        'INSERT INTO battery_items (battery_id, description) VALUES ($1, $2)',
                        [id, itemDesc]
                    );
                }
            }
            
            // Delete removed ones (only if they are NOT done, to preserve history)
            // Or better, just delete if not in the new list and let the user decide.
            // Requirement says "añadir y/o modificar tareas", so we'll delete those not in list.
            for (const oldDesc of existingDescs) {
                if (!items.includes(oldDesc)) {
                    await client.query(
                        'DELETE FROM battery_items WHERE battery_id = $1 AND description = $2 AND is_done = false',
                        [id, oldDesc]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, `PUT /api/task-batteries/${id}`);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST add item to existing battery
router.post('/:id/items', async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO battery_items (battery_id, description) VALUES ($1, $2) RETURNING *',
            [id, description]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, `POST /api/task-batteries/${id}/items`);
        res.status(500).json({ error: err.message });
    }
});

// DELETE item from battery
router.delete('/items/:itemId', async (req, res) => {
    const { itemId } = req.params;
    try {
        await pool.query('DELETE FROM battery_items WHERE id = $1', [itemId]);
        res.json({ success: true });
    } catch (err) {
        logError(err, `DELETE /api/task-batteries/items/${itemId}`);
        res.status(500).json({ error: err.message });
    }
});

// DELETE battery
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM task_batteries WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        logError(err, `DELETE /api/task-batteries/${id}`);
        res.status(500).json({ error: err.message });
    }
});

export default router;
