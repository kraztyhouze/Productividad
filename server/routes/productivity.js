import express from 'express';
import { pool } from '../db.js';
import { recalculateGamification } from './helpers/gamification.js';

const router = express.Router();

// --- GHOST SESSION CLEANUP: Auto-close sessions from previous days ---
async function cleanupGhostSessions(storeId) {
    try {
        // Find sessions that started before today (Madrid timezone)
        const ghostResult = await pool.query(
            `SELECT TRIM(employee_id) as employee_id, employee_name, start_time
             FROM active_sessions
             WHERE store_id = $1
               AND start_time::date < (NOW() AT TIME ZONE 'Europe/Madrid')::date`,
            [storeId]
        );

        if (ghostResult.rows.length === 0) return;

        console.log(`[GhostCleanup] Found ${ghostResult.rows.length} ghost session(s) for store ${storeId}`);

        for (const session of ghostResult.rows) {
            const startTime = new Date(session.start_time);
            const sessionDate = startTime.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
            
            // End time = 23:59:59 of the day the session started (Madrid time)
            const endOfDay = new Date(startTime);
            endOfDay.setHours(23, 59, 59, 999);
            
            const durationSeconds = Math.round((endOfDay - startTime) / 1000);
            const recordId = Date.now() + Math.floor(Math.random() * 10000);

            // Create a daily record for that past day (only if no record already exists for that employee/date)
            const existingRecord = await pool.query(
                'SELECT id FROM daily_records WHERE TRIM(employee_id) = $1 AND date = $2 AND store_id = $3 LIMIT 1',
                [session.employee_id, sessionDate, storeId]
            );
            if (existingRecord.rows.length === 0) {
                await pool.query(
                    `INSERT INTO daily_records (id, employee_id, employee_name, start_time, end_time, duration_seconds, date, groups_count, store_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [recordId, session.employee_id, session.employee_name, session.start_time, endOfDay.toISOString(), durationSeconds, sessionDate, 0, storeId]
                );
            }

            // Delete the ghost session
            await pool.query(
                'DELETE FROM active_sessions WHERE TRIM(employee_id) = $1 AND store_id = $2',
                [session.employee_id, storeId]
            );

            console.log(`[GhostCleanup] Closed ghost session for ${session.employee_name} (${session.employee_id}), date ${sessionDate}, duration ${Math.round(durationSeconds / 3600)}h`);
        }
    } catch (err) {
        console.error('[GhostCleanup] Error during cleanup:', err.message);
    }
}

// --- SYNC ENDPOINT (Performance Optimization) ---
router.get('/sync/productivity', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // Auto-cleanup ghost sessions (sessions from previous days) before returning data
        await cleanupGhostSessions(storeId);

        const [sessions, records, groups, closed, incidents, families, logs] = await Promise.all([
            pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions WHERE store_id = $1', [storeId]),
            pool.query("SELECT id, employee_id as \"employeeId\", employee_name as \"employeeName\", start_time as \"startTime\", end_time as \"endTime\", duration_seconds as \"durationSeconds\", date, groups_count as \"groups\" FROM daily_records WHERE store_id = $1 AND (date >= to_char(NOW() - INTERVAL '30 days', 'YYYY-MM-DD') OR date IS NULL) ORDER BY start_time DESC", [storeId]),
            pool.query("SELECT key, standard, jewelry, recoverable, no_deal, client_seconds FROM daily_groups WHERE store_id = $1 AND (RIGHT(key, 10) >= to_char(NOW() - INTERVAL '30 days', 'YYYY-MM-DD') OR key NOT LIKE '%-202%')", [storeId]),
            pool.query('SELECT date FROM closed_days WHERE store_id = $1', [storeId]),
            pool.query('SELECT date, text FROM day_incidents WHERE store_id = $1', [storeId]),
            pool.query('SELECT id, name, type, date FROM product_families WHERE store_id = $1 ORDER BY id DESC', [storeId]),
            pool.query("SELECT id, store_id, employee_id, start_time, end_time, type, details FROM transaction_logs WHERE store_id = $1 ORDER BY start_time DESC LIMIT 100", [storeId])
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
            productFamilies: families.rows,
            transactionLogs: logs.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Active Sessions
router.get('/active-sessions', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions WHERE store_id = $1', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/active-sessions', async (req, res) => {
    const { employeeId, employeeName, startTime, clientStartTime } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query('INSERT INTO active_sessions (employee_id, employee_name, start_time, client_start_time, store_id) VALUES ($1, $2, $3, $4, $5)', [employeeId, employeeName, startTime, clientStartTime || null, storeId]);
        res.json({ message: 'Session started' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    const { clientStartTime, startTime } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        let query = 'UPDATE active_sessions SET ';
        const params = [];
        let pIndex = 1;

        if (clientStartTime !== undefined) {
            query += `client_start_time = $${pIndex++}, `;
            params.push(clientStartTime);
        }
        if (startTime !== undefined) {
            query += `start_time = $${pIndex++}, `;
            params.push(startTime);
        }

        if (params.length === 0) return res.json({ message: 'No updates provided' });

        query = query.slice(0, -2);
        query += ` WHERE TRIM(employee_id) = $${pIndex++} AND store_id = $${pIndex}`;
        params.push(displayId, storeId);

        await pool.query(query, params);
        res.json({ message: 'Session updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query('DELETE FROM active_sessions WHERE TRIM(employee_id) = $1 AND store_id = $2', [displayId, storeId]);
        res.json({ message: 'Session ended' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily Records
router.get('/daily-records', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT id, employee_id as "employeeId", employee_name as "employeeName", start_time as "startTime", end_time as "endTime", duration_seconds as "durationSeconds", date, groups_count as "groups" FROM daily_records WHERE store_id = $1 ORDER BY start_time DESC', [storeId]);
        const mapped = result.rows.map(r => ({ ...r, id: parseInt(r.id) }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/daily-records', async (req, res) => {
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

router.put('/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    const { durationSeconds, endTime, groups } = req.body;
    try {
        await pool.query(
            'UPDATE daily_records SET duration_seconds=$1, end_time=$2, groups_count=$3 WHERE id=$4',
            [durationSeconds, endTime, groups || 0, id]
        );
        res.json({ message: 'Record updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT employee_id FROM daily_records WHERE id = $1', [id]);
        if (check.rows.length > 0) {
            const empId = String(check.rows[0].employee_id).trim();
            await pool.query('DELETE FROM daily_records WHERE id = $1', [id]);
            // Recalculate
            await recalculateGamification(empId);
        }
        res.json({ message: 'Record deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily Groups
router.get('/daily-groups', async (req, res) => {
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

// --- DAILY GROUPS (Fairness Logic + Coins) ---
router.post('/daily-groups', async (req, res) => {
    const { key, data } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const employeeId = key.split('-')[0];

    try {
        const check = await pool.query('SELECT * FROM daily_groups WHERE key=$1', [key]);

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

        // --- GAMIFICATION: RECALCULATE ---
        await recalculateGamification(employeeId);

        res.json({ message: 'Groups updated', success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/daily-groups/:key', async (req, res) => {
    const { key } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const employeeId = key.split('-')[0];

    try {
        const check = await pool.query('SELECT * FROM daily_groups WHERE TRIM(key)=$1 AND store_id=$2', [key.trim(), storeId]);
        if (check.rows.length > 0) {
            await pool.query('DELETE FROM daily_groups WHERE TRIM(key)=$1 AND store_id=$2', [key.trim(), storeId]);
            // Recalculate everything
            await recalculateGamification(employeeId.trim());
            res.json({ message: 'Groups deleted and XP adjusted' });
        } else {
            res.json({ message: 'Record not found' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSACTION LOGS (XP + Coins) ---
router.post('/transaction-logs', async (req, res) => {
    const { employeeId, startTime, endTime, type, details } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query(
            'INSERT INTO transaction_logs (store_id, employee_id, start_time, end_time, type, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [storeId, employeeId, startTime, endTime, type, details]
        );

        let responseData = { success: true };

        // Award XP & Coins for Sales
        if (['standard', 'jewelry', 'recoverable'].includes(type) || (details && JSON.parse(details).reason)) {
            if (['standard', 'jewelry', 'recoverable'].includes(type)) { // Strict sales check
                const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
                if (empRes.rows.length > 0) {
                    let g = empRes.rows[0].gamification || {};
                    const currentXP = parseInt(g.xp || 0);

                    const newXP = currentXP + 50;
                    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
                    const maxLevel = parseInt(g.maxLevel || 1);

                    g.xp = newXP;
                    g.level = newLevel;

                    let rewardGranted = false;
                    // Reward Check: Only if newLevel > maxLevel
                    if (newLevel > maxLevel) {
                        g.maxLevel = newLevel;
                        g.pendingRewards = (parseInt(g.pendingRewards) || 0) + 1;
                        g.coins = (parseInt(g.coins || 0)) + 1010; // 10 base + 1000 Level Up Bonus
                        rewardGranted = true;
                    } else {
                        g.coins = (parseInt(g.coins || 0)) + 10;
                    }

                    await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
                    responseData = { success: true, xp: newXP, level: newLevel, coins: g.coins, reward: rewardGranted };
                }
            }
        }
        res.json(responseData);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/transaction-logs', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'SELECT id, store_id, employee_id, start_time, end_time, type, details FROM transaction_logs WHERE store_id = $1 ORDER BY start_time DESC LIMIT 100',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/transaction-logs/employee/:employeeId/:date', async (req, res) => {
    const { employeeId, date } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query(
            "DELETE FROM transaction_logs WHERE TRIM(employee_id) = $1 AND store_id = $2 AND start_time::text LIKE $3",
            [employeeId.trim(), storeId, `${date}%`]
        );
        res.json({ message: 'Logs deleted for employee on date' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
