import 'dotenv/config';
import { pool } from './server/db.js';

const PREMIUM_THEMES = ['Cyberpunk', 'Royal', 'Wizard', 'Neon', 'Dragon', 'Mecha', 'Spirit', 'Galaxy', 'Music'];
const EFFECTS = ['fx_sparkle', 'fx_fire', 'fx_matrix', 'fx_confetti', 'fx_notes', 'fx_lightning'];
const BASIC_ITEMS = ['https://api.dicebear.com/7.x/bottts/svg?seed=BlueBot'];

async function unlockAll() {
    try {
        const res = await pool.query("SELECT * FROM employees");
        const employees = res.rows;

        console.log(`Processing ${employees.length} employees...`);

        // Generate Theme Avatars
        const themeAvatars = PREMIUM_THEMES.map(theme =>
            `https://api.dicebear.com/7.x/bottts/svg?seed=${theme}-${Math.random().toString(36).substring(7)}`
        );

        for (const emp of employees) {
            let role = (emp.role || "").toLowerCase();
            let isManager = role.includes('gerente') || role.includes('responsable') || role.includes('supervisor') || role.includes('admin');

            let g = emp.gamification || {};
            let updated = false;

            if (isManager) {
                // Unlock ALL
                const currentAvatars = g.unlockedAvatars || [];
                const newAvatars = [...new Set([...currentAvatars, ...themeAvatars, ...BASIC_ITEMS])];
                g.unlockedAvatars = newAvatars;
                g.unlockedEffects = EFFECTS;
                g.coins = Math.max(g.coins || 0, 99999);
                g.pendingRewards = Math.max(g.pendingRewards || 0, 10);
                updated = true;
                console.log(`Unlocked Manager: ${emp.first_name} (${emp.role})`);
            } else {
                // Give Starter Pack
                if ((g.coins || 0) < 5000) {
                    g.coins = 5000;
                    updated = true;
                    console.log(`Gifted Coins to Employee: ${emp.first_name} (${emp.role})`);
                }
            }

            if (updated) {
                await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, emp.id]);
            }
        }
        console.log("Unlock All Complete!");

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
unlockAll();
