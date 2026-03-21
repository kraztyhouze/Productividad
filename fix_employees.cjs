const { Pool } = require('pg');
const crypto = require('node:crypto');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";
const ENCRYPTION_KEY = "TikTak_Suite_v2.1_Shield_Proteccion_AES256";

const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
    if (!text || typeof text !== 'string') return text;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function generateBlindIndex(text) {
    if (!text || typeof text !== 'string') return text;
    return crypto.createHmac('sha256', key)
        .update(text.toLowerCase().trim())
        .digest('hex')
        .slice(0, 32);
}

async function fix() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        console.log('--- Fixing Employee ID 29 & 30 ---');

        // Fix ID 29
        const fn29 = encrypt('Kiosko');
        const ln29 = encrypt('Compras');
        const alias29 = encrypt('KIOSCO');
        const user29 = encrypt('kiosko');
        const fnb29 = generateBlindIndex('Kiosko');
        const lnb29 = generateBlindIndex('Compras');

        await pool.query(
            "UPDATE employees SET first_name=$1, last_name=$2, alias=$3, username=$4, first_name_bindex=$5, last_name_bindex=$6 WHERE id=29",
            [fn29, ln29, alias29, user29, fnb29, lnb29]
        );
        console.log('✅ ID 29 fixed as Kiosko Compras');

        // Fix ID 30 (Unknown name, using placeholder)
        const fn30 = encrypt('Puesto');
        const ln30 = encrypt('Ventas');
        const alias30 = encrypt('PV30');
        const user30 = encrypt('puesto30');
        const fnb30 = generateBlindIndex('Puesto');
        const lnb30 = generateBlindIndex('Ventas');

        await pool.query(
            "UPDATE employees SET first_name=$1, last_name=$2, alias=$3, username=$4, first_name_bindex=$5, last_name_bindex=$6 WHERE id=30",
            [fn30, ln30, alias30, user30, fnb30, lnb30]
        );
        console.log('✅ ID 30 fixed as Puesto Ventas (placeholder)');

    } finally {
        await pool.end();
    }
}

fix();
