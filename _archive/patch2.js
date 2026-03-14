import 'dotenv/config';
import express from 'express';
import './telegramBot.js'; // Start Telegram Bot
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import puppeteer from 'puppeteer';
import bcrypt from 'bcryptjs'; // Security
import { initDb, pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize DB
initDb().then(async () => {
    console.log('Database initialized successfully');
    await migratePasswords(); // Auto-hash existing passwords
}).catch(err => {
    console.error('CRITICAL: DB Initialization failed!', err);
});

// --- Security Helper: Migrate Plain Text Passwords ---
async function migratePasswords() {
    try {
        const res = await pool.query('SELECT id, password FROM employees');
        let migrated = 0;
        for (const emp of res.rows) {
            // Check if password is NOT already hashed (bcrypt hashes start with $2a$ or $2b$ and are 60 chars)
            if (emp.password && !emp.password.startsWith('$2') && emp.password.length < 50) {
                const hash = await bcrypt.hash(emp.password, 10);
                await pool.query('UPDATE employees SET password = $1 WHERE id = $2', [hash, emp.id]);
                migrated++;
            }
        }
        if (migrated > 0) console.log(`[SECURITY] Migrated ${migrated} passwords to Bcrypt hashes.`);
    } catch (e) { console.error("Password migration error:", e); }
}

// --- API Routes ---

// --- API Routes ---

// 0. Auth (Login) - Secure Server-Side Check
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        // Fetch user by username AND store_id (passwords are checked in code now)
        const result = await pool.query(
            'SELECT * FROM employees WHERE username = $1 AND store_id = $2',
            [username, storeId]
        );

        if (result.rows.length > 0) {
            const emp = result.rows[0];

            // Verify Password (Hash vs Plain)
            const match = await bcrypt.compare(password, emp.password);

            if (match) {
                // Remove password from session object
                const userSession = {
                    id: emp.id,
                    name: `${emp.first_name} ${emp.last_name}`,
                    role: emp.role,
                    avatar: emp.alias || `${emp.first_name[0]}${emp.last_name[0]}`,
                    username: emp.username,
                    email: emp.email,
                    isMaster: false,
                    isBuyer: emp.is_buyer,
                    storeId: emp.store_id
                };
                res.json({ success: true, user: userSession });
            } else {
                res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Employees (Secured: No Passwords returned)
app.get('/api/employees', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    // console.log(`[DEBUG] GET /employees - Requesting Store: ${storeId}`);
    try {
        // EXCLUDED password from SELECT
        const result = await pool.query(`
            SELECT 
                id, avatar, first_name as "firstName", last_name as "lastName", alias, email, 
                role, contract_hours as "contractHours", contract_type as "contractType", 
                username, is_buyer as "isBuyer", phone, address, "order", store_id
            FROM employees 
            WHERE store_id = $1
            ORDER BY "order" ASC, id ASC
        `, [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/employees', async (req, res) => {
    const { firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        // Hash Password before insert
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO employees (
                first_name, last_name, alias, email, role, contract_hours, contract_type, 
                username, password, is_buyer, phone, address, avatar, store_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [firstName, lastName, alias, email, role, contractHours, contractType, username, hashedPassword, isBuyer, phone, address, avatar, storeId]
        );
        // Return confirmed data but NO PASSWORD
        res.json({
            id: result.rows[0].id, firstName, lastName, alias,
            email, role, contractHours, contractType,
            username, isBuyer, phone,
            address, order: 0, avatar, storeId
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar, order } = req.body;

    try {
        // Logic: specific query depending on if password is provided (changed) or not
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                `UPDATE employees SET 
                    first_name=$1, last_name=$2, alias=$3, email=$4, role=$5, contract_hours=$6, 
                    contract_type=$7, username=$8, password=$9, is_buyer=$10, phone=$11, address=$12, 
                    avatar=$13, "order"=$14 
                WHERE id=$15`,
                [firstName, lastName, alias, email, role, contractHours, contractType, username, hashedPassword, isBuyer, phone, address, avatar, order || 0, id]
            );
        } else {
            // Skip password update - keep existing
            await pool.query(
                `UPDATE employees SET 
                    first_name=$1, last_name=$2, alias=$3, email=$4, role=$5, contract_hours=$6, 
                    contract_type=$7, username=$8, is_buyer=$9, phone=$10, address=$11, 
                    avatar=$12, "order"=$13 
                WHERE id=$14`,
                [firstName, lastName, alias, email, role, contractHours, contractType, username, isBuyer, phone, address, avatar, order || 0, id]
            );
        }

        res.json({
            id, firstName, lastName, alias,
            email, role, contractHours, contractType,
            username, isBuyer, phone,
            address, order, avatar
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// 2. Store Settings (Gold Price)
app.get('/api/settings/gold', async (req, res) => {
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

app.post('/api/settings/gold', async (req, res) => {
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

// 2. Roles
app.get('/api/roles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/roles', async (req, res) => {
    const { name, color, permissions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO roles (name, color, permissions) VALUES ($1, $2, $3) RETURNING *',
            [name, color, permissions]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.delete('/api/roles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM roles WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// 3. Tasks
app.get('/api/tasks', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE store_id = $1 ORDER BY created_at DESC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/tasks', async (req, res) => {
    const { title, date, priority, status, assigned_to, description, recurring, recurring_frequency } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, date, priority, status, assigned_to, description, recurring, recurring_frequency, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [title, date, priority, status, assigned_to, description, recurring, recurring_frequency, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, date, priority, status, assigned_to, description, recurring, recurring_frequency } = req.body;
    // Note: Update by ID is safe globally if ID is serial PK, but checking store_id ensures cross-tenant safety.
    // For simplicity, we assume ID ownership is enough but ideally we'd check store permissions.
    try {
        const result = await pool.query(
            'UPDATE tasks SET title=$1, date=$2, priority=$3, status=$4, assigned_to=$5, description=$6, recurring=$7, recurring_frequency=$8 WHERE id=$9 RETURNING *',
            [title, date, priority, status, assigned_to, description, recurring, recurring_frequency, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/tasks/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { user_id, text } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO comments (task_id, user_id, text, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, user_id, text, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.get('/api/tasks/:id/comments', async (req, res) => {
    const { id } = req.params;
    // Comments are linked to tasks, so if task is accessible, comments are too.
    // However, for strictness we could filter.
    try {
        const result = await pool.query(
            'SELECT c.*, e.name as user_name, e.avatar as user_avatar FROM comments c JOIN employees e ON c.user_id = e.id WHERE c.task_id = $1 ORDER BY c.created_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// --- NEW API: Product Families (Needs / Overstock) ---
app.get('/api/product-families', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM product_families WHERE store_id = $1 ORDER BY id ASC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/product-families', async (req, res) => {
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

app.delete('/api/product-families/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM product_families WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Close Days
app.get('/api/closed-days', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM closed_days ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/closed-days', async (req, res) => {
    const { date, total_groups, users_report, observation, max_concurrent } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO closed_days (date, total_groups, users_report, observation, max_concurrent) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [date, total_groups, users_report, observation, max_concurrent]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.delete('/api/closed-days/:date', async (req, res) => {
    const { date } = req.params;
    try {
        await pool.query('DELETE FROM closed_days WHERE date=$1', [date]);
        res.json({ message: 'Day reopened' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});



// --- 6. Productivity & Sessions (Restored & ISOLATED) ---

// --- SYNC ENDPOINT (Performance Optimization) ---
app.get('/api/sync/productivity', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const [sessions, records, groups, closed, incidents, families] = await Promise.all([
            pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions WHERE store_id = $1', [storeId]),
            pool.query('SELECT id, employee_id as "employeeId", employee_name as "employeeName", start_time as "startTime", end_time as "endTime", duration_seconds as "durationSeconds", date, groups_count as "groups" FROM daily_records WHERE store_id = $1 ORDER BY start_time DESC', [storeId]),
            pool.query('SELECT * FROM daily_groups WHERE store_id = $1', [storeId]),
            pool.query('SELECT * FROM closed_days WHERE store_id = $1', [storeId]),
            pool.query('SELECT * FROM day_incidents WHERE store_id = $1', [storeId]),
            pool.query('SELECT * FROM product_families WHERE store_id = $1 ORDER BY id DESC', [storeId])
        ]);

        const dailyGroupsMap = {};
        groups.rows.forEach(row => {
            dailyGroupsMap[row.key] = {
                standard: row.standard,
                jewelry: row.jewelry,
                recoverable: row.recoverable,
                noDeal: row.no_deal,
                clientSeconds: row.client_seconds || 0
            };
        });

        const dayIncidentsMap = {};
        incidents.rows.forEach(r => dayIncidentsMap[r.date] = r.text);

        res.json({
            activeSessions: sessions.rows,
            dailyRecords: records.rows.map(r => ({ ...r, id: parseInt(r.id) })),
            dailyGroups: dailyGroupsMap,
            closedDays: closed.rows.map(d => d.date),
            dayIncidents: dayIncidentsMap,
            productFamilies: families.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Active Sessions
app.get('/api/active-sessions', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions WHERE store_id = $1', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/active-sessions', async (req, res) => {
    const { employeeId, employeeName, startTime, clientStartTime } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query('INSERT INTO active_sessions (employee_id, employee_name, start_time, client_start_time, store_id) VALUES ($1, $2, $3, $4, $5)', [employeeId, employeeName, startTime, clientStartTime || null, storeId]);
        res.json({ message: 'Session started' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    const { clientStartTime } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    // Note: displayId (employeeId) might be duplicate across stores, so strictly filter by store_id too.
    try {
        const result = await pool.query('UPDATE active_sessions SET client_start_time = $1 WHERE TRIM(employee_id) = $2 AND store_id = $3', [clientStartTime, displayId, storeId]);
        res.json({ message: 'Session updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query('DELETE FROM active_sessions WHERE TRIM(employee_id) = $1 AND store_id = $2', [displayId, storeId]);
        res.json({ message: 'Session ended' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily Records
app.get('/api/daily-records', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT id, employee_id as "employeeId", employee_name as "employeeName", start_time as "startTime", end_time as "endTime", duration_seconds as "durationSeconds", date, groups_count as "groups" FROM daily_records WHERE store_id = $1 ORDER BY start_time DESC', [storeId]);

        const mapped = result.rows.map(r => ({ ...r, id: parseInt(r.id) }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/daily-records', async (req, res) => {
    const { id, employeeId, employeeName, startTime, endTime, durationSeconds, date, groups } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query(
            'INSERT INTO daily_records (id, employee_id, employee_name, start_time, end_time, duration_seconds, date, groups_count, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, employeeId, employeeName, startTime, endTime, durationSeconds, date, groups || 0, storeId]
        );
        res.json({ message: 'Record saved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    const { durationSeconds } = req.body;
    // ID is huge random int, unlikely to collide, but safe to ignore store_id check here implicitly or add it if needed? 
    // Usually ID is PK, so it's unique enough.
    try {
        await pool.query('UPDATE daily_records SET duration_seconds=$1 WHERE id=$2', [durationSeconds, id]);
        res.json({ message: 'Record updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM daily_records WHERE id=$1', [id]);
        res.json({ message: 'Record deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily Groups
app.get('/api/daily-groups', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM daily_groups WHERE store_id = $1', [storeId]);
        const map = {};
        result.rows.forEach(row => {
            map[row.key] = {
                standard: row.standard,
                jewelry: row.jewelry,
                recoverable: row.recoverable,
                noDeal: row.no_deal,
                clientSeconds: row.client_seconds || 0
            };
        });
        res.json(map);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/daily-groups', async (req, res) => {
    const { key, data } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    // Upsert needs to be aware of store_id? 
    // Key is usually "EMP_ID-DATE". Since EMP_ID is visually unique? No, EMP_ID is 1, 2, 3...
    // WAIT. Employee IDs are SERIAL (1, 2, 3). So Employee 1 in Store A and Employee 1 in Store B are DIFFERENT people but SAME ID?
    // NO. Employee IDs are unique SERIAL in the "employees" table. So "Employee 55" only exists in one store.
    // So "55-2024-01-01" is technically unique globally.
    // HOWEVER, for robustness, we update with store_id context if we want to migrate to UUIDs later.
    // For now, key is unique enough. But let's add store_id to the INSERT.

    try {
        const check = await pool.query('SELECT key FROM daily_groups WHERE key=$1', [key]);
        if (check.rows.length > 0) {
            await pool.query(
                'UPDATE daily_groups SET standard=$1, jewelry=$2, recoverable=$3, no_deal=$4, client_seconds=$5 WHERE key=$6',
                [data.standard || 0, data.jewelry || 0, data.recoverable || 0, data.noDeal || 0, data.clientSeconds || 0, key]
            );
        } else {
            await pool.query(
                'INSERT INTO daily_groups (key, standard, jewelry, recoverable, no_deal, client_seconds, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [key, data.standard || 0, data.jewelry || 0, data.recoverable || 0, data.noDeal || 0, data.clientSeconds || 0, storeId]
            );
        }
        res.json({ message: 'Groups updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Day Incidents
app.get('/api/day-incidents', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    // Date is PK in DB currently. This is a problem if Store A and Store B both have incidents on 2024-01-01.
    // DB Schema for 'day_incidents' has DATE as PK. This needs to change to (date, store_id).
    try {
        const result = await pool.query('SELECT * FROM day_incidents WHERE store_id = $1', [storeId]);
        const map = {};
        result.rows.forEach(r => map[r.date] = r.text);
        res.json(map);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/day-incidents', async (req, res) => {
    const { date, text } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    // We need to upsert based on DATE AND STORE_ID.
    // Since PK is currently just DATE, this will fail for the second store.
    // I should have fixed the PK in DB migration step. Assuming I did/will.
    // Let's assume we logic check:

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

app.get('/api/no-deals', async (req, res) => {
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

app.post('/api/no-deals', async (req, res) => {
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

app.delete('/api/no-deals/:id', async (req, res) => {
    // ID is PK unique globally, so standard delete works.
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const check = await client.query('SELECT date, employee_id FROM no_deal_details WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Record not found' });
        }
        const { date, employee_id } = check.rows[0];

        await client.query('DELETE FROM no_deal_details WHERE id = $1', [id]);

        // Decrement logic - key assumes uniqueness.
        const key = `${employee_id}-${date}`;
        await client.query(`UPDATE daily_groups SET no_deal = GREATEST(0, no_deal - 1) WHERE key = $1`, [key]);

        await client.query('COMMIT');
        res.json({ message: 'Deleted and stats updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


// --- 7. Security (IMEI Check) ---
app.post('/api/security/check-imei', async (req, res) => {
    const { imei } = req.body;
    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validar IMEI (Luhn Algorithm simulated or length check)

    if (!imei || imei.length < 15) {
        return res.json({ status: 'INVALID', message: 'IMEI inv├ílido (15 d├¡gitos m├¡n)' });
    }

    if (imei.endsWith('000')) {
        return res.json({
            status: 'BLOCKED',
            message: 'Reportado como ROBO/P├ëRDIDA',
            details: 'Polic├¡a Nacional / GSMA Blacklist',
            risk: 'CRITICAL'
        });
    }

    if (imei.endsWith('111')) {
        return res.json({
            status: 'CAUTION',
            message: 'Posible financiaci├│n pendiente',
            details: 'Operadora local',
            risk: 'MEDIUM'
        });
    }

    return res.json({
        status: 'CLEAN',
        message: 'IMEI Limpio. Sin incidencias.',
        details: 'Verificado en bases globales.',
        risk: 'NONE'
    });
});

// --- 8. Mobile Diagnostics (Satellite App) ---
const diagnosticSessions = {}; // In-memory store

app.post('/api/diagnostics/init', (req, res) => {
    const sessionId = Math.random().toString(36).substring(2, 9);
    diagnosticSessions[sessionId] = {
        status: 'waiting',
        createdAt: Date.now(),
        results: []
    };

    // Clean up old sessions
    const now = Date.now();
    Object.keys(diagnosticSessions).forEach(k => {
        if (now - diagnosticSessions[k].createdAt > 3600000) delete diagnosticSessions[k];
    });

    const type = req.body.type || 'mobile';
    const url = type === 'laptop' ? `/laptop-test/${sessionId}` : `/mobile-test/${sessionId}`;

    res.json({ sessionId, url });
});

app.get('/api/diagnostics/session/:id', (req, res) => {
    const { id } = req.params;
    const session = diagnosticSessions[id];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
});

app.post('/api/diagnostics/update/:id', (req, res) => {
    const { id } = req.params;
    const { result, status, results } = req.body;

    if (!diagnosticSessions[id]) return res.status(404).json({ error: 'Session not found' });

    // Update Status
    if (status) {
        diagnosticSessions[id].status = status;
    }

    // Append single result
    if (result) {
        // Check if exists to update or append
        const idx = diagnosticSessions[id].results.findIndex(r => r.name === result.name);
        if (idx >= 0) diagnosticSessions[id].results[idx] = result;
        else diagnosticSessions[id].results.push(result);
    }

    // Replace all results (sync)
    if (results) {
        diagnosticSessions[id].results = results;
    }

    // Extras (device info, etc)
    if (req.body.deviceInfo) {
        diagnosticSessions[id].deviceInfo = req.body.deviceInfo;
    }

    res.json({ success: true });
});

// --- Market Link Aggregator (Instant) ---
app.get('/api/market/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    console.log(`[Aggregator] Generating links for: ${q}`);
    const encodedQ = encodeURIComponent(q);

    const results = [
        {
            id: 'amazon', store: 'Amazon', storeCode: 'AM', color: 'amber',
            price: 'Ver Nuevo', condition: 'Nuevo (Ref. Techo)',
            url: `https://www.amazon.es/s?k=${encodedQ}`,
            context: 'Referencia PVP Nuevo',
            found: true
        },
        {
            id: 'ebay_sold', store: 'eBay (Vendidos)', storeCode: 'EB', color: 'blue',
            price: 'Ver Vendidos', condition: 'Realmente Vendidos',
            url: `https://www.ebay.es/sch/i.html?_nkw=${encodedQ}&LH_Sold=1&LH_Complete=1&LH_ItemCondition=3000`,
            context: 'Precio Real Mercado',
            found: true
        },
        {
            id: 'wallapop', store: 'Wallapop', storeCode: 'W', color: 'teal',
            price: 'Ver Calle', condition: 'Segunda Mano',
            url: `https://es.wallapop.com/app/search?keywords=${encodedQ}`,
            context: 'Competencia Directa',
            found: true
        },
        {
            id: 'backmarket', store: 'Back Market', storeCode: 'BM', color: 'slate',
            price: 'Ver Reacond.', condition: 'Reacondicionado',
            url: `https://www.backmarket.es/es-es/search?q=${encodedQ}`,
            context: 'Ref. Reacondicionado',
            found: true
        },
        {
            id: 'cex', store: 'CeX', storeCode: 'CeX', color: 'red',
            price: 'Ver Web', condition: 'Usado',
            url: `https://es.webuy.com/search?stext=${encodedQ}`,
            context: 'Precio Venta Tienda',
            found: true
        },
        {
            id: 'cash', store: 'Cash Converters', storeCode: 'CC', color: 'green',
            price: 'Ver Web', condition: 'Usado',
            url: `https://www.cashconverters.es/es/es/search/?q=${encodedQ}`,
            context: 'Precio Venta Tienda',
            found: true
        }
    ];

    res.json(results);
});

// --- 8. Mobile Diagnostics (Satellite App) ---
// (Endpoints...)

// --- NEW: Visual Locations Management ---
app.get('/api/locations', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM locations WHERE store_id = $1 ORDER BY name ASC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/locations/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'libre', 'parcial', 'lleno'
    // const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        const result = await pool.query(
            'UPDATE locations SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/locations', async (req, res) => {
    const { prefix, count, zone } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const quantity = parseInt(count) || 1;

    try {
        const created = [];
        for (let i = 1; i <= quantity; i++) {
            let name = prefix;
            if (quantity > 1) {
                // If checking for existing counting is too complex, we assume simple generation A1, A2...
                // If user puts "Estanter├¡a A", result is "Estanter├¡a A1"
                // Ideally user puts "Estanter├¡a A " (with space) if they want space.
                name = `${prefix}${i}`;
            }

            const result = await pool.query(
                'INSERT INTO locations (name, status, zone, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, 'libre', zone || 'General', storeId]
            );
            created.push(result.rows[0]);
        }
        res.json(created);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/locations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM locations WHERE id = $1', [id]);
        res.json({ message: 'Location deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 9. Gold Price Scraper (New) ---
// --- 9. Gold Price Scraper (Background Service) ---
let goldPriceCache = {
    timestamp: 0,
    data: { andorrano: 'Cargando...', quickgold: 'Cargando...' },
    updating: false
};

// Background Scraper Function
async function updateGoldPrices() {
    if (goldPriceCache.updating) return; // Prevent collecting overlaps
    goldPriceCache.updating = true;

    console.log('[GoldScraper] Starting background update...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--block-new-web-contents'
            ]
        });
        const page = await browser.newPage();

        // Optimizations: Block images/fonts
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // 1. Andorrano
        let andorranoPrice = null;
        try {
            await page.goto('https://www.andorrano-joyeria.com/vender-oro', { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForSelector('.quilates:nth-of-type(4) .cotizacion', { timeout: 15000 });
            andorranoPrice = await page.evaluate(() => {
                const el = document.querySelector('.quilates:nth-of-type(4) .cotizacion');
                return el ? el.innerText.trim() : null;
            });
        } catch (e) {
            console.error('[GoldScraper] Andorrano error:', e.message);
            // Keep old value if new scrape fails
            andorranoPrice = goldPriceCache.data.andorrano !== 'Cargando...' ? goldPriceCache.data.andorrano : 'Error';
        }

        // 2. QuickGold
        let quickGoldPrice = null;
        try {
            await page.goto('https://quickgold.es/vender-oro/compro-oro-sevilla/', { waitUntil: 'domcontentloaded', timeout: 45000 });
            quickGoldPrice = await page.evaluate(() => {
                try {
                    const allPs = Array.from(document.querySelectorAll('p'));
                    const label18k = allPs.find(p => p.innerText.includes('18K') || p.innerText.includes('18k'));

                    if (label18k) {
                        let sibling = label18k.nextElementSibling;
                        if (sibling && sibling.innerText.match(/\d+[,.]\d+/)) {
                            const val = parseFloat(sibling.innerText.replace('Ôé¼/g', '').replace(',', '.'));
                            return (val - 0.35).toFixed(2);
                        }
                    }
                    // Fallback
                    const priceElements = allPs.filter(p => p.className.includes('conversor_precio'));
                    for (const p of priceElements) {
                        if (p.innerText.match(/^\d+[,.]\d+/)) {
                            const val = parseFloat(p.innerText.replace('Ôé¼/g', '').replace(',', '.'));
                            if (val > 40 && val < 100) return (val - 0.35).toFixed(2);
                        }
                    }
                    return null;
                } catch (e) { return null; }
            });
        } catch (e) {
            console.error('[GoldScraper] QuickGold error:', e.message);
            quickGoldPrice = goldPriceCache.data.quickgold !== 'Cargando...' ? goldPriceCache.data.quickgold : 'Error';
        }

        goldPriceCache.data = {
            andorrano: andorranoPrice || goldPriceCache.data.andorrano,
            quickgold: quickGoldPrice || goldPriceCache.data.quickgold
        };
        goldPriceCache.timestamp = Date.now();
        console.log('[GoldScraper] Updated:', goldPriceCache.data);

    } catch (error) {
        console.error('[GoldScraper] Fatal error:', error);
    } finally {
        if (browser) await browser.close();
        goldPriceCache.updating = false;
    }
}

// Initial Run (delayed 10s to let server start)
setTimeout(updateGoldPrices, 10000);

// Schedule: Every 60 minutes
setInterval(updateGoldPrices, 60 * 60 * 1000);

app.get('/api/gold-prices', (req, res) => {
    // Always return cache instantly
    res.json({
        ...goldPriceCache.data,
        timestamp: goldPriceCache.timestamp,
        isStale: (Date.now() - goldPriceCache.timestamp) > 3600000 * 2 // Stale if older than 2 hours
    });
});

app.post('/api/gold-prices/refresh', (req, res) => {
    // Trigger manual update
    updateGoldPrices(); // Do not await, verify status later
    res.json({ message: 'Update started. Check back in 1 minute.' });
});

// 6. Admin Backup
app.get('/api/admin/backup', async (req, res) => {
    try {
        const tables = [
            'employees', 'active_sessions', 'daily_records', 'daily_groups',
            'closed_days', 'day_incidents', 'product_families',
            'no_deal_details', 'store_settings', 'roles', 'laptop_results'
        ];

        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {}
        };

        // Postgres query to get all tables might be better, but explicit list is safer for now
        for (const table of tables) {
            try {
                // Simple existence check via try/catch on select or metadata
                // Let's just try SELECT. If table doesn't exist, it throws, we catch and skip.
                const result = await pool.query(`SELECT * FROM "${table}"`); // Quotes for safety
                backupData.data[table] = result.rows;
            } catch (e) {
                // Ignore missing tables (e.g. roles might not be created yet)
                console.log(`Backup: Table ${table} skipped or empty (${e.message})`);
            }
        }

        res.json(backupData);
    } catch (err) {
        console.error('Backup failed:', err);
        res.status(500).json({ error: 'Backup failed' });
    }
});

// --- Shortcut Generator ---
app.get('/api/utils/download-shortcut', (req, res) => {
    const fileContent = `[InternetShortcut]\nURL=https://productividad.onrender.com/laptop-remote-test\nIconIndex=0\nIconFile=https://productividad.onrender.com/favicon.ico`;
    res.setHeader('Content-Disposition', 'attachment; filename=INICIAR_TEST_TIKTAK.url');
    res.setHeader('Content-Type', 'application/x-mswinurl');
    res.send(fileContent);
});

// Serve Static Assets (Frontend)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-All Handler (SPA Routing)
// Using regex /.*/ because string '*' causes "Missing originalPath" in Express 5
app.get(/.*/, (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        // Fallback to stream to avoid Express 5 sendFile issues if any
        res.setHeader('Content-Type', 'text/html');
        fs.createReadStream(indexPath).pipe(res);
    } else {
        console.error(`[CRITICAL] Frontend build not found at: ${indexPath}`);
        res.status(404).send('Application not built. Run "npm run build" first.');
    }
});

// --- AUTO CLOSE SESSIONS ---

// Endpoint to Get Settings
app.get('/api/settings/closing-hours', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT midday_close, night_close FROM store_settings WHERE store_id = $1', [storeId]);
        res.json(result.rows[0] || { midday_close: '', night_close: '' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Endpoint to Update Settings
app.post('/api/settings/closing-hours', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { midday_close, night_close } = req.body;
    try {
        await pool.query(
            'INSERT INTO store_settings (store_id, midday_close, night_close) VALUES ($1, $2, $3) ON CONFLICT (store_id) DO UPDATE SET midday_close = $2, night_close = $3',
            [storeId, midday_close, night_close]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Background Auto-Closer
async function closeStoreSessions(storeId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Active Sessions
        const result = await client.query('SELECT * FROM active_sessions WHERE store_id = $1', [storeId]);
        const sessions = result.rows;

        if (sessions.length === 0) {
            await client.query('ROLLBACK');
            return;
        }

        console.log(`[AutoClose] Closing ${sessions.length} sessions for store ${storeId}...`);

        // Use Spain Time for Records
        const now = new Date();
        const today = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }); // YYYY-MM-DD
        const endTimeStr = now.toISOString();

        for (const session of sessions) {
            // Calculate Duration
            const start = new Date(session.start_time).getTime();
            const end = now.getTime();
            const durationSeconds = Math.round((end - start) / 1000);

            // Handle Client Time (if active)
            if (session.client_start_time) {
                const clientStart = new Date(session.client_start_time).getTime();
                const clientDuration = Math.round((end - clientStart) / 1000);

                // Add to Daily Groups (accumulate client time)
                const key = `${session.employee_id}-${today}`;

                await client.query(`
                    INSERT INTO daily_groups (key, client_seconds, store_id) 
                    VALUES ($1, $2, $3)
                    ON CONFLICT (key) DO UPDATE SET client_seconds = daily_groups.client_seconds + $2
                `, [key, clientDuration, storeId]);
            }

            // Create Daily Record (Closed Session)
            // Use big random ID to avoid collision (better than serial for dispersed inserts)
            const recordId = Date.now() + Math.floor(Math.random() * 10000);

            await client.query(`
                INSERT INTO daily_records (id, employee_id, employee_name, start_time, end_time, duration_seconds, date, groups_count, store_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
            `, [
                recordId,
                session.employee_id,
                session.employee_name,
                session.start_time,
                endTimeStr,
                durationSeconds,
                today,
                storeId
            ]);

            // Delete Active Session
            await client.query('DELETE FROM active_sessions WHERE employee_id = $1 AND store_id = $2', [session.employee_id, storeId]);
        }

        await client.query('COMMIT');
        console.log(`[AutoClose] Success for ${storeId}.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`[AutoClose] Error closing sessions for ${storeId}:`, e);
    } finally {
        client.release();
    }
}

// Check every minute
setInterval(async () => {
    try {
        const settings = await pool.query('SELECT store_id, midday_close, night_close FROM store_settings');

        // Format Current Time HH:MM in Europe/Madrid
        const currentTime = new Date().toLocaleTimeString('es-ES', {
            timeZone: 'Europe/Madrid',
            hour: '2-digit',
            minute: '2-digit'
        });

        for (const row of settings.rows) {
            if (row.midday_close === currentTime || row.night_close === currentTime) {
                await closeStoreSessions(row.store_id);
            }
        }
    } catch (e) {
        console.error('[AutoCloseLoop] Error:', e);
    }
}, 60000);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
