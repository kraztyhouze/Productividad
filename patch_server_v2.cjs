
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/index.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Duplicate Gamification Block (Lines ~1655 onwards if present)
// We look for the second `app.post('/api/gamification/claim-reward'` block and remove it.
const firstClaimIndex = content.indexOf("app.post('/api/gamification/claim-reward'");
const secondClaimIndex = content.indexOf("app.post('/api/gamification/claim-reward'", firstClaimIndex + 1);

if (secondClaimIndex !== -1) {
    console.log("Found duplicate claim-reward endpoint. Removing duplicate block...");
    // Find the start of the block (e.g. `// --- GAMIFICATION API ---`)
    const startBlock = content.lastIndexOf("// --- GAMIFICATION API ---", secondClaimIndex);
    // Find end of block (next app.get or app.post or significant marker)
    // Actually, let's just comment it out or remove it carefully.
    // Easier: Just replace the content with empty string if strict match.
    // But better to rewrite the whole file structure.
    // Given complexity, let's just patch the FIRST block (around line 800) to be correct
    // and remove the second block.
}

// 2. Define New Themes
const newThemes = `
const PREMIUM_THEMES = ['Dragon Ball', 'Marvel', 'Disney', 'Música', 'Fútbol'];
`;

// Replace old PREMIUM_THEMES definition
content = content.replace(/const PREMIUM_THEMES = \[.*\];/s, newThemes.trim());

// 3. Implement Recalculate Logic
const recalcFunction = `
async function recalculateGamification(employeeId) {
    try {
        const empRes = await pool.query('SELECT * FROM employees WHERE id = $1', [employeeId]);
        if (empRes.rows.length === 0) return;
        const emp = empRes.rows[0];
        let g = emp.gamification || {};

        // 1. Calculate XP from Sales (Groups)
        const groupsRes = await pool.query('SELECT * FROM daily_groups WHERE key LIKE $1', [\`\${employeeId}-%\`]);
        let totalSold = 0;
        let totalInteractions = 0;
        
        groupsRes.rows.forEach(row => {
            totalSold += (row.standard || 0) + (row.jewelry || 0) + (row.recoverable || 0);
            totalInteractions += (row.standard || 0) + (row.jewelry || 0) + (row.recoverable || 0) + (row.noDeal || 0);
            // No Deal gives minimal XP? 
        });

        // 2. Calculate XP from Time (Records)
        const recordsRes = await pool.query('SELECT durationSeconds FROM daily_records WHERE "employeeId" = $1', [String(employeeId)]);
        let totalSeconds = 0;
        recordsRes.rows.forEach(r => totalSeconds += (r.durationSeconds || 0));

        // Formula: 10 XP per Sale, 1 XP per minute worked?
        // Let's stick to a simple proxy or trust existing g.xp but verify.
        // Problem: If valid sales are deleted, g.xp remains high.
        // So we MUST recalculate.
        
        // RECALCULATE XP FORMULA
        // 50 XP per Sale (Standard/Jewelry/Rec)
        // 10 XP per No Deal
        // 5 XP per Minute Worked
        const xpFromSales = totalSold * 50;
        let xpFromNoDeals = 0; // Need to count No Deals from groups
        groupsRes.rows.forEach(r => xpFromNoDeals += (r.noDeal || 0) * 10);
        
        const xpFromTime = Math.floor(totalSeconds / 60) * 5;
        
        const newXP = xpFromSales + xpFromNoDeals + xpFromTime;
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1; // Level Curve

        // Coins?
        // Coins = Total Earned - Spent.
        // Earned = newXP (1:1 ratio for simplicity or similar) + Level Up Bonuses?
        // Level Up Bonus: 1000 coins per level above 1.
        const levelBonuses = (newLevel - 1) * 1000;
        const earnedCoins = newXP + levelBonuses;
        
        // Calculate Spent
        let spent = 0;
        // Check unlocked items prices
        // unlockedAvatars
        (g.unlockedAvatars || []).forEach(src => {
            const item = SHOP_ITEMS.find(i => i.src === src);
            if (item) spent += item.price;
        });
        // unlockedEffects
        (g.unlockedEffects || []).forEach(id => {
            const item = SHOP_ITEMS.find(i => i.id === id);
            if (!item) {
                 // Maybe it is a SHOP effect
                 const shopItem = SHOP_ITEMS.find(si => si.id === id);
                 if (shopItem) spent += shopItem.price;
            }
        });

        let newCoins = Math.max(0, earnedCoins - spent);

        // Update DB
        g.xp = newXP;
        g.level = newLevel;
        g.coins = newCoins;
        
        // Pending Rewards? 
        // If Level dropped, remove pending rewards?
        // Max Level tracking
        if (newLevel < (g.maxLevel || 1)) {
             // Downgrade happened.
             g.maxLevel = newLevel; 
             // Should we remove pending chests?
             // Yes, to prevent exploit.
             g.pendingRewards = Math.max(0, (g.pendingRewards || 0) - 1); 
        } else if (newLevel > (g.maxLevel || 1)) {
             g.maxLevel = newLevel;
        }

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        console.log(\`Recalculated Gamification for Emp \${employeeId}: XP=\${newXP}, Level=\${newLevel}, Coins=\${newCoins}\`);
    } catch(e) { console.error("Recalc Error", e); }
}
`;

