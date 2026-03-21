const { Pool } = require('pg');
const crypto = require('node:crypto');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";
const ENCRYPTION_KEY = "TikTak_Suite_v2.1_Shield_Proteccion_AES256";

const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const ALGORITHM = 'aes-256-gcm';

function decrypt(data) {
    if (!data || typeof data !== 'string' || data === '') return data;
    const parts = data.split(':');
    if (parts.length !== 3) return data;

    try {
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null; // Signals broken
    }
}

async function debug() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        console.log('--- Checking ALIAS for employees ---');
        const res = await pool.query('SELECT id, alias, first_name FROM employees');
        for (const r of res.rows) {
            const decAlias = decrypt(r.alias);
            const decFN = decrypt(r.first_name);
            if (decAlias === null || decFN === null) {
                console.log(`❌ ID: ${r.id} is BROKEN (Alias: ${r.alias ? 'exists' : 'null'}, First: ${r.first_name ? 'exists' : 'null'})`);
            } else {
                console.log(`✅ ID: ${r.id} is OK (FN: ${decFN}, Alias: ${decAlias || 'N/A'})`);
            }
        }
    } finally {
        await pool.end();
    }
}

debug();
