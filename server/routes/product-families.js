import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM product_families WHERE store_id = $1 ORDER BY id ASC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    const { name, type, date } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO product_families (name, type, date, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, type, date, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM product_families WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