// Inject Recalc Function before ROUTES
content = content.replace('// --- ROUTES ---', recalcFunction + '\n// --- ROUTES ---');

// 4. Update claim-reward to accept Theme
const claimRewardLogic = `
app.post('/api/gamification/claim-reward', async (req, res) => {
    const { employeeId, theme } = req.body; // Added theme
    try {
        const empRes = await pool.query('SELECT gamification FROM employees WHERE id = $1', [employeeId]);
        let g = empRes.rows[0].gamification || {};
        const pending = parseInt(g.pendingRewards || 0);
        if (pending <= 0) return res.status(400).json({ error: 'No tienes cofres disponibles' });

        g.pendingRewards = pending - 1;

        // 20% Chance for Effect (reduced from 30%)
        const roll = Math.random();
        let rewardData = {};
        const ownedEffects = g.unlockedEffects || [];
        const availableEffects = REWARD_EFFECTS.filter(e => !ownedEffects.includes(e.id));

        if (roll > 0.8 && availableEffects.length > 0) {
             const effect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
             g.unlockedEffects = [...ownedEffects, effect.id];
             rewardData = { type: 'effect', ...effect };
        } else {
             // Avatar based on Theme
             let selectedTheme = theme;
             if (!PREMIUM_THEMES.includes(theme)) {
                 selectedTheme = PREMIUM_THEMES[Math.floor(Math.random() * PREMIUM_THEMES.length)];
             }
             
             // Generate Seed based on Theme
             let seedPrefix = selectedTheme;
             if (selectedTheme === 'Fútbol') {
                 seedPrefix = Math.random() > 0.5 ? 'SevillaFC' : 'RealBetis';
             }
             // Remove spaces for seed
             const cleanSeed = seedPrefix.replace(/\s+/g, '') + Math.random().toString(36).substring(7);
             
             // Use bottts
             const wonAvatar = \`https://api.dicebear.com/7.x/bottts/svg?seed=\${cleanSeed}&backgroundColor=transparent\`;

             g.unlockedAvatars = [...(g.unlockedAvatars || []), wonAvatar];
             g.currentAvatar = wonAvatar;
             g.avatarUrl = wonAvatar;
             rewardData = { type: 'avatar', src: wonAvatar, theme: selectedTheme };
        }

        await pool.query('UPDATE employees SET gamification = $1 WHERE id = $2', [g, employeeId]);
        res.json({ success: true, remaining: g.pendingRewards, ...rewardData });
    } catch(err) { res.status(500).json({ error: err.message }); }
});
`;

// Replace existing claim-reward endpoint using Regex to match the block
const claimRegex = /app\.post\('\/api\/gamification\/claim-reward', async \(req, res\) => \{[\s\S]*?\}\);/m;
content = content.replace(claimRegex, claimRewardLogic);

// 5. Update DELETE endpoints to call recalculate
// Find DELETE /api/daily-records/:id
const deleteRecordRegex = /app\.delete\('\/api\/daily-records\/:id', async \(req, res\) => \{[\s\S]*?\}\);/m;
const newDeleteRecord = `
app.delete('/api/daily-records/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT "employeeId" FROM daily_records WHERE id = $1', [id]);
        if (check.rows.length > 0) {
            const empId = check.rows[0].employeeId;
            await pool.query('DELETE FROM daily_records WHERE id = $1', [id]);
            // Recalculate
            await recalculateGamification(empId);
        }
        res.json({ message: 'Record deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
`;
content = content.replace(deleteRecordRegex, newDeleteRecord);

// Remove the duplicate gamification block at end if exists
// We know the duplicate starts with const AVATAR_THEMES
const duplicateStart = content.indexOf("const AVATAR_THEMES = {");
if (duplicateStart !== -1) {
    // Find the END of the duplicate block. It ends before app.listen probably?
    // Or just replace from AVATAR_THEMES down to the end of the claim-reward function.
    // Let's replace the specific duplicate claim-reward function if it exists.
    const duplicateClaim = content.indexOf("app.post('/api/gamification/claim-reward'", duplicateStart);
    if (duplicateClaim !== -1) {
        // Find end of this function
        const endOfFunc = content.indexOf("});", duplicateClaim);
        if (endOfFunc !== -1) {
            // Remove the whole chunk including AVATAR_THEMES
            const chunkToRemove = content.substring(duplicateStart, endOfFunc + 3);
            content = content.replace(chunkToRemove, "");
            console.log("Removed duplicate gamification block.");
        }
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Server patched successfully.");
