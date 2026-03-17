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
            'INSERT INTO goldsmith_partners (name, contact_info, phone, email, store_id, debt_grams, debt_type, debt_formula) VALUES ($1, $2, $3, $4, $5, 0, $6, $7) RETURNING *',
            [name, contact_info, phone, email, storeId, req.body.debt_type || '18k', req.body.debt_formula || '']
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
            'UPDATE goldsmith_partners SET name=$1, contact_info=$2, phone=$3, email=$4, debt_type=$5, debt_formula=$6 WHERE id=$7 RETURNING *',
            [name, contact_info, phone, email, req.body.debt_type, req.body.debt_formula, id]
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

// --- GOLDSMITH INVENTORY (Agrupaciones) ---
router.get('/goldsmith/inventory', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM goldsmith_inventory WHERE store_id = $1 ORDER BY id ASC', [storeId]);
        res.json(result.rows);
    } catch (err) {
        logError(err, 'GET /goldsmith/inventory');
        res.status(500).json({ error: err.message });
    }
});

router.put('/goldsmith/inventory/threshold', async (req, res) => {
    const { category, threshold } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query('UPDATE goldsmith_inventory SET restock_threshold = $1 WHERE category = $2 AND store_id = $3', [threshold, category, storeId]);
        res.json({ success: true });
    } catch (err) {
        logError(err, 'PUT /goldsmith/inventory/threshold');
        res.status(500).json({ error: err.message });
    }
});

