import 'dotenv/config';
process.env.NODE_ENV = 'production'; // Forced Restart v4 (Interviewer Migration)

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initDb, pool } from './db.js';

// ─── Route Modules ────────────────────────────────────────────────────────────
import authRouter from './routes/auth.js';
import employeesRouter from './routes/employees.js';
import gamificationRouter from './routes/gamification.js';
import productivityRouter from './routes/productivity.js';
import settingsRouter from './routes/settings.js';
import rolesRouter from './routes/roles.js';
import tasksRouter from './routes/tasks.js';
import productFamiliesRouter from './routes/product-families.js';
import closedDaysRouter from './routes/closed-days.js';
import marketPricesRouter from './routes/market-prices.js';
import dashboardRouter from './routes/dashboard.js';
import operationalRouter from './routes/operational.js';
import gerenciaRouter from './routes/gerencia.js';
import taskBatteriesRouter from './routes/task-batteries.js';

// --- Cryptographic Shielding (Fail-Fast) ---
import './utils/crypto.js'; 
import { decryptResponseMiddleware } from './middleware/decryptResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Intercept and decrypt responses automatically
app.use(decryptResponseMiddleware);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://tiktak-manager.vercel.app',
    'https://tiktak-manager.onrender.com',
    'https://productividad.onrender.com'
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// ─── DB Init & Password Migration ─────────────────────────────────────────────
import { encrypt, decrypt, generateBlindIndex } from './utils/crypto.js';

async function migratePasswords() {
    try {
        const res = await pool.query('SELECT id, password FROM employees');
        let migrated = 0;
        for (const emp of res.rows) {
            if (emp.password && !emp.password.startsWith('$2') && emp.password.length < 50) {
                const hash = await bcrypt.hash(emp.password, 10);
                await pool.query('UPDATE employees SET password = $1 WHERE id = $2', [hash, emp.id]);
                migrated++;
            }
        }
        if (migrated > 0) console.log(`[SECURITY] Migrated ${migrated} passwords to Bcrypt hashes.`);
    } catch (e) { console.error('Password migration error:', e); }
}

async function migrateEncryptedData() {
    try {
        const res = await pool.query('SELECT * FROM employees');
        let migratedCount = 0;
        for (const emp of res.rows) {
            const fields = ['first_name', 'last_name', 'alias', 'email', 'username', 'phone', 'address'];
            const bindexes = ['first_name', 'last_name', 'email', 'username'];
            
            let needsUpdate = false;
            const values = [];
            const setClauses = [];
            let argIdx = 1;

            for (const f of fields) {
                if (emp[f] && typeof emp[f] === 'string' && !emp[f].includes(':')) {
                    setClauses.push(`${f} = $${argIdx++}`);
                    values.push(encrypt(emp[f]));
                    needsUpdate = true;
                }
            }
            
            for (const f of bindexes) {
                const currentVal = emp[f];
                if (currentVal && !emp[`${f}_bindex`]) {
                    const clearText = currentVal.includes(':') ? decrypt(currentVal) : currentVal;
                    setClauses.push(`${f}_bindex = $${argIdx++}`);
                    values.push(generateBlindIndex(clearText));
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                values.push(emp.id);
                await pool.query(`UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${argIdx}`, values);
                migratedCount++;
            }
        }
        if (migratedCount > 0) console.log(`[SECURITY] Encrypted/Indexed ${migratedCount} employee records.`);
    } catch (e) { console.error('Data migration error:', e); }
}

initDb().then(async () => {
    console.log('Database initialized successfully');
    await migratePasswords();
    await migrateEncryptedData();
}).catch(err => {
    console.error('CRITICAL: DB Initialization failed!', err);
});

// ─── Schema Migrations (auto-run on startup) ──────────────────────────────────
(async () => {
    try {
        await pool.query('ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS midday_close TEXT');
        await pool.query('ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS night_close TEXT');
        await pool.query('ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement TEXT');
        console.log('Schema: closing-hours and announcement columns ensured.');
    } catch (e) { console.log('Schema check skipped (store_settings):', e.message); }
})();

(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transaction_logs (
                id SERIAL PRIMARY KEY,
                store_id TEXT NOT NULL,
                employee_id TEXT NOT NULL,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                type TEXT,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Schema: transaction_logs table ensured.');
    } catch (e) { console.error('Schema error (transaction_logs):', e); }
})();

