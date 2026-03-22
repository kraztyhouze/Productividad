import express from 'express';
import { pool } from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- AI SCHEDULE PARSER ---
router.post('/parse-schedule', async (req, res) => {
    const { scheduleText, image, date } = req.body;
    
    if (!scheduleText && !image) {
        return res.status(400).json({ error: 'No schedule data provided' });
    }

    try {
        console.log('AI Logic: Processing schedule for date:', date);
        
        // Use Gemini 3.0 Flash (Preview Free version for 2026)
        const modelName = "gemini-3-flash-preview";
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
        
        // Formatear fecha para ayudar a la IA a encontrar la columna
        const targetDate = date ? new Date(date) : new Date();
        const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        const dayName = dayNames[targetDate.getDay()];
        const dayOfMonth = targetDate.getDate();
        const dateMatchString = `${dayName} ${dayOfMonth}`;

        let prompt = `
            Analyze the following work schedule (could be text or a table image).
            TARGET DATE: ${date} (Looks like "${dateMatchString}" in the table)

            INSTRUCTIONS:
            1. Find the column corresponding to this specific date.
            2. Extract all employees who have assigned hours for this day. 
            3. IGNORE those with "DESCANSO", "BAJA", "VACACIONES" or empty cells.
            4. For each employee, extract:
               - name, start_time (HH:mm), end_time (HH:mm), initials (2 letters).

            Return ONLY a JSON array: [{"name": "...", "start_time": "...", "end_time": "...", "initials": "..."}, ...]
        `;

        const parts = [prompt];
        if (scheduleText) parts.push(`Text Source: "${scheduleText}"`);
        if (image) {
            const [metadata, base64Data] = image.split(',');
            const mimeType = metadata.match(/:(.*?);/)[1] || "image/png";
            parts.push({ inlineData: { data: base64Data, mimeType } });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();
        
        // Clean markdown code blocks if present
        const jsonMatch = text.match(/\[.*\]/s);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const resultData = JSON.parse(jsonStr);
        
        res.json(resultData);

    } catch (err) {
        console.error('AI Parser Final Error:', err);
        res.status(500).json({ 
            error: 'Failed to parse schedule', 
            details: err.message
        });
    }
});

// --- DAILY ORGANIZATION CRUD ---
router.get('/:date', async (req, res) => {
    const { date } = req.params;
    const storeId = req.headers['x-store-id'] || 'store_1';
    
    try {
        const result = await pool.query(
            'SELECT * FROM daily_organization WHERE date = $1 AND store_id = $2',
            [date, storeId]
        );
        res.json(result.rows[0] || { date, zones: {} });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { date, organization_data } = req.body;
    const storeId = req.headers['x-store-id'] || 'store_1';
    
    try {
        const result = await pool.query(
            `INSERT INTO daily_organization (date, organization_data, store_id) 
             VALUES ($1, $2, $3)
             ON CONFLICT (date, store_id) 
             DO UPDATE SET organization_data = EXCLUDED.organization_data
             RETURNING *`,
            [date, JSON.stringify(organization_data), storeId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/tracking/summary', async (req, res) => {
    const storeId = req.headers['x-store-id'] || 'store_1';
    try {
        // 1. Get history
        const historyRes = await pool.query(
            'SELECT date, organization_data FROM daily_organization WHERE store_id = $1 ORDER BY date DESC',
            [storeId]
        );
        
        // 2. Get current regular tasks
        const tasksRes = await pool.query(
            `SELECT id, title, status, category, priority_level, created_at 
             FROM tasks 
             WHERE store_id = $1`,
            [storeId]
        );

        // 3. Get battery items
        const batteriesRes = await pool.query(
            `SELECT b.id as battery_id, b.title as battery_title, b.created_at as battery_created_at,
                    i.id as item_id, i.description, i.is_done
             FROM task_batteries b
             JOIN battery_items i ON b.id = i.battery_id
             WHERE b.store_id = $1`,
            [storeId]
        );
        
        const history = historyRes.rows;
        
        // Merge both types of tasks
        const regularTasks = tasksRes.rows.map(t => ({
            ...t,
            id: String(t.id),
            type: 'regular'
        }));

        const batteryTasks = batteriesRes.rows.map(i => ({
            id: `battery-item-${i.item_id}`,
            title: i.description,
            status: i.is_done ? 'Hecha' : 'Pendiente',
            category: `Batería: ${i.battery_title}`,
            priority_level: 'Normal',
            created_at: i.battery_created_at,
            type: 'battery'
        }));

        const allTasks = [...regularTasks, ...batteryTasks];
        
        // Map to store tracking data
        const trackingMap = {}; // { taskId: { days: 0, assignedTo: Set, dates: [] } }

        history.forEach(row => {
            const org = typeof row.organization_data === 'string' ? JSON.parse(row.organization_data) : row.organization_data;
            if (org && org.assignments) {
                Object.entries(org.assignments).forEach(([staffId, data]) => {
                    (data.tasks || []).forEach(taskRef => {
                        if (!trackingMap[taskRef.id]) {
                            trackingMap[taskRef.id] = { days: 0, staffIds: new Set(), dates: [] };
                        }
                        trackingMap[taskRef.id].days++;
                        trackingMap[taskRef.id].staffIds.add(staffId);
                        trackingMap[taskRef.id].dates.push(row.date);
                    });
                });
            }
        });

        // Combine
        const result = allTasks.map(t => {
            const track = trackingMap[t.id] || { days: 0, staffIds: new Set(), dates: [] };
            return {
                ...t,
                daysAssigned: track.days,
                historyDates: track.dates,
                assignedStaffIds: Array.from(track.staffIds)
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
