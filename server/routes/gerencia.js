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
            'INSERT INTO goldsmith_partners (name, contact_info, phone, email, store_id, debt_grams, debt_type, debt_formula) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, contact_info, phone, email, storeId, req.body.debt_grams || 0, req.body.debt_type || '18k', req.body.debt_formula || '']
        );
        res.json(result.rows[0]);
    } catch (err) { 
        logError(err, 'POST /goldsmith/partners');
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

router.put('/goldsmith/partners/:id', async (req, res) => {
    const { id } = req.params;
    const { name, contact_info, phone, email, debt_grams, debt_type, debt_formula } = req.body;
    try {
        const result = await pool.query(
            'UPDATE goldsmith_partners SET name=$1, contact_info=$2, phone=$3, email=$4, debt_type=$5, debt_formula=$6, debt_grams=$7 WHERE id=$8 RETURNING *',
            [name, contact_info, phone, email, debt_type, debt_formula, debt_grams, id]
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

        // 4. Create Movement Record for History
        await client.query(
            `INSERT INTO goldsmith_movements (
                partner_id, type, weight, cost, date, store_id,
                acquisition_cost, status, notes, inventory_category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                order.partner_id, 
                'Recepción', 
                real_weight, 
                total_cost, 
                receive_date, 
                order.store_id,
                total_cost, 
                'Completado', 
                `Recepción de pedido #${id}: ${order.category}`,
                order.category
            ]
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
    const { status, refining_percentage, received_amount, acquisition_cost } = req.body;
    try {
        const result = await pool.query(
            'UPDATE goldsmith_movements SET status=$1, refining_percentage=$2, received_amount=$3, acquisition_cost=COALESCE($4, acquisition_cost) WHERE id=$5 RETURNING *',
            [status, refining_percentage, received_amount, acquisition_cost, id]
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

// --- ADMINISTRATION: CORRECTION & SYNC ---

// Helper to check MANAGER role (Middleware should ideally handle this in index.js, but adding here as backup)
const isManager = (req, res, next) => {
    const userRole = req.headers['x-user-role']; 
    const allowedRoles = ['Gerente', 'Supervisor', 'Responsable'];
    if (!allowedRoles.includes(userRole)) return res.status(403).json({ error: 'Acceso reservado a Gerencia' });
    next();
};

// Recalculate daily_groups and gamification for a specific employee and date
async function reconcileEmployeeDay(employeeId, date, storeId, client) {
    const empIdTrim = String(employeeId).trim();
    
    // 1. Get all transaction logs for that day/employee
    const logsRes = await client.query(
        "SELECT type FROM transaction_logs WHERE TRIM(employee_id) = $1 AND store_id = $2 AND start_time::text LIKE $3",
        [empIdTrim, storeId, `${date}%`]
    );
    
    const stats = { standard: 0, jewelry: 0, recoverable: 0, noDeal: 0 };
    logsRes.rows.forEach(log => {
        if (log.type === 'standard') stats.standard++;
        else if (log.type === 'jewelry') stats.jewelry++;
        else if (log.type === 'recoverable') stats.recoverable++;
        else if (log.type === 'noDeal') stats.noDeal++;
    });

    // 2. Update daily_groups
    const key = `${empIdTrim}-${date}`;
    await client.query(
        `INSERT INTO daily_groups (key, standard, jewelry, recoverable, no_deal, store_id) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (key) DO UPDATE SET 
         standard = EXCLUDED.standard, jewelry = EXCLUDED.jewelry, 
         recoverable = EXCLUDED.recoverable, no_deal = EXCLUDED.no_deal`,
        [key, stats.standard, stats.jewelry, stats.recoverable, stats.noDeal, storeId]
    );

    // 3. Recalculate Gamification (XP/Level)
    // Note: We'd need to import recalculateGamification here or replicate logic.
    // For now, assume it's triggered manually or via separate helper.
}

router.put('/transactions/:id', isManager, async (req, res) => {
    const { id } = req.params;
    const { type, startTime, endTime } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Find existing record to know employee/date
        const oldRes = await client.query('SELECT employee_id, start_time, store_id FROM transaction_logs WHERE id = $1', [id]);
        if (oldRes.rows.length === 0) throw new Error('Registro no encontrado');
        const old = oldRes.rows[0];
        const date = new Date(old.start_time).toISOString().split('T')[0];

        await client.query(
            'UPDATE transaction_logs SET type=$1, start_time=$2, end_time=$3 WHERE id=$4',
            [type, startTime, endTime, id]
        );

        await reconcileEmployeeDay(old.employee_id, date, old.store_id, client);

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, `PUT /transactions/${id}`);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.delete('/transactions/:id', isManager, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const oldRes = await client.query('SELECT employee_id, start_time, store_id FROM transaction_logs WHERE id = $1', [id]);
        if (oldRes.rows.length === 0) throw new Error('Registro no encontrado');
        const old = oldRes.rows[0];
        const date = new Date(old.start_time).toISOString().split('T')[0];

        await client.query('DELETE FROM transaction_logs WHERE id=$1', [id]);

        await reconcileEmployeeDay(old.employee_id, date, old.store_id, client);

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, `DELETE /transactions/${id}`);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- AUDIT ALERTS ---
router.get('/audit-alerts', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const alerts = [];
        
        // 1. Anomalous transaction durations (e.g. < 20 seconds) - suspicious of manipulation
        const durationAlerts = await pool.query(`
            SELECT t.id, t.employee_id, e.first_name, t.start_time, t.type,
                   (EXTRACT(EPOCH FROM (t.end_time - t.start_time))) as duration
            FROM transaction_logs t
            JOIN employees e ON t.employee_id::int = e.id
            WHERE t.store_id = $1 
              AND t.type IN ('standard', 'jewelry', 'recoverable')
              AND (EXTRACT(EPOCH FROM (t.end_time - t.start_time))) < 25
            ORDER BY t.start_time DESC LIMIT 500
        `, [storeId]);
        
        durationAlerts.rows.forEach(r => alerts.push({
            type: 'suspicious_duration',
            severity: 'high',
            message: `Atención ultra rápida (${Math.round(r.duration)}s) por ${r.first_name}`,
            data: r
        }));

        // 2. Closed days with high discrepancies (if expected_total exists)
        const cashAlerts = await pool.query(`
            SELECT id, date, total, expected_total, closed_at
            FROM cash_control_logs
            WHERE store_id = $1 AND ABS(total - expected_total) > 5
            ORDER BY date DESC LIMIT 10
        `, [storeId]);
        
        cashAlerts.rows.forEach(r => alerts.push({
            type: 'cash_discrepancy',
            severity: 'medium',
            message: `Descuadre de ${Math.round(r.total - r.expected_total)}€ en cierre del ${r.date}`,
            data: r
        }));

        res.json(alerts);
    } catch (err) {
        logError(err, 'GET /audit-alerts');
        res.status(500).json({ error: err.message });
    }
});

// --- ADVANCED CASH CONTROL ---
router.put('/cash-control/:id/approve', isManager, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE cash_control_logs SET is_approved = true WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/cash-control/:id/reopen', isManager, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE cash_control_logs SET is_closed = false, is_approved = false WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STORE ZONES ---
router.get('/store-zones', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(`
            SELECT z.*, e.first_name as responsible_name 
            FROM store_zones z 
            LEFT JOIN employees e ON z.responsible_id = e.id 
            WHERE z.store_id = $1 
            ORDER BY z.name ASC`, [storeId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/store-zones', isManager, async (req, res) => {
    const { name, responsible_id, color, description } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO store_zones (name, store_id, responsible_id, color, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, storeId, responsible_id || null, color || '#1A365D', description || '']
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'POST /store-zones');
        res.status(500).json({ error: err.message });
    }
});

router.put('/store-zones/:id', isManager, async (req, res) => {
    const { id } = req.params;
    const { name, responsible_id, color, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE store_zones SET name=$1, responsible_id=$2, color=$3, description=$4 WHERE id=$5 RETURNING *',
            [name, responsible_id || null, color, description, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'PUT /store-zones');
        res.status(500).json({ error: err.message });
    }
});

router.delete('/store-zones/:id', isManager, async (req, res) => {
    try {
        await pool.query('DELETE FROM store_zones WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- UNIFIED TASKS (Gerencia Logic) ---
router.get('/tasks/unified', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // 1. Get Regular Tasks
        const tasksRes = await pool.query(
            'SELECT * FROM tasks WHERE store_id = $1 ORDER BY date ASC, priority_level DESC',
            [storeId]
        );
        let tasks = tasksRes.rows;

        // 2. Get Pending Jewelry Orders to inject reminders
        const ordersRes = await pool.query(`
            SELECT o.*, p.name as partner_name 
            FROM goldsmith_orders o 
            JOIN goldsmith_partners p ON o.partner_id = p.id 
            WHERE o.store_id = $1 AND o.status = 'Pedido Lanzado'
        `, [storeId]);
        
        const now = new Date();
        ordersRes.rows.forEach(order => {
            const launchDate = new Date(order.order_date);
            const diffTime = Math.abs(now - launchDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 1) {
                // Inject virtual "Reminder" task
                tasks.push({
                    id: `jewelry-reminder-${order.id}`,
                    title: `Pendiente: Pedido a ${order.partner_name}`,
                    description: `Lanzado hace ${diffDays} días. Clic para gestionar.`,
                    date: new Date().toISOString().split('T')[0],
                    priority_level: diffDays > 5 ? 'Urgente' : 'Alta',
                    category: 'Joyería',
                    status: 'Pendiente',
                    is_automatic: true,
                    ref_id: order.id,
                    type: 'jewelry_alert'
                });
            }
        });

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- INDIVIDUAL MEETINGS (1:1) & PERFORMANCE PURGE ---

// Get metrics for meeting performance discussion
router.get('/metrics', isManager, async (req, res) => {
    const { report_date, category } = req.query;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        let query = 'SELECT * FROM excel_metrics WHERE store_id = $1';
        const params = [storeId];
        
        if (report_date) {
            params.push(report_date);
            query += ` AND report_date = $${params.length}`;
        }
        if (category) {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk Import Metrics (Simulated, to support "Cargar datos")
router.post('/metrics/bulk', isManager, async (req, res) => {
    const { metrics } = req.body; // Array of objects
    const storeId = req.headers['x-store-id'] || 'store_1';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const m of metrics) {
            await client.query(
                `INSERT INTO excel_metrics (employee_id, report_date, category, metric_name, metric_value, store_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [m.employee_id, m.report_date, m.category, m.metric_name, m.metric_value, storeId]
            );
        }
        await client.query('COMMIT');
        res.json({ success: true, count: metrics.length });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Create meeting record
router.post('/meetings', isManager, async (req, res) => {
    const { employee_id, interviewer_id, date, category, summary } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            `INSERT INTO meeting_records (employee_id, interviewer_id, date, category, summary, store_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [employee_id, interviewer_id, date, category, JSON.stringify(summary), storeId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PURGE METRICS (Excel cleanup)
router.delete('/metrics/purge', isManager, async (req, res) => {
    const { report_date, category } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'DELETE FROM excel_metrics WHERE report_date = $1 AND category = $2 AND store_id = $3',
            [report_date, category, storeId]
        );
        res.json({ success: true, deletedCount: result.rowCount, message: 'Ciclo cerrado: Datos de métricas purgados permanentemente.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- INDIVIDUAL MEETINGS (1:1) ---

router.get('/evaluation-criteria', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM evaluation_criteria WHERE store_id = $1 ORDER BY category ASC, order_index ASC', [storeId]);
        res.json(result.rows);
    } catch (err) {
        logError(err, 'GET /evaluation-criteria');
        res.status(500).json({ error: err.message });
    }
});

router.get('/meetings/draft/:employeeId', isManager, async (req, res) => {
    const { employeeId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM meeting_drafts WHERE employee_id = $1', [employeeId]);
        res.json(result.rows[0] || null);
    } catch (err) {
        logError(err, 'GET /meetings/draft');
        res.status(500).json({ error: err.message });
    }
});

router.post('/meetings/draft', isManager, async (req, res) => {
    const { employee_id, interviewer_id, data } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO meeting_drafts (employee_id, interviewer_id, data, last_saved) 
             VALUES ($1, $2, $3, NOW()) 
             ON CONFLICT (employee_id) DO UPDATE SET 
             interviewer_id = EXCLUDED.interviewer_id, 
             data = EXCLUDED.data, 
             last_saved = EXCLUDED.last_saved 
             RETURNING *`,
            [employee_id, interviewer_id, JSON.stringify(data)]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'POST /meetings/draft');
        res.status(500).json({ error: err.message });
    }
});

router.post('/meetings/finalize', isManager, async (req, res) => {
    const { employee_id, interviewer_id, summary, date } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert Final Record
        const finalRes = await client.query(
            'INSERT INTO final_meetings (employee_id, interviewer_id, date, summary) VALUES ($1, $2, $3, $4) RETURNING id',
            [employee_id, interviewer_id, date, JSON.stringify(summary)]
        );

        // 2. Delete Draft
        await client.query('DELETE FROM meeting_drafts WHERE employee_id = $1', [employee_id]);

        // 3. Update Schedule if exists
        await client.query(
            "UPDATE meeting_schedules SET status = 'Completado' WHERE employee_id = $1 AND status = 'Pendiente' AND scheduled_date <= $2",
            [employee_id, date]
        );

        await client.query('COMMIT');
        res.json({ success: true, id: finalRes.rows[0].id });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, 'POST /meetings/finalize');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.get('/meetings/history/all', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            `SELECT fm.* 
             FROM final_meetings fm
             JOIN employees e ON fm.employee_id::int = e.id
             WHERE e.store_id = $1
             ORDER BY fm.date DESC`, 
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        logError(err, 'GET /meetings/history/all');
        res.status(500).json({ error: err.message });
    }
});

// --- CRITERIA MANAGEMENT ---

router.post('/evaluation-criteria', isManager, async (req, res) => {
    const { category, title, description, order_index } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO evaluation_criteria (category, title, description, order_index, store_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [category, title, description, order_index || 0, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/evaluation-criteria/:id', isManager, async (req, res) => {
    const { id } = req.params;
    const { category, title, description, order_index } = req.body;
    try {
        const result = await pool.query(
            'UPDATE evaluation_criteria SET category = $1, title = $2, description = $3, order_index = $4 WHERE id = $5 RETURNING *',
            [category, title, description, order_index, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/evaluation-criteria/:id', isManager, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM evaluation_criteria WHERE id = $1', [id]);
        res.json({ message: 'Criterion deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MEETING SCHEDULES ---

router.get('/meeting-schedules', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'SELECT * FROM meeting_schedules WHERE store_id = $1 ORDER BY scheduled_date ASC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/meeting-schedules', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { employee_id, scheduled_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO meeting_schedules (employee_id, scheduled_date, store_id) VALUES ($1, $2, $3) RETURNING *',
            [employee_id, scheduled_date, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/meeting-schedules/:id', isManager, async (req, res) => {
    const { id } = req.params;
    const { scheduled_date, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE meeting_schedules SET scheduled_date = $1, status = $2 WHERE id = $3 RETURNING *',
            [scheduled_date, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/meeting-schedules/:id', isManager, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM meeting_schedules WHERE id = $1', [id]);
        res.json({ message: 'Schedule deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ─── ALIAS ROUTES — Frontend URL compatibility layer ─────────────────────────
// El frontend llama a estas URLs. El backend las implementa con nombres distintos.
// Estos alias redirigen internamente sin romper las rutas originales.

// Schedules: el frontend usa /meetings/schedules*, el backend tiene /meeting-schedules*
router.get('/meetings/schedules', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'SELECT * FROM meeting_schedules WHERE store_id = $1 ORDER BY scheduled_date ASC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        logError(err, 'GET /meetings/schedules (alias)');
        res.status(500).json({ error: err.message });
    }
});

router.post('/meetings/schedule', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { employee_id, scheduled_date } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO meeting_schedules (employee_id, scheduled_date, store_id, status) VALUES ($1, $2, $3, 'Pendiente') RETURNING *",
            [employee_id, scheduled_date, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'POST /meetings/schedule (alias)');
        res.status(500).json({ error: err.message });
    }
});

router.delete('/meetings/schedules/:id', isManager, async (req, res) => {
    try {
        await pool.query('DELETE FROM meeting_schedules WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        logError(err, 'DELETE /meetings/schedules/:id (alias)');
        res.status(500).json({ error: err.message });
    }
});

// Criteria: el frontend usa /meetings/criteria*, el backend tiene /evaluation-criteria*
router.get('/meetings/criteria', isManager, async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'SELECT * FROM evaluation_criteria WHERE store_id = $1 ORDER BY category ASC, order_index ASC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        logError(err, 'GET /meetings/criteria (alias)');
        res.status(500).json({ error: err.message });
    }
});

router.post('/meetings/criteria', isManager, async (req, res) => {
    const { category, title, description, order_index } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO evaluation_criteria (category, title, description, order_index, store_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [category, title, description, order_index || 0, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'POST /meetings/criteria (alias)');
        res.status(500).json({ error: err.message });
    }
});

router.put('/meetings/criteria/:id', isManager, async (req, res) => {
    const { id } = req.params;
    const { category, title, description, order_index } = req.body;
    try {
        const result = await pool.query(
            'UPDATE evaluation_criteria SET category = $1, title = $2, description = $3, order_index = $4 WHERE id = $5 RETURNING *',
            [category, title, description, order_index, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'PUT /meetings/criteria/:id (alias)');
        res.status(500).json({ error: err.message });
    }
});

router.delete('/meetings/criteria/:id', isManager, async (req, res) => {
    try {
        await pool.query('DELETE FROM evaluation_criteria WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        logError(err, 'DELETE /meetings/criteria/:id (alias)');
        res.status(500).json({ error: err.message });
    }
});

// Draft: el frontend usa /meetings/save-draft, el backend tiene /meetings/draft
router.post('/meetings/save-draft', isManager, async (req, res) => {
    const { employeeId, draftData } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    // Extraer interviewer_id si viene en draftData, o usar un fallback
    const interviewer_id = draftData?.interviewer?.id || 'gerente';
    try {
        const result = await pool.query(
            `INSERT INTO meeting_drafts (employee_id, interviewer_id, data, last_saved) 
             VALUES ($1, $2, $3, NOW()) 
             ON CONFLICT (employee_id) DO UPDATE SET 
             interviewer_id = EXCLUDED.interviewer_id, 
             data = EXCLUDED.data, 
             last_saved = EXCLUDED.last_saved 
             RETURNING *`,
            [employeeId, interviewer_id, JSON.stringify(draftData)]
        );
        res.json(result.rows[0]);
    } catch (err) {
        logError(err, 'POST /meetings/save-draft (alias)');
        res.status(500).json({ error: err.message });
    }
});

// Finish: el frontend usa /meetings/finish, el backend tiene /meetings/finalize
router.post('/meetings/finish', isManager, async (req, res) => {
    const { employeeId } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Recuperar el borrador para finalizar con los datos guardados
        const draftRes = await client.query(
            'SELECT * FROM meeting_drafts WHERE employee_id = $1',
            [employeeId]
        );
        const draft = draftRes.rows[0];
        const now = new Date().toISOString();

        // Insertar en final_meetings
        const finalRes = await client.query(
            `INSERT INTO final_meetings (employee_id, interviewer_id, date, summary, store_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
                employeeId,
                draft?.interviewer_id || 'gerente',
                now,
                draft?.data ? JSON.stringify(draft.data) : '{}',
                storeId
            ]
        );

        // Eliminar borrador
        await client.query('DELETE FROM meeting_drafts WHERE employee_id = $1', [employeeId]);

        // Marcar cita programada como completada si existe
        await client.query(
            "UPDATE meeting_schedules SET status = 'Completado' WHERE employee_id = $1 AND status = 'Pendiente' AND scheduled_date <= $2",
            [employeeId, now]
        );

        await client.query('COMMIT');
        res.json({ success: true, id: finalRes.rows[0].id });
    } catch (err) {
        await client.query('ROLLBACK');
        logError(err, 'POST /meetings/finish (alias)');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
