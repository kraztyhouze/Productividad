import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pool } from '../db.js';
import { SHOP_ITEMS, REWARD_EFFECTS } from './helpers/gamification.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREMIUM_THEMES = ['Dragon Ball', 'Marvel', 'Disney', 'Música', 'Fútbol'];

// Load themed avatar pools from manifest
let THEMED_AVATAR_POOLS;
try {
    const manifestPath = path.join(__dirname, '..', '..', 'public', 'avatars', 'manifest.json');
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

// Re-export so other modules can import from here
export { SHOP_ITEMS, REWARD_EFFECTS };


// GET /api/gamification/shop
router.get('/shop', (req, res) => res.json(SHOP_ITEMS));

// GET /api/gamification/effects
router.get('/effects', (req, res) => res.json(REWARD_EFFECTS));

// POST /api/gamification/buy-item
router.post('/buy-item', async (req, res) => {
    const { employeeId, itemId } = req.body;
    try {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        let g = empRes.rows[0].gamification || {};
        const coins = parseInt(g.coins || 0);
        if (coins < item.price) return res.status(400).json({ error: 'Saldo insuficiente' });

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

        g.coins = coins - item.price;
        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/gamification/equip-item
router.post('/equip-item', async (req, res) => {
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

// POST /api/gamification/equip-effect
router.post('/equip-effect', async (req, res) => {
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

// POST /api/gamification/claim-reward
router.post('/claim-reward', async (req, res) => {
    const { employeeId, theme } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};
        const pending = parseInt(g.pendingRewards || 0);
        if (pending <= 0) return res.status(400).json({ error: 'No tienes cofres disponibles' });

        g.pendingRewards = pending - 1;

        const roll = Math.random();
        let rewardData = {};
        const ownedEffects = g.unlockedEffects || [];
        const availableEffects = REWARD_EFFECTS.filter(e => !ownedEffects.includes(e.id));

        if (roll > 0.75 && availableEffects.length > 0) {
            const effect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
            g.unlockedEffects = [...ownedEffects, effect.id];
            rewardData = { type: 'effect', effectName: effect.name, effectIcon: effect.icon };
        } else {
            let selectedTheme = theme;
            if (!PREMIUM_THEMES.includes(theme)) {
                selectedTheme = PREMIUM_THEMES[Math.floor(Math.random() * PREMIUM_THEMES.length)];
            }
            const pool_ = THEMED_AVATAR_POOLS[selectedTheme] || THEMED_AVATAR_POOLS['Dragon Ball'];
            const ownedAvatars = g.unlockedAvatars || [];
            let available = pool_.filter(a => !ownedAvatars.includes(a.url));
            if (available.length === 0) {
                for (const t of PREMIUM_THEMES) {
                    const p = THEMED_AVATAR_POOLS[t];
                    const avail = p.filter(a => !ownedAvatars.includes(a.url));
                    if (avail.length > 0) { available = avail; selectedTheme = t; break; }
                }
            }
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

        g.collectionLog = g.collectionLog || [];
        g.collectionLog.push({ date: new Date().toISOString(), ...rewardData });

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g, ...rewardData });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/gamification/equip-border
router.post('/equip-border', async (req, res) => {
    const { employeeId, borderId } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};
        g.currentBorder = borderId;
        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/gamification/delete-avatar
router.post('/delete-avatar', async (req, res) => {
    const { employeeId, avatarUrl } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};
        g.unlockedAvatars = (g.unlockedAvatars || []).filter(a => a !== avatarUrl);
        if (g.currentAvatar === avatarUrl) {
            g.currentAvatar = g.unlockedAvatars[0] || null;
            g.avatarUrl = g.unlockedAvatars[0] || null;
        }
        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        if (g.avatarUrl) await pool.query('UPDATE employees SET avatar = $1 WHERE id = $2', [g.avatarUrl, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/gamification/grant-reward
router.post('/grant-reward', async (req, res) => {
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
        g.rewardHistory = g.rewardHistory || [];
        g.rewardHistory.push({ date: new Date().toISOString(), coins: coins || 0, chests: chests || 0, xp: xp || 0, reason: reason || 'Premio del gerente' });
        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, gamification: g });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/gamification/assign-medal
router.post('/assign-medal', async (req, res) => {
    const { employeeId, title, comment, iconSeed } = req.body;
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let g = empRes.rows[0].gamification || {};
        const medal = {
            id: 'medal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            title,
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

// GET /api/gamification/medal-previews
router.get('/medal-previews', (req, res) => {
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

// POST /api/gamification/delete-medal
router.post('/delete-medal', async (req, res) => {
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

export default router;
