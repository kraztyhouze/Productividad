import 'dotenv/config';
import express from 'express';

import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import puppeteer from 'puppeteer';
import bcrypt from 'bcryptjs'; // Security
import { initDb, pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- GAMIFICATION CONSTANTS (used across multiple endpoints) ---
const SHOP_ITEMS = [
    // --- SKINS (Avatars) ---
    { id: 'skin_basic_blue', name: 'Bot Azul', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=BlueBot', icon: 'user' },
    { id: 'skin_basic_red', name: 'Bot Rojo', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=RedBot', icon: 'user' },
    { id: 'skin_basic_green', name: 'Bot Verde', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=GreenBot', icon: 'user' },
    { id: 'skin_basic_yellow', name: 'Bot Amarillo', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=YellowBot', icon: 'user' },
    { id: 'skin_basic_purple', name: 'Bot Púrpura', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=PurpleBot', icon: 'user' },
    { id: 'skin_basic_orange', name: 'Bot Naranja', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=OrangeBot', icon: 'user' },
    { id: 'skin_elite_gold', name: 'Bot Dorado (Élite)', type: 'skin', price: 10000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldElite', icon: 'disc' },
    { id: 'skin_elite_cyber', name: 'Cyber Unit (Élite)', type: 'skin', price: 15000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberUnit', icon: 'disc' },
    // --- EFFECTS (purchasable) ---
    { id: 'fx_sparkle', name: 'Efecto: Destellos', type: 'effect', price: 8000, icon: 'sparkles' },
    { id: 'fx_confetti', name: 'Efecto: Confeti', type: 'effect', price: 8000, icon: 'party' },
    { id: 'fx_fire', name: 'Efecto: Llamas', type: 'effect', price: 12000, icon: 'flame' },
    { id: 'fx_matrix', name: 'Efecto: Matrix', type: 'effect', price: 12000, icon: 'code' },
    { id: 'fx_notes', name: 'Efecto: Musical', type: 'effect', price: 10000, icon: 'music' },
    { id: 'fx_lightning', name: 'Efecto: Rayo', type: 'effect', price: 15000, icon: 'zap' },
    // --- BORDERS (card customization) ---
    { id: 'border_pink', name: 'Borde Rosa', type: 'border', price: 2000, color: '#ec4899', icon: 'border' },
    { id: 'border_cyan', name: 'Borde Cian', type: 'border', price: 2000, color: '#06b6d4', icon: 'border' },
    { id: 'border_lime', name: 'Borde Verde Lima', type: 'border', price: 2000, color: '#84cc16', icon: 'border' },
    { id: 'border_amber', name: 'Borde Ámbar', type: 'border', price: 2000, color: '#f59e0b', icon: 'border' },
    { id: 'border_red', name: 'Borde Rojo', type: 'border', price: 2000, color: '#ef4444', icon: 'border' },
    { id: 'border_violet', name: 'Borde Violeta', type: 'border', price: 3000, color: '#8b5cf6', icon: 'border' },
    { id: 'border_glow_gold', name: 'Brillo Dorado', type: 'border', price: 8000, color: '#fbbf24', glow: true, icon: 'border' },
    { id: 'border_glow_neon', name: 'Brillo Neón', type: 'border', price: 10000, color: '#22d3ee', glow: true, icon: 'border' },
    { id: 'border_glow_fire', name: 'Brillo Fuego', type: 'border', price: 12000, color: '#f97316', glow: true, icon: 'border' },
    { id: 'border_rainbow', name: 'Arcoíris Animado', type: 'border', price: 20000, color: 'rainbow', glow: true, icon: 'border' },
];

const PREMIUM_THEMES = ['Dragon Ball', 'Marvel', 'Disney', 'Música', 'Fútbol'];

const REWARD_EFFECTS = [
    { id: 'fx_sparkle', name: 'Destellos Mágicos', type: 'effect', icon: 'sparkles' },
    { id: 'fx_fire', name: 'Llamas Infernales', type: 'effect', icon: 'flame' },
    { id: 'fx_matrix', name: 'Código Matrix', type: 'effect', icon: 'code' },
    { id: 'fx_confetti', name: 'Fiesta Total', type: 'effect', icon: 'party' },
    { id: 'fx_notes', name: 'Ritmo Musical', type: 'effect', icon: 'music' },
    { id: 'fx_lightning', name: 'Tormenta Eléctrica', type: 'effect', icon: 'zap' }
];

// Load locally-hosted themed avatar pools from manifest
let THEMED_AVATAR_POOLS;
try {
    const manifestPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'avatars', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const themeMap = { dragonball: 'Dragon Ball', marvel: 'Marvel', disney: 'Disney', musica: 'Música', futbol: 'Fútbol' };
    THEMED_AVATAR_POOLS = {};
    for (const [folder, avatars] of Object.entries(manifest)) {
        const themeName = themeMap[folder] || folder;
        THEMED_AVATAR_POOLS[themeName] = avatars.map(a => ({ name: a.name, url: a.file }));
    }
    console.log('Loaded themed avatar pools:', Object.entries(THEMED_AVATAR_POOLS).map(([k, v]) => `${k}(${v.length})`).join(', '));
} catch (e) {
    console.warn('Could not load avatar manifest, using fallback:', e.message);
    THEMED_AVATAR_POOLS = {
        'Dragon Ball': [{ name: 'Goku', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=GokuDBZ' }],
        'Marvel': [{ name: 'Iron Man', url: 'https://api.dicebear.com/7.x/personas/svg?seed=IronManMarvel' }],
        'Disney': [{ name: 'Mickey', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=MickeyDisney' }],
        'Música': [{ name: 'Guitarra', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Guitar' }],
        'Fútbol': [{ name: 'Balón', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Football' }],
    };
}

// Initialize DB
initDb().then(async () => {
    console.log('Database initialized successfully');
    await migratePasswords(); // Auto-hash existing passwords
}).catch(err => {
    console.error('CRITICAL: DB Initialization failed!', err);
});

// --- Security Helper: Migrate Plain Text Passwords ---
async function migratePasswords() {
    try {
        const res = await pool.query('SELECT id, password FROM employees');
        let migrated = 0;
        for (const emp of res.rows) {
            // Check if password is NOT already hashed (bcrypt hashes start with $2a$ or $2b$ and are 60 chars)
            if (emp.password && !emp.password.startsWith('$2') && emp.password.length < 50) {
                const hash = await bcrypt.hash(emp.password, 10);
                await pool.query('UPDATE employees SET password = $1 WHERE id = $2', [hash, emp.id]);
                migrated++;
            }
        }
        if (migrated > 0) console.log(`[SECURITY] Migrated ${migrated} passwords to Bcrypt hashes.`);
    } catch (e) { console.error("Password migration error:", e); }
}

// --- API Routes ---

// Schema Migration (Auto-Run)
(async () => {
    try {
        await pool.query('ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS midday_close TEXT');
        await pool.query('ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS night_close TEXT');
        await pool.query('ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement TEXT');
        console.log('Schema updated: closing-hours and announcement columns ensured.');
    } catch (e) {
        console.log('Schema check skipped:', e.message);
    }
})();

// --- NEW: Transaction Logs for Accurate Metrics ---
// Table Init (Run once)
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transaction_logs (
                id SERIAL PRIMARY KEY,
                store_id TEXT NOT NULL,
                employee_id TEXT NOT NULL,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                type TEXT,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Schema updated: transaction_logs table ensured.');
    } catch (e) { console.error('Error ensuring transaction_logs:', e); }
})();

// Table Init: Market Prices (PVP Consolas y TMX)
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS market_prices (
                id SERIAL PRIMARY KEY,
                store_id TEXT NOT NULL,
                category TEXT NOT NULL, 
                brand TEXT,
                model TEXT,
                price_a NUMERIC,
                price_b NUMERIC,
                price_c NUMERIC,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Schema updated: market_prices table ensured.');
    } catch (e) { console.error('Error ensuring market_prices:', e); }
})();

// Ensure 'gamification' column exists in employees
(async () => {
    try {
        await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS gamification JSONB DEFAULT '{}'");
        console.log('Schema updated: gamification column ensured.');
    } catch (e) { console.error('Error ensuring gamification column:', e); }
})();

// --- API: Market Prices (PVP Consolas y TMX) ---
app.get('/api/market-prices', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // Order by category (custom order) and id
        const result = await pool.query(`
            SELECT * FROM market_prices 
            WHERE store_id = $1 
            ORDER BY 
                CASE 
                    WHEN category = 'THERMOMIX' THEN 1
                    WHEN category = 'PS5' THEN 2 
                    WHEN category = 'PS4' THEN 3
                    WHEN category = 'SWITCH' THEN 4
                    ELSE 5 
                END, 
                id ASC
        `, [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/market-prices', async (req, res) => {
    const { category, brand, model, price_a, price_b, price_c } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO market_prices (store_id, category, brand, model, price_a, price_b, price_c) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [storeId, category, brand, model, price_a, price_b, price_c]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/market-prices/:id', async (req, res) => {
    const { id } = req.params;
    const { category, brand, model, price_a, price_b, price_c } = req.body;
    try {
        const result = await pool.query(
            'UPDATE market_prices SET category=$1, brand=$2, model=$3, price_a=$4, price_b=$5, price_c=$6 WHERE id=$7 RETURNING *',
            [category, brand, model, price_a, price_b, price_c, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/market-prices/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM market_prices WHERE id=$1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 0. Auth (Login) - Secure Server-Side Check
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        // Fetch user by username AND store_id (passwords are checked in code now)
        const result = await pool.query(
            'SELECT * FROM employees WHERE username = $1 AND store_id = $2',
            [username, storeId]
        );

        if (result.rows.length > 0) {
            const emp = result.rows[0];

            // Verify Password (Hash vs Plain)
            const match = await bcrypt.compare(password, emp.password);

            if (match) {
                // Remove password from session object
                const userSession = {
                    id: emp.id,
                    name: `${emp.first_name} ${emp.last_name}`,
                    role: emp.role,
                    avatar: emp.alias || `${emp.first_name[0]}${emp.last_name[0]}`,
                    username: emp.username,
                    email: emp.email,
                    isMaster: false,
                    isBuyer: emp.is_buyer,
                    storeId: emp.store_id
                };
                res.json({ success: true, user: userSession });
            } else {
                res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Employees (Secured: No Passwords returned)
app.get('/api/employees', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // EXCLUDED password from SELECT
        const result = await pool.query(`
            SELECT 
                id, avatar, first_name as "firstName", last_name as "lastName", alias, email, 
                role, contract_hours as "contractHours", contract_type as "contractType", 
                username, is_buyer as "isBuyer", phone, address, "order", store_id, gamification
            FROM employees 
            WHERE store_id = $1
            ORDER BY "order" ASC, id ASC
        `, [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/employees', async (req, res) => {
    const { firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar, gamification } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        // Hash Password before insert
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO employees (
                first_name, last_name, alias, email, role, contract_hours, contract_type, 
                username, password, is_buyer, phone, address, avatar, store_id, gamification
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
            [firstName, lastName, alias, email, role, contractHours, contractType, username, hashedPassword, isBuyer, phone, address, avatar, storeId, gamification || {}]
        );
        // Return confirmed data but NO PASSWORD
        res.json({
            id: result.rows[0].id, firstName, lastName, alias,
            email, role, contractHours, contractType,
            username, isBuyer, phone,
            address, order: 0, avatar, storeId
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar, order, gamification } = req.body;

    try {
        // Fetch current data to prevent accidental wipes (simulating PATCH)
        const currentRes = await pool.query('SELECT * FROM employees WHERE id=$1', [id]);
        if (currentRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const old = currentRes.rows[0];

        // Safe Merge: Use new value if defined, else keep old
        const newFirstName = firstName !== undefined ? firstName : old.first_name;
        const newLastName = lastName !== undefined ? lastName : old.last_name;
        const newAlias = alias !== undefined ? alias : old.alias;
        const newEmail = email !== undefined ? email : old.email;
        const newRole = role !== undefined ? role : old.role;
        const newContractHours = contractHours !== undefined ? contractHours : old.contract_hours;
        const newContractType = contractType !== undefined ? contractType : old.contract_type;
        const newUsername = username !== undefined ? username : old.username;
        const newIsBuyer = isBuyer !== undefined ? isBuyer : old.is_buyer;
        const newPhone = phone !== undefined ? phone : old.phone;
        const newAddress = address !== undefined ? address : old.address;
        const newAvatar = avatar !== undefined ? avatar : old.avatar;
        const newOrder = order !== undefined ? order : old.order;
        let newGamification = gamification !== undefined ? gamification : (old.gamification || {});

        let hashedPassword = old.password;
        if (password && password.trim() !== "") {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // --- MANAGER PERKS LOGIC (ALWAYS ENFORCED) ---
        const oldRole = old.role;
        const roleChanged = role !== undefined && role !== oldRole;

        // Build full reward sets
        const ALL_AVATARS = SHOP_ITEMS.filter(i => i.type === 'skin' && i.src).map(i => i.src);
        const ALL_EFFECTS = [...new Set([
            ...SHOP_ITEMS.filter(i => i.type === 'effect').map(i => i.id),
            ...REWARD_EFFECTS.map(e => e.id)
        ])];

        if (roleChanged && newRole === 'Gerente') {
            // PROMOTED TO MANAGER: Full unlock
            console.log(`[MANAGER PERKS] Employee ${id} PROMOTED to Gerente - unlocking ALL rewards.`);
            newGamification = {
                xp: 999999,
                level: 50,
                maxLevel: 50,
                coins: 999999,
                pendingRewards: 100,
                unlockedAvatars: ALL_AVATARS,
                unlockedEffects: ALL_EFFECTS,
                currentAvatar: ALL_AVATARS[0] || null,
                avatarUrl: ALL_AVATARS[0] || null,
                medals: newGamification.medals || []
            };
        } else if (roleChanged && oldRole === 'Gerente') {
            // DEMOTED FROM MANAGER: Total reset
            console.log(`[MANAGER PERKS] Employee ${id} DEMOTED from Gerente - resetting gamification.`);
            newGamification = {
                xp: 0,
                level: 1,
                maxLevel: 1,
                coins: 0,
                pendingRewards: 0,
                unlockedAvatars: [],
                unlockedEffects: [],
                currentAvatar: null,
                avatarUrl: null,
                medals: []
            };
        } else if (newRole === 'Gerente') {
            // ALREADY MANAGER: Ensure perks are present (sync fix)
            const currentG = newGamification || {};
            if (!currentG.pendingRewards || currentG.pendingRewards < 100 ||
                !currentG.unlockedAvatars || currentG.unlockedAvatars.length < ALL_AVATARS.length) {
                console.log(`[MANAGER PERKS] Employee ${id} is Gerente but missing perks - syncing.`);
                newGamification = {
                    ...currentG,
                    xp: Math.max(currentG.xp || 0, 999999),
                    level: Math.max(currentG.level || 1, 50),
                    maxLevel: 50,
                    coins: Math.max(currentG.coins || 0, 999999),
                    pendingRewards: Math.max(currentG.pendingRewards || 0, 100),
                    unlockedAvatars: [...new Set([...(currentG.unlockedAvatars || []), ...ALL_AVATARS])],
                    unlockedEffects: [...new Set([...(currentG.unlockedEffects || []), ...ALL_EFFECTS])],
                    medals: currentG.medals || []
                };
            }
        }

        const result = await pool.query(
            `UPDATE employees SET 
                first_name=$1, last_name=$2, alias=$3, email=$4, role=$5, contract_hours=$6, 
                contract_type=$7, username=$8, password=$9, is_buyer=$10, phone=$11, address=$12, 
                avatar=$13, "order"=$14, gamification=$15
            WHERE id=$16 RETURNING *`,
            [newFirstName, newLastName, newAlias, newEmail, newRole, newContractHours, newContractType, newUsername, hashedPassword, newIsBuyer, newPhone, newAddress, newAvatar, newOrder, newGamification, id]
        );

        const updated = result.rows[0];
        res.json({
            id: updated.id,
            firstName: updated.first_name,
            lastName: updated.last_name,
            alias: updated.alias,
            email: updated.email,
            role: updated.role,
            contractHours: updated.contract_hours,
            contractType: updated.contract_type,
            username: updated.username,
            isBuyer: updated.is_buyer,
            phone: updated.phone,
            address: updated.address,
            order: updated.order,
            avatar: updated.avatar,
            gamification: updated.gamification
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/employees/:id/reset-gamification', async (req, res) => {
    const { id } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';

    // Reset State
    const initialGamification = {
        xp: 0,
        level: 1,
        maxLevel: 1,
        coins: 0,
        pendingRewards: 0,
        unlockedAvatars: [],
        unlockedEffects: [],
        currentAvatar: null,
        avatarUrl: null,
        medals: []
        // We keep medals? User said "resetear el perfil... start from 0". 
        // "Reset profile... back to level 1... remove unlocked avatars".
        // Medals are achievements, usually kept, but "experience 0 and level 1" implies hard reset.  
        // I'll reset everything for a complete "fresh start" as requested.
    };

    try {
        const result = await pool.query(
            'UPDATE employees SET gamification = $1 WHERE id = $2 AND store_id = $3 RETURNING *',
            [initialGamification, id, storeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Gamification profile reset successfully', employee: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// 2. Store Settings (Gold Price)
app.get('/api/settings/gold', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT gold_price FROM store_settings WHERE store_id = $1', [storeId]);
        if (result.rows.length > 0) {
            res.json({ price: result.rows[0].gold_price });
        } else {
            res.json({ price: 77.00 }); // Default fallback
        }
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/settings/gold', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { price } = req.body;

    if (!price || isNaN(price)) {
        return res.status(400).json({ error: 'Invalid price' });
    }

    try {
        await pool.query(
            'INSERT INTO store_settings (store_id, gold_price) VALUES ($1, $2) ON CONFLICT (store_id) DO UPDATE SET gold_price = $2, updated_at = CURRENT_TIMESTAMP',
            [storeId, price]
        );
        res.json({ success: true, price });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// Closing Hours Settings
// General Store Settings (Closing Hours + Announcement)
app.get('/api/settings', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT midday_close, night_close, announcement FROM store_settings WHERE store_id = $1', [storeId]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.json({ midday_close: '', night_close: '', announcement: '' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { midday_close, night_close, announcement } = req.body;
    try {
        await pool.query(
            `INSERT INTO store_settings (store_id, midday_close, night_close, announcement) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (store_id) 
             DO UPDATE SET midday_close = $2, night_close = $3, announcement = $4, updated_at = CURRENT_TIMESTAMP`,
            [storeId, midday_close, night_close, announcement]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
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
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE store_id = $1 ORDER BY created_at DESC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.post('/api/tasks', async (req, res) => {
    const { title, date, priority, status, assigned_to, description, recurring, recurring_frequency } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, date, priority, status, assigned_to, description, recurring, recurring_frequency, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [title, date, priority, status, assigned_to, description, recurring, recurring_frequency, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, date, priority, status, assigned_to, description, recurring, recurring_frequency } = req.body;
    // Note: Update by ID is safe globally if ID is serial PK, but checking store_id ensures cross-tenant safety.
    // For simplicity, we assume ID ownership is enough but ideally we'd check store permissions.
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
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO comments (task_id, user_id, text, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, user_id, text, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

app.get('/api/tasks/:id/comments', async (req, res) => {
    const { id } = req.params;
    // Comments are linked to tasks, so if task is accessible, comments are too.
    // However, for strictness we could filter.
    try {
        const result = await pool.query(
            'SELECT c.*, e.name as user_name, e.avatar as user_avatar FROM comments c JOIN employees e ON c.user_id = e.id WHERE c.task_id = $1 ORDER BY c.created_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// --- NEW API: Product Families (Needs / Overstock) ---
app.get('/api/product-families', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM product_families WHERE store_id = $1 ORDER BY id ASC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/product-families', async (req, res) => {
    const { name, type, date } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO product_families (name, type, date, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, type, date, storeId]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/product-families/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM product_families WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
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

app.delete('/api/closed-days/:date', async (req, res) => {
    const { date } = req.params;
    try {
        await pool.query('DELETE FROM closed_days WHERE date=$1', [date]);
        res.json({ message: 'Day reopened' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});



// --- 6. Productivity & Sessions (Restored & ISOLATED) ---

// --- SYNC ENDPOINT (Performance Optimization) ---
app.get('/api/sync/productivity', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const [sessions, records, groups, closed, incidents, families, logs] = await Promise.all([
            pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions WHERE store_id = $1', [storeId]),
            pool.query('SELECT id, employee_id as "employeeId", employee_name as "employeeName", start_time as "startTime", end_time as "endTime", duration_seconds as "durationSeconds", date, groups_count as "groups" FROM daily_records WHERE store_id = $1 ORDER BY start_time DESC', [storeId]),
            pool.query('SELECT * FROM daily_groups WHERE store_id = $1', [storeId]),
            pool.query('SELECT * FROM closed_days WHERE store_id = $1', [storeId]),
            pool.query('SELECT * FROM day_incidents WHERE store_id = $1', [storeId]),
            pool.query('SELECT * FROM product_families WHERE store_id = $1 ORDER BY id DESC', [storeId]),
            pool.query("SELECT * FROM transaction_logs WHERE store_id = $1 AND start_time > NOW() - INTERVAL '60 days' ORDER BY start_time DESC", [storeId])
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
app.get('/api/active-sessions', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT TRIM(employee_id) as "employeeId", employee_name as "employeeName", start_time as "startTime", client_start_time as "clientStartTime" FROM active_sessions WHERE store_id = $1', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/active-sessions', async (req, res) => {
    const { employeeId, employeeName, startTime, clientStartTime } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query('INSERT INTO active_sessions (employee_id, employee_name, start_time, client_start_time, store_id) VALUES ($1, $2, $3, $4, $5)', [employeeId, employeeName, startTime, clientStartTime || null, storeId]);
        res.json({ message: 'Session started' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    const { clientStartTime, startTime } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    // Note: displayId (employeeId) might be duplicate across stores, so strictly filter by store_id too.
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

app.delete('/api/active-sessions/:displayId', async (req, res) => {
    const { displayId } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query('DELETE FROM active_sessions WHERE TRIM(employee_id) = $1 AND store_id = $2', [displayId, storeId]);
        res.json({ message: 'Session ended' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily Records
app.get('/api/daily-records', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT id, employee_id as "employeeId", employee_name as "employeeName", start_time as "startTime", end_time as "endTime", duration_seconds as "durationSeconds", date, groups_count as "groups" FROM daily_records WHERE store_id = $1 ORDER BY start_time DESC', [storeId]);

        const mapped = result.rows.map(r => ({ ...r, id: parseInt(r.id) }));
        res.json(mapped);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/daily-records', async (req, res) => {
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

app.delete('/api/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT employee_id FROM daily_records WHERE id = $1', [id]);
        if (check.rows.length > 0) {
            const empId = check.rows[0].employee_id;
            await pool.query('DELETE FROM daily_records WHERE id = $1', [id]);
            // Recalculate
            await recalculateGamification(empId);
        }
        res.json({ message: 'Record deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});



// Daily Groups
app.get('/api/daily-groups', async (req, res) => {
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
app.post('/api/daily-groups', async (req, res) => {
    const { key, data } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const employeeId = key.split('-')[0];

    try {
        const check = await pool.query('SELECT * FROM daily_groups WHERE key=$1', [key]);
        let oldSales = 0;

        if (check.rows.length > 0) {
            const old = check.rows[0];
            oldSales = (old.standard || 0) + (old.jewelry || 0) + (old.recoverable || 0);

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

app.delete('/api/daily-groups/:key', async (req, res) => {
    const { key } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    const employeeId = key.split('-')[0];

    try {
        const check = await pool.query('SELECT * FROM daily_groups WHERE key=$1 AND store_id=$2', [key, storeId]);
        if (check.rows.length > 0) {
            await pool.query('DELETE FROM daily_groups WHERE key=$1 AND store_id=$2', [key, storeId]);
            // Recalculate everything
            await recalculateGamification(employeeId);
            res.json({ message: 'Groups deleted and XP adjusted' });
        } else {
            res.json({ message: 'Record not found' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSACTION LOGS (XP + Coins) ---
app.post('/api/transaction-logs', async (req, res) => {
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
                    const currentCoins = parseInt(g.coins || 0);

                    const newXP = currentXP + 50;
                    const newCoins = currentCoins + 10;
                    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
                    const maxLevel = parseInt(g.maxLevel || 1);

                    g.xp = newXP;
                    g.coins = newCoins;
                    g.level = newLevel;

                    let rewardGranted = false;
                    // Reward Check: Only if newLevel > maxLevel
                    if (newLevel > maxLevel) {
                        g.maxLevel = newLevel;
                        // g.pendingRewards based on milestone?
                        // If they used Kiosko, maybe we give Coins bonus instead of chests?
                        // Let's give BOTH: 1 Chest + 100 Coins Bonus
                        g.pendingRewards = (parseInt(g.pendingRewards) || 0) + 1;
                        g.coins += 1000; // Level Up Bonus Increased!
                        rewardGranted = true;
                    }

                    await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
                    responseData = { success: true, xp: newXP, level: newLevel, coins: g.coins, reward: rewardGranted };
                }
            }
        }
        res.json(responseData);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/transaction-logs/employee/:employeeId/:date', async (req, res) => {
    const { employeeId, date } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        await pool.query(
            "DELETE FROM transaction_logs WHERE employee_id = $1 AND store_id = $2 AND start_time::text LIKE $3",
            [employeeId, storeId, `${date}%`]
        );
        res.json({ message: 'Logs deleted for employee on date' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


async function recalculateGamification(employeeId) {
    try {
        const empRes = await pool.query('SELECT * FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return;
        const emp = empRes.rows[0];
        let g = emp.gamification || {};

        const groupsRes = await pool.query('SELECT * FROM daily_groups WHERE key LIKE $1', [`${employeeId}-%`]);
        let totalSold = 0;
        let totalNoDeals = 0;
        groupsRes.rows.forEach(row => {
            totalSold += (row.standard || 0) + (row.jewelry || 0) + (row.recoverable || 0);
            totalNoDeals += (row.no_deal || 0);
        });

        const recordsRes = await pool.query('SELECT duration_seconds FROM daily_records WHERE employee_id = $1', [String(employeeId)]);
        let totalSeconds = 0;
        recordsRes.rows.forEach(r => totalSeconds += (r.duration_seconds || 0));

        const xpFromSales = totalSold * 50;
        const xpFromNoDeals = totalNoDeals * 10;
        const xpFromTime = Math.floor(totalSeconds / 60) * 5;
        const newXP = xpFromSales + xpFromNoDeals + xpFromTime;
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
        const levelBonuses = (newLevel - 1) * 1000;
        const earnedCoins = newXP + levelBonuses;

        let spent = 0;
        (g.unlockedAvatars || []).forEach(src => {
            const item = SHOP_ITEMS.find(i => i.src === src);
            if (item) spent += item.price;
        });
        (g.unlockedEffects || []).forEach(id => {
            const item = SHOP_ITEMS.find(i => i.id === id);
            if (!item) {
                const shopItem = SHOP_ITEMS.find(si => si.id === id);
                if (shopItem) spent += shopItem.price;
            }
        });

        let newCoins = Math.max(0, earnedCoins - spent);
        g.xp = newXP; g.level = newLevel; g.coins = newCoins;
        if (newLevel < (g.maxLevel || 1)) {
            g.maxLevel = newLevel;
            g.pendingRewards = Math.max(0, (g.pendingRewards || 0) - 1);
        } else if (newLevel > (g.maxLevel || 1)) {
            g.maxLevel = newLevel;
        }

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        console.log(`Recalculated Gamification for Emp ${employeeId}: XP=${newXP}, Level=${newLevel}, Coins=${newCoins}`);
    } catch (e) { console.error("Recalc Error", e); }
}




app.get('/api/gamification/shop', (req, res) => res.json(SHOP_ITEMS));
app.get('/api/gamification/effects', (req, res) => res.json(REWARD_EFFECTS));

app.post('/api/gamification/buy-item', async (req, res) => {
    const { employeeId, itemId } = req.body;
    try {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        let g = empRes.rows[0].gamification || {};
        const coins = parseInt(g.coins || 0);

        if (coins < item.price) return res.status(400).json({ error: 'Saldo insuficiente' });

        // Add to inventory based on type
        if (item.type === 'effect') {
            g.unlockedEffects = g.unlockedEffects || [];
            if (g.unlockedEffects.includes(item.id)) return res.status(400).json({ error: 'Ya tienes este efecto' });
            g.unlockedEffects.push(item.id);
        } else if (item.type === 'border') {
            g.unlockedBorders = g.unlockedBorders || [];
            if (g.unlockedBorders.includes(item.id)) return res.status(400).json({ error: 'Ya tienes este borde' });
            g.unlockedBorders.push(item.id);
        } else {
            g.unlockedAvatars = g.unlockedAvatars || [];
            if (g.unlockedAvatars.includes(item.src)) return res.status(400).json({ error: 'Ya tienes este avatar' });
            g.unlockedAvatars.push(item.src);
        }

        // Deduct AFTER validation passes
        g.coins = coins - item.price;

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gamification/equip-item', async (req, res) => {
    const { employeeId, avatarUrl, avatarSrc } = req.body;
    const url = avatarUrl || avatarSrc;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};

        g.currentAvatar = url;
        g.avatarUrl = url;

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        await pool.query('UPDATE employees SET avatar = $1 WHERE id = $2', [url, employeeId]);
        res.json({ success: true, currentAvatar: url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gamification/equip-effect', async (req, res) => {
    const { employeeId, effectId, type } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        let g = empRes.rows[0].gamification || {};

        if (type === 'entry') g.currentEntryEffect = effectId;
        if (type === 'exit') g.currentExitEffect = effectId;

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, entry: g.currentEntryEffect, exit: g.currentExitEffect });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Claim reward from chest - uses CURATED themed avatar pools
app.post('/api/gamification/claim-reward', async (req, res) => {
    const { employeeId, theme } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};
        const pending = parseInt(g.pendingRewards || 0);
        if (pending <= 0) return res.status(400).json({ error: 'No tienes cofres disponibles' });

        g.pendingRewards = pending - 1;

        // 25% chance for an effect (if any left to unlock)
        const roll = Math.random();
        let rewardData = {};
        const ownedEffects = g.unlockedEffects || [];
        const availableEffects = REWARD_EFFECTS.filter(e => !ownedEffects.includes(e.id));

        if (roll > 0.75 && availableEffects.length > 0) {
            // WON AN EFFECT!
            const effect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
            g.unlockedEffects = [...ownedEffects, effect.id];
            rewardData = { type: 'effect', effectName: effect.name, effectIcon: effect.icon };
        } else {
            // WON AN AVATAR from the curated theme pool
            let selectedTheme = theme;
            if (!PREMIUM_THEMES.includes(theme)) {
                selectedTheme = PREMIUM_THEMES[Math.floor(Math.random() * PREMIUM_THEMES.length)];
            }

            const pool_ = THEMED_AVATAR_POOLS[selectedTheme] || THEMED_AVATAR_POOLS['Dragon Ball'];
            const ownedAvatars = g.unlockedAvatars || [];

            // Find avatars from this theme that the player doesn't own yet
            let available = pool_.filter(a => !ownedAvatars.includes(a.url));
            // If all owned from this theme, pick from ANY theme
            if (available.length === 0) {
                for (const t of PREMIUM_THEMES) {
                    const p = THEMED_AVATAR_POOLS[t];
                    const avail = p.filter(a => !ownedAvatars.includes(a.url));
                    if (avail.length > 0) { available = avail; selectedTheme = t; break; }
                }
            }
            // If truly all 100 avatars owned, generate a unique one
            if (available.length === 0) {
                const randSeed = 'Unique' + Date.now();
                available = [{ name: 'Especial', url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${randSeed}&backgroundColor=ff6b35,ffa500&backgroundType=gradientLinear` }];
            }

            const won = available[Math.floor(Math.random() * available.length)];
            g.unlockedAvatars = [...ownedAvatars, won.url];
            g.currentAvatar = won.url;
            g.avatarUrl = won.url;
            rewardData = { type: 'avatar', src: won.url, avatarName: won.name, theme: selectedTheme };
        }

        // Keep a collection log for the player
        g.collectionLog = g.collectionLog || [];
        g.collectionLog.push({
            date: new Date().toISOString(),
            ...rewardData
        });

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        // Return FULL gamification so frontend stays in sync
        res.json({ success: true, gamification: g, ...rewardData });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Equip a border
app.post('/api/gamification/equip-border', async (req, res) => {
    const { employeeId, borderId } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};
        g.currentBorder = borderId; // null to unequip
        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MANAGER GAMIFICATION MANAGEMENT ---

// Manager: Delete avatar from employee
app.post('/api/gamification/delete-avatar', async (req, res) => {
    const { employeeId, avatarUrl } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};

        // Remove from unlocked list
        g.unlockedAvatars = (g.unlockedAvatars || []).filter(a => a !== avatarUrl);

        // If currently equipped, unequip
        if (g.currentAvatar === avatarUrl) {
            g.currentAvatar = g.unlockedAvatars[0] || null;
            g.avatarUrl = g.unlockedAvatars[0] || null;
        }

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        if (g.avatarUrl) {
            await pool.query('UPDATE employees SET avatar = $1 WHERE id = $2', [g.avatarUrl, employeeId]);
        }
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Manager: Grant rewards to employee (coins, chests, xp)
app.post('/api/gamification/grant-reward', async (req, res) => {
    const { employeeId, coins, chests, xp, reason } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};

        if (coins) g.coins = (parseInt(g.coins) || 0) + parseInt(coins);
        if (chests) g.pendingRewards = (parseInt(g.pendingRewards) || 0) + parseInt(chests);
        if (xp) {
            g.xp = (parseInt(g.xp) || 0) + parseInt(xp);
            g.level = Math.floor(Math.sqrt(Math.max(0, g.xp) / 100)) + 1;
        }

        // Log the reward grant
        g.rewardHistory = g.rewardHistory || [];
        g.rewardHistory.push({
            date: new Date().toISOString(),
            coins: coins || 0,
            chests: chests || 0,
            xp: xp || 0,
            reason: reason || 'Premio del gerente'
        });

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Manager: Create and assign medal to employee
app.post('/api/gamification/assign-medal', async (req, res) => {
    const { employeeId, title, comment, iconSeed } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};

        const medal = {
            id: 'medal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            title: title,
            comment: comment || '',
            icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${iconSeed || title}&backgroundColor=f59e0b,ef4444,8b5cf6,06b6d4,10b981&shape1Color=f59e0b,ef4444&shape2Color=8b5cf6,06b6d4&shape3Color=10b981,f59e0b`,
            date: new Date().toISOString()
        };

        g.medals = g.medals || [];
        g.medals.push(medal);

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, medal, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Manager: Generate random medal previews
app.get('/api/gamification/medal-previews', (req, res) => {
    const count = parseInt(req.query.count) || 6;
    const previews = [];
    const styles = ['shapes', 'identicon', 'bottts', 'fun-emoji', 'thumbs', 'adventurer-neutral'];
    for (let i = 0; i < count; i++) {
        const style = styles[i % styles.length];
        const seed = 'Medal' + Math.random().toString(36).substring(2, 8);
        previews.push({
            seed,
            url: `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=f59e0b,ef4444,8b5cf6,06b6d4,10b981`
        });
    }
    res.json(previews);
});

// Manager: Delete medal from employee
app.post('/api/gamification/delete-medal', async (req, res) => {
    const { employeeId, medalId } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};

        g.medals = (g.medals || []).filter(m => m.id !== medalId);

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- RESTORED ENDPOINTS ---
// Day Incidents
app.get('/api/day-incidents', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM day_incidents WHERE store_id = $1', [storeId]);
        const map = {};
        result.rows.forEach(r => map[r.date] = r.text);
        res.json(map);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/day-incidents', async (req, res) => {
    const { date, text } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const check = await pool.query('SELECT date FROM day_incidents WHERE date=$1 AND store_id=$2', [date, storeId]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE day_incidents SET text=$1 WHERE date=$2 AND store_id=$3', [text, date, storeId]);
        } else {
            await pool.query('INSERT INTO day_incidents (date, text, store_id) VALUES ($1, $2, $3)', [date, text, storeId]);
        }
        res.json({ message: 'Incident saved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/no-deals', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const { start, end } = req.query;
        let query = 'SELECT * FROM no_deal_details WHERE store_id = $1';
        const params = [storeId];
        if (start && end) {
            query += ' AND date >= $2 AND date <= $3';
            params.push(start, end);
        }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/no-deals', async (req, res) => {
    const { date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes, type, customer_name, customer_phone, grams, price_per_gram } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query(
            'INSERT INTO no_deal_details (date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes, store_id, type, customer_name, customer_phone, grams, price_per_gram) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
            [date, employee_id, reason, brand, model, price_asked, price_offered, price_sale, notes, storeId, type, customer_name, customer_phone, grams, price_per_gram]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/no-deals/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT date, employee_id FROM no_deal_details WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Record not found' });

        await pool.query('DELETE FROM no_deal_details WHERE id = $1', [id]);

        // Decrement daily groups count manually or assume recalc takes care if we had recalculate logic?
        // Basic decrement:
        const { date, employee_id } = check.rows[0];
        const key = `${employee_id}-${date}`;
        await pool.query('UPDATE daily_groups SET no_deal = GREATEST(0, no_deal - 1) WHERE key = $1', [key]);

        // NEW: Recalculate Gamification
        await recalculateGamification(employee_id);

        res.json({ message: 'Deleted and stats updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Security & Diagnostics mocks/simple endpoints
app.post('/api/security/check-imei', (req, res) => res.json({ status: 'CLEAN', message: 'IMEI Limpio' }));

// Locations
app.get('/api/locations', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT * FROM locations WHERE store_id = $1 ORDER BY name ASC', [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/locations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM locations WHERE id = $1', [id]);
        res.json({ message: 'Location deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/locations', async (req, res) => {
    const { prefix, count, zone } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const created = [];
        for (let i = 1; i <= (parseInt(count) || 1); i++) {
            const name = (parseInt(count) || 1) > 1 ? `${prefix}${i}` : prefix;
            const r = await pool.query('INSERT INTO locations (name, status, zone, store_id) VALUES ($1,$2,$3,$4) RETURNING *', [name, 'libre', zone || 'General', storeId]);
            created.push(r.rows[0]);
        }
        res.json(created);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/locations/:id', async (req, res) => {
    const { id } = req.params; const { status } = req.body;
    try { const r = await pool.query('UPDATE locations SET status=$1 WHERE id=$2 RETURNING *', [status, id]); res.json(r.rows[0]); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Settings
app.get('/api/settings', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        const result = await pool.query('SELECT midday_close, night_close, announcement FROM store_settings WHERE store_id = $1', [storeId]);
        res.json(result.rows[0] || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/settings', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { mid, night, ann } = req.body; // shorthand
    // Simplify for restoration
    res.json({ success: true }); // Mock for now or implement full if needed?
    // Let's implement full
    const { midday_close, night_close, announcement } = req.body;
    try {
        await pool.query(`INSERT INTO store_settings (store_id, midday_close, night_close, announcement) 
             VALUES ($1, $2, $3, $4) ON CONFLICT (store_id) DO UPDATE SET 
             midday_close = COALESCE($2, store_settings.midday_close),
             night_close = COALESCE($3, store_settings.night_close),
             announcement = COALESCE($4, store_settings.announcement)`, [storeId, midday_close, night_close, announcement]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DASHBOARD MISSING HEADER
app.get('/api/dashboard', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    const { date } = req.query;
    const dateStr = date || new Date().toISOString().split('T')[0];
    try {
        const response = {};
        const now = new Date();
        const startRange = new Date(`${dateStr}T00:00:00`);
        const endRange = new Date(`${dateStr}T23:59:59`);

        // Logs
        const logsRes = await pool.query('SELECT * FROM daily_logs WHERE store_id = $1 AND date(timestamp) = $2', [storeId, dateStr]);
        // Active
        const activeRes = await pool.query('SELECT * FROM active_sessions WHERE store_id = $1', [storeId]);
        const activeLogs = [];
        const activeSessionsList = [];

        activeRes.rows.forEach(s => {
            // For logs calculation
            if (s.client_start_time) {
                const st = new Date(s.client_start_time);
                if (st >= startRange && st < endRange) {
                    activeLogs.push({
                        start_time: s.client_start_time,
                        end_time: now.toISOString(),
                        employee_id: s.employee_id
                    });
                }
            }
            // For frontend state
            activeSessionsList.push({
                employeeId: s.employee_id,
                employeeName: s.employee_name,
                startTime: s.start_time,
                clientStartTime: s.client_start_time
            });
        });

        response.timeStats = calculateTimeStats([...logsRes.rows, ...activeLogs]);
        response.hourlyStats = calculateHourlyStats(logsRes.rows);

        // C. Daily Groups Breakdown (Per Employee)
        // Fetch everything for the date to build the table
        const groupsQuery = await pool.query(
            `SELECT key, standard, jewelry, recoverable, no_deal, client_seconds FROM daily_groups 
                 WHERE store_id = $1 AND key LIKE $2`,
            [storeId, `%-${dateStr}`]
        );

        const employeeGroups = {};
        let totalGroups = 0;
        const breakdown = { standard: 0, jewelry: 0, recoverable: 0 };

        groupsQuery.rows.forEach(r => {
            // Robust Parse: key is {ID}-{DATE}
            // We split by '-' and assume everything before the date part is ID.
            // The date part is the last 3 tokens (YYYY-MM-DD)? No, ISO date is 3 tokens.
            // key: "55-2024-02-18". "abc-def-2024-02-18".
            const parts = r.key.split('-');
            if (parts.length < 4) return; // invalid key format? YYYY-MM-DD is 3 parts. +1 ID = 4 parts.

            const datePart = parts.slice(-3).join('-'); // Reconstruct YYYY-MM-DD
            const empId = parts.slice(0, -3).join('-'); // Reconstruct ID

            if (datePart !== dateStr) return; // Should match query, but double check

            employeeGroups[r.key] = {
                standard: r.standard || 0,
                jewelry: r.jewelry || 0,
                recoverable: r.recoverable || 0,
                noDeal: r.no_deal || 0,
                clientSeconds: r.client_seconds || 0
            };
            // Frontend expects keys like "55-2024-02-18' (which is r.key) mapping to values.

            const g = (r.standard || 0) + (r.jewelry || 0) + (r.recoverable || 0);
            totalGroups += g;
            breakdown.standard += (r.standard || 0);
            breakdown.jewelry += (r.jewelry || 0);
            breakdown.recoverable += (r.recoverable || 0);
        });

        // D. Daily Records (Shifts)
        const recordsQuery = await pool.query(
            `SELECT id, employee_id, employee_name, start_time, end_time, duration_seconds, date 
                 FROM daily_records 
                 WHERE store_id = $1 AND date = $2`,
            [storeId, dateStr]
        );

        // Map to frontend format
        const dailyRecordsList = recordsQuery.rows.map(r => ({
            id: r.id, // Ensure BigInt handling if needed, but JSON usually OK if not huge
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            startTime: r.start_time,
            endTime: r.end_time,
            durationSeconds: r.duration_seconds,
            date: r.date,
            groups: 0 // Legacy field
        }));

        // Response construction for Dashboard
        response.dailyStats = {
            employeeGroups, // { "55-2024...": { ... } }
            dailyRecords: dailyRecordsList,
            activeSessions: activeSessionsList, // Only meaningful for Today
            totalGroups,
            breakdown
        };




        res.json(response);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});




app.put('/api/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    const { durationSeconds } = req.body;
    try {
        const check = await pool.query('UPDATE daily_records SET duration_seconds = $1 WHERE id = $2 RETURNING employee_id', [durationSeconds, id]);
        if (check.rows.length > 0) {
            await recalculateGamification(check.rows[0].employee_id);
        }
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
