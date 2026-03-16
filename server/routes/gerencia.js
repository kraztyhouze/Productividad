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
    const { name, contact_info, phone, email } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO goldsmith_partners (name, contact_info, phone, email, store_id, debt_grams) VALUES ($1, $2, $3, $4, $5, 0) RETURNING *',
            [name, contact_info, phone, email, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        logError(err, 'POST /goldsmith/partners');
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

router.put('/goldsmith/partners/:id', async (req, res) => {
    const { id } = req.params;
    const { name, contact_info, phone, email } = req.body;
    try {
        const result = await pool.query(
            'UPDATE goldsmith_partners SET name=$1, contact_info=$2, phone=$3, email=$4 WHERE id=$5 RETURNING *',
            [name, contact_info, phone, email, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'PUT /goldsmith/partners');
        res.status(500).json({ error: err.message });
    }
});

router.delete('/goldsmith/partners/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM goldsmith_partners WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (err) {
        logError(err, 'DELETE /goldsmith/partners');
        res.status(500).json({ error: err.message });
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
                partner_id, type, weight || 0, (type === 'Fundición' ? cost : cost) || 0, date, storeId,
                (type === 'Fundición' ? cost : acquisition_cost) || 0, refining_percentage || 0, received_amount || 0,
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

router.delete('/goldsmith/movements/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Get movement details before deleting
        const movRes = await client.query('SELECT * FROM goldsmith_movements WHERE id=$1', [id]);
        if (movRes.rows.length === 0) throw new Error('Movimiento no encontrado.');
        
        const movement = movRes.rows[0];
        
        // If it was a debt adjustment, we reverse it
        if (movement.is_debt_adjustment && movement.weight > 0) {
            await client.query('UPDATE goldsmith_partners SET debt_grams = debt_grams + $1 WHERE id = $2', [movement.weight, movement.partner_id]);
        }

        await client.query('DELETE FROM goldsmith_movements WHERE id=$1', [id]);
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, 'DELETE /goldsmith/movements');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
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
    const { 
        date, denominations, others, observations, total, 
        is_closed, closed_at, closed_by, 
        expected_total, responsible_1, responsible_2 
    } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const check = await pool.query('SELECT id FROM cash_control_logs WHERE date = $1 AND store_id = $2 AND is_closed = false', [date, storeId]);
        
        const query = check.rows.length > 0
            ? `UPDATE cash_control_logs SET 
                denominations=$1, others=$2, observations=$3, total=$4, is_closed=$5, 
                closed_at=$6, closed_by=$7, expected_total=$8, responsible_1=$9, responsible_2=$10 
                WHERE id=$11 RETURNING *`
            : `INSERT INTO cash_control_logs (
                denominations, others, observations, total, is_closed, 
                closed_at, closed_by, expected_total, responsible_1, responsible_2, date, store_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;

        const params = [
            JSON.stringify(denominations || {}), 
            JSON.stringify(others || {}), 
            observations || '', 
            total || 0, 
            !!is_closed, 
            closed_at || null, 
            closed_by || null,
            expected_total || 0,
            responsible_1 || null,
            responsible_2 || null,
            check.rows.length > 0 ? check.rows[0].id : date,
            check.rows.length > 0 ? undefined : storeId
        ];

        // If insert, last param should be store_id. If update, last param should be id.
        // Simplified query handling for clarity:
        let result;
        if (check.rows.length > 0) {
            result = await pool.query(
                `UPDATE cash_control_logs SET 
                denominations=$1, others=$2, observations=$3, total=$4, is_closed=$5, 
                closed_at=$6, closed_by=$7, expected_total=$8, responsible_1=$9, responsible_2=$10 
                WHERE id=$11 RETURNING *`,
                [
                    JSON.stringify(denominations || {}), JSON.stringify(others || {}), 
                    observations || '', total || 0, !!is_closed, closed_at || null, closed_by || null,
                    expected_total || 0, responsible_1 || null, responsible_2 || null, check.rows[0].id
                ]
            );
        } else {
            result = await pool.query(
                `INSERT INTO cash_control_logs (
                date, denominations, others, observations, total, is_closed, 
                closed_at, closed_by, expected_total, responsible_1, responsible_2, store_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [
                    date, JSON.stringify(denominations || {}), JSON.stringify(others || {}), 
                    observations || '', total || 0, !!is_closed, closed_at || null, closed_by || null,
                    expected_total || 0, responsible_1 || null, responsible_2 || null, storeId
                ]
            );
        }
        res.json(result.rows[0]);
    } catch (err) { 
        logError(err, 'POST /cash-control');
        res.status(500).json({ error: err.message });
    }
});

export default router;
