import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { initDb, pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize DB
initDb().then(() => {
    console.log('Database initialized successfully');
}).catch(err => {
    console.error('CRITICAL: DB Initialization failed!', err);
});

// --- API Routes ---

// 1. Employees
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, avatar, first_name as "firstName", last_name as "lastName", alias, email, 
                role, contract_hours as "contractHours", contract_type as "contractType", 
                username, password, is_buyer as "isBuyer", phone, address, "order"
            FROM employees 
            ORDER BY "order" ASC, id ASC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/employees', async (req, res) => {
    const { firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO employees (
                first_name, last_name, alias, email, role, contract_hours, contract_type, 
                username, password, is_buyer, phone, address, avatar
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar]
        );
        // Map back to camelCase for response
        const row = result.rows[0];
        res.json({
            id: row.id, firstName: row.first_name, lastName: row.last_name, alias: row.alias,
            email: row.email, role: row.role, contractHours: row.contract_hours, contractType: row.contract_type,
            username: row.username, password: row.password, isBuyer: row.is_buyer, phone: row.phone,
            address: row.address, order: row.order, avatar: row.avatar
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar, order } = req.body;
    try {
        const result = await pool.query(
            `UPDATE employees SET 
                first_name=$1, last_name=$2, alias=$3, email=$4, role=$5, contract_hours=$6, 
                contract_type=$7, username=$8, password=$9, is_buyer=$10, phone=$11, address=$12, 
                avatar=$13, "order"=$14 
            WHERE id=$15 RETURNING *`,
            [firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar, order || 0, id]
        );
        // Map back
        const row = result.rows[0];
        res.json({
            id: row.id, firstName: row.first_name, lastName: row.last_name, alias: row.alias,
            email: row.email, role: row.role, contractHours: row.contract_hours, contractType: row.contract_type,
            username: row.username, password: row.password, isBuyer: row.is_buyer, phone: row.phone,
            address: row.address, order: row.order, avatar: row.avatar
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
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/tasks', async (req, res) => {
    const { title, date, priority, status, assigned_to, description, recurring, recurring_frequency } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, date, priority, status, assigned_to, description, recurring, recurring_frequency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title, date, priority, status, assigned_to, description, recurring, recurring_frequency]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, date, priority, status, assigned_to, description, recurring, recurring_frequency } = req.body;
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
    try {
        const result = await pool.query(
            'INSERT INTO comments (task_id, user_id, text) VALUES ($1, $2, $3) RETURNING *',
            [id, user_id, text]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.get('/api/tasks/:id/comments', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT c.*, e.name as user_name, e.avatar as user_avatar FROM comments c JOIN employees e ON c.user_id = e.id WHERE c.task_id = $1 ORDER BY c.created_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
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

// 5. Product Families
app.get('/api/product-families', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM product_families ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/product-families', async (req, res) => {
    const { name, type, date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO product_families (name, type, date) VALUES ($1, $2, $3) RETURNING *',
            [name, type, date]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.delete('/api/product-families/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM product_families WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// --- 6. Productivity & Sessions (Restored) ---

// Active Sessions
app.get('/api/active-sessions', async (req, res) => {
    try {
        const result = await pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/active-sessions', async (req, res) => {
    const { employeeId, employeeName, startTime, clientStartTime } = req.body;
    try {
        await pool.query('INSERT INTO active_sessions (employee_id, employee_name, start_time, client_start_time) VALUES ($1, $2, $3, $4)', [employeeId, employeeName, startTime, clientStartTime || null]);
        res.json({ message: 'Session started' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    const { clientStartTime } = req.body;
    try {
        // Robust update handling whitespace
        const result = await pool.query('UPDATE active_sessions SET client_start_time = $1 WHERE TRIM(employee_id) = $2', [clientStartTime, displayId]);
        res.json({ message: 'Session updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    try {
        await pool.query('DELETE FROM active_sessions WHERE TRIM(employee_id) = $1', [displayId]);
        res.json({ message: 'Session ended' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily Records
app.get('/api/daily-records', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, employee_id as "employeeId", employee_name as "employeeName", start_time as "startTime", end_time as "endTime", duration_seconds as "durationSeconds", date, groups_count as "groups" FROM daily_records ORDER BY start_time DESC');
        const mapped = result.rows.map(r => ({ ...r, id: parseInt(r.id) })); // Keep employeeId as String
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/daily-records', async (req, res) => {
    const { id, employeeId, employeeName, startTime, endTime, durationSeconds, date, groups } = req.body;
    try {
        await pool.query(
            'INSERT INTO daily_records (id, employee_id, employee_name, start_time, end_time, duration_seconds, date, groups_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, employeeId, employeeName, startTime, endTime, durationSeconds, date, groups || 0]
        );
        res.json({ message: 'Record saved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    const { durationSeconds } = req.body;
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
    try {
        const result = await pool.query('SELECT * FROM daily_groups');
        // Map from SQL (underscore) to JS (camel/object)
        // Schema: key, standard, jewelry, recoverable, no_deal
        // Context expects object: { [key]: { standard, jewelry, recoverable, noDeal } } (Wait, context logic check)
        // Context code: `const groups = await res.json()` then `setDailyGroups`. It expects an object map or array.
        // Step 29 Context: `setDailyGroups(await groupsRes.json())`. And usage is `dailyGroups[key]`.
        // So I should return an Object Map: { "emp-date": { standard: 1... } }

        const map = {};
        result.rows.forEach(row => {
            map[row.key] = {
                standard: row.standard,
                jewelry: row.jewelry,
                recoverable: row.recoverable,
                noDeal: row.no_deal, // camelCase for frontend
                clientSeconds: row.client_seconds || 0
            };
        });
        res.json(map);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/daily-groups', async (req, res) => {
    const { key, data } = req.body;
    // data = { standard, jewelry, recoverable, noDeal }
    try {
        // Upsert
        const check = await pool.query('SELECT key FROM daily_groups WHERE key=$1', [key]);
        if (check.rows.length > 0) {
            await pool.query(
                'UPDATE daily_groups SET standard=$1, jewelry=$2, recoverable=$3, no_deal=$4, client_seconds=$5 WHERE key=$6',
                [data.standard || 0, data.jewelry || 0, data.recoverable || 0, data.noDeal || 0, data.clientSeconds || 0, key]
            );
        } else {
            await pool.query(
                'INSERT INTO daily_groups (key, standard, jewelry, recoverable, no_deal, client_seconds) VALUES ($1, $2, $3, $4, $5, $6)',
                [key, data.standard || 0, data.jewelry || 0, data.recoverable || 0, data.noDeal || 0, data.clientSeconds || 0]
            );
        }
        res.json({ message: 'Groups updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/daily-groups/:key', async (req, res) => {
    const { key } = req.params;
    try {
        await pool.query('DELETE FROM daily_groups WHERE key=$1', [key]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Day Incidents
app.get('/api/day-incidents', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM day_incidents');
        // Map to { date: text }
        const map = {};
        result.rows.forEach(r => map[r.date] = r.text);
        res.json(map);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/day-incidents', async (req, res) => {
    const { date, text } = req.body;
    try {
        const check = await pool.query('SELECT date FROM day_incidents WHERE date=$1', [date]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE day_incidents SET text=$1 WHERE date=$2', [text, date]);
        } else {
            await pool.query('INSERT INTO day_incidents (date, text) VALUES ($1, $2)', [date, text]);
        }
        res.json({ message: 'Incident saved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/no-deals', async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = 'SELECT * FROM no_deal_details';
        const params = [];
        if (start && end) {
            query += ' WHERE date >= $1 AND date <= $2';
            params.push(start, end);
        }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/no-deals', async (req, res) => {
    const { date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO no_deal_details (date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/no-deals/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Details to know who/when (needed for decrementing stats)
        const check = await client.query('SELECT date, employee_id FROM no_deal_details WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Record not found' });
        }
        const { date, employee_id } = check.rows[0];

        // 2. Delete Detail
        await client.query('DELETE FROM no_deal_details WHERE id = $1', [id]);

        // 3. Decrement Count in daily_groups
        const key = `${employee_id}-${date}`;
        await client.query(`
            UPDATE daily_groups 
            SET no_deal = GREATEST(0, no_deal - 1) 
            WHERE key = $1
        `, [key]);

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
    // ... (keep existing code, just context)
    const { imei } = req.body;
    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    // ... existing imei logic ...
    // Note: I will just overwrite the whole block to be safe or use proper ranges. 
    // Actually, I'll append the new code AFTER the security block to avoid messing with it.
    // Wait, the user asked to ADD, so I will append.
    // I need to return the EXISTING content for the match, then add the new stuff.
    // Let's just REPLACE the end of the file or insert before the aggregator.
    // BETTER: Insert BEFORE the Market Link Aggregator, keeping IMEI check intact.

    if (!imei || imei.length < 15) {
        return res.json({ status: 'INVALID', message: 'IMEI inválido (15 dígitos mín)' });
    }

    if (imei.endsWith('000')) {
        return res.json({
            status: 'BLOCKED',
            message: 'Reportado como ROBO/PÉRDIDA',
            details: 'Policía Nacional / GSMA Blacklist',
            risk: 'CRITICAL'
        });
    }

    if (imei.endsWith('111')) {
        return res.json({
            status: 'CAUTION',
            message: 'Posible financiación pendiente',
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

// --- 9. Gold Price Scraper (New) ---
let goldPriceCache = { timestamp: 0, data: null };

app.get('/api/gold-prices', async (req, res) => {
    // 1 hour cache
    if (Date.now() - goldPriceCache.timestamp < 3600000 && goldPriceCache.data) {
        return res.json(goldPriceCache.data);
    }

    let browser;
    try {
        console.log('[GoldScraper] Starting scrape...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 1. Andorrano
        let andorranoPrice = null;
        try {
            await page.goto('https://www.andorrano-joyeria.com/vender-oro', { waitUntil: 'domcontentloaded', timeout: 30000 });
            // Selector: .quilates:nth-of-type(4) .cotizacion
            andorranoPrice = await page.evaluate(() => {
                try {
                    const el = document.querySelector('.quilates:nth-of-type(4) .cotizacion');
                    return el ? el.innerText.trim() : null;
                } catch (e) { return null; }
            });
        } catch (e) { console.error('Andorrano fail', e.message); }

        // 2. QuickGold (Optimized: Direct Visible Price > 100g - 0.35)
        let quickGoldPrice = null;
        try {
            // Use the main text page which renders the >100g price immediately
            await page.goto('https://quickgold.es/vender-oro/compro-oro-sevilla/', { waitUntil: 'domcontentloaded', timeout: 30000 });

            // The price is in a <p> with class containing "conversor_precio18k"
            // Example: <p class="conversor_precio18k__tEwgL">81.70<span> €/g</span></p>
            // We use a CSS attribute selector for robustness against hash changes
            await page.waitForSelector('p[class*="conversor_precio18k"]', { timeout: 5000 });

            quickGoldPrice = await page.evaluate(() => {
                try {
                    const el = document.querySelector('p[class*="conversor_precio18k"]');
                    if (!el) return null;
                    // Get text (e.g. "81.70 €/g") and parse
                    const text = el.innerText.replace('€/g', '').replace(',', '.').trim();
                    const val = parseFloat(text);
                    if (isNaN(val)) return null;

                    // Logic: Visible price is for >100g. We subtract 0.35 for <100g price.
                    return (val - 0.35).toFixed(2);
                } catch (e) { return null; }
            });

        } catch (e) { console.error('QuickGold optimized fail', e.message); }

        const result = {
            andorrano: andorranoPrice || 'N/A',
            quickgold: quickGoldPrice || 'N/A',
            timestamp: Date.now()
        };

        goldPriceCache = { timestamp: Date.now(), data: result };
        res.json(result);

    } catch (error) {
        console.error('Scraper error:', error);
        res.status(500).json({ error: 'Failed to scrape prices' });
    } finally {
        if (browser) await browser.close();
    }
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
