import express from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import { SHOP_ITEMS, REWARD_EFFECTS } from './gamification.js';

const router = express.Router();

// 1. Employees (Secured: No Passwords returned)
router.get('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // EXCLUDED password from SELECT
        const result = await pool.query(`
            SELECT 
                id, avatar, first_name as "firstName", last_name as "lastName", alias, email, 
                role, contract_hours as "contractHours", contract_type as "contractType", 
                username, is_buyer as "isBuyer", phone, address, "order", store_id, gamification,
                can_count_cash as "canCountCash"
            FROM employees 
            WHERE store_id = $1
            ORDER BY "order" ASC, id ASC
        `, [storeId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/', async (req, res) => {
    const { firstName, lastName, alias, email, role, contractHours, contractType, username, password, isBuyer, phone, address, avatar, gamification } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        // Hash Password before insert
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO employees (
                first_name, last_name, alias, email, role, contract_hours, contract_type, 
                username, password, is_buyer, phone, address, avatar, store_id, gamification, can_count_cash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
            [firstName, lastName, alias, email, role, contractHours, contractType, username, hashedPassword, isBuyer, phone, address, avatar, storeId, gamification || {}, req.body.canCountCash || false]
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

router.put('/:id', async (req, res) => {
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
        const newCanCount = req.body.canCountCash !== undefined ? req.body.canCountCash : old.can_count_cash;
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
                avatar=$13, "order"=$14, gamification=$15, can_count_cash=$16
            WHERE id=$17 RETURNING *`,
            [newFirstName, newLastName, newAlias, newEmail, newRole, newContractHours, newContractType, newUsername, hashedPassword, newIsBuyer, newPhone, newAddress, newAvatar, newOrder, newGamification, newCanCount, id]
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
            gamification: updated.gamification,
            canCountCash: updated.can_count_cash
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/reset-gamification', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }) }
});


export default router;
