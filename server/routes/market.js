import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// --- API: Market Prices (PVP Consolas y TMX) ---
router.get('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // Order by category (custom order) and id
        const result = await pool.query(`
            SELECT * FROM market_prices 
            WHERE store_id = $1 
            ORDER BY 
                CASE 
                    WHEN category = 'THERMOMIX' THEN 1
                    WHEN category = 'PS5' THEN 2 
                    WHEN category = 'PS4' THEN 3
                    WHEN category = 'SWITCH' THEN 4
                    ELSE 5 
                END, 
                id ASC
        `, [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    const { category, brand, model, price_a, price_b, price_c } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO market_prices (store_id, category, brand, model, price_a, price_b, price_c) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [storeId, category, brand, model, price_a, price_b, price_c]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { category, brand, model, price_a, price_b, price_c } = req.body;
    try {
        const result = await pool.query(
            'UPDATE market_prices SET category=$1, brand=$2, model=$3, price_a=$4, price_b=$5, price_c=$6 WHERE id=$7 RETURNING *',
            [category, brand, model, price_a, price_b, price_c, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM market_prices WHERE id=$1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