(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS market_prices (
                id SERIAL PRIMARY KEY,
                store_id TEXT NOT NULL,
                category TEXT NOT NULL,
                brand TEXT,
                model TEXT,
                price_a NUMERIC,
                price_b NUMERIC,
                price_c NUMERIC,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Schema: market_prices table ensured.');
    } catch (e) { console.error('Schema error (market_prices):', e); }
})();

(async () => {
    try {
        await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS gamification JSONB DEFAULT '{}'");
        await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_interviewer BOOLEAN DEFAULT FALSE");
        await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE");
        console.log('Schema: gamification, is_interviewer and is_active columns ensured in employees table.');
    } catch (e) { console.error('Schema error (employees migration):', e); }
})();

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', authRouter);                        // POST /api/login
app.use('/api/employees', employeesRouter);          // /api/employees/*
app.use('/api/gamification', gamificationRouter);    // /api/gamification/*
app.use('/api', productivityRouter);                 // /api/sync/productivity, /api/active-sessions, /api/daily-records, etc.
app.use('/api/settings', settingsRouter);                     // /api/settings/*, /api/settings/gold
app.use('/api/roles', rolesRouter);                  // /api/roles/*
app.use('/api/tasks', tasksRouter);                  // /api/tasks/*
app.use('/api/product-families', productFamiliesRouter); // /api/product-families/*
app.use('/api/closed-days', closedDaysRouter);       // /api/closed-days/*
app.use('/api/market-prices', marketPricesRouter);   // /api/market-prices/*
app.use('/api/dashboard', dashboardRouter);          // /api/dashboard
app.use('/api', operationalRouter);                  // /api/day-incidents, /api/no-deals, /api/locations, /api/market/search, /api/diagnostics/*, /api/security/*
app.use('/api/gerencia', gerenciaRouter);
app.use('/api/task-batteries', taskBatteriesRouter);

// ─── Auto-Close Shifts Cron (every 60s) ───────────────────────────────────────
setInterval(async () => {
    try {
        const now = new Date();
        const nowEsp = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
        const h = nowEsp.getHours().toString().padStart(2, '0');
        const m = nowEsp.getMinutes().toString().padStart(2, '0');
        const currentHHMM = `${h}:${m}`;

        const settingsRes = await pool.query('SELECT store_id, midday_close, night_close FROM store_settings');

        for (let setting of settingsRes.rows) {
            if ((setting.midday_close && setting.midday_close === currentHHMM) ||
                (setting.night_close && setting.night_close === currentHHMM)) {

                const activeRes = await pool.query('SELECT * FROM active_sessions WHERE store_id = $1', [setting.store_id]);
                if (activeRes.rows.length === 0) continue;

                console.log(`[Auto-Close] Store ${setting.store_id} reached closing time: ${currentHHMM}. Closing ${activeRes.rows.length} sessions.`);

                for (let session of activeRes.rows) {
                    const start = new Date(session.start_time);
                    const end = now;
                    let durationSeconds = Math.max(0, (end - start) / 1000);
                    if (isNaN(durationSeconds)) durationSeconds = 0;

                    const dateStr = start.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
                    const recordId = Date.now() + Math.floor(Math.random() * 10000);

                    await pool.query(
                        'INSERT INTO daily_records (id, employee_id, employee_name, start_time, end_time, duration_seconds, date, groups_count, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                        [recordId, session.employee_id, session.employee_name, session.start_time, end.toISOString(), durationSeconds, dateStr, 0, setting.store_id]
                    );
                    await pool.query('DELETE FROM active_sessions WHERE employee_id = $1 AND store_id = $2', [session.employee_id, setting.store_id]);

                    if (session.client_start_time) {
                        await pool.query(
                            'INSERT INTO transaction_logs (store_id, employee_id, start_time, end_time, type, details) VALUES ($1, $2, $3, $4, $5, $6)',
                            [setting.store_id, session.employee_id, session.client_start_time, end.toISOString(), 'shopping', JSON.stringify({ action: 'shift_end_auto_stop_backend' })]
                        );
                    }
                }
            }
        }
    } catch (err) {
        console.error('[Auto-Close Error]', err);
    }
}, 60000);

// ─── Static Files (React build) ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../dist')));
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[GLOBAL ERROR] ${req.method} ${req.url}:`, err);
    res.status(500).json({ 
        error: 'Error interno del servidor (Global)', 
        message: err.message, 
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('🚀 TikTak 2.1 PRODUCTION SERVER STARTING');
    console.log(`✅ Port: ${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log('==========================================');
});
