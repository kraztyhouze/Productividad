import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize DB on start
initDb();

// --- Active Sessions ---
app.get('/api/active-sessions', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM active_sessions');
        const mapped = rows.map(s => ({
            employeeId: s.employee_id,
            employeeName: s.employee_name,
            startTime: s.start_time
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/active-sessions', async (req, res) => {
    const { employeeId, employeeName, startTime } = req.body;
    try {
        await query(
            'INSERT INTO active_sessions (employee_id, employee_name, start_time) VALUES ($1, $2, $3)',
            [employeeId, employeeName, startTime]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        // Unique violation code in Postgres is 23505
        if (err.code === '23505') {
            res.status(200).json({ success: false, message: 'Session already active' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.delete('/api/active-sessions/:employeeId', async (req, res) => {
    try {
        await query('DELETE FROM active_sessions WHERE employee_id = $1', [req.params.employeeId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }) }
});


// --- Daily Records ---
app.get('/api/daily-records', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM daily_records ORDER BY start_time DESC');
        const mapped = rows.map(r => ({
            id: Number(r.id), // BIGINT comes as string in PG client sometimes, safe cast to number for JS
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            startTime: r.start_time,
            endTime: r.end_time,
            durationSeconds: r.duration_seconds,
            date: r.date,
            groups: r.groups_count
        }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/daily-records', async (req, res) => {
    const r = req.body;
    try {
        await query(
            `INSERT INTO daily_records 
            (id, employee_id, employee_name, start_time, end_time, duration_seconds, date, groups_count) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [r.id, r.employeeId, r.employeeName, r.startTime, r.endTime, r.durationSeconds, r.date, r.groups || 0]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/daily-records/:id', async (req, res) => {
    const { durationSeconds } = req.body;
    try {
        await query(
            'UPDATE daily_records SET duration_seconds = $1 WHERE id = $2',
            [durationSeconds, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.delete('/api/daily-records/:id', async (req, res) => {
    try {
        await query('DELETE FROM daily_records WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }) }
});


// --- Daily Groups ---
app.get('/api/daily-groups', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM daily_groups');
        const result = {};
        rows.forEach(row => {
            result[row.key] = {
                standard: row.standard,
                jewelry: row.jewelry,
                recoverable: row.recoverable
            };
        });
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/daily-groups', async (req, res) => {
    const { key, data } = req.body;
    try {
        await query(
            `INSERT INTO daily_groups (key, standard, jewelry, recoverable) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT(key) DO UPDATE SET
                standard = excluded.standard,
                jewelry = excluded.jewelry,
                recoverable = excluded.recoverable`,
            [key, data.standard || 0, data.jewelry || 0, data.recoverable || 0]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }) }
});


// --- Closed Days ---
app.get('/api/closed-days', async (req, res) => {
    try {
        const { rows } = await query('SELECT date FROM closed_days');
        res.json(rows.map(r => r.date));
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/closed-days', async (req, res) => {
    const { date } = req.body;
    try {
        await query('INSERT INTO closed_days (date) VALUES ($1)', [date]);
        res.json({ success: true });
    } catch (err) {
        // Ignore duplicate key error (23505)
        if (err.code === '23505') res.json({ success: true });
        else res.status(500).json({ error: err.message });
    }
});

app.delete('/api/closed-days/:date', async (req, res) => {
    try {
        await query('DELETE FROM closed_days WHERE date = $1', [req.params.date]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }) }
});


// --- Incidents ---
app.get('/api/day-incidents', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM day_incidents');
        const result = {};
        rows.forEach(r => {
            result[r.date] = r.text;
        });
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/day-incidents', async (req, res) => {
    const { date, text } = req.body;
    try {
        await query(
            `INSERT INTO day_incidents (date, text) VALUES ($1, $2)
            ON CONFLICT(date) DO UPDATE SET text = excluded.text`,
            [date, text]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }) }
});


// --- Health Check (para Railway/Docker) ---
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// --- Serve Frontend (Production/Docker) ---
app.use(express.static(path.join(__dirname, '../dist')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
