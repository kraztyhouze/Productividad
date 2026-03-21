const { Pool } = require('pg');
const crypto = require('node:crypto');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";
const ENCRYPTION_KEY = "TikTak_Suite_v2.1_Shield_Proteccion_AES256";

const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const ALGORITHM = 'aes-256-gcm';

function decrypt(data) {
    if (!data || typeof data !== 'string') return data;
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
        const res = await pool.query('SELECT id, first_name, last_name, username FROM employees');
        const results = res.rows.map(r => ({
            id: r.id,
            first_name: decrypt(r.first_name),
            last_name: decrypt(r.last_name),
            username: decrypt(r.username),
            is_broken: decrypt(r.first_name) === null || decrypt(r.last_name) === null || decrypt(r.username) === null
        }));
        
        console.log('--- EMPLOYEE STATUS ---');
        results.forEach(r => {
            if (r.is_broken) {
                console.log(`❌ ID: ${r.id} - BROKEN (cannot decrypt)`);
            } else {
                console.log(`✅ ID: ${r.id} - OK (${r.first_name} ${r.last_name})`);
            }
        });

        const brokenCount = results.filter(r => r.is_broken).length;
        console.log(`\nSummary: ${brokenCount} / ${results.length} employees are broken.`);

    } finally {
        await pool.end();
    }
}

debug();
