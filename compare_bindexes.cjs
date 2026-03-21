const { Pool } = require('pg');
const crypto = require('node:crypto');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";
const ENCRYPTION_KEY = "TikTak_Suite_v2.1_Shield_Proteccion_AES256";

const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function generateLocalBIndex(text) {
    if (!text) return null;
    return crypto.createHmac('sha256', key)
        .update(text.toLowerCase().trim())
        .digest('hex')
        .slice(0, 32);
}

function decrypt(data) {
    if (!data || typeof data !== 'string' || data === '') return data;
    const parts = data.split(':');
    if (parts.length !== 3) return data;
    try {
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) { return null; }
}

async function debug() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const res = await pool.query("SELECT id, username, username_bindex FROM employees");
        const list = res.rows.map(r => {
            const decUser = decrypt(r.username);
            const expected = generateLocalBIndex(decUser);
            return {
                id: r.id,
                user: decUser,
                dbBIndex: r.username_bindex,
                expected: expected,
                match: r.username_bindex === expected
            };
        });
        console.table(list);
    } finally {
        await pool.end();
    }
}

debug();
