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
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (month) {
            // Stats for whole month
            const result = await pool.query(
                `SELECT employee_id as id, SUM(groups_count) as groups, SUM(duration_seconds) as client_seconds 
                 FROM daily_records 
                 WHERE store_id = $1 AND date LIKE $2 
                 GROUP BY employee_id`,
                [storeId, `${month}%`]
            );
            response.monthlyTop = result.rows;
            response.monthStats = { totalGroups: result.rows.reduce((a, b) => a + Number(b.groups), 0) };
            return res.json(response);
        }

        const dateStr = date || todayStr;
        const now = new Date();
        const startRange = new Date(`${dateStr}T00:00:00`);
        const endRange = new Date(`${dateStr}T23:59:59`);

        // Daily logs & active sessions
        const [logsRes, activeRes] = await Promise.all([
            pool.query('SELECT * FROM daily_records WHERE store_id = $1 AND date = $2', [storeId, dateStr]),
            pool.query('SELECT * FROM active_sessions WHERE store_id = $1', [storeId])
        ]);

        const activeLogs = [];
        const activeSessionsList = [];

        activeRes.rows.forEach(s => {
            if (s.client_start_time) {
                const st = new Date(s.client_start_time);
                if (st >= startRange && st < endRange) {
                    activeLogs.push({ start_time: s.client_start_time, end_time: now.toISOString(), employee_id: s.employee_id });
                }
            }
            activeSessionsList.push({
                employeeId: s.employee_id,
                employeeName: s.employee_name,
                startTime: s.start_time,
                clientStartTime: s.client_start_time
            });
        });

        // Sum up groups
        let totalG = 0;
        logsRes.rows.forEach(r => totalG += (r.groups_count || 0));
        
        response.totalGroups = totalG;
        response.hourlyStats = { hourly: {} }; // Optional: fill if table exists
        response.dailyStats = {
            dailyRecords: logsRes.rows,
            activeSessions: activeSessionsList,
            totalGroups: totalG
        };
        response.timeStats = { unionSeconds: logsRes.rows.reduce((a, b) => a + (Number(b.duration_seconds || 0)), 0) };

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
