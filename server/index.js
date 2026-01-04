import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { initDb, pool } from './db.js';

dotenv.config();

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

// --- Market Scraper (Hybrid: Axios + Puppeteer) ---
app.get('/api/market/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    console.log(`[Scraper] Starting hybrid search for: ${q}`);
    const results = [];
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

    // --- 1. LIGHTWEIGHT REQUESTS (Axios/Cheerio) ---
    // eBay, GAME, Wallapop (link only)
    // Run concurrently as they are cheap.
    const lightPromises = [];

    // eBay
    lightPromises.push(async () => {
        const ebayUrl = `https://www.ebay.es/sch/i.html?_nkw=${encodeURIComponent(q)}&_sacat=0&LH_ItemCondition=3000`;
        try {
            const { data } = await axios.get(ebayUrl, { headers: { 'User-Agent': userAgent }, timeout: 10000 });
            const $ = cheerio.load(data);
            const priceText = $('.s-item__price').first().text().trim();
            results.push({
                id: 'ebay', store: 'eBay', storeCode: 'EB', color: 'blue',
                price: priceText || 'Ver web',
                condition: 'Segunda mano', url: ebayUrl, found: !!priceText
            });
        } catch (e) {
            results.push({ id: 'ebay', store: 'eBay', storeCode: 'EB', color: 'blue', price: 'Ver web', url: ebayUrl, found: false });
        }
    });

    // GAME
    lightPromises.push(async () => {
        const gameUrl = `https://www.game.es/buscar/${encodeURIComponent(q)}`;
        try {
            const { data } = await axios.get(gameUrl, { headers: { 'User-Agent': userAgent }, timeout: 10000 });
            const $ = cheerio.load(data);
            let priceText = $('.search-item .buy--price').first().text().trim();
            if (priceText) {
                priceText = priceText.replace(/\n/g, ',').replace(/\s+/g, '') + '€';
            }
            results.push({
                id: 'game', store: 'GAME', storeCode: 'GM', color: 'purple',
                price: priceText || 'Ver web',
                condition: 'Seminuevo', url: gameUrl, found: !!priceText
            });
        } catch (e) {
            results.push({ id: 'game', store: 'GAME', storeCode: 'GM', color: 'purple', price: 'Ver web', url: gameUrl, found: false });
        }
    });

    // Wallapop (Static Link)
    results.push({
        id: 'w', store: 'Wallapop', storeCode: 'W', color: 'teal',
        price: 'Ver web', url: `https://es.wallapop.com/app/search?keywords=${encodeURIComponent(q)}`,
        condition: 'Segunda mano', found: false
    });

    // Execute light tasks
    await Promise.all(lightPromises.map(p => p()));

    // --- 2. HEAVYWEIGHT REQUESTS (Puppeteer) ---
    // CeX, Cash Converters, Back Market, Chrono24
    // Run SEQUENTIALLY to minimize RAM usage on server.
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process' // Helps reduce memory
            ]
        });

        const runPuppeteerTask = async (url, storeId, storeName, storeCode, color, condition, selectorFn) => {
            let page = null;
            try {
                page = await browser.newPage();
                await page.setUserAgent(userAgent);
                await page.setViewport({ width: 1280, height: 720 });

                // Block resources
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (['image', 'font', 'stylesheet', 'media'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

                // Quick Cookie Accept (Generic)
                try {
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
                        const accept = buttons.find(b => /aceptar|accept|consent|entendido/i.test(b.innerText));
                        if (accept) accept.click();
                    });
                } catch (e) { }

                // Short wait
                await new Promise(r => setTimeout(r, 1000));

                const data = await page.evaluate(selectorFn);

                let found = false;
                let price = 'Ver web';

                if (data && data.price) {
                    price = data.price;
                    if (!price.includes('€') && !price.includes('EUR')) price += '€';
                    found = true;
                } else {
                    // Body text fallback (last resort)
                    const bodyPrice = await page.evaluate(() => {
                        const matches = document.body.innerText.match(/(\d{2,4}[.,]\d{2})\s?€/);
                        return matches ? matches[0] : null;
                    });
                    if (bodyPrice) { price = bodyPrice; found = true; }
                }

                results.push({
                    id: storeId, store: storeName, storeCode, color,
                    price, condition, url, found
                });

            } catch (err) {
                console.error(`[Scraper] Puppeteer Error ${storeName}:`, err.message);
                results.push({
                    id: storeId, store: storeName, storeCode, color,
                    price: 'Ver web', condition, url, found: false
                });
            } finally {
                if (page) await page.close(); // Close immediately to free RAM
            }
        };

        // Sequential Execution
        // 1. Cash Converters
        await runPuppeteerTask(
            `https://www.cashconverters.es/es/es/search/?q=${encodeURIComponent(q)}`,
            'cc', 'Cash Converters', 'CC', 'green', 'Usado',
            () => {
                const el = document.querySelector('.product-item .price') || document.querySelector('.price');
                return el && /\d/.test(el.innerText) ? { price: el.innerText.trim() } : null;
            }
        );

        // 2. Back Market
        await runPuppeteerTask(
            `https://www.backmarket.es/es-es/search?q=${encodeURIComponent(q)}`,
            'bm', 'Back Market', 'BM', 'slate', 'Reacondicionado',
            () => {
                const el = document.querySelector('[data-test="product-price"]') || document.querySelector('.body-1-bold');
                return el ? { price: el.innerText.trim() } : null;
            }
        );

        // 3. CeX
        await runPuppeteerTask(
            `https://es.webuy.com/search?stext=${encodeURIComponent(q)}`,
            'cex', 'CeX', 'CeX', 'red', 'Usado',
            () => {
                const el = document.querySelector('.price-txt') || document.querySelector('.productPrice');
                if (!el) {
                    const match = document.body.innerText.match(/Vender\s*(\d+[.,]\d{2})\s*€\s*Comprar\s*(\d+[.,]\d{2})\s*€/);
                    if (match && match[2]) return { price: match[2] + '€' };
                }
                return el ? { price: el.innerText.trim() } : null;
            }
        );

        // 4. Chrono24
        await runPuppeteerTask(
            `https://www.chrono24.es/search/index.htm?query=${encodeURIComponent(q)}`,
            'c24', 'Chrono24', '24', 'amber', 'Usado',
            () => {
                const el = document.querySelector('.article-price strong') || document.querySelector('.article-price');
                return el ? { price: el.innerText.trim() } : null;
            }
        );

    } catch (e) {
        console.error('[Scraper] Top-level Puppeteer error:', e);
    } finally {
        if (browser) await browser.close();
    }

    // Sort valid prices
    const validPrices = results.filter(r => r.found);
    validPrices.forEach(p => {
        let clean = p.price.replace(/[^\d.,]/g, '').trim();
        if (clean.indexOf(',') > -1 && clean.indexOf('.') > -1) {
            if (clean.indexOf(',') > clean.indexOf('.')) clean = clean.replace('.', '').replace(',', '.');
        } else if (clean.includes(',')) clean = clean.replace(',', '.');
        p.val = parseFloat(clean);
    });
    validPrices.sort((a, b) => a.val - b.val);
    if (validPrices.length > 0) {
        const bestId = validPrices[0].id;
        results.forEach(r => { if (r.id === bestId) r.isBestPrice = true; });
    }

    res.json(results);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
