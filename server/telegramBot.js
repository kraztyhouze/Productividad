
import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pool } from './db.js';

// --- CONFIG ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// CSV of IDs
const ALLOWED_USERS = (process.env.TELEGRAM_ALLOWED_USERS || '').split(',').map(s => s.trim()).filter(Boolean);

if (!TELEGRAM_TOKEN || !GEMINI_API_KEY) {
    console.warn("⚠️ Telegram Bot skipped: Missing TELEGRAM_TOKEN or GEMINI_API_KEY");
}

let bot = null;
let genAI = null;
let model = null;

if (TELEGRAM_TOKEN && GEMINI_API_KEY) {
    bot = new Telegraf(TELEGRAM_TOKEN);
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // --- AVAILABLE TOOLS (Functions the AI can "call") ---
    const tools = {
        getGoldPrice: async () => {
            const res = await pool.query('SELECT gold_price, updated_at FROM store_settings WHERE store_id = $1', ['store_1']);
            if (res.rows.length === 0) return "No hay precio de oro definido.";
            return `El precio del oro (18k) está a ${res.rows[0].gold_price}€/g.`;
        },
        getActiveEmployees: async () => {
            const res = await pool.query('SELECT employee_name, start_time FROM active_sessions WHERE store_id = $1', ['store_1']);
            if (res.rows.length === 0) return "No hay nadie trabajando ahora mismo.";
            return `Hay ${res.rows.length} empleados activos: ${res.rows.map(r => r.employee_name).join(', ')}.`;
        },
        getDailyStats: async () => {
            try {
                const res = await pool.query(`
                    SELECT 
                        employee_name, 
                        COUNT(*) as sessions,
                        SUM(groups_count) as total_groups,
                        SUM(duration_seconds) as total_seconds
                    FROM daily_records 
                    WHERE date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AND store_id = 'store_1'
                    GROUP BY employee_name
                    ORDER BY total_groups DESC
                `);

                if (res.rows.length === 0) return "📉 No hay actividad registrada hoy (todavía).";

                let report = `📊 *REPORTE DE PRODUCTIVIDAD (HOY)*\n\n`;

                res.rows.forEach(r => {
                    const hours = (parseInt(r.total_seconds) || 0) / 3600;
                    const groups = parseInt(r.total_groups) || 0;
                    const groupsPerHour = hours > 0.1 ? (groups / hours).toFixed(1) : 0;

                    // Icon logic based on performance
                    let icon = '⚠️';
                    if (Number(groupsPerHour) >= 35) icon = '🔥';
                    else if (Number(groupsPerHour) >= 20) icon = '✅';

                    const timeStr = hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)}h`;

                    report += `👤 *${r.employee_name}*\n`;
                    report += `   • ${icon} Rendimiento: ${groupsPerHour} g/h\n`;
                    report += `   • 📦 Grupos: ${groups}\n`;
                    report += `   • ⏱ Tiempo: ${timeStr} (${r.sessions} sesiones)\n\n`;
                });

                const totalGroups = res.rows.reduce((sum, r) => sum + (parseInt(r.total_groups) || 0), 0);
                report += `🏆 *Total Tienda: ${totalGroups} grupos*`;

                return report;
            } catch (error) {
                console.error("Error generating daily stats:", error);
                throw new Error(`Error al generar reporte: ${error.message}`);
            }
        },
        getDailySales: async () => {
            try {
                const res = await pool.query(`
                    SELECT * FROM daily_groups 
                    WHERE key = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AND store_id = 'store_1'
                `);
                if (res.rows.length === 0) return "📉 No hay ventas/compras registradas aún.";

                const r = res.rows[0];
                return `💰 *DESGLOSE DE ACTIVIDAD (HOY)*\n\n` +
                    `💎 Joyería: ${r.jewelry || 0}\n` +
                    `📦 Estándar: ${r.standard || 0}\n` +
                    `♻️ Recuperable: ${r.recoverable || 0}\n` +
                    `❌ No Trato: ${r.no_deal || 0}`;
            } catch (e) {
                return "Error al consultar ventas: " + e.message;
            }
        },
        getFailedDeals: async () => {
            try {
                const res = await pool.query(`
                    SELECT * FROM no_deal_details 
                    WHERE date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AND store_id = 'store_1'
                    ORDER BY id DESC LIMIT 5
                `);
                if (res.rows.length === 0) return "✅ No hay 'No Tratos' registrados hoy.";

                let msg = "❌ *ÚLTIMOS NO TRATOS (HOY)*\n\n";
                res.rows.forEach(r => {
                    msg += `📱 *${r.brand} ${r.model}*\n   Motivo: ${r.reason} (${r.notes || ''})\n   Oferta: ${r.price_offered}€ vs Piden: ${r.price_asked}€\n\n`;
                });
                return msg;
            } catch (e) {
                return "Error al consultar no tratos: " + e.message;
            }
        }
    };

    // --- AI ENGINE ---
    bot.on('text', async (ctx) => {
        const userId = String(ctx.from.id);
        const userMsg = ctx.message.text;

        // Security Check
        const allowed = (process.env.TELEGRAM_ALLOWED_USERS || '').split(',');
        // If whitelist is defined in env, enforce it.
        // If env is empty, currently we allow everyone OR block everyone?
        // Let's block everyone if not in list, but print ID to help setup.
        if (allowed.length > 0 && !allowed.includes(userId)) {
            console.log(`[Telegram] Unauthorized access attempt from: ${userId}`);
            // Friendly error to help user set it up
            return ctx.reply(`⛔ Acceso denegado.\n\nTu ID de Telegram es: \`${userId}\`\n\nPor favor, añade este ID a la variable TELEGRAM_ALLOWED_USERS en el archivo .env del servidor para autorizarte.`, { parse_mode: 'Markdown' });
        }

        console.log(`[Telegram] Msg from ${userId}: ${userMsg}`);

        // 1. Ask Gemini to classify INTENT and pick a TOOL
        const systemPrompt = `
            Eres TikTak AI, un asistente de gestión para una tienda de compraventa.
            Herramientas Disponibles:
            - getGoldPrice: Para consultar precio del oro.
            - getActiveEmployees: Para saber quién está trabajando o cuantos hay.
            - getDailyStats: Estadísticas generales de productividad.
            - getDailySales: Para ver el desglose de compras/ventas (joyería, estándar, etc).
            - getFailedDeals: Para ver la lista de operaciones fallidas (No Tratos).
            - chat: Para conversa normal.

            Tu respuesta debe ser ESTRICTAMENTE un JSON con este formato:
            { "action": "TOOL_NAME_OR_CHAT", "response": "Texto amable para el usuario si es chat, o vacío si es tool" }
            
            Usuario dice: "${userMsg}"
        `;

        try {
            await ctx.sendChatAction('typing');

            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            const text = response.text();

            console.log("[Gemini Raw]", text);

            // Robust JSON Extraction
            let jsonStr = text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) jsonStr = jsonMatch[0];

            let decision;
            try {
                decision = JSON.parse(jsonStr);
            } catch (jsonErr) {
                console.error("JSON Error:", jsonErr);
                decision = { action: 'chat', response: text }; // Fallback
            }

            if (decision.action === 'chat') {
                ctx.reply(decision.response);
            } else if (tools[decision.action]) {
                try {
                    const toolResult = await tools[decision.action]();
                    ctx.reply(`📊 ${toolResult}`);
                } catch (toolErr) {
                    console.error("Tool Execution Error:", toolErr);
                    // Detailed Error Reporting
                    const errDetail = JSON.stringify(toolErr, Object.getOwnPropertyNames(toolErr));
                    ctx.reply(`❌ Error DB: ${toolErr.message || 'Sin mensaje'}\n\nDetalles: ${errDetail}`);
                }
            } else {
                ctx.reply(decision.response || "No lo entiendo.");
            }

        } catch (e) {
            console.error("AI Error:", e);
            ctx.reply(`❌ Lo siento, hubo un problema técnico. Intenta preguntar de otra forma.`);
        }
    });

    bot.launch();
    console.log("🤖 Telegram Bot Started!");

    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export default bot;
