import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/', async (req, res) => {
    const { name, color, permissions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO roles (name, color, permissions) VALUES ($1, $2, $3) RETURNING *',
            [name, color, permissions]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM roles WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

export default router;
