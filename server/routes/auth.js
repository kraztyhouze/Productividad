import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';

const router = express.Router();

// Rate Limiting for Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { success: false, message: 'Demasiados intentos de inicio de sesión, por favor inténtalo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// POST /api/login — Secure Server-Side Auth
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';

    try {
        const result = await pool.query(
            'SELECT * FROM employees WHERE username = $1 AND store_id = $2',
            [username, storeId]
        );

        if (result.rows.length > 0) {
            const emp = result.rows[0];
            const match = await bcrypt.compare(password, emp.password);

            if (match) {
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

export default router;
