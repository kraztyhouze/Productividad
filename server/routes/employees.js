import express from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import { SHOP_ITEMS, REWARD_EFFECTS } from './gamification.js';
import { DataService } from '../services/dataService.js';

const router = express.Router();

// 1. Employees (Secured: No Passwords returned)
router.get('/', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // EXCLUDED password and bindex columns from SELECT
        const result = await pool.query(`
            SELECT 
                id, avatar, first_name as "firstName", last_name as "lastName", alias, email, 
                role, contract_hours as "contractHours", contract_type as "contractType", 
                username, is_buyer as "isBuyer", phone, address, "order", store_id, gamification,
                can_count_cash as "canCountCash", is_interviewer as "isInterviewer",
                has_1_1_meetings as "has11Meetings", is_active as "isActive",
                show_in_warroom as "showInWarRoom"
            FROM employees 
            WHERE store_id = $1
            ORDER BY "order" ASC, id ASC
        `, [storeId]);
        const employees = result.rows.map(emp => ({
            ...emp,
            nombre: emp.alias || `${emp.firstName} ${emp.lastName}`
        }));
        res.json(employees);
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/', async (req, res) => {
    const body = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        // Hash Password before insert
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Security: Prepare data for DB (Encryption & Blind Indexing)
        const dbData = DataService.prepareEmployeeForSave({
            first_name: body.firstName,
            last_name: body.lastName,
            alias: body.alias,
            email: body.email,
            username: body.username,
            phone: body.phone,
            address: body.address
        });

        const result = await pool.query(
            `INSERT INTO employees (
                first_name, last_name, alias, email, role, contract_hours, contract_type, 
                username, password, is_buyer, phone, address, avatar, store_id, gamification, 
                can_count_cash, is_interviewer, has_1_1_meetings, is_active,
                first_name_bindex, last_name_bindex, email_bindex, show_in_warroom
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING id`,
            [
                dbData.first_name, dbData.last_name, dbData.alias, dbData.email, body.role, body.contractHours, body.contractType, 
                dbData.username, hashedPassword, body.isBuyer, dbData.phone, dbData.address, body.avatar, storeId, 
                body.gamification || {}, body.canCountCash || false, body.isInterviewer || false,
                body.has11Meetings !== undefined ? body.has11Meetings : true,
                body.isActive !== undefined ? body.isActive : true,
                dbData.first_name_bindex || null, dbData.last_name_bindex || null, dbData.email_bindex || null,
                body.showInWarRoom !== undefined ? body.showInWarRoom : true
            ]
        );
        // Return confirmed data but NO PASSWORD (middleware will decrypt the response transparently)
        res.json({
            id: result.rows[0].id, ...body, password: undefined
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    try {
        const currentRes = await pool.query('SELECT * FROM employees WHERE id=$1', [id]);
        if (currentRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const old = currentRes.rows[0];

        // Decrypt inputs or merge (DataService.prepare handles it if we pass strings)
        const merged = {
            first_name: body.firstName !== undefined ? body.firstName : old.first_name,
            last_name: body.lastName !== undefined ? body.lastName : old.last_name,
            alias: body.alias !== undefined ? body.alias : old.alias,
            email: body.email !== undefined ? body.email : old.email,
            username: body.username !== undefined ? body.username : old.username,
            phone: body.phone !== undefined ? body.phone : old.phone,
            address: body.address !== undefined ? body.address : old.address
        };

        const dbData = DataService.prepareEmployeeForSave(merged);

        let hashedPassword = old.password;
        if (body.password && body.password.trim() !== "") {
            hashedPassword = await bcrypt.hash(body.password, 10);
        }

        const newRole = body.role !== undefined ? body.role : old.role;
        let newGamification = body.gamification !== undefined ? body.gamification : (old.gamification || {});

        const oldRole = old.role;
        const roleChanged = body.role !== undefined && body.role !== oldRole;

        const ALL_AVATARS = SHOP_ITEMS.filter(i => i.type === 'skin' && i.src).map(i => i.src);
        const ALL_EFFECTS = [...new Set([
            ...SHOP_ITEMS.filter(i => i.type === 'effect').map(i => i.id),
            ...REWARD_EFFECTS.map(e => e.id)
        ])];

        if (roleChanged && newRole === 'Gerente') {
            newGamification = {
                xp: 999999, level: 50, maxLevel: 50, coins: 999999, pendingRewards: 100,
                unlockedAvatars: ALL_AVATARS, unlockedEffects: ALL_EFFECTS,
                currentAvatar: ALL_AVATARS[0] || null, avatarUrl: ALL_AVATARS[0] || null,
                medals: newGamification.medals || []
            };
        } else if (roleChanged && oldRole === 'Gerente') {
            newGamification = { xp: 0, level: 1, maxLevel: 1, coins: 0, pendingRewards: 0, unlockedAvatars: [], unlockedEffects: [], currentAvatar: null, avatarUrl: null, medals: [] };
        }

        const result = await pool.query(
            `UPDATE employees SET 
                first_name=$1, last_name=$2, alias=$3, email=$4, role=$5, contract_hours=$6, 
                contract_type=$7, username=$8, password=$9, is_buyer=$10, phone=$11, address=$12, 
                avatar=$13, "order"=$14, gamification=$15, can_count_cash=$16, is_interviewer=$17,
                has_1_1_meetings=$18, is_active=$19, first_name_bindex=$20, last_name_bindex=$21, email_bindex=$22,
                show_in_warroom=$23
            WHERE id=$24 RETURNING *`,
            [
                dbData.first_name, dbData.last_name, dbData.alias, dbData.email, newRole, body.contractHours !== undefined ? body.contractHours : old.contract_hours, 
                body.contractType !== undefined ? body.contractType : old.contract_type, dbData.username, hashedPassword, body.isBuyer !== undefined ? body.isBuyer : old.is_buyer, 
                dbData.phone, dbData.address, body.avatar !== undefined ? body.avatar : old.avatar, body.order !== undefined ? body.order : old.order, 
                newGamification, body.canCountCash !== undefined ? body.canCountCash : old.can_count_cash, body.isInterviewer !== undefined ? body.isInterviewer : (old.is_interviewer || false),
                body.has11Meetings !== undefined ? body.has11Meetings : (old.has_1_1_meetings !== undefined ? old.has_1_1_meetings : true),
                body.isActive !== undefined ? body.isActive : (old.is_active !== undefined ? old.is_active : true),
                dbData.first_name_bindex || null, dbData.last_name_bindex || null, dbData.email_bindex || null,
                body.showInWarRoom !== undefined ? body.showInWarRoom : (old.show_in_warroom !== undefined ? old.show_in_warroom : true),
                id
            ]
        );

        const updated = result.rows[0];
        res.json({
            id: updated.id,
            firstName: updated.first_name, lastName: updated.last_name, alias: updated.alias,
            email: updated.email, role: updated.role, contractHours: updated.contract_hours,
            contractType: updated.contract_type, username: updated.username,
            isBuyer: updated.is_buyer, phone: updated.phone, address: updated.address,
            order: updated.order, avatar: updated.avatar, gamification: updated.gamification,
            canCountCash: updated.can_count_cash, isInterviewer: updated.is_interviewer,
            has11Meetings: updated.has_1_1_meetings,
            isActive: updated.is_active,
            showInWarRoom: updated.show_in_warroom
        });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

router.post('/:id/reset-gamification', async (req, res) => {
    const { id } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';

    // Reset State
    const initialGamification = {
        xp: 0, level: 1, maxLevel: 1, coins: 0, pendingRewards: 0,
        unlockedAvatars: [], unlockedEffects: [], currentAvatar: null, avatarUrl: null, medals: []
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
