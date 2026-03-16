import express from 'express';
import { pool } from '../db.js';
import fs from 'fs';

const router = express.Router();

function logError(err, route) {
    const msg = `[${new Date().toISOString()}] ERROR in ${route}: ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync('server_error_log.txt', msg);
    console.error(msg);
}

// --- GOLDSMITH PARTNERS ---
router.get('/goldsmith/partners', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM goldsmith_partners WHERE store_id = $1 ORDER BY name ASC', [storeId]);
        res.json(result.rows);
    } catch (err) { 
        logError(err, 'GET /goldsmith/partners');
        res.status(500).json({ error: err.message });
    }
});

router.post('/goldsmith/partners', async (req, res) => {
    const { name, contact_info } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO goldsmith_partners (name, contact_info, store_id, debt_grams) VALUES ($1, $2, $3, 0) RETURNING *',
            [name, contact_info, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        logError(err, 'POST /goldsmith/partners');
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// --- GOLDSMITH MOVEMENTS ---
router.get('/goldsmith/movements', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(`
            SELECT m.*, p.name as partner_name, p.debt_grams as current_partner_debt
            FROM goldsmith_movements m 
            JOIN goldsmith_partners p ON m.partner_id = p.id 
            WHERE m.store_id = $1 
            ORDER BY m.date DESC, m.created_at DESC`, [storeId]);
        res.json(result.rows);
    } catch (err) { 
        logError(err, 'GET /goldsmith/movements');
        res.status(500).json({ error: err.message });
    }
});

router.post('/goldsmith/movements', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { 
            partner_id, type, weight, cost, date, 
            acquisition_cost, refining_percentage, received_amount,
            karats_data, status, is_debt_adjustment, debt_added 
        } = req.body;
        const storeId = req.headers['x-store-id'] || 'store_1';

        if (!partner_id || isNaN(parseInt(partner_id))) {
            throw new Error('Debe seleccionar un joyero/socio válido.');
        }

        const result = await client.query(
            `INSERT INTO goldsmith_movements (
                partner_id, type, weight, cost, date, store_id,
                acquisition_cost, refining_percentage, received_amount,
                karats_data, status, is_debt_adjustment
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                partner_id, type, weight || 0, cost || 0, date, storeId,
                acquisition_cost || 0, refining_percentage || 0, received_amount || 0,
                JSON.stringify(karats_data || []), status || 'Completado', !!is_debt_adjustment
            ]
        );

        if (type === 'Recepción' && debt_added > 0) {
            await client.query('UPDATE goldsmith_partners SET debt_grams = debt_grams + $1 WHERE id = $2', [debt_added, partner_id]);
        }
        if (is_debt_adjustment && weight > 0) {
            await client.query('UPDATE goldsmith_partners SET debt_grams = GREATEST(0, debt_grams - $1) WHERE id = $2', [weight, partner_id]);
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) { 
        await client.query('ROLLBACK');
        logError(err, 'POST /goldsmith/movements');
        res.status(500).json({ error: err.message, stack: err.stack });
    } finally {
        client.release();
    }
});

router.put('/goldsmith/movements/:id', async (req, res) => {
    const { id } = req.params;
    const { status, refining_percentage, received_amount } = req.body;
    try {
        const result = await pool.query(
            'UPDATE goldsmith_movements SET status=$1, refining_percentage=$2, received_amount=$3 WHERE id=$4 RETURNING *',
            [status, refining_percentage, received_amount, id]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        logError(err, 'PUT /goldsmith/movements');
        res.status(500).json({ error: err.message });
    }
});

router.get('/cash-control', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM cash_control_logs WHERE store_id = $1 ORDER BY date DESC, created_at DESC LIMIT 30', [storeId]);
        res.json(result.rows);
    } catch (err) { 
        logError(err, 'GET /cash-control');
        res.status(500).json({ error: err.message });
    }
});

router.post('/cash-control', async (req, res) => {
    const { date, denominations, others, observations, total, is_closed, closed_at, closed_by } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const check = await pool.query('SELECT id FROM cash_control_logs WHERE date = $1 AND store_id = $2 AND is_closed = false', [date, storeId]);
        
        if (check.rows.length > 0) {
            const result = await pool.query(
                'UPDATE cash_control_logs SET denominations=$1, others=$2, observations=$3, total=$4, is_closed=$5, closed_at=$6, closed_by=$7 WHERE id=$8 RETURNING *',
                [
                    JSON.stringify(denominations || {}), 
                    JSON.stringify(others || {}), 
                    observations || '', 
                    total || 0, 
                    !!is_closed, 
                    closed_at || null, 
                    closed_by || null, 
                    check.rows[0].id
                ]
            );
            res.json(result.rows[0]);
        } else {
            const result = await pool.query(
                'INSERT INTO cash_control_logs (date, denominations, others, observations, total, is_closed, closed_at, closed_by, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                [
                    date, 
                    JSON.stringify(denominations || {}), 
                    JSON.stringify(others || {}), 
                    observations || '', 
                    total || 0, 
                    !!is_closed, 
                    closed_at || null, 
                    closed_by || null, 
                    storeId
                ]
            );
            res.json(result.rows[0]);
        }
    } catch (err) { 
        logError(err, 'POST /cash-control');
        res.status(500).json({ error: err.message });
    }
});

export default router;
