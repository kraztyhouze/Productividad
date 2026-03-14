import 'dotenv/config';
import { pool } from './db.js';

const tables = [
    'active_sessions',
    'daily_records',
    'day_incidents',
    'closed_days',
    'employees',
    'product_families',
    'daily_groups',
    'roles',
    'tasks',
    'comments',
    'no_deal_details',
    'store_settings',
    'locations',
    'transaction_logs',
    'market_prices'
];

async function undoSecurity() {
    console.log('🔓 Desactivando RLS para restaurar acceso a datos...');
    const client = await pool.connect();
    try {
        for (const table of tables) {
            try {
                // DISABLE Row Level Security to restore access
                await client.query(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
                console.log(`✅ Acceso Restaurado: ${table}`);
            } catch (e) {
                console.error(`❌ Error en ${table}:`, e.message);
            }
        }
        console.log('\n✨ Base de datos desbloqueada. El dashboard debería mostrar datos de nuevo.');
    } catch (e) {
        console.error('Error de conexión:', e);
    } finally {
        client.release();
        process.exit();
    }
}

undoSecurity();
