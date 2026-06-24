import express from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import { DataService } from '../services/dataService.js';

const router = express.Router();

// Middleware to verify that the requesting user is a Master Admin
const requireMasterAdmin = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ success: false, message: 'No se proporcionó el ID de usuario administrador.' });
    }
    try {
        const result = await pool.query('SELECT is_master, is_active FROM employees WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Usuario no encontrado.' });
        }
        const emp = result.rows[0];
        if (!emp.is_active) {
            return res.status(403).json({ success: false, message: 'Usuario desactivado.' });
        }
        if (!emp.is_master) {
            return res.status(403).json({ success: false, message: 'Acceso denegado: Se requieren privilegios de Administrador Maestro.' });
        }
        next();
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Apply security middleware to all routes in this file
router.use(requireMasterAdmin);

// 1. GET /api/admin/stats — Retrieve aggregated performance and usage analytics
router.get('/stats', async (req, res) => {
    const dateParam = req.query.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
    try {
        // Global counts
        const storesCount = await pool.query('SELECT COUNT(*) FROM stores');
        const activeStoresCount = await pool.query('SELECT COUNT(*) FROM stores WHERE is_active = true');
        const employeesCount = await pool.query('SELECT COUNT(*) FROM employees');
        const activeEmployeesCount = await pool.query('SELECT COUNT(*) FROM employees WHERE is_active = true');
        const activeSessionsCount = await pool.query('SELECT COUNT(*) FROM active_sessions');

        // Cash Closure Stats for the selected day
        const cashLogs = await pool.query(
            'SELECT store_id, total, expected_total, is_closed FROM cash_control_logs WHERE date = $1',
            [dateParam]
        );

        let cashClosuresCount = 0;
        let totalDiscrepancies = 0;
        cashLogs.rows.forEach(log => {
            if (log.is_closed) cashClosuresCount++;
            const diff = parseFloat(log.total || 0) - parseFloat(log.expected_total || 0);
            if (diff !== 0) {
                totalDiscrepancies += Math.abs(diff);
            }
        });

        // Live sessions details
        const activeSessions = await pool.query(`
            SELECT s.id, s.employee_id, s.start_time, s.store_id, 
                   e.avatar, e.first_name, e.last_name, e.alias, st.name as store_name
            FROM active_sessions s
            LEFT JOIN employees e ON s.employee_id = e.id
            LEFT JOIN stores st ON s.store_id = st.id
            ORDER BY s.start_time DESC
        `);

        // Recent Audit Feed (transaction_logs)
        const recentActivity = await pool.query(`
            SELECT t.id, t.store_id, t.employee_id, t.start_time, t.end_time, t.type, t.details, 
                   e.alias, e.first_name, e.last_name, st.name as store_name
            FROM transaction_logs t
            LEFT JOIN employees e ON (CASE WHEN t.employee_id ~ '^[0-9]+$' THEN t.employee_id::integer ELSE null END) = e.id
            LEFT JOIN stores st ON t.store_id = st.id
            ORDER BY t.start_time DESC
            LIMIT 20
        `);

        // Hourly productivity summary by store (last 7 days)
        const recentUsage = await pool.query(`
            SELECT date, store_id, SUM(duration_seconds) as total_seconds 
            FROM daily_records 
            WHERE date >= (CURRENT_DATE - INTERVAL '7 days')::text
            GROUP BY date, store_id
            ORDER BY date DESC
        `);

        res.json({
            stats: {
                totalStores: parseInt(storesCount.rows[0].count),
                activeStores: parseInt(activeStoresCount.rows[0].count),
                totalEmployees: parseInt(employeesCount.rows[0].count),
                activeEmployees: parseInt(activeEmployeesCount.rows[0].count),
                activeSessions: parseInt(activeSessionsCount.rows[0].count),
                cashClosures: cashClosuresCount,
                cashDiscrepancies: parseFloat(totalDiscrepancies.toFixed(2))
            },
            activeSessions: activeSessions.rows,
            recentActivity: recentActivity.rows,
            recentUsage: recentUsage.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET /api/admin/stores — List all stores
router.get('/stores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stores ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. POST /api/admin/stores — Create a new store
router.post('/stores', async (req, res) => {
    const { id, name, color, isActive } = req.body;
    if (!id || !name) {
        return res.status(400).json({ error: 'ID y Nombre de tienda son obligatorios.' });
    }
    const storeId = id.trim().toLowerCase();

    try {
        const check = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe una tienda con este identificador.' });
        }

        // Insert Store
        await pool.query(
            'INSERT INTO stores (id, name, color, is_active) VALUES ($1, $2, $3, $4)',
            [storeId, name.trim(), color || 'from-blue-600 to-blue-800', isActive !== undefined ? isActive : true]
        );

        // Seed Default Modules
        const defaultModules = [
            'dashboard', 'productivity', 'market', 'reports',
            'gerencia_summary', 'gerencia_tasks', 'gerencia_team', 
            'gerencia_tracking', 'gerencia_jewelry', 'gerencia_meetings', 
            'gerencia_cash'
        ];

        for (const mod of defaultModules) {
            await pool.query(
                'INSERT INTO store_modules (store_id, module_key, is_enabled) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
                [storeId, mod]
            );
        }

        res.json({ success: true, store: { id: storeId, name, color, is_active: isActive !== undefined ? isActive : true } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. PUT /api/admin/stores/:id — Update store settings
router.put('/stores/:id', async (req, res) => {
    const { id } = req.params;
    const { name, color, isActive } = req.body;
    try {
        const result = await pool.query(
            'UPDATE stores SET name = $1, color = $2, is_active = $3 WHERE id = $4 RETURNING *',
            [name.trim(), color, isActive, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tienda no encontrada.' });
        }
        res.json({ success: true, store: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. GET /api/admin/modules/:storeId — Get modules visibility settings for a store
router.get('/modules/:storeId', async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            'SELECT module_key as "moduleKey", is_enabled as "isEnabled" FROM store_modules WHERE store_id = $1 ORDER BY module_key ASC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. PUT /api/admin/modules/:storeId — Save modules settings for a store
router.put('/modules/:storeId', async (req, res) => {
    const { storeId } = req.params;
    const { modules } = req.body; // Array of { moduleKey, isEnabled }

    if (!Array.isArray(modules)) {
        return res.status(400).json({ error: 'La estructura de módulos debe ser un arreglo.' });
    }

    try {
        for (const mod of modules) {
            await pool.query(
                `INSERT INTO store_modules (store_id, module_key, is_enabled) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (store_id, module_key) 
                 DO UPDATE SET is_enabled = $3, updated_at = CURRENT_TIMESTAMP`,
                [storeId, mod.moduleKey, mod.isEnabled]
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. GET /api/admin/users — List all users system-wide (transparently decrypted by middleware)
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, first_name as "firstName", last_name as "lastName", alias, email, 
                   role, store_id as "storeId", is_active as "isActive", is_master as "isMaster", username
            FROM employees 
            ORDER BY id ASC
        `);
        res.json(result.rows.map(user => ({
            ...user,
            nombre: user.alias || `${user.firstName} ${user.lastName}`
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. PUT /api/admin/users/:id — Edit a user globally
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { role, storeId, isActive, isMaster } = req.body;

    try {
        const result = await pool.query(
            `UPDATE employees 
             SET role = $1, store_id = $2, is_active = $3, is_master = $4 
             WHERE id = $5 RETURNING id`,
            [role, storeId, isActive, isMaster, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
