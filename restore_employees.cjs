const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: "postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
});

async function restore() {
    const backupPath = "c:/Users/Juanma/.gemini/antigravity/TikTak 2.1/backup-railway/employees_2026-02-03T14-24-52.json";
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log(`Starting restoration of ${backupData.length} employees...`);
    
    for (const emp of backupData) {
        // We will reset first_name, last_name, alias, email, phone, address and username to cleartext
        // This will allow the server to re-encrypt them with the NEW key on next restart.
        await pool.query(`
            UPDATE employees 
            SET first_name = $1, 
                last_name = $2, 
                alias = $3, 
                email = $4, 
                phone = $5, 
                address = $6,
                username = $7
            WHERE id = $8 OR username = $7
        `, [
            emp.first_name, 
            emp.last_name, 
            emp.alias, 
            emp.email, 
            emp.phone, 
            emp.address,
            emp.username,
            emp.id
        ]);
        console.log(`Restored ${emp.username}`);
    }
    
    console.log('✅ Restoration complete! The server will re-encrypt these on next restart.');
    await pool.end();
}

restore().catch(console.error);
