import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
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

// --- Market Link Aggregator (Instant) ---
app.get('/api/market/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    console.log(`[Aggregator] Generating links for: ${q}`);
    const encodedQ = encodeURIComponent(q);

    const results = [
        {
            id: 'ebay', store: 'eBay', storeCode: 'EB', color: 'blue',
            price: 'Ver web', condition: 'Segunda mano',
            url: `https://www.ebay.es/sch/i.html?_nkw=${encodedQ}&_sacat=0&LH_ItemCondition=3000`,
            found: true
        },
        {
            id: 'game', store: 'GAME', storeCode: 'GM', color: 'purple',
            price: 'Ver web', condition: 'Seminuevo',
            url: `https://www.game.es/buscar/${encodedQ}`,
            found: true
        },
        {
            id: 'w', store: 'Wallapop', storeCode: 'W', color: 'teal',
            price: 'Ver web', condition: 'Segunda mano',
            url: `https://es.wallapop.com/app/search?keywords=${encodedQ}`,
            found: true
        },
        {
            id: 'cc', store: 'Cash Converters', storeCode: 'CC', color: 'green',
            price: 'Ver web', condition: 'Usado',
            url: `https://www.cashconverters.es/es/es/search/?q=${encodedQ}`,
            found: true
        },
        {
            id: 'bm', store: 'Back Market', storeCode: 'BM', color: 'slate',
            price: 'Ver web', condition: 'Reacondicionado',
            url: `https://www.backmarket.es/es-es/search?q=${encodedQ}`,
            found: true
        },
        {
            id: 'cex', store: 'CeX', storeCode: 'CeX', color: 'red',
            price: 'Ver web', condition: 'Usado',
            url: `https://es.webuy.com/search?stext=${encodedQ}`,
            found: true
        },
        {
            id: 'c24', store: 'Chrono24', storeCode: '24', color: 'amber',
            price: 'Ver web', condition: 'Usado',
            url: `https://www.chrono24.es/search/index.htm?query=${encodedQ}`,
            found: true
        }
    ];

    res.json(results);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
