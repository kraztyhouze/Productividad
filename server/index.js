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
        const result = await pool.query('SELECT * FROM employees ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/employees', async (req, res) => {
    const { name, role, avatar, username, password } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO employees (name, role, avatar, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, role, avatar, username, password] // Plain text password for now as per previous instructions
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { name, role, avatar, username, password } = req.body;
    try {
        const result = await pool.query(
            'UPDATE employees SET name=$1, role=$2, avatar=$3, username=$4, password=$5 WHERE id=$6 RETURNING *',
            [name, role, avatar, username, password, id]
        );
        res.json(result.rows[0]);
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

// --- Market Scraper (Puppeteer) ---
app.get('/api/market/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    console.log(`[Scraper] Starting search for: ${q}`);
    const results = [];
    let browser = null;

    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const scrapePage = async (url, storeId, storeName, storeCode, color, condition, selectorFn) => {
            let page = null;
            try {
                page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
                await page.setViewport({ width: 1366, height: 768 });

                // Block images to speed up
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (['image', 'font', 'stylesheet'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

                // Try to close cookies/modals
                try {
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"], #onetrust-accept-btn-handler'));
                        const accept = buttons.find(b => {
                            const t = b.innerText.toLowerCase();
                            return t.includes('aceptar') || t.includes('accept') || t.includes('consent') || t.includes('entendido');
                        });
                        if (accept) accept.click();
                    });
                } catch (e) { }

                // Short wait to ensure hydration/interaction
                await new Promise(r => setTimeout(r, 2000));

                const data = await page.evaluate(selectorFn);

                let found = false;
                let price = 'Ver web';

                if (data && data.price) {
                    price = data.price;
                    // Ensure format is X,XX€ or X.XX€
                    if (!price.includes('€') && !price.includes('EUR')) price += '€';
                    found = true;
                } else {
                    // Try one more generic extraction if failed
                    const bodyPrice = await page.evaluate(() => {
                        // Look for X,XX € pattern in body
                        const matches = document.body.innerText.match(/(\d{2,4}[.,]\d{2})\s?€/);
                        return matches && matches.length > 0 ? matches[0] : null;
                    });
                    if (bodyPrice) {
                        price = bodyPrice;
                        found = true;
                    } else {
                        console.log(`[Scraper] Price not found for ${storeName}, taking screenshot...`);
                        await page.screenshot({ path: `debug_${storeId}_notfound.png` });
                    }
                }

                results.push({
                    id: storeId, store: storeName, storeCode, color,
                    price, condition, url, found
                });
            } catch (err) {
                console.error(`[Scraper] Error ${storeName}:`, err.message);
                if (page) await page.screenshot({ path: `debug_${storeId}_error.png` });
                results.push({
                    id: storeId, store: storeName, storeCode, color,
                    price: 'Ver web', condition, url, found: false
                });
            } finally {
                if (page) await page.close();
            }
        };

        const promises = [];

        // 1. Cash Converters
        promises.push(scrapePage(
            `https://www.cashconverters.es/es/es/search/?q=${encodeURIComponent(q)}`,
            'cc', 'Cash Converters', 'CC', 'green', 'Usado',
            () => {
                // Try to find the specific product price inside a product card
                const productPrice = document.querySelector('.product-item .price');
                if (productPrice && productPrice.innerText.match(/\d/)) return { price: productPrice.innerText.trim() };

                // Fallback: look for any price-like text in the main content area (avoiding sidebar)
                const main = document.querySelector('.search-results') || document.body;
                const matches = main.innerText.match(/(\d{2,4}[.,]\d{2})\s?€/);
                if (matches) return { price: matches[0] };

                return null;
            }
        ));

        // 2. Back Market
        promises.push(scrapePage(
            `https://www.backmarket.es/es-es/search?q=${encodeURIComponent(q)}`,
            'bm', 'Back Market', 'BM', 'slate', 'Reacondicionado',
            () => {
                // Try data-test selector
                let el = document.querySelector('[data-test="product-price"]');
                if (el) return { price: el.innerText.trim() };

                // Try looking for the price in the first product card
                const productCard = document.querySelector('.productCard') || document.querySelector('a[href*="/es-es/p/"]');
                if (productCard) {
                    const txt = productCard.innerText;
                    const match = txt.match(/(\d{2,4}[.,]\d{2})\s?€/);
                    if (match) return { price: match[0] };
                }

                return null;
            }
        ));

        // 3. CeX
        promises.push(scrapePage(
            `https://es.webuy.com/search?stext=${encodeURIComponent(q)}`,
            'cex', 'CeX', 'CeX', 'red', 'Usado',
            () => {
                const el = document.querySelector('.price-txt') ||
                    document.querySelector('.productPrice');

                if (!el) {
                    const match = document.body.innerText.match(/Vender\s*(\d+[.,]\d{2})\s*€\s*Comprar\s*(\d+[.,]\d{2})\s*€/);
                    if (match && match[2]) return { price: match[2] + '€' };
                }

                return el ? { price: el.innerText.trim() } : null;
            }
        ));

        // 4. eBay
        promises.push(scrapePage(
            `https://www.ebay.es/sch/i.html?_nkw=${encodeURIComponent(q)}&_sacat=0&LH_ItemCondition=3000`,
            'ebay', 'eBay', 'EB', 'blue', 'Segunda mano',
            () => {
                const el = document.querySelector('.s-item__price');
                return el ? { price: el.innerText.trim() } : null;
            }
        ));

        // 5. GAME
        promises.push(scrapePage(
            `https://www.game.es/buscar/${encodeURIComponent(q)}`,
            'game', 'GAME', 'GM', 'purple', 'Seminuevo',
            () => {
                // Try to grab price from first result
                const el = document.querySelector('.search-item .buy--price');
                if (el) {
                    // GAME format: "123 'newline' 95" -> 123,95
                    return { price: el.innerText.replace(/\n/g, ',').trim() + '€' };
                }
                return null;
            }
        ));

        // 6. Chrono24
        promises.push(scrapePage(
            `https://www.chrono24.es/search/index.htm?query=${encodeURIComponent(q)}`,
            'c24', 'Chrono24', '24', 'amber', 'Usado',
            () => {
                const el = document.querySelector('.article-price strong') || document.querySelector('.article-price');
                return el ? { price: el.innerText.trim() } : null;
            }
        ));

        await Promise.all(promises);

        // 4. Wallapop (Link only)
        results.push({
            id: 'w', store: 'Wallapop', storeCode: 'W', color: 'teal',
            price: 'Ver web', url: `https://es.wallapop.com/app/search?keywords=${encodeURIComponent(q)}`,
            condition: 'Segunda mano', found: false
        });

        // Determine best price
        const validPrices = results.filter(r => r.found && r.price.includes('€'));
        if (validPrices.length > 0) {
            validPrices.forEach(p => {
                let clean = p.price.replace(/[^\d.,]/g, '').trim();
                // European format handling: 1.234,56 -> 1234.56
                if (clean.indexOf(',') > clean.indexOf('.')) { // 1.234,56 or 1234,56
                    clean = clean.replace('.', '').replace(',', '.');
                } else if (clean.includes(',')) {
                    clean = clean.replace(',', '.');
                }
                p.val = parseFloat(clean);
            });
            validPrices.sort((a, b) => a.val - b.val);
            const bestId = validPrices[0].id;
            results.forEach(r => { if (r.id === bestId) r.isBestPrice = true; });
        }

    } catch (e) {
        console.error('[Scraper] Critical puppeteer error:', e);
    } finally {
        if (browser) await browser.close();
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
