require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function generateBlindIndex(text) {
    return crypto.createHmac('sha256', key)
        .update(text.toLowerCase().trim())
        .digest('hex')
        .slice(0, 32);
}

async function fixAdmin() {
    const username = 'admin';
    const password = 'admin123';
    
    const encryptedUsername = encrypt(username);
    const bindex = generateBlindIndex(username);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    try {
        // Try to find the user by blind index first
        const check = await pool.query("SELECT * FROM employees WHERE username_bindex = $1", [bindex]);
        if (check.rows.length > 0) {
            await pool.query(
                "UPDATE employees SET username = $1, password = $2 WHERE username_bindex = $3",
                [encryptedUsername, hashedPassword, bindex]
            );
            console.log("Admin updated successfully.");
        } else {
             // Create it if it doesn't exist (assuming store_1)
             await pool.query(
                 "INSERT INTO employees (username, username_bindex, password, store_id, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                 [encryptedUsername, bindex, hashedPassword, 'store_1', 'Gerente', 'Admin', 'TikTak']
             );
             console.log("Admin created successfully.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

fixAdmin();