router.put('/goldsmith/inventory/adjust', async (req, res) => {
    const { mode, category, targetCategory, weight, cost } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        if (mode === 'direct') {
            await client.query(
                'UPDATE goldsmith_inventory SET total_weight = $1, total_cost = $2 WHERE category = $3 AND store_id = $4',
                [weight, cost, category, storeId]
            );
        } else if (mode === 'transfer') {
            // Get source stats to calculate proportional cost
            const sourceRes = await client.query('SELECT total_weight, total_cost FROM goldsmith_inventory WHERE category = $1 AND store_id = $2', [category, storeId]);
            const source = sourceRes.rows[0];
            
            if (!source || Number(source.total_weight) < Number(weight)) {
                throw new Error('Stock insuficiente para la transferencia.');
            }

            const avgCost = Number(source.total_weight) > 0 ? Number(source.total_cost) / Number(source.total_weight) : 0;
            const costToTransfer = Number(weight) * avgCost;

            // Deduct from source
            await client.query(
                'UPDATE goldsmith_inventory SET total_weight = total_weight - $1, total_cost = total_cost - $2 WHERE category = $3 AND store_id = $4',
                [weight, costToTransfer, category, storeId]
            );

            // Add to target
            await client.query(
                'UPDATE goldsmith_inventory SET total_weight = total_weight + $1, total_cost = total_cost + $2 WHERE category = $3 AND store_id = $4',
                [weight, costToTransfer, targetCategory, storeId]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, 'PUT /goldsmith/inventory/adjust');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- GOLDSMITH ORDERS ---
router.get('/goldsmith/orders', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(`
            SELECT o.*, p.name as partner_name 
            FROM goldsmith_orders o 
            JOIN goldsmith_partners p ON o.partner_id = p.id 
            WHERE o.store_id = $1 
            ORDER BY o.created_at DESC`, [storeId]);
        res.json(result.rows);
    } catch (err) {
        logError(err, 'GET /goldsmith/orders');
        res.status(500).json({ error: err.message });
    }
});

router.post('/goldsmith/orders', async (req, res) => {
    const { partner_id, category, est_weight, order_date } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `INSERT INTO goldsmith_orders (partner_id, category, est_weight, order_date, store_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [partner_id, category, est_weight, order_date, storeId]
        );

        const partnerRes = await client.query('SELECT name FROM goldsmith_partners WHERE id = $1', [partner_id]);
        const partnerName = partnerRes.rows[0]?.name || 'Socio';

        // Automatic Task
        await client.query(
            `INSERT INTO tasks (title, date, priority, status, description, category, store_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [`Esperando pedido de ${partnerName}`, order_date, 'Media', 'Pendiente', `Pedido de ${est_weight}g de ${category}.`, 'Joyería / Finanzas', storeId]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, 'POST /goldsmith/orders');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.put('/goldsmith/orders/:id/receive', async (req, res) => {
    const { id } = req.params;
    const { real_weight, total_cost, receive_date } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const orderRes = await client.query('SELECT * FROM goldsmith_orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) throw new Error('Pedido no encontrado.');
        const order = orderRes.rows[0];

        // Update Order
        await client.query(
            `UPDATE goldsmith_orders SET real_weight = $1, total_cost = $2, receive_date = $3, status = 'Recibido' 
             WHERE id = $4`,
            [real_weight, total_cost, receive_date, id]
        );

        // Update Inventory
        await client.query(
            `UPDATE goldsmith_inventory SET total_weight = total_weight + $1, total_cost = total_cost + $2 
             WHERE category = $3 AND store_id = $4`,
            [real_weight, total_cost, order.category, order.store_id]
        );

        // Update Partner Debt
        await client.query(
            `UPDATE goldsmith_partners SET debt_grams = debt_grams + $1 WHERE id = $2`,
            [real_weight, order.partner_id]
        );

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, 'PUT /goldsmith/orders/:id/receive');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
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
            karats_data, status, is_debt_adjustment, debt_added,
            notes, image_url, inventory_category
        } = req.body;
        const storeId = req.headers['x-store-id'] || 'store_1';

        if (!partner_id || isNaN(parseInt(partner_id))) {
            throw new Error('Debe seleccionar un joyero/socio válido.');
        }

        const result = await client.query(
            `INSERT INTO goldsmith_movements (
                partner_id, type, weight, cost, date, store_id,
                acquisition_cost, refining_percentage, received_amount,
                karats_data, status, is_debt_adjustment,
                notes, image_url, inventory_category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [
                partner_id, type, weight || 0, (type === 'Fundición' ? cost : cost) || 0, date, storeId,
                (type === 'Fundición' ? cost : acquisition_cost) || 0, refining_percentage || 0, received_amount || 0,
                JSON.stringify(karats_data || []), status || 'Completado', !!is_debt_adjustment,
                notes || '', image_url || '', inventory_category || null
            ]
        );

        // Inventory Logic
        if (inventory_category) {
            if (type === 'Recepción') {
                // If it's a purchase, add to stock. 
                // We use 'cost' as the acquisition cost for the inventory.
                await client.query(
                    `UPDATE goldsmith_inventory SET total_weight = total_weight + $1, total_cost = total_cost + $2 
                     WHERE category = $3 AND store_id = $4`,
                    [weight, cost, inventory_category, storeId]
                );
            } else if (type === 'Envío' || type === 'Fundición') {
                // Deduct from stock. We also deduct a proportional cost to keep avg accurate.
                // To do this strictly, we'd need the current avg price.
                const invRes = await client.query('SELECT total_weight, total_cost FROM goldsmith_inventory WHERE category = $1 AND store_id = $2', [inventory_category, storeId]);
                const inv = invRes.rows[0];
                if (inv && inv.total_weight > 0) {
                    const avgCost = inv.total_cost / inv.total_weight;
                    const costToDeduct = weight * avgCost;
                    await client.query(
                        `UPDATE goldsmith_inventory SET total_weight = GREATEST(0, total_weight - $1), 
                         total_cost = GREATEST(0, total_cost - $2) 
                         WHERE category = $3 AND store_id = $4`,
                        [weight, costToDeduct, inventory_category, storeId]
                    );
                } else {
                    await client.query(
                        `UPDATE goldsmith_inventory SET total_weight = GREATEST(0, total_weight - $1) 
                         WHERE category = $2 AND store_id = $3`,
                        [weight, inventory_category, storeId]
                    );
                }
            }
        }

        const movementId = result.rows[0].id;

        if (type === 'Recepción' && debt_added > 0) {
            const partnerRes = await client.query('SELECT name FROM goldsmith_partners WHERE id = $1', [partner_id]);
            const partnerName = partnerRes.rows[0]?.name || 'Socio';
            
            await client.query('UPDATE goldsmith_partners SET debt_grams = debt_grams + $1 WHERE id = $2', [debt_added, partner_id]);
            
            // Automatic Task Creation
            await client.query(
                `INSERT INTO tasks (
                    title, date, priority, status, description, category, ref_id, store_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    `Liquidación de deuda: ${partnerName}`,
                    date,
                    'Alta',
                    'Pendiente',
                    `Deuda generada por recepción de oro (${debt_added}g).`,
                    'Joyería / Finanzas',
                    `jewelry_${movementId}`,
                    storeId
                ]
            );
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
        // Increase limit to 1000 to cover full year of daily records
        const result = await pool.query('SELECT * FROM cash_control_logs WHERE store_id = $1 ORDER BY date DESC, created_at DESC LIMIT 1000', [storeId]);
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
