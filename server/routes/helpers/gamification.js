import { pool } from '../../db.js';

// --- GAMIFICATION CONSTANTS ---
export const SHOP_ITEMS = [
    { id: 'skin_basic_blue', name: 'Bot Azul', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=BlueBot', icon: 'user' },
    { id: 'skin_basic_red', name: 'Bot Rojo', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=RedBot', icon: 'user' },
    { id: 'skin_basic_green', name: 'Bot Verde', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=GreenBot', icon: 'user' },
    { id: 'skin_basic_yellow', name: 'Bot Amarillo', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=YellowBot', icon: 'user' },
    { id: 'skin_basic_purple', name: 'Bot Púrpura', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=PurpleBot', icon: 'user' },
    { id: 'skin_basic_orange', name: 'Bot Naranja', type: 'skin', price: 3000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=OrangeBot', icon: 'user' },
    { id: 'skin_elite_gold', name: 'Bot Dorado (Élite)', type: 'skin', price: 10000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldElite', icon: 'disc' },
    { id: 'skin_elite_cyber', name: 'Cyber Unit (Élite)', type: 'skin', price: 15000, src: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberUnit', icon: 'disc' },
    { id: 'fx_sparkle', name: 'Efecto: Destellos', type: 'effect', price: 8000, icon: 'sparkles' },
    { id: 'fx_confetti', name: 'Efecto: Confeti', type: 'effect', price: 8000, icon: 'party' },
    { id: 'fx_fire', name: 'Efecto: Llamas', type: 'effect', price: 12000, icon: 'flame' },
    { id: 'fx_matrix', name: 'Efecto: Matrix', type: 'effect', price: 12000, icon: 'code' },
    { id: 'fx_notes', name: 'Efecto: Musical', type: 'effect', price: 10000, icon: 'music' },
    { id: 'fx_lightning', name: 'Efecto: Rayo', type: 'effect', price: 15000, icon: 'zap' },
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

export const REWARD_EFFECTS = [
    { id: 'fx_sparkle', name: 'Destellos Mágicos', type: 'effect', icon: 'sparkles' },
    { id: 'fx_fire', name: 'Llamas Infernales', type: 'effect', icon: 'flame' },
    { id: 'fx_matrix', name: 'Código Matrix', type: 'effect', icon: 'code' },
    { id: 'fx_confetti', name: 'Fiesta Total', type: 'effect', icon: 'party' },
    { id: 'fx_notes', name: 'Ritmo Musical', type: 'effect', icon: 'music' },
    { id: 'fx_lightning', name: 'Tormenta Eléctrica', type: 'effect', icon: 'zap' }
];

export async function recalculateGamification(employeeId) {
    try {
        // Basic check: if ID is not a number, it can't be in the employees table (ID is SERIAL)
        const numericId = parseInt(employeeId);
        if (isNaN(numericId)) {
            console.log(`[Gamification] Skipping recalc for non-numeric ID: ${employeeId}`);
            return;
        }

        const empRes = await pool.query('SELECT * FROM employees WHERE id = $1', [numericId]);
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
    } catch (e) { console.error('Recalc Error', e); }
}
