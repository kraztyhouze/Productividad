import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useProductivity } from '../context/ProductivityContext';
import { motion, AnimatePresence } from 'framer-motion';
import MeetingsView from '../components/Gerencia/MeetingsView';
import { 
    Pocket, 
    Calculator, 
    Plus, 
    PlusCircle,
    Save, 
    Lock,
    Trash2,
    Clock,
    AlertCircle,
    TrendingUp,
    Euro,
    Weight,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Edit3,
    Check,
    BarChart3,
    ArrowUpRight,
    Users,
    CheckCircle2,
    Layers,
    X,
    Info,
    Package,
    Camera,
    FileText,
    Download,
    Table,
    Award,
    Activity,
    ShieldAlert,
    TrendingDown,
    Zap,
    MessageSquare,
    RefreshCcw,
    List,
    Layout
} from 'lucide-react';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    addDays, 
    addYears,
    eachDayOfInterval,
    parseISO,
    isToday,
    startOfDay,
    addWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// --- NEW UI COMPONENTS ---
import GlassCard from '../components/Gerencia/GlassCard';
import ProductivityTrendChart from '../components/Gerencia/ProductivityTrendChart';
import SalesMixChart from '../components/Gerencia/SalesMixChart';
import XPGoalsChart from '../components/Gerencia/XPGoalsChart';
import ZoneFilter from '../components/Gerencia/ZoneFilter';
import OrderReminder from '../components/Gerencia/OrderReminder';
import * as dateUtils from '../utils/dateUtils';

// --- CONSTANTS ---
const BILLS = [500, 200, 100, 50, 20, 10, 5];
const COINS = [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01];

const GOLDSMITH_CATEGORIES = [
    '18k', '18k con piedra', '14k', '14k con piedra', 
    '9k', '9k con piedra', 'Plata 925', 'Plata 925 con piedra'
];

const CATEGORY_COLORS = {
    '18k': '#FFD700',
    '18k con piedra': '#FFC107',
    '14k': '#FFA000',
    '14k con piedra': '#FF8F00',
    '9k': '#FF6F00',
    '9k con piedra': '#E65100',
    'Plata 925': '#B0BEC5',
    'Plata 925 con piedra': '#90A4AE'
};

