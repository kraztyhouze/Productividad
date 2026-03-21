const { Pool } = require('pg');
const crypto = require('node:crypto');

const DATABASE_URL = "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";
const ENCRYPTION_KEY = "TikTak_Suite_v2.1_Shield_Proteccion_AES256";

const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const ALGORITHM = 'aes-256-gcm';

function decrypt(data) {
    if (!data || typeof data !== 'string' || data.split(':').length !== 3) return data;
    try {
        const [ivHex, authTagHex, encrypted] = data.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) { return null; }
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
        console.log('--- REGENERATING ALL BLIND INDEXES ---');
        const res = await pool.query("SELECT id, username, first_name, last_name, email FROM employees");
        
        for (const emp of res.rows) {
            const decUser = decrypt(emp.username);
            const decFN = decrypt(emp.first_name);
            const decLN = decrypt(emp.last_name);
            const decEmail = decrypt(emp.email);

            if (decUser) {
                const userBI = generateBlindIndex(decUser);
                const fnBI = generateBlindIndex(decFN);
                const lnBI = generateBlindIndex(decLN);
                const emailBI = generateBlindIndex(decEmail);

                await pool.query(
                    `UPDATE employees SET 
                        username_bindex = $1, 
                        first_name_bindex = $2, 
                        last_name_bindex = $3, 
                        email_bindex = $4
                    WHERE id = $5`,
                    [userBI, fnBI, lnBI, emailBI, emp.id]
                );
                console.log(`✅ Fixed BIndexes for ID ${emp.id} (user: ${decUser})`);
            } else {
                console.log(`❌ Skipped ID ${emp.id} (cannot decrypt username)`);
            }
        }
    } finally {
        await pool.end();
    }
}

fix();
