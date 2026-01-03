import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Active Sessions ---
app.get('/api/active-sessions', async (req, res) => {
    const db = await getDb();
    const sessions = await db.all('SELECT * FROM active_sessions');
    // Initialize context expects specific keys (camelCase vs snake_case in DB)
    // We should map them.
    const mapped = sessions.map(s => ({
        employeeId: s.employee_id,
        employeeName: s.employee_name,
        startTime: s.start_time
    }));
    res.json(mapped);
});

app.post('/api/active-sessions', async (req, res) => {
    const { employeeId, employeeName, startTime } = req.body;
    const db = await getDb();
    try {
        await db.run(
            'INSERT INTO active_sessions (employee_id, employee_name, start_time) VALUES (?, ?, ?)',
            [employeeId, employeeName, startTime]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            // Already exists, ignore or update? Logic says ignore based on frontend check
            res.status(200).json({ success: false, message: 'Session already active' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.delete('/api/active-sessions/:employeeId', async (req, res) => {
    const db = await getDb();
    await db.run('DELETE FROM active_sessions WHERE employee_id = ?', [req.params.employeeId]);
    res.json({ success: true });
});


// --- Daily Records ---
app.get('/api/daily-records', async (req, res) => {
    const db = await getDb();
    const records = await db.all('SELECT * FROM daily_records ORDER BY start_time DESC');
    // Map back to camelCase
    const mapped = records.map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        startTime: r.start_time,
        endTime: r.end_time,
        durationSeconds: r.duration_seconds,
        date: r.date,
        groups: r.groups_count
    }));
    res.json(mapped);
});

app.post('/api/daily-records', async (req, res) => {
    const r = req.body;
    const db = await getDb();
    await db.run(
        `INSERT INTO daily_records 
        (id, employee_id, employee_name, start_time, end_time, duration_seconds, date, groups_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.employeeId, r.employeeName, r.startTime, r.endTime, r.durationSeconds, r.date, r.groups || 0]
    );
    res.json({ success: true });
});

app.put('/api/daily-records/:id', async (req, res) => {
    const { durationSeconds } = req.body;
    const db = await getDb();
    await db.run(
        'UPDATE daily_records SET duration_seconds = ? WHERE id = ?',
        [durationSeconds, req.params.id]
    );
    res.json({ success: true });
});

app.delete('/api/daily-records/:id', async (req, res) => {
    const db = await getDb();
    await db.run('DELETE FROM daily_records WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});


// --- Daily Groups ---
app.get('/api/daily-groups', async (req, res) => {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM daily_groups');
    // Convert array to object { key: { standard, jewelry, recoverable } }
    const result = {};
    rows.forEach(row => {
        result[row.key] = {
            standard: row.standard,
            jewelry: row.jewelry,
            recoverable: row.recoverable
        };
    });
    res.json(result);
});

app.post('/api/daily-groups', async (req, res) => {
    const { key, data } = req.body; // data: { standard, jewelry, recoverable }
    const db = await getDb();
    // Upsert equivalent
    await db.run(
        `INSERT INTO daily_groups (key, standard, jewelry, recoverable) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
            standard = excluded.standard,
            jewelry = excluded.jewelry,
            recoverable = excluded.recoverable`,
        [key, data.standard || 0, data.jewelry || 0, data.recoverable || 0]
    );
    res.json({ success: true });
});


// --- Closed Days ---
app.get('/api/closed-days', async (req, res) => {
    const db = await getDb();
    const rows = await db.all('SELECT date FROM closed_days');
    res.json(rows.map(r => r.date));
});

app.post('/api/closed-days', async (req, res) => {
    const { date } = req.body;
    const db = await getDb();
    try {
        await db.run('INSERT INTO closed_days (date) VALUES (?)', [date]);
        res.json({ success: true });
    } catch {
        // start silently if duplicate
        res.json({ success: true });
    }
});

app.delete('/api/closed-days/:date', async (req, res) => {
    const db = await getDb();
    await db.run('DELETE FROM closed_days WHERE date = ?', [req.params.date]);
    res.json({ success: true });
});


// --- Incidents ---
app.get('/api/day-incidents', async (req, res) => {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM day_incidents');
    const result = {};
    rows.forEach(r => {
        result[r.date] = r.text;
    });
    res.json(result);
});

app.post('/api/day-incidents', async (req, res) => {
    const { date, text } = req.body;
    const db = await getDb();
    await db.run(
        `INSERT INTO day_incidents (date, text) VALUES (?, ?)
        ON CONFLICT(date) DO UPDATE SET text = excluded.text`,
        [date, text]
    );
    res.json({ success: true });
});


// --- Serve Frontend (Production/Docker) ---
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
