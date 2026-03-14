
import 'dotenv/config';
import { pool } from './db.js';

const tables = [
    'active_sessions', 'daily_records', 'day_incidents', 'closed_days',
    'employees', 'product_families', 'daily_groups', 'roles',
    'tasks', 'comments', 'no_deal_details', 'store_settings',
    'locations', 'transaction_logs', 'market_prices'
];

async function revertSecurity() {
    console.log("--- REVERTING SECURITY TO PUBLIC ACCESS ---");
    const client = await pool.connect();

    try {
        for (const table of tables) {
            try {
                // 1. Drop the restrictive 'BackendAccess' policy
                await client.query(`DROP POLICY IF EXISTS "BackendAccess" ON public.${table};`);

                // 2. Re-create the permissive 'AllowAll' policy (Access to Everyone)
                // This restores the state where the app definitely worked.
                await client.query(`
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies 
                            WHERE tablename = '${table}' AND policyname = 'AllowAll'
                        ) THEN
                            CREATE POLICY "AllowAll" ON public.${table} FOR ALL USING (true) WITH CHECK (true);
                        END IF;
                    END $$;
                `);

                console.log(`✅ Restored Public Access for: ${table}`);
            } catch (e) {
                console.error(`❌ Error on ${table}:`, e.message);
            }
        }
        console.log("--- REVERT COMPLETE ---");
    } catch (e) {
        console.error("Connection Error:", e);
    } finally {
        client.release();
        process.exit();
    }
}

revertSecurity();
