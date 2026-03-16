import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// 2. Store Settings (Gold Price)
router.get('/gold', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT gold_price FROM store_settings WHERE store_id = $1', [storeId]);
        if (result.rows.length > 0) {
            res.json({ price: result.rows[0].gold_price });
        } else {
            res.json({ price: 77.00 }); // Default fallback
        }
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/gold', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { price } = req.body;

    if (!price || isNaN(price)) {
        return res.status(400).json({ error: 'Invalid price' });
    }

    try {
        await pool.query(
            'INSERT INTO store_settings (store_id, gold_price) VALUES ($1, $2) ON CONFLICT (store_id) DO UPDATE SET gold_price = $2, updated_at = CURRENT_TIMESTAMP',
            [storeId, price]
        );
        res.json({ success: true, price });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// Closing Hours Settings
// General Store Settings (Closing Hours + Announcement)
router.get('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT midday_close, night_close, announcement FROM store_settings WHERE store_id = $1', [storeId]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.json({ midday_close: '', night_close: '', announcement: '' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { midday_close, night_close, announcement } = req.body;
    try {
        await pool.query(
            `INSERT INTO store_settings (store_id, midday_close, night_close, announcement) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (store_id) 
             DO UPDATE SET midday_close = $2, night_close = $3, announcement = $4, updated_at = CURRENT_TIMESTAMP`,
            [storeId, midday_close, night_close, announcement]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