// --- HELPERS ---
const formatPrice = (p) => Number(p || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatWeight = (w) => Number(w || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' gr';
const getEmpName = (e) => {
    if (!e) return '---';
    return e.alias || `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.username || 'S/N';
};

const compressImage = (file, maxWidth = 800) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                if (scale < 1) {
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // 0.7 quality
            };
        };
    });
};

const downloadCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
        Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    );
    const content = [headers, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const downloadWeeklyPDF = (batteries, tasks = []) => {
    try {
        const doc = new jsPDF();
        const today = format(new Date(), 'dd/MM/yyyy');
        
        // --- CONFIG & STYLES ---
        const primaryColor = [26, 54, 93]; // #1A365D
        const secondaryColor = [255, 140, 157]; // #FF8C9D
        
        // Header
        doc.setFillColor(248, 249, 251);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(...primaryColor);
        doc.text('TIKTAK', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text('CONTROL OPERATIVO Y AGENDA SEMANAL', 14, 28);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Generado: ${today}`, 196, 20, { align: 'right' });
        
        let yPos = 50;

        // --- SECTION 1: AGENDA TASKS (CURRENT WEEK) ---
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
        const weekTasks = tasks.filter(t => {
            const d = parseISO(t.date);
            return d >= start && d <= end;
        }).sort((a,b) => a.date.localeCompare(b.date));

        if (weekTasks.length > 0) {
            doc.setFillColor(...secondaryColor);
            doc.rect(14, yPos, 182, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(255);
            doc.text('AGENDA DE LA SEMANA (TAREAS PUNTUALES)', 18, yPos + 5.5);
            
            const agendaData = weekTasks.map(t => [
                format(parseISO(t.date), 'dd/MM (EEE)', { locale: es }).toUpperCase(),
                (t.title || '').toUpperCase(),
                (t.assigned_to || 'S/A').toUpperCase(),
                t.status === 'Hecha' ? 'OK' : '[  ]'
            ]);

            autoTable(doc, {
                startY: yPos + 12,
                head: [['FECHA', 'TAREA', 'RESPONSABLE', 'CHECK']],
                body: agendaData,
                theme: 'grid',
                headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                columnStyles: { 0: { cellWidth: 30 }, 2: { cellWidth: 35 }, 3: { cellWidth: 15, halign: 'center' } }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // --- SECTION 2: TASK BATTERIES ---
        if (!Array.isArray(batteries) || batteries.length === 0) {
            doc.setFontSize(10);
            doc.setTextColor(180);
            doc.text('No hay baterías de tareas activas.', 14, yPos);
        } else {
            batteries.forEach((b, index) => {
                if (yPos > 240) { doc.addPage(); yPos = 20; }
                
                doc.setFillColor(...primaryColor);
                doc.rect(14, yPos, 182, 8, 'F');
                doc.setFontSize(10);
                doc.setTextColor(255);
                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}. BATERÍA: ${(b.title || 'SIN TÍTULO').toUpperCase()}`, 18, yPos + 5.5);
                
                const tableData = (b.items || []).map(item => [
                    (item.description || '').toUpperCase(),
                    (item.is_done ? 'HECHA' : 'PENDIENTE').toUpperCase(),
                    (item.completed_by || 'POR ASIGNAR').toUpperCase(),
                    '[       ]'
                ]);
                
                autoTable(doc, {
                    startY: yPos + 10,
                    head: [['DESCRIPCIÓN', 'ESTADO', 'FIRMA/RESPONSABLE', 'CHECK']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [60, 80, 110], fontSize: 8 },
                    bodyStyles: { fontSize: 8 },
                    columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 25 }, 2: { cellWidth: 40 }, 3: { cellWidth: 22 } }
                });
                yPos = doc.lastAutoTable.finalY + 12;
            });
        }
        
        doc.save(`TikTak_Agenda_Semanal_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
        console.error("Critical error generating PDF:", error);
        alert(`Error al generar el PDF: ${error.message}`);
    }
};

const downloadCashPDF = (history) => {
    try {
        const doc = new jsPDF();
        const today = format(new Date(), 'dd/MM/yyyy');
        
        // Header Setup
        doc.setFillColor(26, 52, 92);
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setFontSize(26);
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
        doc.text('TIKTAK', 14, 25);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORTE DE AUDITORÍA DE CAJA (ARQUEOS)', 14, 34);
        
        doc.setFontSize(9);
        doc.text(`Fecha Emisión: ${today}`, 196, 25, { align: 'right' });
        doc.text('CONTROL FINANCIERO INTERNO', 196, 31, { align: 'right' });

        const tableData = (history || []).map(h => {
            const diff = Number(h.total || 0) - Number(h.expected_total || 0);
            return [
                format(parseISO(h.date), 'dd/MM/yyyy'),
                h.responsible_1 || '---',
                `${formatPrice(h.expected_total)}€`,
                `${formatPrice(h.total)}€`,
                { content: `${diff > 0 ? '+' : ''}${formatPrice(diff)}€`, styles: { textColor: diff < 0 ? [220, 38, 38] : diff > 0 ? [22, 163, 74] : [100, 100, 100] } },
                h.observations || 'Sin incidencias'
            ];
        });

        autoTable(doc, {
            startY: 55,
            head: [['FECHA', 'RESPONSABLE', 'SISTEMA', 'CONTADO', 'DIFERENCIA', 'OBSERVACIONES']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [248, 249, 251], textColor: [26, 52, 92], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8, cellPadding: 4 },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' },
                4: { halign: 'right', fontStyle: 'bold' },
                5: { cellWidth: 50 }
            }
        });

        doc.save(`TikTak_Arqueos_${today.replace(/\//g, '-')}.pdf`);
    } catch (e) { console.error(e); }
};

const downloadJewelryPDF = (movements) => {
    try {
        const doc = new jsPDF('l', 'mm', 'a4');
        const today = format(new Date(), 'dd/MM/yyyy');
        
        doc.setFillColor(255, 140, 157); // #FF8C9D
        doc.rect(0, 0, 297, 40, 'F');
        
        doc.setFontSize(28);
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
        doc.text('TIKTAK JOYERÍA', 14, 25);
        
        doc.setFontSize(12);
        doc.text('HISTORIAL DE MOVIMIENTOS Y RENTABILIDAD', 14, 33);

        const tableData = (movements || []).map(m => {
            const cost = Number(m.acquisition_cost || 0);
            const rec = Number(m.received_amount || 0);
            const benefit = rec > 0 ? (rec - cost) : 0;
            return [
                format(parseISO(m.date), 'dd/MM/yyyy'),
                m.type.toUpperCase(),
                (m.inventory_category || 'N/A').toUpperCase(),
                (m.partner_name || '---').toUpperCase(),
                `${m.weight}g`,
                cost > 0 ? `${formatPrice(cost)}€` : '---',
                rec > 0 ? `${formatPrice(rec)}€` : '---',
                benefit !== 0 ? { content: `${benefit > 0 ? '+' : ''}${formatPrice(benefit)}€`, styles: { textColor: benefit > 0 ? [22, 163, 74] : [200, 0, 0], fontStyle: 'bold' } } : '---',
                m.status || '---'
            ];
        });

        autoTable(doc, {
            startY: 50,
            head: [['FECHA', 'TIPO', 'CAT.', 'SOCIO', 'PESO', 'COSTE ADQ.', 'VALOR FINAL', 'BENEFICIO', 'ESTADO']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 30, 30], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' }
            }
        });

        doc.save(`TikTak_Joyería_${today.replace(/\//g, '-')}.pdf`);
    } catch (e) { console.error(e); }
};


// --- MAIN PAGE ---
const Gerencia = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const { dailyGroups, transactionLogs, adminActions } = useProductivity();
    
    const [activeTab, setActiveTabState] = useState('summary');
    
    // Sync with URL params
    const location = useLocation();
    useEffect(() => {
        const queryTab = new URLSearchParams(location.search).get('tab');
        if (queryTab) setActiveTabState(queryTab);
        else setActiveTabState('summary');
    }, [location.search]);

    const setActiveTab = (tab) => {
        // Option 1: navigate to change URL
        // navigate(`/gerencia?tab=${tab}`);
        // Option 2: just state (but sidebar won't update its active state)
        // I will use state for internal toggles but the sidebar uses URLs.
        setActiveTabState(tab);
    };

    const [tasks, setTasks] = useState([]);
    const [partners, setPartners] = useState([]);
    const [movements, setMovements] = useState([]);
    const [cashHistory, setCashHistory] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [zones, setZones] = useState([]);
    const [activeZoneId, setActiveZoneId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [auditAlerts, setAuditAlerts] = useState([]);

    const [modal, setModal] = useState({ type: null, data: null });

    const setLoadingSafe = (val) => setLoading(val);

    const loadData = async () => {
        setLoading(true);
        try {
            const h = { 
                'x-store-id': currentStore,
                'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role
            };
            const [tRes, pRes, mRes, cRes, bRes, iRes, oRes, aRes, zRes] = await Promise.all([
                fetch('/api/gerencia/tasks/unified', { headers: h }),
                fetch('/api/gerencia/goldsmith/partners', { headers: h }),
                fetch('/api/gerencia/goldsmith/movements', { headers: h }),
                fetch('/api/gerencia/cash-control', { headers: h }),
                fetch('/api/task-batteries', { headers: h }),
                fetch('/api/gerencia/goldsmith/inventory', { headers: h }),
                fetch('/api/gerencia/goldsmith/orders', { headers: h }),
                fetch('/api/gerencia/audit-alerts', { headers: h }),
                fetch('/api/gerencia/store-zones', { headers: h })
            ]);
            
            if (tRes.ok) setTasks(await tRes.json());
            if (pRes.ok) setPartners(await pRes.json());
            if (mRes.ok) setMovements(await mRes.json());
            if (cRes.ok) setCashHistory(await cRes.json());
            if (bRes.ok) setBatteries(await bRes.json());
            if (iRes.ok) setInventory(await iRes.json());
            if (oRes.ok) setOrders(await oRes.json());
            if (aRes.ok) setAuditAlerts(await aRes.json());
            if (zRes.ok) setZones(await zRes.json());
            
            const eRes = await fetch('/api/employees', { headers: h });
            if (eRes.ok) setEmployees(await eRes.json());
            
        } catch (e) { 
            console.error("Error loading Gerencia data:", e);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { loadData(); }, [currentStore]);

    // --- NOTIFICATIONS SYSTEM ---
    useEffect(() => {
        if (!("Notification" in window)) return;
        
        const requestPermission = async () => {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                console.log("Notificaciones autorizadas.");
            }
        };

        if (Notification.permission === "default") {
            requestPermission();
        }

        // Scheduler: check every minute
        const interval = setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.status === 'Hecha' || !task.time) return;
                
                const taskDate = parseISO(task.date);
                const [h, m] = task.time.split(':');
                taskDate.setHours(parseInt(h), parseInt(m), 0);
                
                const diffMinutes = Math.floor((taskDate - now) / 60000);
                
                if (diffMinutes === 15) {
                    new Notification("TikTak Agenda: Próxima Tarea", {
                        body: `${task.title} - Comienza en 15 min.`,
                        icon: '/logo192.png' // Assuming there's a logo
                    });
                }
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [tasks]);

    const sendImmediateNotification = (title, body) => {
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '/logo192.png' });
        }
    };

    const cumulativeCashDiff = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return (Array.isArray(cashHistory) ? cashHistory : [])
            .filter(h => new Date(h.date).getFullYear() === currentYear && h.is_closed)
            .reduce((acc, h) => acc + (Number(h.total || 0) - Number(h.expected_total || 0)), 0);
    }, [cashHistory]);

    const tabs = [
        { id: 'summary', label: 'Resumen', icon: BarChart3 },
        { id: 'tasks', label: 'Agenda', icon: CalendarIcon },
        { id: 'reports', label: 'Informes', icon: FileText },
        { id: 'jewelry', label: 'Joyería', icon: Pocket },
        { id: 'cash', label: 'Conteo', icon: Calculator }
    ];

    if (![ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role)) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-[#F8F9FB] rounded-[40px] border-2 border-[#E2E8F0] animate-in zoom-in duration-500">
                <div className="p-10 bg-red-50 text-red-500 rounded-full mb-8"><Lock size={64} /></div>
                <h1 className="text-4xl font-black text-[#1A365D] tracking-tighter uppercase">ACCESO RESTRINGIDO</h1>
                <p className="text-[#A0AEC0] font-bold text-xs uppercase tracking-widest mt-4">Solo personal de gerencia autorizado</p>
            </div>
        );
    }

    const handleSaveTask = async (taskData) => {
        const method = taskData.id ? 'PUT' : 'POST';
        const url = taskData.id ? `/api/tasks/${taskData.id}` : '/api/tasks';
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(taskData)
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
        else { const err = await res.json(); alert('Error: ' + (err.error || 'Server error')); }
    };

    const handleSaveMovement = async (movData) => {
        const res = await fetch('/api/gerencia/goldsmith/movements', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(movData)
        });
        if (res.ok) { 
            setModal({ type: null, data: null }); 
            loadData(); 
            if (movData.type === 'Recepción' && movData.debt_added > 0) {
                sendImmediateNotification("Nueva Deuda de Oro", `Se ha registrado una deuda de ${movData.debt_added}g.`);
            }
        }
        else { const err = await res.json(); alert('Error: ' + (err.error || 'Server error')); }
    };

    const handleUpdateSmelt = async (moveId, refining, received, cost) => {
        const res = await fetch(`/api/gerencia/goldsmith/movements/${moveId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify({ status: 'Completado', refining_percentage: refining, received_amount: received, acquisition_cost: cost })
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
    };

    const handleSavePartner = async (pData) => {
        const method = pData.id ? 'PUT' : 'POST';
        const url = pData.id ? `/api/gerencia/goldsmith/partners/${pData.id}` : '/api/gerencia/goldsmith/partners';
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(pData)
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
        else { const err = await res.json(); alert('Error: ' + (err.error || 'Server error')); }
    };

    const handleDeletePartner = async (id) => {
        if (!confirm('¿Seguro quieres eliminar este joyero? Se perderá su historial local.')) return;
        const res = await fetch(`/api/gerencia/goldsmith/partners/${id}`, { 
            method: 'DELETE', headers: { 'x-store-id': currentStore } 
        });
        if (res.ok) loadData();
    };

    const handleDeleteMovement = async (id) => {
        if (!confirm('¿Seguro quieres eliminar este registro? Si afectó a la deuda del joyero, se revertirá.')) return;
        const res = await fetch(`/api/gerencia/goldsmith/movements/${id}`, { 
            method: 'DELETE', headers: { 'x-store-id': currentStore } 
        });
        if (res.ok) loadData();
    };

    const handleSaveOrder = async (oData) => {
        const res = await fetch('/api/gerencia/goldsmith/orders', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(oData)
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
        else { const err = await res.json(); alert('Error: ' + (err.error || 'Server error')); }
    };

    const handleReceiveOrder = async (id, data) => {
        const res = await fetch(`/api/gerencia/goldsmith/orders/${id}/receive`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(data)
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
        else { const err = await res.json(); alert('Error: ' + (err.error || 'Server error')); }
    };

    const handleAdjustInventory = async (adjustData) => {
        const res = await fetch('/api/gerencia/goldsmith/inventory/adjust', {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(adjustData)
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
        else { const err = await res.json(); alert('Error: ' + (err.error || 'Server error')); }
    };

    const handleSaveCash = async (cashData) => {
        const res = await fetch('/api/gerencia/cash-control', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(cashData)
        });
        if (res.ok) loadData();
    };

    const handleSaveBattery = async (bData) => {
        const method = bData.id ? 'PUT' : 'POST';
        const url = bData.id ? `/api/task-batteries/${bData.id}` : '/api/task-batteries';
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(bData)
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
    };

    const handleDeleteBattery = async (id) => {
        if (!confirm('¿Seguro quieres eliminar esta batería y todas sus tareas?')) return;
        const res = await fetch(`/api/task-batteries/${id}`, { 
            method: 'DELETE', headers: { 'x-store-id': currentStore } 
        });
        if (res.ok) loadData();
    };

    const handlePostponeBattery = (battery) => {
        // Prepare new data based on expired battery
        const pendingItems = (battery.items || []).filter(i => !i.is_done).map(i => i.description);
        
        // Calculate new dates (next month)
        const oldStart = parseISO(battery.start_date);
        const oldEnd = parseISO(battery.end_date);
        const diffMs = oldEnd - oldStart;
        
        const newStart = addDays(oldEnd, 1);
        const newEnd = new Date(newStart.getTime() + diffMs);

        setModal({
            type: 'battery',
            data: {
                title: `${battery.title} (Renovada)`,
                start_date: format(newStart, 'yyyy-MM-dd'),
                end_date: format(newEnd, 'yyyy-MM-dd'),
                items: pendingItems.length > 0 ? pendingItems : ['', '', '']
            }
        });
    };

    const handleToggleBatteryItem = async (itemId, isDone, completedBy) => {
        const res = await fetch(`/api/task-batteries/items/${itemId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify({ is_done: isDone, completed_by: completedBy })
        });
        if (res.ok) {
            setModal({ type: null, data: null });
            loadData();
        }
    };

    const handleSaveBatteryItem = async (itemData) => {
        const res = await fetch(`/api/task-batteries/${itemData.battery_id}/items`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify({ description: itemData.description })
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
    };

    const handleDeleteBatteryItem = async (itemId) => {
        if (!confirm('¿Eliminar esta tarea de la batería?')) return;
        const res = await fetch(`/api/task-batteries/items/${itemId}`, {
            method: 'DELETE', headers: { 'x-store-id': currentStore }
        });
        if (res.ok) loadData();
    };

    const handleGrantXP = async (data) => {
        const ok = await adminActions.grantBonusXP(data.employeeId, data.xp, data.reason);
        if (ok) {
            setModal({ type: null, data: null });
            loadData();
        }
    };


    const handleDeleteTask = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar esta tarea?')) return;
        const res = await fetch(`/api/tasks/${id}`, { 
            method: 'DELETE', 
            headers: { 'x-store-id': currentStore } 
        });
        if (res.ok) { 
            setModal({ type: null, data: null }); 
            loadData(); 
        }
    };

    const handleSaveZone = async (z) => {
        const method = z.id ? 'PUT' : 'POST';
        const url = z.id ? `/api/gerencia/store-zones/${z.id}` : '/api/gerencia/store-zones';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore, 'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role },
            body: JSON.stringify(z)
        });
        if (res.ok) {
            loadData();
            setModal({ type: 'zone_manager', data: null });
        }
    };

    const handleDeleteZone = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar esta zona?')) return;
        const res = await fetch(`/api/gerencia/store-zones/${id}`, {
            method: 'DELETE',
            headers: { 'x-store-id': currentStore, 'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role }
        });
        if (res.ok) loadData();
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header / Title bar if needed, otherwise just the content */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-[#1A365D] uppercase tracking-tight">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h1>
                    <p className="text-[#A0AEC0] text-xs font-bold uppercase tracking-widest mt-1">Gestión Centralizada</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setModal({ type: 'xp_bonus', data: null })} 
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#718096] hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <Award size={14} />
                        Bono XP
                    </button>
                    <button 
                        onClick={loadData}
                        className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#718096] hover:text-[#1A365D] transition-colors"
                        title="Refrescar datos"
                    >
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto">
                {activeTab === 'summary' && <GerenciaDashboard tasks={tasks} batteries={batteries} partners={partners} movements={movements} cashHistory={cashHistory} inventory={inventory} orders={orders} cumulativeCashDiff={cumulativeCashDiff} employees={employees} auditAlerts={auditAlerts} onXPBonus={() => setModal({ type: 'xp_bonus', data: null })} activeZoneId={activeZoneId} onTabSwitch={setActiveTab} />}
                {activeTab === 'reports' && <ReportsView batteries={batteries} tasks={tasks} cashHistory={cashHistory} movements={movements} partners={partners} activeZoneId={activeZoneId} />}
                {activeTab === 'tasks' && <TasksView tasks={tasks} batteries={batteries} employees={employees} partners={partners} zones={zones} activeZoneId={activeZoneId} onSelectZone={setActiveZoneId} onManageZones={() => setModal({ type: 'zone_manager', data: null })} onEdit={(t) => setModal({ type: 'task', data: t })} onAdd={() => setModal({ type: 'task', data: null })} onAddBattery={() => setModal({ type: 'battery', data: null })} onEditBattery={(b) => setModal({ type: 'battery', data: b })} onAddBatteryItem={(bId) => setModal({ type: 'battery_item', data: { battery_id: bId } })} onDeleteBatteryItem={handleDeleteBatteryItem} onCheckBattery={(item) => setModal({ type: 'battery_item_check', data: item })} onDeleteBattery={handleDeleteBattery} onPostponeBattery={handlePostponeBattery} loadData={loadData} currentStore={currentStore} />}
                {activeTab === 'jewelry' && <JewelryView inventory={inventory} orders={orders} partners={partners} movements={movements} onAddPartner={() => setModal({ type: 'partner', data: null })} onEditPartner={(p) => setModal({ type: 'partner', data: p })} onDeletePartner={handleDeletePartner} onAddMovement={(type) => setModal({ type: 'movement', data: type })} onDeleteMovement={handleDeleteMovement} onRefine={(m) => setModal({ type: 'refine', data: m })} onAddOrder={() => setModal({ type: 'order', data: null })} onReceiveOrder={(o) => setModal({ type: 'order_receive', data: o })} onAdjustInventory={(cat) => setModal({ type: 'inventory_adjust', data: cat })} />}
                {activeTab === 'meetings' && <MeetingsView storeId={currentStore} />}
                {activeTab === 'cash' && <CashView history={Array.isArray(cashHistory) ? cashHistory : []} employees={employees} onSave={handleSaveCash} user={user} cumulativeCashDiff={cumulativeCashDiff} />}
            </div>

            {/* MODALS PERSISTENTES (Animaciones movidas aquí) */}
            <AnimatePresence>
                {/* ... existing modals ... */}
                {modal.type === 'task' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title={modal.data ? 'Editar Tarea' : 'Nueva Tarea'}>
                        <TaskForm initialData={modal.data} employees={employees} zones={zones} onSave={handleSaveTask} onCancel={() => setModal({ type: null, data: null })} onDelete={handleDeleteTask} />
                    </GlobalModal>
                )}
                {modal.type === 'zone_manager' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Gestión de Zonas">
                        <ZoneManagerForm zones={zones} employees={employees} onSave={handleSaveZone} onDelete={handleDeleteZone} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'partner' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title={modal.data ? 'Editar Joyero' : 'Nuevo Joyero'}>
                        <PartnerForm initialData={modal.data} onSave={handleSavePartner} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'movement' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Operación de Joyería" maxWidth="max-w-4xl">
                        <MovementForm type={modal.data} partners={partners} onSave={handleSaveMovement} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'refine' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Cierre de Lote">
                        <RefineForm movement={modal.data} onSave={handleUpdateSmelt} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'battery' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title={modal.data ? "Editar Batería" : "Nueva Batería"}>
                        <BatteryForm initialData={modal.data} zones={zones} onSave={handleSaveBattery} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'battery_item' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Añadir Tarea">
                        <BatteryItemForm batteryId={modal.data?.battery_id} onSave={handleSaveBatteryItem} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'battery_item_check' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Checkbox Tarea">
                        <BatteryItemCheckForm item={modal.data} onConfirm={handleToggleBatteryItem} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'order' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Lanzar Pedido">
                        <OrderForm partners={partners} onSave={handleSaveOrder} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'order_receive' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Recibir Mercancía">
                        <OrderClosureModal order={modal.data} onConfirm={handleReceiveOrder} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'inventory_adjust' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Stock / Inventario">
                        <InventoryAdjustmentModal initialCategory={modal.data} onSave={handleAdjustInventory} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
                {modal.type === 'xp_bonus' && (
                    <GlobalModal isOpen={true} onClose={() => setModal({ type: null, data: null })} title="Bonificación XP">
                        <XPBonusForm employees={employees} onSave={handleGrantXP} onCancel={() => setModal({ type: null, data: null })} />
                    </GlobalModal>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- SUB-COMPONENTS/VIEWS ---

const GerenciaDashboard = ({ tasks, batteries, partners, movements, cashHistory, inventory, orders, cumulativeCashDiff, employees, auditAlerts, activeZoneId, onXPBonus, onTabSwitch }) => {
    const { dailyGroups } = useProductivity();
    
    // --- New States for Alerts Filtering ---
    const [alertMonth, setAlertMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [showAllAlerts, setShowAllAlerts] = useState(false);

    const availableAlertMonths = useMemo(() => {
        const monthsSet = new Set();
        monthsSet.add(format(new Date(), 'yyyy-MM'));
        (auditAlerts || []).forEach(a => {
            if (a.type === 'suspicious_duration' && a.data?.start_time) {
                monthsSet.add(format(parseISO(a.data.start_time), 'yyyy-MM'));
            }
        });
        return Array.from(monthsSet).sort().reverse();
    }, [auditAlerts]);

    const buyingAlerts = useMemo(() => {
        const filteredByMonth = (auditAlerts || []).filter(a => {
            if (a.type !== 'suspicious_duration') return false;
            const start = a.data?.start_time;
            if (!start) return false;
            return format(parseISO(start), 'yyyy-MM') === alertMonth;
        });
        
        const counts = {};
        filteredByMonth.forEach(a => {
            const name = a.data?.first_name || 'Desconocido';
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a,b) => b.count - a.count);
    }, [auditAlerts, alertMonth]);

    // --- restored 1. PRODUCTIVITY RANKING ---
    const prodRanking = useMemo(() => {
        if (!employees || !dailyGroups) return [];
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => format(addDays(today, -i), 'yyyy-MM-dd'));

        return [...employees]
            .map(emp => {
                const empId = String(emp.id).trim();
                let weeklyTotal = 0;
                last7Days.forEach(date => {
                    const stats = dailyGroups[`${empId}-${date}`];
                    if (stats) {
                        weeklyTotal += (Number(stats.standard || 0) + Number(stats.jewelry || 0) + Number(stats.recoverable || 0));
                    }
                });
                return {
                    id: emp.id,
                    name: emp.alias || emp.first_name,
                    total: weeklyTotal,
                    avatar: emp.avatar,
                    role: emp.role
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
    }, [employees, dailyGroups]);

    // --- restored 2. TREND DATA ---
    const trendData = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const dStr = format(addDays(today, -i), 'yyyy-MM-dd');
            let dayTotal = 0;
            (employees || []).forEach(emp => {
                const stats = dailyGroups[`${String(emp.id).trim()}-${dStr}`];
                if (stats) dayTotal += (Number(stats.standard || 0) + Number(stats.jewelry || 0) + Number(stats.recoverable || 0));
            });
            days.push({
                name: format(addDays(today, -i), 'EEE', { locale: es }).toUpperCase(),
                productividad: dayTotal,
                tiempo_tienda: 8 
            });
        }
        return days;
    }, [employees, dailyGroups]);

    // --- restored 3. MIX DATA ---
    const mixData = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return (employees || []).map(emp => {
            const stats = dailyGroups[`${String(emp.id).trim()}-${today}`] || {};
            return {
                name: emp.alias || emp.first_name,
                standard: Number(stats.standard || 0),
                jewelry: Number(stats.jewelry || 0),
                recoverable: Number(stats.recoverable || 0)
            };
        });
    }, [employees, dailyGroups]);

    // --- restored 4. BATTERY PROGRESS ---
    const batteryStats = useMemo(() => {
        const safeBatteries = (Array.isArray(batteries) ? batteries : []).filter(b => !activeZoneId || b.zone_id == activeZoneId);
        let totalItems = 0;
        let doneItems = 0;
        
        safeBatteries.forEach(b => {
            (b.items || []).forEach(item => {
                totalItems++;
                if (item.is_done) doneItems++;
            });
        });

        const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
        return { progress, active: doneItems, total: totalItems };
    }, [batteries, activeZoneId]);

    // --- restored 5. JEWELRY DEBT ---
    const totalDebt = (partners || []).reduce((acc, p) => acc + Number(p.debt_grams || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI OVERVIEW GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard title="Joyería en Tránsito" icon={Pocket} description="Pedidos lanzados no recibidos" 
                    action={<div className="flex items-center gap-1 text-[10px] bg-blue-100/50 text-blue-600 px-2 py-1 rounded-full"><Plus size={10}/> {orders.filter(o => o.status !== 'Recibido').length} Pedidos</div>}>
                    <div className="mt-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">
                            {orders.filter(o => o.status !== 'Recibido').reduce((acc, o) => acc + Number(o.est_weight || 0), 0).toFixed(1)}g
                        </span>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Peso estimado pendiente</div>
                    </div>
                </GlassCard>

                <GlassCard title="Control de Caja" icon={Calculator} description="Diferencia acumulada anual"
                    action={<div onClick={() => onTabSwitch('cash')} className="flex items-center gap-1 text-[10px] bg-green-100/50 text-green-600 px-2 py-1 rounded-full cursor-pointer"><ChevronRight size={10}/> Ver Más</div>}>
                    <div className="mt-2 text-3xl font-black text-slate-800 tracking-tighter">
                        {cumulativeCashDiff > 0 ? '+' : ''}{Number(cumulativeCashDiff || 0).toFixed(2)}€
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Precisión del arqueo</div>
                </GlassCard>

                <GlassCard title="Progreso Baterías" icon={Zap} description="Cumplimiento de objetivos"
                    action={<div onClick={() => onTabSwitch('tasks')} className="flex items-center gap-1 text-[10px] bg-pink-100/50 text-pink-600 px-2 py-1 rounded-full cursor-pointer"><ChevronRight size={10}/> Ver Más</div>}>
                    <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${batteryStats.progress || 0}%` }} className="h-full bg-gradient-to-r from-pink-400 to-rose-500" />
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase">{batteryStats.active}/{batteryStats.total} Tareas de control completadas</div>
                </GlassCard>

                <GlassCard title="Alertas Compras" icon={ShieldAlert} description="Alertas por comprador" 
                    className={buyingAlerts.length > 0 ? " ring-2 ring-rose-300 ring-offset-4 ring-offset-transparent shadow-rose-100 shadow-2xl" : ""}>
                    
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-rose-300 uppercase tracking-widest mb-1">Período</span>
                            <select 
                                value={alertMonth} 
                                onChange={(e) => setAlertMonth(e.target.value)}
                                className="bg-rose-50 border-none text-[10px] font-black uppercase text-rose-600 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-200 cursor-pointer transition-all"
                            >
                                {availableAlertMonths.map(m => <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy', { locale: es })}</option>)}
                            </select>
                        </div>
                        <div className="text-right">
                            <span className="text-[20px] font-black text-rose-500 block leading-none">{buyingAlerts.length}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Compradores</span>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[120px] overflow-hidden">
                        {buyingAlerts.slice(0, 2).map((a, i) => (
                            <div key={i} className="flex justify-between items-center bg-rose-50/30 p-3 rounded-2xl border border-rose-100/50 group hover:bg-rose-50 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[100px]">{a.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-rose-600 bg-white px-3 py-1 rounded-full shadow-sm border border-rose-100">{a.count} <span className="text-[8px] opacity-60">Alertas</span></span>
                            </div>
                        ))}
                        {buyingAlerts.length === 0 && (
                            <div className="py-6 flex flex-col items-center justify-center gap-2 opacity-50">
                                <CheckCircle2 size={24} className="text-green-400" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase italic">Sin alertas este mes</p>
                            </div>
                        )}
                    </div>

                    {buyingAlerts.length >= 3 && (
                        <button 
                            onClick={() => setShowAllAlerts(true)}
                            className="w-full mt-4 py-3 bg-white border border-rose-100 text-[9px] font-black text-rose-500 hover:bg-rose-500 hover:text-white uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95"
                        >
                            Ver todos los compradores ({buyingAlerts.length})
                        </button>
                    )}
                </GlassCard>
            </div>

            {/* CHARTS & RANKING SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                    <GlassCard title="Tendencia de Compras" icon={Activity} description="Volumen real de compras (últimos 7 días)">
                        <ProductivityTrendChart data={trendData} />
                    </GlassCard>
                </div>

                <div className="xl:col-span-4">
                    <GlassCard title="Ranking Semanal" icon={Award} description="Productividad acumulada en compras" className="h-full">
                        <div className="space-y-6 mt-4">
                            {prodRanking.map((emp, index) => (
                                <div key={emp.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform group-hover:scale-110 ${index === 0 ? 'border-yellow-400 shadow-lg' : 'border-white/50'}`}>
                                                <img src={emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`} alt="" />
                                            </div>
                                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : 'bg-orange-400'}`}>
                                                {index + 1}°
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm truncate max-w-[100px]">{emp.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[100px]">{emp.role}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-slate-800">{emp.total.toFixed(0)}</div>
                                        <div className="text-[9px] font-black text-pink-500 uppercase">Compras Sem.</div>
                                    </div>
                                </div>
                            ))}
                            {prodRanking.length === 0 && <p className="text-center text-slate-300 text-xs italic mt-10">Sin datos de compras esta semana</p>}
                        </div>
                    </GlassCard>
                </div>

                <div className="xl:col-span-6">
                    <GlassCard title="Mix de Trabajo Diario" icon={Layers} description="Distribución de compras por empleado (Hoy)">
                        <SalesMixChart data={mixData} />
                    </GlassCard>
                </div>

                <div className="xl:col-span-3">
                    <GlassCard title="Deuda Joyeros" icon={Euro} description="Total liquidación pendiente">
                        <div className="mt-4 flex flex-col items-center justify-center py-6">
                            <span className="text-4xl font-black text-rose-500 tracking-tighter">{(totalDebt || 0).toFixed(2)}<span className="text-sm ml-1">gr</span></span>
                            <div className="mt-3 px-4 py-1.5 bg-rose-50 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">Pendiente de regular</div>
                            <button onClick={() => onTabSwitch('jewelry')} className="mt-6 text-[9px] font-black text-slate-400 hover:text-[#1A365D] uppercase underline flex items-center gap-1 transition-colors">
                                <Pocket size={12}/> Ir a Joyería
                            </button>
                        </div>
                    </GlassCard>
                </div>

                <div className="xl:col-span-3">
                    <GlassCard title="Acciones Rápidas" icon={PlusCircle} description="Accesos directos de gestión">
                        <div className="grid grid-cols-1 gap-3 mt-2">
                            <button onClick={() => onTabSwitch('cash')} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-600 transition-all font-bold text-xs uppercase tracking-tight">
                                <ShieldAlert size={16}/> Revisar Auditoría de Arqueos
                            </button>
                            <button 
                                onClick={onXPBonus}
                                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-all font-bold text-xs uppercase tracking-tight"
                            >
                                <Zap size={16}/> Bono Productividad Manual
                            </button>
                            <button onClick={() => onTabSwitch('reports')} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-600 transition-all font-bold text-xs uppercase tracking-tight">
                                <FileText size={16}/> Informes PDF
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>
            
            {/* Modal for All Alerts */}
            <AnimatePresence>
                {showAllAlerts && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#1A365D]/40 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => setShowAllAlerts(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-white"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-rose-50/20">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-2 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200"><ShieldAlert size={20}/></div>
                                        <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Todas las Alertas de Compras</h3>
                                    </div>
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">{format(parseISO(`${alertMonth}-01`), 'MMMM yyyy', { locale: es })}</p>
                                </div>
                                <button onClick={() => setShowAllAlerts(false)} className="p-3 bg-white text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"><X size={20}/></button>
                            </div>
                            
                            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {buyingAlerts.map((a, i) => (
                                        <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-rose-100 transition-all group items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 font-black text-xs shadow-sm shadow-rose-100 group-hover:scale-110 transition-transform">{a.name.charAt(0)}</div>
                                                <div>
                                                    <div className="font-black text-[#1A365D] text-xs uppercase tracking-tight">{a.name}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Comprador Activo</div>
                                                </div>
                                            </div>
                                            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-rose-50 flex flex-col items-center">
                                                <span className="text-xl font-black text-rose-500">{a.count}</span>
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Alertas</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {buyingAlerts.length === 0 && <p className="text-center text-slate-300 uppercase italic py-20 font-black text-xs">Sin alertas este período</p>}
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">Estas alertas se generan por tiempos de atención sospechosamente cortos en compras de oro.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AccountStatusWidget = ({ partners }) => {
    const totalDebt = (partners || []).reduce((acc, p) => acc + Number(p.debt_grams || 0), 0);
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-[50] flex flex-col items-end gap-3">
            {expanded && (
                <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-[#E2E8F0] w-80 mb-2 animate-in slide-in-from-bottom-4 duration-300">
                    <h4 className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4">Liquidaciones Pendientes</h4>
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {(partners || []).filter(p => Number(p.debt_grams) > 0).map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                                <span className="text-[10px] font-black text-[#1A365D] uppercase truncate w-2/3">{p.name}</span>
                                <span className="text-[10px] font-black text-[#FF8C9D]">{Number(p.debt_grams).toFixed(2)}g</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <button 
                onClick={() => setExpanded(!expanded)}
                className="bg-[#1A365D] text-white p-6 rounded-full shadow-2xl shadow-blue-900/40 border-4 border-white flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all"
            >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Deuda Oro</span>
                <span className="text-xl font-black">{totalDebt.toFixed(2)}g</span>
            </button>
        </div>
    );
};

const DailyTimelineView = ({ tasks, employees, onEdit, onToggleStatus }) => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTasks = tasks.filter(t => t.date === today);

    return (
        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden text-sm animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                    <div className="grid grid-cols-[100px_repeat(auto-fill,minmax(200px,1fr))] border-b border-[#F4F7FA]">
                        <div className="p-6 bg-slate-50 border-r border-[#E2E8F0]"></div>
                        {employees.map(e => (
                            <div key={e.id} className="p-6 font-black text-[#1A365D] uppercase tracking-tighter text-center bg-slate-50 border-r border-[#E2E8F0]">
                                {getEmpName(e)}
                            </div>
                        ))}
                    </div>
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                        {hours.map(hour => {
                            return (
                                <div key={hour} className="grid grid-cols-[100px_repeat(auto-fill,minmax(200px,1fr))] border-b border-dashed border-[#F4F7FA] min-h-[80px]">
                                    <div className="p-4 bg-slate-50/50 border-r border-[#E2E8F0] flex items-center justify-center font-black text-[10px] text-slate-400">
                                        {hour}
                                    </div>
                                    {employees.map(emp => {
                                        const empName = getEmpName(emp);
                                        const task = todayTasks.find(t => t.assigned_to === empName && (t.time || '09:00').startsWith(hour.substring(0, 2)));
                                        return (
                                            <div key={emp.id} className="p-2 border-r border-[#F4F7FA] relative flex items-center justify-center">
                                                {task && (
                                                    <button 
                                                        onClick={() => onEdit(task)}
                                                        className={`w-full p-3 rounded-2xl text-[9px] font-black uppercase transition-all hover:scale-[1.02] shadow-sm ${
                                                            task.status === 'Hecha' ? 'bg-green-50 text-green-500 border border-green-100' :
                                                            task.priority === 'Alta' ? 'bg-red-50 text-red-500 border border-red-100 shadow-red-100' :
                                                            'bg-blue-50 text-[#1A365D] border border-blue-100 shadow-blue-50'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span>{task.time || '--:--'}</span>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Hecha' ? 'bg-green-500' : task.priority === 'Alta' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                        </div>
                                                        <div className="truncate">{task.title}</div>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MiniCalendar = ({ currentMonth, onMonthChange, tasks }) => {
    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] border border-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h4>
                <div className="flex gap-2">
                    <button onClick={() => onMonthChange(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"><ChevronLeft size={14}/></button>
                    <button onClick={() => onMonthChange(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"><ChevronRight size={14}/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-[8px] font-black text-slate-300 mb-2">{d}</div>
                ))}
                {days.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDay = isToday(day);
                    const hasTasks = tasks.some(t => isSameDay(parseISO(t.date), day));
                    
                    return (
                        <div 
                            key={i} 
                            className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[9px] font-black relative cursor-pointer transition-all
                                ${!isCurrentMonth ? 'text-slate-200' : isTodayDay ? 'bg-[#FF8C9D] text-white shadow-lg shadow-coral-100' : 'text-slate-600 hover:bg-slate-50'}
                            `}
                        >
                            {format(day, 'd')}
                            {hasTasks && !isTodayDay && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const UpcomingTimeline = ({ tasks, onSelectTask }) => {
    const today = startOfDay(new Date());
    const horizon = addDays(today, 14);
    
    const upcomingDays = [];
    for (let d = today; d <= horizon; d = addDays(d, 1)) {
        const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), d));
        if (dayTasks.length > 0) {
            upcomingDays.push({ date: d, tasks: dayTasks });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cronograma Próximo</h4>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {upcomingDays.map((day, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-slate-100 py-1">
                        <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-slate-200" />
                        <div className="mb-2">
                            <span className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter">
                                {isToday(day.date) ? 'HOY' : format(day.date, 'EEEE d', { locale: es })}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {day.tasks.map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => onSelectTask(t)}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center gap-3
                                        ${t.status === 'Hecha' ? 'bg-green-50/50 border-green-100 text-green-600' : 'bg-white border-[#E2E8F0] text-[#1A365D] shadow-sm'}
                                    `}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'Hecha' ? 'bg-green-500' : t.priority === 'Alta' ? 'bg-rose-500' : 'bg-blue-400'}`} />
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase truncate">{t.title}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.time || 'TODO EL DÍA'}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                {upcomingDays.length === 0 && (
                    <p className="text-center text-[10px] text-slate-300 italic py-10 uppercase tracking-widest">Sin tareas próximos</p>
                )}
            </div>
        </div>
    );
};

const TasksView = ({ tasks, batteries, onEdit, onAdd, onAddBattery, onEditBattery, onAddBatteryItem, onDeleteBatteryItem, onCheckBattery, onDeleteBattery, onPostponeBattery, loadData, currentStore, employees, partners, zones, activeZoneId, onSelectZone, onManageZones }) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const [month, setMonth] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);
    const [view, setView] = useState('batteries'); // 'batteries', 'calendar', 'list'

    const startDate = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const filteredTasks = safeTasks.filter(t => !activeZoneId || t.zone_id == activeZoneId);
    const alertTasks = safeTasks.filter(t => t.type === 'jewelry_alert');
    const displayTasks = filteredTasks.filter(t => t.type !== 'jewelry_alert');

    const projectTasks = (physicalTasks) => {
        const projected = [];
        const horizon = addMonths(new Date(), 6);
        
        physicalTasks.filter(t => t.recurring && t.status !== 'Hecha' && t.type !== 'jewelry_alert').forEach(task => {
            let currentStr = task.date;
            if (!currentStr) return;

            // Generate up to 50 instances to prevent infinite loops
            for (let i = 0; i < 50; i++) {
                const nextDate = getNextOccurrenceDate(currentStr, task);
                if (!nextDate || nextDate > format(horizon, 'yyyy-MM-dd')) break;
                
                projected.push({
                    ...task,
                    id: `virtual-${task.id}-${nextDate}`,
                    date: nextDate,
                    isVirtual: true
                });
                currentStr = nextDate;
            }
        });
        return projected;
    };

    const getNextOccurrenceDate = (currentDateStr, task) => {
        try {
            const { periodicity, recurring_days, recurring_month_day, recurring_interval = 1, recurring_type = 'simple' } = task;
            let next = parseISO(currentDateStr);
            if (isNaN(next.getTime())) return null;

            const interval = Number(recurring_interval) || 1;

            if (periodicity === 'Diario') {
                next = addDays(next, interval);
            } else if (periodicity === 'Semanal') {
                const dayMap = { 'D': 0, 'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6 };
                const selectedDays = (Array.isArray(recurring_days) ? recurring_days : []).map(d => dayMap[d]).filter(d => d !== undefined).sort((a,b) => a - b);
                
                if (selectedDays.length === 0) {
                    next = addDays(next, 7 * interval);
                } else {
                    let currentDay = next.getDay();
                    let nextDay = selectedDays.find(d => d > currentDay);
                    if (nextDay === undefined) {
                        nextDay = selectedDays[0];
                        next = addDays(next, (7 * interval - currentDay + nextDay));
                    } else {
                        next = addDays(next, nextDay - currentDay);
                    }
                }
            } else if (periodicity === 'Mensual') {
                if (recurring_type === 'on_day' && recurring_month_day) {
                    next.setDate(1);
                    next = addMonths(next, interval);
                    next.setDate(Number(recurring_month_day));
                } else {
                    next = addMonths(next, interval);
                }
            } else if (periodicity === 'Anual') {
                next = addYears(next, interval);
            } else {
                return null;
            }
            return format(next, 'yyyy-MM-dd');
        } catch (e) { return null; }
    };

    const allTasks = [...displayTasks, ...projectTasks(displayTasks)];

    const toggleStatus = async (task) => {
        if (task.isVirtual) {
            // Instantiate virtual task before completing
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify({ ...task, id: undefined, status: 'Hecha', isVirtual: undefined })
            });
            if (res.ok) loadData();
            return;
        }
        const newStatus = task.status === 'Hecha' ? 'Pendiente' : 'Hecha';
        await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify({ ...task, status: newStatus })
        });
        loadData();
        if (selectedTask?.id === task.id) {
            setSelectedTask({ ...task, status: newStatus });
        }
    };

    const deleteTask = async (id) => {
        if (typeof id === 'string' && id.startsWith('virtual-')) {
            alert('Para eliminar una serie de tareas, edita la tarea principal y desactiva la periodicidad.');
            return;
        }
        if (!confirm('¿Seguro que quieres eliminar esta tarea?')) return;
        await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: { 'x-store-id': currentStore } });
        setSelectedTask(null);
        loadData();
    };

        return (
        <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* PANEL CENTRAL (75%) */}
            <div className="flex-1 w-full lg:max-w-[calc(100%-360px)] space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="bg-white p-1 rounded-2xl border border-[#E5E7EB] shadow-sm flex gap-1">
                        {[
                            { id: 'batteries', label: 'Baterías', icon: Layers },
                            { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
                            { id: 'list', label: 'Lista', icon: List }
                        ].map(v => (
                            <button 
                                key={v.id} onClick={() => setView(v.id)}
                                className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === v.id ? 'bg-[#1A365D] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <v.icon size={14} />
                                {v.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onManageZones} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">Ajustes Zonas</button>
                    </div>
                </div>

                {view === 'batteries' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        {(zones.length > 0 ? zones : [{id: 'general', name: 'ZONA GENERAL'}]).map(zone => {
                            const zoneBatteries = (batteries || []).filter(b => b.zone_id == zone.id);
                            const zoneTasks = (tasks || []).filter(t => t.zone_id == zone.id && t.status !== 'Hecha');
                            
                            let total = 0, done = 0;
                            zoneBatteries.forEach(b => { (b.items || []).forEach(i => { total++; if(i.is_done) done++; }); });
                            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                            return (
                                <div key={zone.id} className="bg-white rounded-[48px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-700">
                                    <header className="p-10 border-b border-[#F8F9FA] flex justify-between items-center bg-slate-50/10">
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-16 h-16 flex items-center justify-center">
                                                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                     <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                     <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#1A365D] transition-all duration-1000" strokeDasharray={176} strokeDashoffset={176 - (176 * progress) / 100} />
                                                 </svg>
                                                 <span className="text-xs font-black text-[#1A365D] tabular-nums">{progress}%</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-[900] text-[#1A365D] uppercase tracking-tighter leading-none">{zone.name}</h3>
                                                <div className="flex items-center gap-2 mt-2 opacity-40">
                                                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">{zoneBatteries.length} Planes Activos</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={onAdd} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#FF8C9D] hover:border-[#FF8C9D] transition-all shadow-sm">
                                            <Plus size={20} />
                                        </button>
                                    </header>
                                    
                                    <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar bg-white">
                                        <BatteriesView 
                                            batteries={zoneBatteries} onEdit={onEditBattery} onAddExtra={onAddBatteryItem} onDeleteExtra={onDeleteBatteryItem} onCheck={onCheckBattery} onDelete={onDeleteBattery} onPostpone={onPostponeBattery}
                                            hideHeader={true} isCompact={true} activeZoneId={zone.id}
                                        />
                                        
                                        {zoneTasks.length > 0 && (
                                            <div className="mt-10 pt-8 border-t border-slate-100">
                                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Ejecución Inmediata</h4>
                                                <div className="space-y-1">
                                                    {zoneTasks.slice(0, 10).map(t => (
                                                        <div key={t.id} onClick={() => setSelectedTask(t)} className="flex items-center gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer group">
                                                            <div className={`w-0.5 h-7 rounded-full transition-all ${t.priority_level === 'Urgente' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : t.priority_level === 'Alta' ? 'bg-amber-400' : 'bg-slate-200'}`} />
                                                            <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-blue-400 bg-white transition-all shadow-sm" />
                                                            <span className="text-[12px] font-black text-slate-600 uppercase truncate flex-1 tracking-tight">{t.title}</span>
                                                            <span className="text-[9px] font-black text-slate-300 group-hover:text-blue-500 tabular-nums">{t.time || ''}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <footer className="p-6 bg-slate-50/50 border-t border-[#F8F9FA] flex justify-between items-center">
                                         <button onClick={() => setView('list')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1A365D] px-4 py-2 transition-colors">Auditar Zona</button>
                                         <button onClick={onAddBattery} className="px-6 py-3 bg-white border border-slate-200 text-[#1A365D] rounded-2xl text-[10px] font-black uppercase shadow-sm hover:shadow-xl transition-all">Nuevo Despliegue</button>
                                    </footer>
                                </div>
                            );
                        })}
                    </div>
                )}

                {view === 'calendar' && (
                     <div className="bg-white rounded-[64px] border border-[#E5E7EB] shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-700">
                        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-[#E5E7EB]">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Dom'].map(d => (
                                <div key={d} className="p-6 text-center text-[11px] font-[900] text-slate-300 uppercase tracking-[0.3em]">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((day, i) => {
                                const dayTasks = allTasks.filter(t => isSameDay(parseISO(t.date), day));
                                const isCurrentMonth = isSameMonth(day, month);
                                const isTodayDay = isToday(day);

                                return (
                                    <div 
                                        key={i} 
                                        className={`min-h-[160px] p-6 border-r border-b border-[#E5E7EB] transition-all relative ${!isCurrentMonth ? 'opacity-10 grayscale' : 'hover:bg-slate-50/30'} ${isTodayDay ? 'bg-blue-50/10' : ''}`}
                                    >
                                        <div className={`text-xs font-black mb-6 flex items-center justify-center w-9 h-9 rounded-2xl transition-all ${isTodayDay ? 'bg-[#1A365D] text-white shadow-2xl' : 'text-slate-300'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                                             {dayTasks.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => setSelectedTask(t)} 
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black truncate uppercase border ${t.status === 'Hecha' ? 'bg-green-50 text-green-500 border-green-100 line-through' : 'bg-white text-[#1A365D] border-slate-100 shadow-sm cursor-pointer hover:border-blue-400 transition-all font-bold tracking-tight'}`}
                                                >
                                                    {t.title}
                                                </div>
                                             ))}
                                         </div>
                                     </div>
                                 );
                            })}
                        </div>
                    </div>
                )}

                {view === 'list' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in duration-500">
                        <div className="space-y-4 max-h-[900px] overflow-y-auto pr-4 custom-scrollbar">
                            {allTasks.sort((a,b) => a.date.localeCompare(b.date)).map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => setSelectedTask(t)}
                                    className={`bg-white p-8 rounded-[48px] border border-[#E5E7EB] shadow-sm hover:shadow-2xl transition-all cursor-pointer flex items-center gap-8 group ${selectedTask?.id === t.id ? 'ring-4 ring-blue-500/10 bg-blue-50/10 border-blue-200' : ''}`}
                                >
                                    <div className={`min-w-0 flex-1`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t.date ? format(parseISO(t.date), "EEEE d MMM", { locale: es }) : 'POR DEFINIR'}</span>
                                            {t.status === 'Hecha' && <CheckCircle2 size={12} className="text-green-500"/>}
                                        </div>
                                        <h4 className="text-lg font-black text-[#1A365D] uppercase truncate tracking-tighter leading-none">{t.title}</h4>
                                    </div>
                                    <ChevronRight size={20} className={`text-slate-200 group-hover:text-blue-500 translate-x-0 group-hover:translate-x-2 transition-all`} />
                                </div>
                            ))}
                        </div>

                        <div className="sticky top-24 h-fit">
                            {selectedTask ? (
                                <div className="bg-[#1A365D] text-white p-12 rounded-[64px] shadow-2xl space-y-12 animate-in zoom-in-95 duration-500 border border-white/10">
                                    <div className="flex justify-between items-start">
                                        <div className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/20">
                                            {selectedTask.status}
                                        </div>
                                        <button onClick={() => setSelectedTask(null)} className="p-4 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-[900] uppercase tracking-tighter leading-[1]">{selectedTask.title}</h3>
                                        <div className="flex items-center gap-3 text-[12px] font-black text-blue-400 mt-8 bg-blue-500/10 w-fit px-6 py-3 rounded-3xl border border-blue-500/20 shadow-lg">
                                            <CalendarIcon size={18} /> 
                                            {selectedTask.date ? format(parseISO(selectedTask.date), "EEEE d MMMM yyyy", { locale: es }).toUpperCase() : 'PENDIENTE'}
                                        </div>
                                    </div>
                                    <div className="space-y-6 bg-white/5 p-10 rounded-[56px] border border-white/5 backdrop-blur-sm">
                                        <label className="text-[11px] font-black text-blue-300 uppercase tracking-[0.4em]">Especificaciones de Tarea</label>
                                        <p className="text-lg font-medium leading-relaxed opacity-90 whitespace-pre-wrap tracking-tight">{selectedTask.description || 'No hay descripción detallada.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5 pt-4">
                                        <button onClick={() => toggleStatus(selectedTask)} className={`py-7 rounded-[40px] font-black text-[12px] uppercase tracking-widest transition-all ${selectedTask.status === 'Hecha' ? 'bg-green-500 text-white shadow-2xl shadow-green-500/40' : 'bg-white text-[#1A365D] shadow-2xl shadow-black/20'}`}>{selectedTask.status === 'Hecha' ? 'Cerrar' : 'Confirmar'}</button>
                                        <button onClick={() => selectedTask.isVirtual ? alert('Es proyectada') : onEdit(selectedTask)} className="py-7 bg-white/10 text-white rounded-[40px] font-black text-[12px] uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all font-black">Editar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[600px] border-2 border-dashed border-slate-200 rounded-[70px] flex flex-col items-center justify-center p-16 text-center text-slate-300 bg-white/40 backdrop-blur-sm">
                                    <Layout size={64} className="mb-10 opacity-10" />
                                    <p className="text-[12px] font-black uppercase tracking-[0.4em] opacity-40">Selecciona una entrada de lista</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* SIDEBAR DERECHO (25%) */}
            <aside className="w-full lg:w-[320px] shrink-0 sticky top-24 space-y-10 animate-in fade-in slide-in-from-right-4 duration-1000">
                <div className="bg-white rounded-[48px] border border-[#E5E7EB] shadow-sm p-10 space-y-12">
                    <MiniCalendar currentMonth={month} onMonthChange={setMonth} tasks={allTasks} />
                    
                    <div className="pt-12 border-t border-slate-50">
                        <h4 className="text-[11px] font-black text-[#1A365D] uppercase tracking-[0.4em] mb-12 flex items-center justify-center gap-4">
                            <Clock size={20} className="text-[#FF8C9D]" />
                            Lineal Temporal
                        </h4>
                        <UpcomingTimeline tasks={allTasks} onSelectTask={(t) => { setSelectedTask(t); setView('list'); }} />
                    </div>
                </div>
                
                <div className="bg-[#1A365D] rounded-[48px] p-10 text-white space-y-6 shadow-2xl shadow-blue-900/40">
                     <h5 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em]">Propagación Rápida</h5>
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={onAdd} className="bg-white/10 h-28 rounded-[32px] flex flex-col items-center justify-center gap-3 hover:bg-white/20 transition-all border border-white/5">
                            <Plus size={24} />
                            <span className="text-[9px] font-black uppercase">Tarea</span>
                        </button>
                        <button onClick={onAddBattery} className="bg-white/10 h-28 rounded-[32px] flex flex-col items-center justify-center gap-3 hover:bg-white/20 transition-all border border-white/5">
                            <Layers size={24} />
                            <span className="text-[9px] font-black uppercase">Batería</span>
                        </button>
                     </div>
                </div>
            </aside>
        </div>
    );
};


const InventoryAdjustmentModal = ({ initialCategory, onSave, onCancel }) => {
    const [mode, setMode] = useState('direct'); // 'direct' or 'transfer'
    const [data, setData] = useState({
        category: initialCategory || GOLDSMITH_CATEGORIES[0],
        targetCategory: GOLDSMITH_CATEGORIES[1],
        weight: '',
        cost: ''
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ mode, ...data }); }} className="space-y-6">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6">
                <button type="button" onClick={() => setMode('direct')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'direct' ? 'bg-white text-[#1A365D] shadow-sm' : 'text-slate-400'}`}>Ajuste Directo</button>
                <button type="button" onClick={() => setMode('transfer')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'transfer' ? 'bg-white text-[#1A365D] shadow-sm' : 'text-slate-400'}`}>Transferencia</button>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{mode === 'transfer' ? 'Desde Agrupación' : 'Seleccionar Agrupación'}</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.category} onChange={e => setData({...data, category: e.target.value})}>
                        {GOLDSMITH_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                {mode === 'transfer' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Hacia Agrupación</label>
                        <select className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.targetCategory} onChange={e => setData({...data, targetCategory: e.target.value})}>
                            {GOLDSMITH_CATEGORIES.filter(c => c !== data.category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{mode === 'transfer' ? 'Peso a Mover (g)' : 'Peso Total (g)'}</label>
                        <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-center" value={data.weight} onChange={e => setData({...data, weight: e.target.value})}/>
                        {mode === 'direct' && <p className="text-[8px] text-slate-400 mt-1 italic">Sobreescribe el peso actual.</p>}
                    </div>
                    {mode === 'direct' && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Coste Total (€)</label>
                            <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-center text-green-600" value={data.cost} onChange={e => setData({...data, cost: e.target.value})}/>
                            <p className="text-[8px] text-slate-400 mt-1 italic">Sobreescribe el costo actual.</p>
                        </div>
                    )}
                </div>
            </div>

            <button type="submit" className="w-full py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">
                {mode === 'transfer' ? 'EJECUTAR TRANSFERENCIA' : 'ACTUALIZAR VALORES'}
            </button>
        </form>
    );
};

const GoldsmithInventoryPanel = ({ inventory, onAdjust }) => {
    return (
        <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                    Matriz de Agrupaciones (Inventario Real) <Layers size={16} className="text-[#FF8C9D]"/>
                </h3>
                <button 
                    onClick={() => onAdjust()} 
                    className="text-[9px] font-black text-slate-400 px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all uppercase"
                >
                    Ajuste General
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inventory.map(item => {
                    const avgCost = item.total_weight > 0 ? item.total_cost / item.total_weight : 0;
                    const isLow = Number(item.total_weight) < Number(item.restock_threshold);
                    return (
                        <div key={item.id} className={`p-5 rounded-[32px] border-2 transition-all group relative overflow-hidden ${isLow ? 'bg-orange-50 border-orange-200' : 'bg-[#F8F9FB] border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                            <div className="flex justify-between items-start mb-1 z-10 relative">
                                <p className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter">{item.category}</p>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#CCC' }} />
                            </div>
                            <div className="space-y-1 z-10 relative">
                                <p className="text-sm font-black text-[#1A365D]">{Number(item.total_weight).toFixed(2)} gr</p>
                                <div className="flex flex-col gap-0.5 mt-2">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Coste: {formatPrice(item.total_cost)}€</span>
                                    <span className="text-[8px] font-black text-[#1A365D] uppercase bg-blue-50 px-2 py-0.5 rounded-md w-fit">{avgCost.toFixed(2)}€/g</span>
                                </div>
                            </div>
                            {isLow && <p className="text-[7px] font-black text-orange-600 uppercase mt-2 flex items-center gap-1 z-10 relative"><AlertCircle size={8}/> REPOSICIÓN</p>}
                            
                            <button 
                                onClick={() => onAdjust(item.category)}
                                className="absolute inset-0 bg-[#1A365D]/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
                            >
                                <Edit3 size={16} className="mb-1" />
                                <span className="text-[8px] font-black uppercase">Ajustar</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const GoldsmithOrdersPanel = ({ orders, onReceive }) => {
    return (
        <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
            <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest mb-6 flex items-center gap-2">
                Pedidos en Tránsito <Clock size={16} className="text-[#FF8C9D]"/>
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {orders.filter(o => o.status === 'Pedido Lanzado').length === 0 ? (
                    <div className="p-8 bg-slate-50 rounded-3xl text-center border-2 border-dashed border-slate-100 italic text-[10px] text-slate-400">No hay pedidos pendientes de recepción.</div>
                ) : (
                    orders.filter(o => o.status === 'Pedido Lanzado').map(o => (
                        <div key={o.id} className="p-5 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                            <div>
                                <p className="text-[10px] font-black text-[#1A365D] uppercase">{o.partner_name}</p>
                                <p className="text-[8px] font-bold text-blue-400 uppercase">{o.category} | Est: {o.est_weight}g</p>
                                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Lanzado: {format(parseISO(o.order_date), 'dd/MM/yyyy')}</p>
                            </div>
                            <button 
                                onClick={() => onReceive(o)} 
                                className="bg-[#1A365D] text-white text-[9px] font-black px-5 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all uppercase shadow-lg shadow-blue-900/10"
                            >
                                Recibido
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const JewelryView = ({ inventory, orders, partners, movements, onAddPartner, onEditPartner, onDeletePartner, onAddMovement, onDeleteMovement, onRefine, onAddOrder, onReceiveOrder, onAdjustInventory, activeZoneId }) => {
    const [viewMode, setViewMode] = useState('ops'); // 'ops' or 'report'
    const safeMovements = Array.isArray(movements) ? movements : [];
    const safePartners = Array.isArray(partners) ? partners : [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    const transitWeight = safeOrders.filter(o => o.status === 'Pedido Lanzado').reduce((acc, o) => acc + Number(o.est_weight), 0);
    const inOpsWeight = safeMovements.filter(m => m.status === 'Pendiente').reduce((acc, m) => acc + Number(m.weight), 0);
    
    const lastSmelting = safeMovements.find(m => m.type === 'Fundición' && m.status === 'Completado');
    const smeltingHistory = safeMovements.filter(m => m.type === 'Fundición' && m.status === 'Completado').slice(0, 5);

    const donutData = safeInventory.map(item => ({
        name: item.category,
        value: Number(item.total_weight)
    })).filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Dashboard Header Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1A365D] p-8 rounded-[40px] text-white flex gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Stock por Agrupación</h4>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%" cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#FFF'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="w-1/3 space-y-2">
                        {donutData.slice(0, 4).map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name] }} />
                                <span className="text-[8px] font-black uppercase text-blue-100 truncate">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Oro en Tránsito <TrendingUp size={14} className="text-blue-500" />
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-300 uppercase">Pedidos Lanzados</span>
                            <span className="text-xl font-black text-[#1A365D]">{transitWeight.toFixed(2)} gr</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-300 uppercase">En Fundiciones</span>
                            <span className="text-xl font-black text-blue-500">{inOpsWeight.toFixed(2)} gr</span>
                        </div>
                        <div className="pt-4 border-t border-dashed border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-[#1A365D] uppercase">Total Flotante</span>
                            <span className="text-sm font-black text-[#FF8C9D]">{(transitWeight + inOpsWeight).toFixed(2)} gr</span>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 p-8 rounded-[40px] border border-green-100 shadow-sm flex flex-col justify-center">
                    <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Margen Real (Últ. Fundición) <BarChart3 size={14} className="text-green-500" />
                    </h4>
                    {lastSmelting ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black text-green-600/50 uppercase">Coste Adquisición</span>
                                <span className="text-xs font-black text-green-900">{formatPrice(lastSmelting.acquisition_cost)}€</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black text-green-600/50 uppercase">Importe Recibido</span>
                                <span className="text-xs font-black text-green-900">{formatPrice(lastSmelting.received_amount)}€</span>
                            </div>
                            <div className="pt-4 border-t border-dashed border-green-200 flex justify-between items-center">
                                <span className="text-[10px] font-black text-green-700 uppercase">Beneficio Neto</span>
                                <span className="text-xl font-black text-green-600">+{formatPrice(lastSmelting.received_amount - lastSmelting.acquisition_cost)}€</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs font-bold text-green-400 italic">No hay fundiciones cerradas aún.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-2 rounded-[32px] border border-[#E2E8F0] w-fit mx-auto lg:mx-0">
                <button onClick={() => setViewMode('ops')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${viewMode === 'ops' ? 'bg-[#1A365D] text-white shadow-lg' : 'text-[#A0AEC0] hover:text-[#1A365D]'}`}>Operativa</button>
                <button onClick={() => setViewMode('report')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${viewMode === 'report' ? 'bg-[#1A365D] text-white shadow-lg' : 'text-[#A0AEC0] hover:text-[#1A365D]'}`}>Reporte Detallado</button>
            </div>

            {viewMode === 'ops' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column (Inventory & Orders) */}
                    <div className="lg:col-span-8 space-y-8">
                        <GoldsmithInventoryPanel inventory={safeInventory} onAdjust={onAdjustInventory} />
                        
                        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                            <div className="p-8 pb-4 flex justify-between items-center">
                                <h2 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Registro de Movimientos</h2>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => onAddMovement('Recepción')} className="bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-amber-100 transition-all">Recibir Oro</button>
                                    <button onClick={() => onAddMovement('Envío')} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-100 transition-all">Enviar Joyero</button>
                                    <button onClick={() => onAddMovement('Fundición')} className="bg-[#FF8C9D] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-coral-100 hover:scale-[1.02] active:scale-95 transition-all">Fundición</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left uppercase text-[10px] font-bold min-w-[700px]">
                                    <thead className="bg-[#F4F7FA] font-black text-[#A0AEC0] tracking-widest border-b">
                                        <tr>
                                            <th className="p-5 pl-10">Fecha</th>
                                            <th className="p-5">Tipo</th>
                                            <th className="p-5">Agrupación</th>
                                            <th className="p-5">Socio</th>
                                            <th className="p-5">Peso</th>
                                            <th className="p-5">Estado</th>
                                            <th className="p-5 text-right pr-10">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {safeMovements.slice(0, 15).map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-5 pl-10 font-bold text-[#1A365D]">{format(parseISO(m.date), 'dd/MM/yyyy')}</td>
                                                <td className="p-5">
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${m.type === 'Envío' ? 'bg-blue-100 text-blue-600' : m.type === 'Recepción' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                        {m.type}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[m.inventory_category] || '#CCC' }} />
                                                        <span className="text-[10px] font-black text-slate-500">{m.inventory_category || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 font-black text-slate-600">{m.partner_name}</td>
                                                <td className="p-5 font-mono text-[#1A365D] font-black">{m.weight} gr</td>
                                                <td className="p-5">
                                                    <span className={`text-[9px] font-black ${m.status?.includes('Pendiente') ? 'text-coral-400 animate-pulse' : 'text-green-500'}`}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right pr-10">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {m.status?.includes('Pendiente') && (
                                                            <button onClick={() => onRefine(m)} className="bg-[#1A365D] text-white text-[9px] font-black px-4 py-2 rounded-xl hover:scale-105 transition-all">REFINAR</button>
                                                        )}
                                                        <button 
                                                            onClick={() => onDeleteMovement(m.id)}
                                                            className="text-slate-300 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Orders & Partners) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex flex-col gap-4">
                            <button onClick={() => onAddOrder()} className="w-full bg-[#1A365D] text-white py-5 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                                <PlusCircle size={20}/> LANZAR NUEVO PEDIDO
                            </button>
                            <GoldsmithOrdersPanel orders={safeOrders} onReceive={onReceiveOrder} />
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                                    Mis Joyeros <Users size={16} className="text-[#FF8C9D]"/>
                                </h3>
                                <button onClick={onAddPartner} className="text-[9px] font-black text-[#FF8C9D] bg-coral-50 px-3 py-1.5 rounded-lg hover:bg-coral-100 transition-all uppercase">Añadir</button>
                            </div>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {safePartners.map(p => (
                                    <div key={p.id} className="p-5 bg-[#F8F9FB] rounded-[32px] border border-slate-100 group transition-all hover:bg-white hover:shadow-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter">{p.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 mt-0.5">{p.phone || 'Sin tlf'}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => onEditPartner(p)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit3 size={12}/></button>
                                                <button onClick={() => onDeletePartner(p.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-slate-200">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Deuda en {p.debt_type}</span>
                                            <span className={`text-[12px] font-black ${Number(p.debt_grams) > 0 ? 'text-[#FF8C9D]' : 'text-green-500'}`}>{Number(p.debt_grams).toFixed(2)}g</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#F8F9FB] p-8 rounded-[40px] border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest mb-4">Historial de Afinaje</h4>
                            <div className="space-y-3">
                                {smeltingHistory.length === 0 ? (
                                    <p className="text-[9px] text-slate-400 italic">No hay historial de fundiciones.</p>
                                ) : (
                                    smeltingHistory.map(m => (
                                        <div key={m.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-50">
                                            <div>
                                                <p className="text-[9px] font-black text-[#1A365D]">{format(parseISO(m.date), 'dd/MM/yy')}</p>
                                                <p className="text-[8px] font-bold text-slate-400">{m.weight}g Enviados</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-green-500">{(m.refining_percentage || 0)}%</p>
                                                <p className="text-[8px] font-bold text-slate-400">Afinado</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <JewelryReport movements={safeMovements} partners={safePartners} inventory={safeInventory} />
            )}

            <div className="pt-10 border-t border-slate-100 mt-20">
                <AccountStatusWidget partners={partners} activeZoneId={activeZoneId} />
                
                {/* JEWELRY ALERTS - Move here from Agenda */}
                {orders.filter(o => o.status !== 'Recibido').length > 0 && (
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                            <ShieldAlert className="text-rose-500" size={16}/> Recordatorios de Pedidos Críticos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {orders.filter(o => o.status !== 'Recibido').map(order => (
                                <OrderReminder 
                                    key={order.id} 
                                    order={order} 
                                    onClick={() => onReceiveOrder(order)} 
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const JewelryReport = ({ movements, partners, inventory }) => {
    const [filterPartner, setFilterPartner] = useState('all');
    
    const filteredMovements = useMemo(() => {
        return movements.filter(m => 
            filterPartner === 'all' || m.partner_id.toString() === filterPartner
        ).sort((a,b) => b.date.localeCompare(a.date));
    }, [movements, filterPartner]);

    // Group by Month
    const groupedByMonth = useMemo(() => {
        const groups = {};
        filteredMovements.forEach(m => {
            const monthKey = format(parseISO(m.date), 'MMMM yyyy', { locale: es });
            if (!groups[monthKey]) groups[monthKey] = { movements: [], stats: { weight: 0, cost: 0, received: 0, benefit: 0 } };
            groups[monthKey].movements.push(m);
            
            if (m.type === 'Envío') {
                groups[monthKey].stats.weight += Number(m.weight || 0);
            } else if (m.type === 'Fundición' && m.status === 'Completado') {
                const cost = Number(m.acquisition_cost || 0);
                const received = Number(m.received_amount || 0);
                groups[monthKey].stats.cost += cost;
                groups[monthKey].stats.received += received;
                groups[monthKey].stats.benefit += (received - cost);
            }
        });
        return groups;
    }, [filteredMovements]);

    const totalStats = useMemo(() => {
        const res = { totalWeight: 0, totalCost: 0, receivedVal: 0, benefit: 0 };
        filteredMovements.forEach(m => {
            if (m.type === 'Envío' || m.type === 'Fundición') {
                res.totalWeight += Number(m.weight || 0);
            }
            if (m.type === 'Fundición' && m.status === 'Completado') {
                const cost = Number(m.acquisition_cost || 0);
                const received = Number(m.received_amount || 0);
                res.totalCost += cost;
                res.receivedVal += received;
                res.benefit += (received - cost);
            }
        });
        return res;
    }, [filteredMovements]);

    // STOCK SUMMARY LOGIC
    const stockSummary = useMemo(() => {
        const summary = {};
        GOLDSMITH_CATEGORIES.forEach(cat => {
            summary[cat] = { in: 0, out: 0, current: 0, value: 0 };
        });

        // 1. Current Snapshot
        Object.values(inventory || {}).forEach(item => {
            if (summary[item.category]) {
                summary[item.category].current = Number(item.total_weight || 0);
                summary[item.category].value = Number(item.total_cost || 0);
            }
        });

        // 2. Flows from Movements
        movements.forEach(m => {
            if (!m.inventory_category || !summary[m.inventory_category]) return;
            const w = Number(m.weight || 0);
            if (m.type === 'Recepción' || m.type === 'Ajuste+') {
                summary[m.inventory_category].in += w;
            } else if (m.type === 'Envío' || m.type === 'Fundición' || m.type === 'Ajuste-') {
                summary[m.inventory_category].out += w;
            }
        });

        return summary;
    }, [inventory, movements]);

    const partnerStats = useMemo(() => {
        if (filterPartner === 'all') return null;
        const p = partners.find(p => p.id.toString() === filterPartner);
        if (!p) return null;

        const pMoves = movements.filter(m => m.partner_id.toString() === filterPartner);
        const sent = pMoves.filter(m => m.type === 'Envío').reduce((a, b) => a + Number(b.weight), 0);
        const received = pMoves.filter(m => m.type === 'Recepción').reduce((a, b) => a + Number(b.weight), 0);

        return { ...p, sent, received };
    }, [filterPartner, partners, movements]);

    return (
        <div className="space-y-8 animate-in zoom-in duration-300">
            <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Informe Operativa Joyería</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análisis de rentabilidad y movimientos</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-300 uppercase mb-1">Joyero Seleccionado</span>
                        <select 
                            className="bg-[#F4F7FA] border-none rounded-2xl p-3 pr-10 font-black text-[10px] uppercase text-[#1A365D]"
                            value={filterPartner}
                            onChange={(e) => setFilterPartner(e.target.value)}
                        >
                            <option value="all">Todos los Socios</option>
                            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#1A365D] p-6 rounded-[32px] shadow-xl text-white">
                    <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest block mb-2">Peso Total Enviado</span>
                    <p className="text-3xl font-black tracking-tighter">{totalStats.totalWeight.toFixed(2)}<span className="text-xs ml-1 opacity-50">gr</span></p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-2">Coste Invertido</span>
                    <p className="text-3xl font-black text-[#1A365D] tracking-tighter">{totalStats.totalCost.toFixed(2)}€</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-2">Beneficio Neto</span>
                    <p className="text-3xl font-black text-green-500 tracking-tighter">+{totalStats.benefit.toFixed(2)}€</p>
                </div>
                <div className="bg-green-50 p-6 rounded-[32px] border border-green-100 shadow-sm">
                    <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest block mb-2">Rentabilidad (%)</span>
                    <p className="text-3xl font-black text-green-600 tracking-tighter">
                        {totalStats.totalCost > 0 ? ((totalStats.benefit / totalStats.totalCost) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            {/* 1. STOCK SUMMARY TABLE */}
            <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#F4F7FA] bg-slate-50/50 flex justify-between items-center">
                    <h4 className="text-xs font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                        Estado de Inventario (Real vs Flujos) <Package size={16} className="text-[#FF8C9D]"/>
                    </h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left uppercase text-[9px] font-bold">
                        <thead className="bg-white text-slate-400 border-b">
                            <tr>
                                <th className="p-6">Categoría</th>
                                <th className="p-6 text-right">Peso Inicial*</th>
                                <th className="p-6 text-right text-green-500">Entradas (+)</th>
                                <th className="p-6 text-right text-[#FF8C9D]">Salidas (-)</th>
                                <th className="p-6 text-right text-[#1A365D]">Stock Actual</th>
                                <th className="p-6 text-right">Valorización (€)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {GOLDSMITH_CATEGORIES.map(cat => {
                                const s = stockSummary[cat];
                                const initial = s.current - s.in + s.out;
                                return ( initial > 0 || s.current > 0 || s.in > 0 || s.out > 0) && (
                                    <tr key={cat} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                                                <span className="font-black text-[#1A365D]">{cat}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right text-slate-300">{initial.toFixed(2)}g</td>
                                        <td className="p-6 text-right text-green-600 font-black">+{s.in.toFixed(2)}g</td>
                                        <td className="p-6 text-right text-coral-400 font-black">-{s.out.toFixed(2)}g</td>
                                        <td className="p-6 text-right font-black text-[#1A365D] bg-slate-50/50">{s.current.toFixed(2)}g</td>
                                        <td className="p-6 text-right font-black text-[#1A365D]">{formatPrice(s.value)}€</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="p-4 bg-slate-100/50 text-[8px] text-slate-400 text-center font-black uppercase">
                        * El Peso inicial se calcula retroactivamente basándose en el stock actual y los movimientos registrados.
                    </div>
                </div>
            </div>

            {/* 2. PARTNER DRILL-DOWN (If filtered) */}
            {partnerStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-[#1A365D] text-white rounded-[32px] flex items-center justify-center font-black text-2xl uppercase shadow-xl shadow-blue-900/20">
                                {partnerStats.name.substring(0, 2)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#1A365D] tracking-tighter uppercase">{partnerStats.name}</h3>
                                <p className="text-[10px] font-black text-[#FF8C9D] uppercase tracking-widest mt-1">Ficha Individual de Socio</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-6 rounded-3xl">
                                <span className="text-[8px] font-black text-slate-300 uppercase block mb-1">Gramos Enviados</span>
                                <p className="text-xl font-black text-[#1A365D]">{partnerStats.sent.toFixed(2)}g</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl">
                                <span className="text-[8px] font-black text-slate-300 uppercase block mb-1">Gramos Recibidos</span>
                                <p className="text-xl font-black text-[#1A365D]">{partnerStats.received.toFixed(2)}g</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-[#FF8C9D] p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="relative z-10">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] block mb-2">Estado de Deuda Actual</span>
                            <h4 className="text-5xl font-black tracking-tighter">{Number(partnerStats.debt_grams).toFixed(2)}<span className="text-lg ml-1 opacity-70">gr</span></h4>
                            <p className="text-xs font-bold mt-4 uppercase tracking-widest opacity-80 flex items-center gap-2">
                                <Lock size={14}/> Referencia Base: Oro {partnerStats.debt_type}
                            </p>
                        </div>
                        <Euro className="absolute -bottom-8 -right-8 text-white/10 w-48 h-48 rotate-12" />
                    </div>
                </div>
            )}

            {Object.keys(groupedByMonth).map(month => (
                <div key={month} className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-[#F4F7FA] bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h4 className="text-sm font-black text-[#1A365D] uppercase tracking-widest">{month}</h4>
                            <div className="flex gap-2">
                                <span className="text-[8px] font-black bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-400 uppercase">Beneficio mes: {groupedByMonth[month].stats.benefit.toFixed(2)}€</span>
                                <span className="text-[8px] font-black bg-green-500 text-white px-2 py-1 rounded-lg uppercase">
                                    {groupedByMonth[month].stats.cost > 0 ? ((groupedByMonth[month].stats.benefit / groupedByMonth[month].stats.cost) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left uppercase text-[9px] font-bold min-w-[600px]">
                            <thead className="text-[#A0AEC0] border-b">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Socio</th>
                                    <th className="p-4">Peso</th>
                                    <th className="p-4">Costo Adq.</th>
                                    <th className="p-4">Valor Final</th>
                                    <th className="p-4">Beneficio</th>
                                    <th className="p-4 text-right">Margen %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {groupedByMonth[month].movements.map(m => {
                                    const cost = Number(m.acquisition_cost || 0);
                                    const received = Number(m.received_amount || 0);
                                    const benefit = received - cost;
                                    const marginPercent = cost > 0 ? (benefit / cost) * 100 : 0;
                                    
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-black">{format(parseISO(m.date), 'dd/MM/yy')}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black ${m.type === 'Envío' ? 'bg-blue-50 text-blue-500' : m.type === 'Recepción' ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}>
                                                    {m.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600">{m.partner_name}</td>
                                            <td className="p-4 font-mono font-black">{m.weight}g</td>
                                            <td className="p-4 font-mono text-slate-400">{cost > 0 ? `${cost.toFixed(2)}€` : '-'}</td>
                                            <td className="p-4 font-mono font-black text-[#1A365D]">{received > 0 ? `${received.toFixed(2)}€` : '-'}</td>
                                            <td className={`p-4 font-mono font-black ${benefit > 0 ? 'text-green-500' : 'text-slate-300'}`}>
                                                {m.type === 'Fundición' && m.status === 'Completado' ? `+${benefit.toFixed(2)}€` : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {m.type === 'Fundición' && m.status === 'Completado' ? (
                                                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black ${marginPercent > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {marginPercent.toFixed(1)}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportsView = ({ batteries, tasks, cashHistory, movements, partners, activeZoneId }) => {
    const safeBatteries = (Array.isArray(batteries) ? batteries : []).filter(b => !activeZoneId || b.zone_id == activeZoneId);
    const safeHistory = Array.isArray(cashHistory) ? cashHistory : [];
    const safeMovements = Array.isArray(movements) ? movements : [];
    const safePartners = Array.isArray(partners) ? partners : [];

    const handleDownloadCashCSV = () => {
        const data = safeHistory.map(h => ({
            Fecha: format(parseISO(h.date), 'dd/MM/yyyy'),
            Responsable: h.responsible_1,
            Teorico: h.expected_total,
            Real: h.total,
            Diferencia: (Number(h.total) - Number(h.expected_total)).toFixed(2),
            Observaciones: h.observations
        }));
        downloadCSV(data, `TikTak_Arqueos_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    const handleDownloadJewelryCSV = () => {
        const data = safeMovements.map(m => ({
            Fecha: m.date,
            Tipo: m.type,
            Socio: m.partner_name,
            Peso: m.weight,
            Costo_Adq: m.acquisition_cost,
            Valor_Final: m.received_amount,
            Beneficio: m.status === 'Completado' ? (Number(m.received_amount) - Number(m.acquisition_cost)).toFixed(2) : '0.00',
            Estado: m.status
        }));
        downloadCSV(data, `TikTak_Joyería_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white">
                <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase">Panel de <span className="text-[#FF8C9D]">Informes</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Exportación de datos para contabilidad y control</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* BATERÍAS PDF */}
                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6"><FileText size={28}/></div>
                    <h3 className="text-lg font-black text-[#1A365D] uppercase mb-2">Agenda Semanal</h3>
                    <p className="text-xs text-slate-400 font-bold mb-8">PDF con las tareas de la agenda y las baterías de objetivos vigentes para firma física.</p>
                    <button 
                        onClick={() => downloadWeeklyPDF(safeBatteries, tasks)}
                        className="w-full py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 group-hover:bg-[#FF8C9D] transition-colors"
                    >
                        <Download size={16}/> GENERAR PDF SEMANAL
                    </button>
                </div>

                {/* ARQUEOS PDF */}
                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><Calculator size={28}/></div>
                    <h3 className="text-lg font-black text-[#1A365D] uppercase mb-2">Informe Arqueos</h3>
                    <p className="text-xs text-slate-400 font-bold mb-8">PDF profesional con el histórico de cierres de caja, descuadres y auditoría de firmas.</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => downloadCashPDF(safeHistory)}
                            className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 group-hover:bg-green-600 transition-colors"
                        >
                            <Download size={16}/> PDF
                        </button>
                        <button 
                            onClick={handleDownloadCashCSV}
                            className="px-4 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all"
                        >
                            CSV
                        </button>
                    </div>
                </div>

                {/* JOYERÍA PDF */}
                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><Pocket size={28}/></div>
                    <h3 className="text-lg font-black text-[#1A365D] uppercase mb-2">Informe Joyería</h3>
                    <p className="text-xs text-slate-400 font-bold mb-8">Reporte corporativo en PDF de fundiciones, beneficios y balances de metales por socio.</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => downloadJewelryPDF(safeMovements)}
                            className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 group-hover:bg-amber-500 transition-colors"
                        >
                            <Download size={16}/> PDF
                        </button>
                        <button 
                            onClick={handleDownloadJewelryCSV}
                            className="px-4 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all"
                        >
                            CSV
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const CashView = ({ history, onSave, employees, user, cumulativeCashDiff }) => {
    const safeHistory = Array.isArray(history) ? history : [];
    const safeEmployees = Array.isArray(employees) ? employees : [];
    const [localDate, setLocalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    // Auth roles for counting - Filtered by canCountCash permission
    const countingStaff = safeEmployees.filter(e => e.canCountCash);

    const [data, setData] = useState({
        expected_total: 0,
        real_total: 0,
        observations: '',
        responsible_1: '',
        responsible_2: '',
        is_closed: false,
        details: { bills: {}, coins: {}, others: 0 }
    });

    const [counts, setCounts] = useState({
        bills: BILLS.reduce((acc, b) => ({ ...acc, [b]: '' }), {}),
        coins: COINS.reduce((acc, c) => ({ ...acc, [c]: '' }), {}),
        others: ''
    });

    useEffect(() => {
        const total = Object.entries(counts.bills).reduce((acc, [val, qty]) => acc + (Number(val) * Number(qty || 0)), 0) +
                      Object.entries(counts.coins).reduce((acc, [val, qty]) => acc + (Number(val) * Number(qty || 0)), 0) +
                      Number(counts.others || 0);
        setData(prev => ({ ...prev, real_total: total, details: counts }));
    }, [counts]);

    useEffect(() => {
        const log = safeHistory.find(l => l.date === localDate);
        if (log) {
            setData({
                expected_total: log.expected_total || 0,
                real_total: log.total || 0,
                observations: log.observations || '',
                responsible_1: log.responsible_1 || '',
                responsible_2: log.responsible_2 || '',
                is_closed: !!log.is_closed
            });
        } else {
            setData({
                expected_total: 0,
                real_total: 0,
                observations: '',
                responsible_1: user.username || '',
                responsible_2: '',
                is_closed: false
            });
        }
    }, [localDate, safeHistory, user]);

    const diff = Number(data.real_total || 0) - Number(data.expected_total || 0);

    const handleSave = (isClosing) => {
        if (!data.responsible_1) return alert('Debes seleccionar al menos un responsable.');
        onSave({
            ...data,
            date: localDate,
            total: data.real_total,
            is_closed: isClosing,
            closed_at: isClosing ? new Date().toISOString() : null,
            closed_by: user.username,
            metadata: JSON.stringify(data.details)
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4 w-full md:w-auto">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase">Conteo de Caja</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registro diario de arqueos y cierre</p>
                    </div>
                    <input 
                        type="date" 
                        className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-black text-[#1A365D]" 
                        value={localDate} 
                        onChange={e => setLocalDate(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <div className="text-right">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Diferencia Final</span>
                        <div className={`text-5xl font-black tabular-nums tracking-tighter ${diff === 0 ? 'text-slate-200' : diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(2)}€
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto bg-slate-50 p-6 rounded-[32px] border border-white">
                    <div className="text-right">
                        <span className="text-[9px] font-black text-[#1A365D] uppercase tracking-widest block mb-1">Arqueo Global {new Date().getFullYear()}</span>
                        <div className={`text-3xl font-black tabular-nums tracking-tighter ${cumulativeCashDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {cumulativeCashDiff > 0 ? '+' : ''}{cumulativeCashDiff.toFixed(2)}€
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-8">
                    <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                         Resultados del Día <Calculator size={16} className="text-[#FF8C9D]"/>
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1">Total Teórico (Sistema) €</label>
                            <input 
                                type="number" 
                                step="0.01"
                                disabled={data.is_closed}
                                className="w-full bg-[#F4F7FA] border-none rounded-2xl p-5 font-black text-2xl text-[#1A365D] focus:ring-2 focus:ring-blue-100 transition-all" 
                                value={data.expected_total} 
                                onChange={e => setData({...data, expected_total: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 text-[#FF8C9D]">Total Real (Contado) €</label>
                            <input 
                                type="number" 
                                step="0.01"
                                disabled={data.is_closed}
                                className="w-full bg-white border-4 border-[#FF8C9D]/10 focus:border-[#FF8C9D]/30 rounded-2xl p-5 font-black text-4xl text-[#1A365D] shadow-xl shadow-coral-100/10 transition-all"
                                value={data.real_total} 
                                onChange={e => setData({...data, real_total: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest">Responsables del Conteo</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-300 uppercase block mb-2">Responsable 1</label>
                                <select 
                                    disabled={data.is_closed}
                                    className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-xs"
                                    value={data.responsible_1}
                                    onChange={e => setData({...data, responsible_1: e.target.value})}
                                >
                                    <option value="">Seleccionar...</option>
                                    {countingStaff.map(e => <option key={e.id} value={getEmpName(e)}>{getEmpName(e)} ({e.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-300 uppercase block mb-2">Responsable 2 (Opcional)</label>
                                <select 
                                    disabled={data.is_closed}
                                    className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-xs"
                                    value={data.responsible_2}
                                    onChange={e => setData({...data, responsible_2: e.target.value})}
                                >
                                    <option value="">Ninguno</option>
                                    {countingStaff.map(e => <option key={e.id} value={getEmpName(e)}>{getEmpName(e)} ({e.role})</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">Anotaciones / Observaciones</label>
                            <textarea 
                                disabled={data.is_closed}
                                rows={4}
                                className="w-full bg-[#F4F7FA] border-none rounded-3xl p-5 font-bold text-xs resize-none placeholder:text-slate-300" 
                                placeholder="Indica si ha habido algún problema, vales pendientes, o motivo del descuadre..."
                                value={data.observations} 
                                onChange={e => setData({...data, observations: e.target.value})}
                            />
                        </div>
                    </div>

                    {!data.is_closed ? (
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleSave(false)} 
                                className="flex-1 bg-white border-2 border-slate-100 py-5 rounded-[32px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                <Save size={16} className="inline mr-2"/> Guardar Borrador
                            </button>
                            <button 
                                onClick={() => confirm('¿Cerrar caja definitivamente?') && handleSave(true)} 
                                className="flex-1 bg-[#1A365D] text-white py-5 rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Lock size={16} className="inline mr-2"/> Cerrar y Firmar Caja
                            </button>
                        </div>
                    ) : (
                        <div className="bg-coral-50 border-2 border-coral-100 p-8 rounded-[40px] flex items-center gap-6">
                            <div className="bg-white p-4 rounded-3xl text-[#FF8C9D] shadow-sm"><Lock size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-[#FF8C9D] uppercase tracking-[0.2em]">Caja Auditada y Cerrada</p>
                                <p className="text-xs font-bold text-slate-500 mt-1">Este registro ya no puede ser modificado por seguridad.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Historial de Auditoría (Audit Trail) */}
            <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#F4F7FA] flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                            Registro de Auditoría <BarChart3 size={16} className="text-blue-500"/>
                        </h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Histórico de cierres y arqueos</p>
                    </div>
                    <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Arqueo Acumulado {new Date().getFullYear()}</span>
                        <div className={`text-4xl font-black tabular-nums tracking-tighter ${cumulativeCashDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {cumulativeCashDiff > 0 ? '+' : ''}{cumulativeCashDiff.toFixed(2)}€
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Resultado Global de todas las entradas</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8F9FB] text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                            <tr>
                                <th className="p-6">Fecha</th>
                                <th className="p-6">Responsable</th>
                                <th className="p-6 text-right">Teórico</th>
                                <th className="p-6 text-right">Real</th>
                                <th className="p-6 text-right">Diferencia</th>
                                <th className="p-6">Incidencias</th>
                                <th className="p-6 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[10px] font-bold">
                            {safeHistory.length === 0 ? (
                                <tr><td colSpan="7" className="p-10 text-center text-slate-300 uppercase italic">No hay registros históricos</td></tr>
                            ) : (
                                safeHistory.map(h => {
                                    const diffVal = Number(h.total || 0) - Number(h.expected_total || 0);
                                    const hasIncidence = h.observations && h.observations.trim().length > 0;
                                    const hasDiff = diffVal !== 0;
                                    
                                    return (
                                        <tr key={h.id} className={`hover:bg-slate-50 transition-colors ${hasDiff || hasIncidence ? 'bg-coral-50/5' : ''}`}>
                                            <td className="p-6 font-black text-[#1A365D]">{format(parseISO(h.date), 'dd/MM/yyyy')}</td>
                                            <td className="p-6 text-slate-500">{h.responsible_1}</td>
                                            <td className="p-6 text-right text-slate-400">{formatPrice(h.expected_total)}€</td>
                                            <td className="p-6 text-right font-black text-[#1A365D] tracking-tighter text-xs">{formatPrice(h.total)}€</td>
                                            <td className={`p-6 text-right font-black ${diffVal === 0 ? 'text-slate-200' : diffVal > 0 ? 'text-green-500' : 'text-[#FF8C9D]'}`}>
                                                {diffVal > 0 ? '+' : ''}{diffVal.toFixed(2)}€
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    {(hasDiff || hasIncidence) ? (
                                                        <>
                                                            <AlertCircle size={14} className="text-[#FF8C9D] shrink-0" />
                                                            <span className="text-slate-400 truncate max-w-[150px] italic">{h.observations || 'Descuadre detectado'}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-green-500/30">Sin incidencias</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6 text-center whitespace-nowrap">
                                                {h.is_closed ? (
                                                    <span className="bg-green-100 text-green-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase shadow-sm">Cerrado</span>
                                                ) : (
                                                    <span className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase shadow-sm">Abierto</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- FORMS ---

const TaskForm = ({ initialData, employees, zones, onSave, onCancel, onDelete }) => {
    // Helper to safely format dates for input fields
    const safeDate = (dateStr) => {
        try {
            if (!dateStr || typeof dateStr !== 'string') return format(new Date(), 'yyyy-MM-dd');
            const d = parseISO(dateStr);
            return isNaN(d) ? format(new Date(), 'yyyy-MM-dd') : format(d, 'yyyy-MM-dd');
        } catch (e) {
            console.error("TaskForm Date Error:", e);
            return format(new Date(), 'yyyy-MM-dd');
        }
    };

    const [data, setData] = useState({ 
        title: initialData?.title || '', 
        date: safeDate(initialData?.date),
        time: initialData?.time || '09:00',
        priority: initialData?.priority || 'Media', 
        priority_level: initialData?.priority_level || initialData?.priority || 'Media',
        periodicity: initialData?.periodicity || 'Manual', 
        recurring: !!initialData?.recurring, 
        assigned_to: initialData?.assigned_to || '', 
        description: initialData?.description || '',
        category: initialData?.category || 'Gerencia',
        zone_id: initialData?.zone_id || '',
        recurring_interval: initialData?.recurring_interval || 1,
        recurring_type: initialData?.recurring_type || 'simple',
        recurring_days: Array.isArray(initialData?.recurring_days) ? initialData?.recurring_days : [],
        recurring_end_date: initialData?.recurring_end_date || '',
        id: initialData?.id || null
    });

    const isEdit = !!initialData?.id;

    const days = [
        { key: 'L', label: 'L' },
        { key: 'M', label: 'M' },
        { key: 'X', label: 'X' },
        { key: 'J', label: 'J' },
        { key: 'V', label: 'V' },
        { key: 'S', label: 'S' },
        { key: 'D', label: 'D' }
    ];

    const toggleDay = (day) => {
        const current = Array.isArray(data.recurring_days) ? data.recurring_days : [];
        if (current.includes(day)) {
            setData({ ...data, recurring_days: current.filter(d => d !== day) });
        } else {
            setData({ ...data, recurring_days: [...current, day] });
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-8">
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Título de la Tarea</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Ej: Revisar inventario de vitrinas"
                            className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white transition-all rounded-2xl p-4 font-bold text-[#1A365D]" 
                            value={data.title} 
                            onChange={e => setData({...data, title: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Instrucciones Detalladas</label>
                        <textarea 
                            rows={4}
                            placeholder="Describe paso a paso lo que debe hacerse..."
                            className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white transition-all rounded-2xl p-4 font-bold text-[#1A365D] resize-none" 
                            value={data.description} 
                            onChange={e => setData({...data, description: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Fecha Inicio</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="date" 
                                required 
                                className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 pl-12 font-bold text-[#1A365D] text-xs" 
                                value={data.date} 
                                onChange={e => setData({...data, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Hora</label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="time" 
                                className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 pl-12 font-bold text-[#1A365D] text-xs" 
                                value={data.time} 
                                onChange={e => setData({...data, time: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Departamento / Categoría</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.category} 
                            onChange={e => setData({...data, category: e.target.value})}
                        >
                            <option value="Gerencia">Gerencia (Azul TikTak)</option>
                            <option value="Ventas">Ventas (Verde Esmeralda)</option>
                            <option value="Joyería / Finanzas">Joyería / Finanzas</option>
                            <option value="Limpieza">Limpieza</option>
                            <option value="Administración">Administración</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Nivel de Prioridad</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.priority_level} 
                            onChange={e => setData({...data, priority_level: e.target.value, priority: e.target.value})}
                        >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente (Resaltada)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Ubicación / Zona</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.zone_id} 
                            onChange={e => setData({...data, zone_id: e.target.value})}
                        >
                            <option value="">Sin Zona Específica</option>
                            {(zones || []).map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Asignar a</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.assigned_to} 
                            onChange={e => setData({...data, assigned_to: e.target.value})}
                        >
                            <option value="">Sin Asignar</option>
                            {(employees || []).map(e => (
                                <option key={e.id} value={getEmpName(e)}>{getEmpName(e)} ({e.role})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Recurrence Section */}
                <div className="bg-[#F8F9FB] p-6 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                             Periodicidad <Clock size={14} className="text-[#FF8C9D]" />
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-lg border-slate-300 text-[#FF8C9D] focus:ring-[#FF8C9D]/20"
                                checked={data.recurring} 
                                onChange={e => setData({ ...data, recurring: e.target.checked, periodicity: e.target.checked ? 'Diario' : 'Manual' })} 
                            />
                            <span className="text-[10px] font-black text-[#A0AEC0] uppercase">Tarea Periódica</span>
                        </label>
                    </div>

                    {data.recurring && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Repetir cada...</label>
                                    <select 
                                        className="w-full bg-white border-none rounded-xl p-3 font-bold text-[#1A365D]" 
                                        value={data.periodicity} 
                                        onChange={e => setData({...data, periodicity: e.target.value})}
                                    >
                                        <option value="Diario">Días</option>
                                        <option value="Semanal">Semanas</option>
                                        <option value="Mensual">Meses</option>
                                        <option value="Anual">Años</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Intervalo</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="w-full bg-white border-none rounded-xl p-3 font-bold text-[#1A365D]" 
                                        value={data.recurring_interval} 
                                        onChange={e => setData({...data, recurring_interval: e.target.value})}
                                    />
                                </div>
                            </div>

                            {data.periodicity === 'Semanal' && (
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 text-center">Días de la semana</label>
                                    <div className="flex justify-between gap-1">
                                        {days.map(d => {
                                            const active = Array.isArray(data.recurring_days) && data.recurring_days.includes(d.key);
                                            return (
                                                <button 
                                                    key={d.key}
                                                    type="button"
                                                    onClick={() => toggleDay(d.key)}
                                                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${active ? 'bg-[#FF8C9D] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                                                >
                                                    {d.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {data.periodicity === 'Mensual' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Día concreto del mes</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number" 
                                            min="1" max="31"
                                            placeholder="Ej: 15"
                                            className="flex-1 bg-white border-none rounded-xl p-3 font-black text-[#1A365D]" 
                                            value={data.recurring_month_day || ''} 
                                            onChange={e => setData({...data, recurring_month_day: e.target.value, recurring_type: 'on_day'})}
                                        />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Se repetirá el día {data.recurring_month_day || 'X'}</span>
                                    </div>
                                    <p className="text-[8px] text-slate-400 italic">Si el día es 31, se ajustará automáticamente al último día de meses más cortos.</p>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Finalizar repetición (Opcional)</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-white border-none rounded-xl p-3 font-bold text-[#1A365D]" 
                                    value={data.recurring_end_date || ''} 
                                    onChange={e => setData({...data, recurring_end_date: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 pt-4">
                <button 
                    type="submit" 
                    className="w-full py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1A365D]/20 hover:scale-[1.01] transition-all"
                >
                    {isEdit ? 'GUARDAR CAMBIOS' : 'CREAR TAREA'}
                </button>
                <div className="flex gap-3">
                    {isEdit && (
                        <button 
                            type="button" 
                            onClick={() => onDelete(data.id)}
                            className="flex-1 py-4 bg-red-50 text-red-400 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100 transition-colors"
                        >
                            ELIMINAR
                        </button>
                    )}
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-100 transition-colors"
                    >
                        CANCELAR
                    </button>
                </div>
            </div>
        </form>
    );
};

const PartnerForm = ({ initialData, onSave, onCancel }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [info, setInfo] = useState(initialData?.contact_info || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [debtType, setDebtType] = useState(initialData?.debt_type || '18k');
    const [debtFormula, setDebtFormula] = useState(initialData?.debt_formula || 'x');
    const [debtGrams, setDebtGrams] = useState(initialData?.debt_grams || 0);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ id: initialData?.id, name, contact_info: info, phone, email, debt_type: debtType, debt_formula: debtFormula, debt_grams: debtGrams }); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nombre Comercial / Profesional</label><input type="text" required className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-[#1A365D]" value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Teléfono</label><input type="tel" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black" value={phone} onChange={e => setPhone(e.target.value)}/></div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Email</label><input type="email" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black" value={email} onChange={e => setEmail(e.target.value)}/></div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-blue-50/30 p-4 rounded-3xl border border-blue-50">
                    <div>
                        <label className="text-[10px] font-black text-blue-400 uppercase block mb-2">Tipo de Deuda Base</label>
                        <select className="w-full bg-white border-none rounded-xl p-3 font-black text-xs" value={debtType} onChange={e => setDebtType(e.target.value)}>
                            <option value="18k">Oro 18k</option>
                            <option value="24k">Oro 24k</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-blue-400 uppercase block mb-2 pl-1">Fórmula de Cálculo (x = gr)</label>
                        <input type="text" className="w-full bg-white border-none rounded-xl p-3 font-black text-xs" placeholder="Ej: x * 0.95" value={debtFormula} onChange={e => setDebtFormula(e.target.value)} />
                    </div>
                </div>
                <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 space-y-2">
                    <label className="text-[10px] font-black text-amber-600 uppercase block tracking-widest pl-1">Deuda Actual Ledger (Gramos)</label>
                    <div className="relative">
                        <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-300" size={18} />
                        <input 
                            type="number" step="0.01"
                            className="w-full bg-white border-2 border-transparent focus:border-amber-400 rounded-2xl p-4 pl-12 font-black text-xl text-amber-700 shadow-sm transition-all" 
                            placeholder="0.00" 
                            value={debtGrams} 
                            onChange={e => setDebtGrams(e.target.value)} 
                        />
                    </div>
                    <p className="text-[8px] text-amber-400 font-bold uppercase pl-1">* ESTE VALOR COMPUTA PARA EL SALDO GLOBAL CON EL JOYERO</p>
                </div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Notas / Dirección / Información Extra</label><textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold resize-none" rows={3} value={info} onChange={e => setInfo(e.target.value)}/></div>
            </div>
            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A365D] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-101 transition-all">GUARDAR SOCIO</button>
            </div>
        </form>
    );
};

const MovementForm = ({ type: movType, partners, onSave, onCancel }) => {
    const safePartners = Array.isArray(partners) ? partners : [];
    const [lines, setLines] = useState([{ karat: '18k', type: 'Oro', weight: '', cost_gr: '' }]);
    const [data, setData] = useState({ 
        partner_id: '', 
        date: format(new Date(), 'yyyy-MM-dd'), 
        debt_added: 0, 
        is_debt_adjustment: false, 
        total_cost: 0,
        debt_impact_override: '', // User can manually override what's added/subtracted
        notes: '',
        image_url: '',
        inventory_category: ''
    });
    
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const compressed = await compressImage(file);
            setData({ ...data, image_url: compressed });
        } catch (error) {
            console.error("Error compressing image:", error);
        } finally {
            setUploading(false);
        }
    };
    
    const partner = safePartners.find(p => p.id.toString() === data.partner_id.toString());
    const totalW = lines.reduce((a, l) => a + Number(l.weight || 0), 0);
    
    // Logic for formula
    const calculateImpact = (val) => {
        if (!partner || !partner.debt_formula || !val) return val;
        try {
            // Very simple parser for safety
            const f = partner.debt_formula.toLowerCase().replace(/x/g, val.toString());
            // Only allow numbers and basic operators if possible, but eval is easier for user-provided math
            return eval(f);
        } catch (e) { return val; }
    };

    const debtImpact = data.debt_impact_override ? Number(data.debt_impact_override) : calculateImpact(totalW);
    const totalC = movType === 'Fundición' ? Number(data.total_cost || 0) : lines.reduce((a, l) => a + (Number(l.weight || 0) * Number(l.cost_gr || 0)), 0);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({...data, type: movType, weight: totalW, cost: totalC, karats_data: lines, status: movType === 'Fundición' ? 'Pendiente' : 'Completado', debt_added: movType === 'Recepción' ? debtImpact : 0, weight: movType === 'Envío' && data.is_debt_adjustment ? debtImpact : totalW }); }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Joyero / Socio</label><select required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.partner_id} onChange={e => setData({...data, partner_id: e.target.value})}><option value="">Socio...</option>{safePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Fecha</label><input type="date" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.date} onChange={e => setData({...data, date: e.target.value})}/></div>
            </div>

            {(movType === 'Envío' || movType === 'Fundición' || movType === 'Recepción') && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">
                        {movType === 'Recepción' ? 'Clasificar Entrada en Inventario' : 'Seleccionar Origen del Oro (Inventario)'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {GOLDSMITH_CATEGORIES.map(cat => (
                            <button 
                                key={cat}
                                type="button"
                                onClick={() => setData({...data, inventory_category: cat})}
                                className={`p-3 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center justify-between border-2 ${data.inventory_category === cat ? 'bg-[#1A365D] text-white border-[#1A365D]' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                            >
                                <span>{cat}</span>
                                {data.inventory_category === cat && <CheckCircle2 size={12}/>}
                            </button>
                        ))}
                    </div>
                    {!data.inventory_category && (movType === 'Envío' || movType === 'Fundición') && (
                        <p className="text-[8px] text-red-400 font-black uppercase mt-2">* ES OBLIGATORIO SELECCIONAR UNA AGRUPACIÓN PARA DETRAER STOCK</p>
                    )}
                </div>
            )}
            
            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase">Detalle Pesos</h4><button type="button" onClick={() => setLines([...lines, { karat: '18k', type: 'Oro', weight: '', cost_gr: '' }])} className="text-[#FF8C9D] font-black text-[10px]">+ AÑADIR FILA</button></div>
                {lines.map((l, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <select className="bg-white rounded-lg p-2 text-[10px] font-black uppercase" value={l.type} onChange={e => { const nl = [...lines]; nl[i].type = e.target.value; setLines(nl); }}><option>Oro</option><option>Plata</option></select>
                        <select className="bg-white rounded-lg p-2 text-[10px] font-black" value={l.karat} onChange={e => { const nl = [...lines]; nl[i].karat = e.target.value; setLines(nl); }}>
                            {l.type === 'Oro' ? (<><option>24k</option><option>18k</option><option>14k</option><option>9k</option></>) : (<><option>999</option><option>925</option></>)}
                        </select>
                        <input type="number" step="0.01" required className="flex-1 bg-white rounded-lg p-2 text-xs font-bold" placeholder="Gramos" value={l.weight} onChange={e => { const nl = [...lines]; nl[i].weight = e.target.value; setLines(nl); }}/>
                        {movType !== 'Recepción' && movType !== 'Fundición' && movType !== 'Envío' && (
                            <input type="number" step="0.01" required className="flex-1 bg-white rounded-lg p-2 text-xs font-bold" placeholder="€/g" value={l.cost_gr} onChange={e => { const nl = [...lines]; nl[i].cost_gr = e.target.value; setLines(nl); }}/>
                        )}
                        {lines.length > 1 && <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="text-red-300 px-2"><Trash2 size={14}/></button>}
                    </div>
                ))}
            </div>

            {movType === 'Fundición' && (
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-400 uppercase block mb-2">Coste de Adquisición / Envío (€) <span className="text-[8px] opacity-60">(Opcional si se introduce al refinar)</span></label>
                    <input type="number" step="0.01" className="w-full bg-white border-2 border-transparent focus:border-blue-300 rounded-xl p-4 font-black text-blue-900" placeholder="Ej: 4500.00" value={data.total_cost} onChange={e => setData({...data, total_cost: e.target.value})}/>
                </div>
            )}


            <div className="pt-2 flex justify-between font-black text-[10px] uppercase px-2 text-slate-400">
                <span>Total Peso Real: {totalW.toFixed(2)}g</span>
                {movType !== 'Recepción' && movType !== 'Fundición' && movType !== 'Envío' && <span className="text-coral-400">Total Coste estim: {totalC.toFixed(2)}€</span>}
            </div>

            {movType === 'Recepción' && (
                <div className="bg-amber-50 p-6 rounded-3xl space-y-4 border border-amber-100">
                    <div className="flex justify-between items-center text-amber-600 font-black text-[10px] uppercase">
                        <span>Impacto en Deuda (Auto-calculado)</span>
                        <span>Fórmula: {partner?.debt_formula || 'Sin fórmula'}</span>
                    </div>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-[9px] font-black text-amber-400 uppercase block mb-1">Gramos a añadir al Ledger</label>
                            <input type="number" step="0.01" className="w-full bg-white border-none rounded-xl p-3 font-black text-amber-900" placeholder={debtImpact.toFixed(2)} value={data.debt_impact_override} onChange={e => setData({...data, debt_impact_override: e.target.value})}/>
                        </div>
                        <div className="bg-white px-4 py-3 rounded-xl border border-amber-200 text-xs font-black text-amber-600">
                             Result: {debtImpact.toFixed(2)} gr ({partner?.debt_type || '18k'})
                        </div>
                    </div>
                </div>
            )}

            {movType === 'Envío' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase px-2"><input type="checkbox" className="w-4 h-4" checked={data.is_debt_adjustment} onChange={e => setData({...data, is_debt_adjustment: e.target.checked})}/> Descontar del Ledger del Socio</div>
                    {data.is_debt_adjustment && (
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex gap-4 items-end animate-in slide-in-from-top-2 duration-300">
                             <div className="flex-1">
                                <label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Gramos a descontar (Confirmados por joyer)</label>
                                <input type="number" step="0.01" className="w-full bg-white border-none rounded-xl p-3 font-black text-blue-900" placeholder={debtImpact.toFixed(2)} value={data.debt_impact_override} onChange={e => setData({...data, debt_impact_override: e.target.value})}/>
                             </div>
                             <div className="bg-white px-4 py-3 rounded-xl border border-blue-200 text-xs font-black text-blue-600">
                                Descuento: {debtImpact.toFixed(2)} gr
                             </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Notas del Envío / Recepción</label>
                    <textarea 
                        className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs resize-none" 
                        rows={3} 
                        placeholder="Observaciones adicionales, detalles específicos..."
                        value={data.notes}
                        onChange={e => setData({...data, notes: e.target.value})}
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Adjuntar Foto</label>
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 group hover:border-[#FF8C9D] transition-all">
                                <Plus size={16} className="text-slate-400 group-hover:text-[#FF8C9D]" />
                                <span className="text-[10px] font-black text-slate-400 group-hover:text-[#FF8C9D] uppercase">
                                    {uploading ? 'Comprimiendo...' : data.image_url ? 'Imagen Seleccionada' : 'Seleccionar Imagen'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {data.image_url && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative group">
                            <img src={data.image_url} alt="Envío" className="w-full h-full object-cover" />
                            <button 
                                type="button" 
                                onClick={() => setData({...data, image_url: ''})}
                                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-5 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" disabled={uploading} className="flex-1 py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all disabled:opacity-50">PROCESAR MOVIMIENTO</button>
            </div>
        </form>
    );
};

const RefineForm = ({ movement, onSave, onCancel }) => {
    const [ref, setRef] = useState(movement.refining_percentage || '');
    const [rec, setRec] = useState(movement.received_amount || '');
    const [cost, setCost] = useState(movement.acquisition_cost || '');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(movement.id, ref, rec, cost); }} className="space-y-6">
            <div className="text-center mb-6">
                <div className="p-4 bg-coral-50 text-[#FF8C9D] rounded-full w-fit mx-auto mb-2"><TrendingUp/></div>
                <p className="text-xs font-black text-slate-400">{movement.partner_name} | {movement.weight}g</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Afinaje Resultante (%)</label>
                    <input type="number" step="0.1" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black" value={ref} onChange={e => setRef(e.target.value)}/>
                </div>
                
                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Coste de Adquisición Total (€)</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black text-blue-600" value={cost} onChange={e => setCost(e.target.value)}/>
                    <p className="text-[8px] text-slate-300 mt-1 italic uppercase text-center">Puedes modificarlo si varió desde el envío</p>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Importe Final Recibido (€)</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black text-green-600" value={rec} onChange={e => setRec(e.target.value)}/>
                </div>
            </div>

            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-[#FF8C9D] text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-102 transition-all">
                    FINALIZAR Y ARCHIVAR
                </button>
            </div>
        </form>
    );
};


const OrderForm = ({ partners, onSave, onCancel }) => {
    const [data, setData] = useState({
        partner_id: '',
        category: '18k',
        est_weight: '',
        order_date: format(new Date(), 'yyyy-MM-dd')
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Joyero / Proveedor</label>
                    <select required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.partner_id} onChange={e => setData({...data, partner_id: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Categoría del Producto</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.category} onChange={e => setData({...data, category: e.target.value})}>
                        {GOLDSMITH_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Gramos Estimados</label>
                        <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black" value={data.est_weight} onChange={e => setData({...data, est_weight: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Fecha Estimada</label>
                        <input type="date" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.order_date} onChange={e => setData({...data, order_date: e.target.value})}/>
                    </div>
                </div>
            </div>
            <button type="submit" className="w-full py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">LANZAR PEDIDO</button>
        </form>
    );
};

const OrderClosureModal = ({ order, onConfirm, onCancel }) => {
    const [weight, setWeight] = useState('');
    const [cost, setCost] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(order.id, { real_weight: weight, total_cost: cost, receive_date: date }); }} className="space-y-6">
            <div className="text-center p-6 bg-blue-50 rounded-3xl mb-4">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Pedido en curso</p>
                <h4 className="text-lg font-black text-[#1A365D] uppercase">{order.partner_name} | {order.category}</h4>
                <p className="text-xs font-bold text-blue-300 mt-1">Estimado: {order.est_weight}g</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Peso Real Recibido (gr)</label>
                    <input type="number" step="0.01" required autoFocus className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-xl text-center" value={weight} onChange={e => setWeight(e.target.value)}/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Importe Final (€)</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-xl text-center text-green-600" value={cost} onChange={e => setCost(e.target.value)}/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Fecha de Recepción</label>
                    <input type="date" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={date} onChange={e => setDate(e.target.value)}/>
                </div>
            </div>
            <button type="submit" className="w-full py-5 bg-green-500 text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">CONFIRMAR RECEPCIÓN Y AJUSTAR STOCK</button>
        </form>
    );
};


const BatteriesView = ({ batteries, onAdd, onCheck, onDelete, onEdit, onAddItem, onDeleteItem, onPostpone, hideHeader, isCompact, activeZoneId }) => {
    const safeBatteries = (Array.isArray(batteries) ? batteries : []).filter(b => !activeZoneId || b.zone_id == activeZoneId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!hideHeader && (
                <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-6 rounded-[40px] border border-white">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase tabular-nums">
                            Baterías de <span className="text-[#FF8C9D]">Tareas</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestión de objetivos por periodos</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => downloadWeeklyPDF(safeBatteries)}
                            className="bg-white border-2 border-slate-100 text-[#1A365D] px-6 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <CalendarIcon size={16} /> DESCARGAR PDF SEMANAL
                        </button>
                        <button 
                            onClick={onAdd} 
                            className="bg-[#1A365D] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> NUEVA BATERÍA
                        </button>
                    </div>
                </div>
            )}

            <div className={isCompact ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"}>
                {safeBatteries.length === 0 ? (
                    <div className="col-span-full py-10 bg-white/50 backdrop-blur-sm rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-60">
                        <Layers size={32} className="mb-4 text-slate-300" />
                        <p className="font-black text-[10px] uppercase tracking-widest text-[#1A365D]">No hay baterías activas</p>
                    </div>
                ) : (
                    safeBatteries.map(b => {
                        const total = b.items?.length || 0;
                        const done = (b.items || []).filter(i => i.is_done).length;
                        const progress = total > 0 ? (done / total) * 100 : 0;
                        
                        return (
                            <div key={b.id} className={`bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group ${isCompact ? 'p-6' : ''}`}>
                                {!isCompact ? (
                                    <>
                                        <div className="p-8 border-b border-[#F4F7FA]">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="bg-blue-50 text-[#1A365D] p-3 rounded-2xl"><Layers size={20}/></div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => onEdit(b)} className="p-2 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={16}/></button>
                                                    <button onClick={() => onDelete(b.id)} className="p-2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter mb-2">{b.title}</h3>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${new Date() > parseISO(b.end_date) ? 'bg-red-50 text-red-400' : 'bg-slate-50 text-[#FF8C9D]'}`}>
                                                    <CalendarIcon size={12}/>
                                                    {format(parseISO(b.start_date), 'dd/MM')} — {format(parseISO(b.end_date), 'dd/MM')}
                                                    {new Date() > parseISO(b.end_date) && <span className="ml-1 font-black underline animate-pulse">EXPIRADA</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-8 space-y-4 flex-1 bg-slate-50/30">
                                            {new Date() > parseISO(b.end_date) && progress < 100 && (
                                                <button 
                                                    onClick={() => onPostpone(b)}
                                                    className="w-full py-4 bg-[#FF8C9D] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-coral-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-4"
                                                >
                                                    <Clock size={16}/> POSPONER / RENOVAR BATERÍA
                                                </button>
                                            )}
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso ({done}/{total})</span>
                                                <span className={`text-xs font-black ${progress === 100 ? 'text-green-500' : 'text-[#1A365D]'}`}>
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-[#1A365D]'}`} style={{ width: `${progress}%` }} />
                                            </div>
                                            
                                            <div className="pt-6 space-y-3">
                                                {(b.items || []).map(item => (
                                                    <div key={item.id} className="flex items-center gap-5 p-5 rounded-[32px] hover:bg-slate-50 transition-all group/item border border-transparent hover:border-slate-100 bg-white">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onCheck(item); }}
                                                            className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 flex items-center justify-center ${item.is_done ? 'bg-green-500 border-green-500 text-white shadow-xl shadow-green-500/20' : 'bg-white border-slate-200 text-transparent hover:border-blue-400'}`}
                                                        >
                                                            <Check size={16} strokeWidth={4}/>
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[13px] font-black uppercase truncate transition-all tracking-tight ${item.is_done ? 'text-slate-300 line-through' : 'text-[#1A365D]'}`}>{item.description}</p>
                                                            {item.is_done && <span className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2 mt-1 italic"><Check size={8}/> {item.completed_by}</span>}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onDeleteExtra(item.id); }}
                                                            className="p-3 text-slate-100 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-rose-50 rounded-xl"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => onAddItem(b.id)}
                                                    className="w-full p-4 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black text-slate-400 uppercase hover:border-blue-200 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <PlusCircle size={14}/> Añadir Tarea Extra
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-tighter truncate pr-4">{b.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => onEdit(b)} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={12}/></button>
                                                <button onClick={() => onDelete(b.id)} className="p-1 text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                                                <span className="text-[9px] font-black text-[#FF8C9D] bg-coral-50 px-2 py-0.5 rounded-lg whitespace-nowrap">{progress.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1A365D] transition-all duration-700" style={{ width: `${progress}%` }} />
                                        </div>
                                        <div className="space-y-2">
                                            {(b.items || []).map(item => (
                                                <div key={item.id} className="flex items-center gap-2 group/compact">
                                                    <button 
                                                        onClick={() => onCheck(item)}
                                                        className="flex-1 flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all"
                                                    >
                                                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${item.is_done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200'}`}>
                                                            {item.is_done && <Check size={10} strokeWidth={4}/>}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase truncate ${item.is_done ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{item.description}</span>
                                                    </button>
                                                    <button onClick={() => onDeleteItem(item.id)} className="opacity-0 group-hover/compact:opacity-100 p-1 text-slate-200 hover:text-red-400 transition-all"><X size={10}/></button>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => onAddItem(b.id)}
                                                className="w-full mt-2 py-2 border border-dashed border-slate-100 rounded-lg text-[8px] font-black text-slate-300 uppercase hover:text-blue-400 hover:border-blue-100 transition-all"
                                            >
                                                + EXTRA
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const BatteryForm = ({ initialData, zones, onSave, onCancel }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [startDate, setStartDate] = useState(initialData?.start_date || format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(initialData?.end_date || format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [zoneId, setZoneId] = useState(initialData?.zone_id || '');
    
    // Support for editing items in existing batteries
    const [items, setItems] = useState(initialData?.items?.map(i => i.description) || ['', '', '']);

    const handleItemChange = (idx, val) => {
        const ni = [...items];
        ni[idx] = val;
        setItems(ni);
    };

    const addItem = () => setItems([...items, '']);
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

    return (
        <form onSubmit={async (e) => { 
            e.preventDefault(); 
            const filteredItems = items.filter(i => i.trim() !== '');
            if (filteredItems.length === 0) return alert('Debes añadir al menos una tarea.');
            
            onSave({ 
                id: initialData?.id,
                title, 
                start_date: startDate, 
                end_date: endDate, 
                zone_id: zoneId || null,
                items: filteredItems 
            });
        }} className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">Nombre de la Batería</label>
                    <input type="text" required placeholder="Ej: Mantenimiento Mensual Mar-Abr" className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-[#1A365D] shadow-inner" value={title} onChange={e => setTitle(e.target.value)}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">Fecha Inicio</label>
                        <input type="date" required className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-[#1A365D] shadow-inner" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">Fecha Fin</label>
                        <input type="date" required className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-[#1A365D] shadow-inner" value={endDate} onChange={e => setEndDate(e.target.value)}/>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">Zona Responsable (Categoría)</label>
                    <div className="flex flex-wrap gap-2">
                        {zones.map(z => (
                            <button 
                                key={z.id}
                                type="button"
                                onClick={() => setZoneId(z.id)}
                                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border
                                    ${zoneId == z.id ? 'bg-[#1A365D] text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}
                                `}
                            >
                                {z.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Lista de Tareas ({items.filter(i => i.trim()).length})</label>
                        <button type="button" onClick={addItem} className="text-[9px] font-black text-[#FF8C9D] bg-coral-50 hover:bg-coral-100 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">+ AÑADIR TAREA</button>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 group">
                                <div className="bg-slate-50 flex-1 flex items-center rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1A365D]/10 transition-all">
                                    <span className="pl-5 text-[10px] font-black text-slate-300">{idx + 1}.</span>
                                    <input 
                                        type="text" 
                                        placeholder={`Tarea a realizar...`}
                                        className="w-full bg-transparent border-none p-5 font-bold text-xs outline-none" 
                                        value={item} 
                                        onChange={e => handleItemChange(idx, e.target.value)}
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-400 p-2 transition-colors"><Trash2 size={18}/></button>
                                )}
                            </div>
                        ))}
                    </div>
                    {initialData && (
                        <p className="text-[8px] text-slate-400 italic text-center uppercase">Aviso: Al editar una batería existente, las tareas marcadas como hechas se mantendrán si su descripción coincide exactamente.</p>
                    )}
                </div>
            </div>
            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-5 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-5 bg-[#1A365D] text-white rounded-[32px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all">
                    {initialData ? 'ACTUALIZAR BATERÍA Y TAREAS' : 'CREAR BATERÍA'}
                </button>
            </div>
        </form>
    );
};


const BatteryItemForm = ({ batteryId, onSave, onCancel }) => {
    const [description, setDescription] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ battery_id: batteryId, description }); }} className="space-y-6">
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Descripción de la Tarea Extra</label>
                <input 
                    type="text" required autoFocus
                    placeholder="Ej: Pintar estantería entrada..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-[#1A365D]" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                />
            </div>
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-900/10">AÑADIR A LA LISTA</button>
            </div>
        </form>
    );
};

const BatteryItemCheckForm = ({ item, onConfirm, onCancel }) => {
    const [name, setName] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(item.id, !item.is_done, name); }} className="space-y-8">
            <div className="bg-slate-50 p-8 rounded-[40px] text-center border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-3">Estás marcando como realizada:</p>
                <h4 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter leading-tight bg-white p-6 rounded-3xl shadow-sm border border-[#E2E8F0]">{item.description}</h4>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase block text-center tracking-[0.3em]">¿Quién firma esta tarea?</label>
                <input 
                    type="text" 
                    required 
                    autoFocus
                    placeholder="Escribe tu nombre..."
                    className="w-full bg-white border-2 border-slate-100 focus:border-green-500 rounded-3xl p-6 text-center font-black text-[#1A365D] text-2xl outline-none transition-all shadow-xl shadow-slate-100" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-4 pt-4">
                <button type="submit" className="w-full py-6 bg-green-500 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-green-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 size={18}/> CONFIRMAR FINALIZACIÓN
                </button>
                <button type="button" onClick={onCancel} className="w-full py-2 text-slate-300 font-black text-[9px] uppercase tracking-[0.2em] hover:text-slate-400 transition-colors">
                    ME HE EQUIVOCADO, CANCELAR
                </button>
            </div>
        </form>
    );
};


// --- GLOBAL MODAL COMPONENT (using Portals to avoid clipping) ---
const GlobalModal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-[#1A365D]/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className={`relative bg-white w-full ${maxWidth} rounded-[40px] shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[92vh] min-h-[400px]`}>
                <div className="p-8 flex justify-between items-center border-b border-[#F4F7FA] shrink-0">
                    <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#F4F7FA] rounded-full text-slate-400 transition-colors"><X/></button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

const XPBonusForm = ({ employees, onSave, onCancel }) => {
    const [data, setData] = useState({ employeeId: employees[0]?.id || '', xp: 100, reason: '' });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-6">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Empleado</label>
                <select 
                    value={data.employeeId} 
                    onChange={e => setData({...data, employeeId: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-[#E2E8F0] rounded-2xl font-bold text-sm text-[#1A365D]"
                >
                    {(employees || []).map(e => <option key={e.id} value={e.id}>{getEmpName(e)}</option>)}
                </select>
            </div>
            <div className="space-y-4">
                <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Cantidad de Puntos</label>
                <input 
                    type="number" 
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-center text-xl" 
                    value={data.xp} 
                    onChange={e => setData({...data, xp: e.target.value})}
                    placeholder="0"
                />
            </div>
            <div className="space-y-4">
                <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Motivo</label>
                <input 
                    type="text" 
                    value={data.reason} 
                    onChange={e => setData({...data, reason: e.target.value})}
                    placeholder="Ej: Excelencia en cierre, Apoyo extra..."
                    className="w-full p-4 bg-slate-50 border border-[#E2E8F0] rounded-2xl font-bold text-sm text-[#1A365D]"
                />
            </div>
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-[#A0AEC0] rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">Cargar Bonus</button>
            </div>
        </form>
    );
};

const ZoneManagerForm = ({ zones, employees, onSave, onDelete, onCancel }) => {
    const [editZone, setEditZone] = useState({ name: '', responsible_id: '' });

    return (
        <div className="space-y-8 min-h-[400px]">
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nueva Zona Operativa</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                        type="text" 
                        placeholder="Nombre (Ej: Zona Sonido)"
                        className="bg-white border-2 border-transparent focus:border-blue-400 rounded-2xl p-4 font-bold text-[#1A365D]"
                        value={editZone.name}
                        onChange={e => setEditZone({...editZone, name: e.target.value})}
                    />
                    <select 
                        className="bg-white border-none rounded-2xl p-4 font-bold text-[#1A365D]"
                        value={editZone.responsible_id}
                        onChange={e => setEditZone({...editZone, responsible_id: e.target.value})}
                    >
                        <option value="">Responsable de Zona</option>
                        {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.alias || e.first_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CERRAR</button>
                    <button 
                        onClick={() => { if(editZone.name) onSave(editZone); setEditZone({ name: '', responsible_id: '' }); }}
                        className="flex-1 bg-[#1A365D] text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all font-black"
                    >
                        {editZone.id ? 'Guardar Cambios' : 'Crear Zona'}
                    </button>
                </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {zones.map(zone => (
                    <div key={zone.id} className="bg-white border border-slate-100 p-4 rounded-[24px] flex justify-between items-center group hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-black">
                                {zone.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-black text-[#1A365D] text-xs uppercase tracking-tighter">{zone.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Resp: {employees.find(e => e.id == zone.responsible_id)?.alias || '---'}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditZone(zone)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><FileText size={16}/></button>
                            <button onClick={() => onDelete(zone.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Gerencia;
