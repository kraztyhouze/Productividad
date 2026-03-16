import express from 'express';
import { pool } from '../db.js';
import fs from 'fs';

const router = express.Router();

function logError(err, route) {
    const msg = `[${new Date().toISOString()}] ERROR in ${route}: ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync('server_error_log.txt', msg);
    console.error(msg);
}

// Helper to calculate next task date
function getNextOccurrence(currentDateStr, periodicity, recurring_days, recurring_month_day) {
    try {
        let next = new Date(currentDateStr);
        if (isNaN(next.getTime())) next = new Date();
        
        if (periodicity === 'Diario') {
            next.setDate(next.getDate() + 1);
        } else if (periodicity === 'Semanal') {
            const dayMap = { 'D': 0, 'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6 };
            const selectedDays = (Array.isArray(recurring_days) ? recurring_days : []).map(d => dayMap[d]).filter(d => d !== undefined).sort((a,b) => a - b);
            
            if (selectedDays.length === 0) {
                next.setDate(next.getDate() + 7);
            } else {
                let currentDay = next.getDay();
                let nextDay = selectedDays.find(d => d > currentDay);
                if (nextDay === undefined) {
                    nextDay = selectedDays[0];
                    next.setDate(next.getDate() + (7 - currentDay + nextDay));
                } else {
                    next.setDate(next.getDate() + (nextDay - currentDay));
                }
            }
        } else if (periodicity === 'Mensual') {
            const day = Number(recurring_month_day) || 1;
            next.setMonth(next.getMonth() + 1);
            next.setDate(day);
        }
        return next.toISOString().split('T')[0];
    } catch (e) {
        return currentDateStr;
    }
}

router.get('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE store_id = $1 ORDER BY date ASC, created_at DESC', [storeId]);
        res.json(result.rows);
    } catch (err) { 
        logError(err, 'GET /api/tasks');
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { 
        title, date, priority, status, assigned_to, description, 
        recurring, periodicity, recurring_days, recurring_month_day 
    } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            `INSERT INTO tasks (
                title, date, priority, status, assigned_to, description, 
                recurring, periodicity, recurring_days, recurring_month_day, store_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                title, date || new Date().toISOString().split('T')[0], priority || 'Media', status || 'Pendiente', assigned_to || '', description || '', 
                !!recurring, periodicity || 'Manual', 
                JSON.stringify(recurring_days || []), recurring_month_day || null, storeId
            ]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        logError(err, 'POST /api/tasks');
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        title, date, priority, status, assigned_to, description, 
        recurring, periodicity, recurring_days, recurring_month_day 
    } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    
    try {
        const currentTaskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        const currentTask = currentTaskRes.rows[0];

        const result = await pool.query(
            `UPDATE tasks SET 
                title=$1, date=$2, priority=$3, status=$4, assigned_to=$5, description=$6, 
                recurring=$7, periodicity=$8, recurring_days=$9, recurring_month_day=$10 
            WHERE id=$11 RETURNING *`,
            [
                title, date, priority, status, assigned_to || '', description || '', 
                !!recurring, periodicity, JSON.stringify(recurring_days || []), 
                recurring_month_day, id
            ]
        );

        if (status === 'Hecha' && currentTask?.status !== 'Hecha' && recurring) {
            const nextDateStr = getNextOccurrence(date, periodicity, recurring_days, recurring_month_day);
            if (periodicity !== 'Manual') {
                await pool.query(
                    `INSERT INTO tasks (
                        title, date, priority, status, assigned_to, description, 
                        recurring, periodicity, recurring_days, recurring_month_day, store_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        title, nextDateStr, priority, 'Pendiente', assigned_to || '', description || '', 
                        true, periodicity, JSON.stringify(recurring_days || []), 
                        recurring_month_day, storeId
                    ]
                );
            }
        }
        res.json(result.rows[0]);
    } catch (err) { 
        logError(err, 'PUT /api/tasks');
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ message: 'Task deleted' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

export default router;
