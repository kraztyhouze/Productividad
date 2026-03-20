import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Helper: calculate time-based statistics from logs
function calculateTimeStats(logs) {
    if (!logs || logs.length === 0) return { totalSeconds: 0, avgSeconds: 0, maxSeconds: 0 };
    let total = 0, max = 0;
    logs.forEach(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        const dur = Math.max(0, (end - start) / 1000);
        if (!isNaN(dur)) { total += dur; if (dur > max) max = dur; }
    });
    return { totalSeconds: Math.floor(total), avgSeconds: Math.floor(total / logs.length), maxSeconds: Math.floor(max) };
}

// Helper: calculate hourly stats from logs
function calculateHourlyStats(logs) {
    const hourly = {};
    (logs || []).forEach(log => {
        const h = new Date(log.start_time).getHours();
        hourly[h] = (hourly[h] || 0) + 1;
    });
    return hourly;
}

const getDashboardData = async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { date, month } = req.query;
    
    try {
        const response = {};
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

        // --- HELPER: Max Concurrent Calculation ---
        const getMaxConcurrent = async (targetDate) => {
            // Check if day is closed and has max_concurrent stored
            const closedRes = await pool.query('SELECT max_concurrent FROM closed_days WHERE store_id = $1 AND date = $2', [storeId, targetDate]);
            if (closedRes.rows.length > 0 && closedRes.rows[0].max_concurrent > 0) {
                return closedRes.rows[0].max_concurrent;
            }

            // Otherwise calculate from transaction logs
            const logsRes = await pool.query(
                "SELECT start_time, end_time FROM transaction_logs WHERE store_id = $1 AND start_time::date = $2 AND type = 'shopping'",
                [storeId, targetDate]
            );
            const events = [];
            logsRes.rows.forEach(l => {
                events.push({ time: new Date(l.start_time).getTime(), type: 1 });
                events.push({ time: new Date(l.end_time).getTime(), type: -1 });
            });
            events.sort((a, b) => a.time - b.time || b.type - a.type);
            let max = 0, current = 0;
            events.forEach(e => {
                current += e.type;
                if (current > max) max = current;
            });
            return max;
        };

        if (month) {
            // Stats for whole month from daily_groups
            // daily_groups key is "ID-YYYY-MM-DD"
            const result = await pool.query(
                `SELECT 
                    split_part(key, '-', 1) as id, 
                    SUM(standard + jewelry + recoverable) as groups, 
                    SUM(client_seconds) as client_seconds,
                    AVG(NULLIF(standard + jewelry + recoverable, 0) / NULLIF(client_seconds / 3600.0, 0)) as efficiency
                 FROM daily_groups 
                 WHERE store_id = $1 AND key LIKE $2 
                 GROUP BY split_part(key, '-', 1)`,
                [storeId, `%-${month}-%`]
            );

            // Best day of the month
            const bestDayRes = await pool.query(
                `SELECT split_part(key, '-', 2) || '-' || split_part(key, '-', 3) || '-' || split_part(key, '-', 4) as day, 
                        SUM(standard + jewelry + recoverable) as total
                 FROM daily_groups 
                 WHERE store_id = $1 AND key LIKE $2
                 GROUP BY day ORDER BY total DESC LIMIT 1`,
                [storeId, `%-${month}-%`]
            );

            response.monthlyTop = result.rows.map(r => ({
                id: r.id,
                groups: parseInt(r.groups || 0),
                clientSeconds: parseInt(r.client_seconds || 0),
                efficiency: parseFloat(r.efficiency || 0)
            }));
            
            response.monthStats = { 
                totalGroups: result.rows.reduce((a, b) => a + parseInt(b.groups || 0), 0),
                maxDailyGroups: bestDayRes.rows.length > 0 ? parseInt(bestDayRes.rows[0].total) : 0
            };
            return res.json(response);
        }

        const dateStr = date || todayStr;

        // Daily Groups Breakdown
        const groupsRes = await pool.query(
            "SELECT * FROM daily_groups WHERE store_id = $1 AND key LIKE $2",
            [storeId, `%-${dateStr}`]
        );

        let totalG = 0, jG = 0, sG = 0, rG = 0, nG = 0, cSec = 0;
        const employeeGroups = {};

        groupsRes.rows.forEach(row => {
            const groups = (row.standard || 0) + (row.jewelry || 0) + (row.recoverable || 0);
            totalG += groups;
            jG += (row.jewelry || 0);
            sG += (row.standard || 0);
            rG += (row.recoverable || 0);
            nG += (row.no_deal || 0);
            cSec += (row.client_seconds || 0);
            employeeGroups[row.key] = {
                standard: row.standard,
                jewelry: row.jewelry,
                recoverable: row.recoverable,
                noDeal: row.no_deal,
                clientSeconds: row.client_seconds
            };
        });

        // Shift Time Records
        const recordsRes = await pool.query('SELECT * FROM daily_records WHERE store_id = $1 AND date = $2', [storeId, dateStr]);
        
        // Active Sessions
        const activeRes = await pool.query('SELECT * FROM active_sessions WHERE store_id = $1', [storeId]);
        const activeSessionsList = activeRes.rows.map(s => ({
            employeeId: s.employee_id,
            employeeName: s.employee_name,
            startTime: s.start_time,
            clientStartTime: s.client_start_time
        }));

        // Hourly distribution
        const hourlyRes = await pool.query(
            `SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as count 
             FROM transaction_logs 
             WHERE store_id = $1 AND start_time::date = $2 AND type = 'shopping'
             GROUP BY hour`,
            [storeId, dateStr]
        );
        const hourlyMap = {};
        hourlyRes.rows.forEach(r => hourlyMap[parseInt(r.hour)] = parseInt(r.count));

        // Max Concurrent
        const maxConcurrent = await getMaxConcurrent(dateStr);

        response.totalGroups = totalG;
        response.groupsBreakdown = { jewelry: jG, standard: sG, recoverable: rG, noDeal: nG };
        response.timeStats = { 
            unionSeconds: cSec,
            maxConcurrent: maxConcurrent
        };
        response.hourlyStats = { hourly: hourlyMap };
        response.dailyStats = {
            dailyRecords: recordsRes.rows,
            activeSessions: activeSessionsList,
            employeeGroups: employeeGroups,
            totalGroups: totalG
        };

        res.json(response);
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Support both / and /stats
router.get('/', getDashboardData);
router.get('/stats', getDashboardData);

export default router;
