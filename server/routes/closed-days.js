import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM closed_days ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/', async (req, res) => {
    const { date, total_groups, users_report, observation, max_concurrent } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO closed_days (date, total_groups, users_report, observation, max_concurrent) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [date, total_groups, users_report, observation, max_concurrent]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.delete('/:date', async (req, res) => {
    const { date } = req.params;
    try {
        await pool.query('DELETE FROM closed_days WHERE date=$1', [date]);
        res.json({ message: 'Day reopened' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

export default router;
