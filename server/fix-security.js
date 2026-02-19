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

async function secureTables() {
    console.log('🔐 Iniciando securización de la base de datos (RLS)...');
    const client = await pool.connect();
    try {
        for (const table of tables) {
            try {
                // 1. Enable Row Level Security
                await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
                console.log(`✅ RLS Activado: ${table}`);

                // Nota: Al activar RLS sin crear políticas específicas, se deniega el acceso
                // a usuarios públicos/anónimos de Supabase, pero el usuario 'postgres' 
                // o 'service_role' (que usa este backend) sigue teniendo acceso total.

            } catch (e) {
                console.error(`❌ Error en ${table}:`, e.message);
            }
        }
        console.log('\n✨ Base de datos securizada. Las alertas de Supabase deberían desaparecer.');
    } catch (e) {
        console.error('Error de conexión:', e);
    } finally {
        client.release();
        process.exit();
    }
}

secureTables();
