/**
 * operational.js
 * Groups smaller, self-contained endpoints that don't justify their own file:
 * - Day Incidents
 * - No-Deals
 * - Locations
 * - Market Search (link aggregator)
 * - Diagnostics
 * - Security / IMEI check
 */
import express from 'express';
import { pool } from '../db.js';
import { recalculateGamification } from './helpers/gamification.js';

const router = express.Router();

// ─── DAY INCIDENTS ────────────────────────────────────────────────────────────
router.get('/day-incidents', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM day_incidents WHERE store_id = $1', [storeId]);
        const map = {};
        result.rows.forEach(r => map[r.date] = r.text);
        res.json(map);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/day-incidents', async (req, res) => {
    const { date, text } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const check = await pool.query('SELECT date FROM day_incidents WHERE date=$1 AND store_id=$2', [date, storeId]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE day_incidents SET text=$1 WHERE date=$2 AND store_id=$3', [text, date, storeId]);
        } else {
            await pool.query('INSERT INTO day_incidents (date, text, store_id) VALUES ($1, $2, $3)', [date, text, storeId]);
        }
        res.json({ message: 'Incident saved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── NO-DEALS ─────────────────────────────────────────────────────────────────
router.get('/no-deals', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const { start, end } = req.query;
        let query = 'SELECT * FROM no_deal_details WHERE store_id = $1';
        const params = [storeId];
        if (start && end) {
            query += ' AND date >= $2 AND date <= $3';
            params.push(start, end);
        }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/no-deals', async (req, res) => {
    const { date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes, type, customer_name, customer_phone, grams, price_per_gram } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO no_deal_details (date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes, store_id, type, customer_name, customer_phone, grams, price_per_gram) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
            [date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes, storeId, type, customer_name, customer_phone, grams, price_per_gram]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/no-deals/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT date, employee_id FROM no_deal_details WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
        await pool.query('DELETE FROM no_deal_details WHERE id = $1', [id]);
        const { date, employee_id } = check.rows[0];
        const key = `${employee_id}-${date}`;
        await pool.query('UPDATE daily_groups SET no_deal = GREATEST(0, no_deal - 1) WHERE key = $1', [key]);
        await recalculateGamification(employee_id);
        res.json({ message: 'Deleted and stats updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── LOCATIONS ────────────────────────────────────────────────────────────────
router.get('/locations', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM locations WHERE store_id = $1 ORDER BY name ASC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/locations', async (req, res) => {
    const { prefix, count, zone } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const created = [];
        for (let i = 1; i <= (parseInt(count) || 1); i++) {
            const name = (parseInt(count) || 1) > 1 ? `${prefix}${i}` : prefix;
            const r = await pool.query(
                'INSERT INTO locations (name, status, zone, store_id) VALUES ($1,$2,$3,$4) RETURNING *',
                [name, 'libre', zone || 'General', storeId]
            );
            created.push(r.rows[0]);
        }
        res.json(created);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/locations/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const r = await pool.query('UPDATE locations SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/locations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM locations WHERE id = $1', [id]);
        res.json({ message: 'Location deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── MARKET SEARCH (link aggregator) ─────────────────────────────────────────
router.get('/market/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const encodedQ = encodeURIComponent(q);
    const results = [
        { id: 'amazon', store: 'Amazon', storeCode: 'AM', color: 'amber', price: 'Ver Nuevo', condition: 'Nuevo (Ref. Techo)', url: `https://www.amazon.es/s?k=${encodedQ}`, context: 'Referencia PVP Nuevo', found: true },
        { id: 'ebay_sold', store: 'eBay (Vendidos)', storeCode: 'EB', color: 'blue', price: 'Ver Vendidos', condition: 'Realmente Vendidos', url: `https://www.ebay.es/sch/i.html?_nkw=${encodedQ}&LH_Sold=1&LH_Complete=1&LH_ItemCondition=3000`, context: 'Precio Real Mercado', found: true },
        { id: 'wallapop', store: 'Wallapop', storeCode: 'W', color: 'teal', price: 'Ver Calle', condition: 'Segunda Mano', url: `https://es.wallapop.com/app/search?keywords=${encodedQ}`, context: 'Competencia Directa', found: true },
        { id: 'backmarket', store: 'Back Market', storeCode: 'BM', color: 'slate', price: 'Ver Reacond.', condition: 'Reacondicionado', url: `https://www.backmarket.es/es-es/search?q=${encodedQ}`, context: 'Ref. Reacondicionado', found: true },
        { id: 'cex', store: 'CeX', storeCode: 'CeX', color: 'red', price: 'Ver Web', condition: 'Usado', url: `https://es.webuy.com/search?stext=${encodedQ}`, context: 'Precio Venta Tienda', found: true },
        { id: 'cash', store: 'Cash Converters', storeCode: 'CC', color: 'green', price: 'Ver Web', condition: 'Usado', url: `https://www.cashconverters.es/es/es/search/?q=${encodedQ}`, context: 'Precio Venta Tienda', found: true }
    ];
    res.json(results);
});

// ─── SECURITY / IMEI ──────────────────────────────────────────────────────────
router.post('/security/check-imei', (req, res) => res.json({ status: 'CLEAN', message: 'IMEI Limpio' }));

// ─── DIAGNOSTICS ──────────────────────────────────────────────────────────────
const diagnosticSessions = {};

router.post('/diagnostics/init', (req, res) => {
    const { type } = req.body;
    const sessionId = Date.now().toString(36).substr(-4) + Math.random().toString(36).substring(2, 6);
    const url = type === 'mobile' ? `/mobile-test/${sessionId}` : `/laptop-test/${sessionId}`;
    diagnosticSessions[sessionId] = { status: 'waiting', results: [], deviceInfo: null };
    res.json({ sessionId, url });
});

router.get('/diagnostics/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = diagnosticSessions[sessionId];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
});

router.post('/diagnostics/update/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (!diagnosticSessions[sessionId]) {
        diagnosticSessions[sessionId] = { status: 'running', results: [], deviceInfo: null };
    }
    const session = diagnosticSessions[sessionId];
    const { status, results, deviceInfo } = req.body;
    if (status) session.status = status;
    if (results) session.results = results;
    if (deviceInfo) session.deviceInfo = deviceInfo;
    res.json({ success: true });
});

router.post('/diagnostics/remote/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (!diagnosticSessions[sessionId]) {
        diagnosticSessions[sessionId] = { status: 'running', results: [], deviceInfo: null };
    }
    const session = diagnosticSessions[sessionId];
    const { test, status, details } = req.body;
    const existingIndex = session.results.findIndex(r => r.name === test);
    const passed = status === 'PASS';
    if (existingIndex !== -1) {
        session.results[existingIndex] = { name: test, passed, details };
    } else {
        session.results.push({ name: test, passed, details });
    }
    res.json({ success: true });
});

router.get('/gold-prices', (req, res) => {
    res.json({
        andorrano: "78.45",
        quickgold: "77.90",
        timestamp: new Date().toISOString()
    });
});

export default router;
