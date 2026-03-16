import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
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
    X
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
    isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell
} from 'recharts';

// --- CONSTANTS ---
const BILLS = [500, 200, 100, 50, 20, 10, 5];
const COINS = [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01];

// --- HELPERS ---
const formatPrice = (p) => Number(p || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatWeight = (w) => Number(w || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' gr';

// --- MAIN PAGE ---
const Gerencia = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const [activeTab, setActiveTab] = useState('summary');
    const [tasks, setTasks] = useState([]);
    const [partners, setPartners] = useState([]);
    const [movements, setMovements] = useState([]);
    const [cashHistory, setCashHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modal, setModal] = useState({ type: null, data: null });

    const loadData = async () => {
        setLoading(true);
        try {
            const h = { 'x-store-id': currentStore };
            const [tRes, pRes, mRes, cRes] = await Promise.all([
                fetch('/api/tasks', { headers: h }),
                fetch('/api/gerencia/goldsmith/partners', { headers: h }),
                fetch('/api/gerencia/goldsmith/movements', { headers: h }),
                fetch('/api/gerencia/cash-control', { headers: h })
            ]);
            
            // Defensive parsing to prevent React crashes if API fails
            if (tRes.ok) setTasks(await tRes.json());
            if (pRes.ok) setPartners(await pRes.json());
            if (mRes.ok) setMovements(await mRes.json());
            if (cRes.ok) setCashHistory(await cRes.json());
            
        } catch (e) { 
            console.error("Error loading Gerencia data:", e);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { loadData(); }, [currentStore]);

    if (user?.role !== ROLES.MANAGER) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-[#F8F9FB] rounded-[40px] border-2 border-[#E2E8F0] animate-in zoom-in duration-500">
                <div className="p-10 bg-red-50 text-red-500 rounded-full mb-8"><Lock size={64} /></div>
                <h1 className="text-4xl font-black text-[#1A365D] tracking-tighter uppercase">ACCESO RESTRINGIDO</h1>
                <p className="text-[#A0AEC0] font-bold text-xs uppercase tracking-widest mt-4">Solo Gerentes autorizados</p>
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
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
        else { const err = await res.json(); alert('Error: ' + (err.error || 'Server error')); }
    };

    const handleUpdateSmelt = async (moveId, refining, received) => {
        const res = await fetch(`/api/gerencia/goldsmith/movements/${moveId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify({ status: 'Completado', refining_percentage: refining, received_amount: received })
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
    };

    const handleSavePartner = async (pData) => {
        const res = await fetch('/api/gerencia/goldsmith/partners', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(pData)
        });
        if (res.ok) { setModal({ type: null, data: null }); loadData(); }
    };

    const handleSaveCash = async (cashData) => {
        const res = await fetch('/api/gerencia/cash-control', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
            body: JSON.stringify(cashData)
        });
        if (res.ok) loadData();
    };

    const tabs = [
        { id: 'summary', label: 'Resumen', icon: BarChart3 },
        { id: 'tasks', label: 'Agenda', icon: CalendarIcon },
        { id: 'jewelry', label: 'Joyería', icon: Pocket },
        { id: 'cash', label: 'Fondos', icon: Calculator }
    ];

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

    return (
        <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-[40px] shadow-sm border border-[#E2E8F0] flex gap-2 w-fit sticky top-4 z-40 mx-auto md:mx-0">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-8 py-4 rounded-[32px] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#1A365D] text-white shadow-xl shadow-[#1A365D]/20' : 'text-[#A0AEC0] hover:bg-slate-50 hover:text-[#1A365D]'}`}>
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[70vh]">
                {activeTab === 'summary' && <GerenciaDashboard tasks={tasks} partners={partners} movements={movements} cashHistory={cashHistory} />}
                {activeTab === 'tasks' && <TasksView tasks={tasks} onEdit={(t) => setModal({ type: 'task', data: t })} onAdd={() => setModal({ type: 'task', data: null })} loadData={loadData} currentStore={currentStore} />}
                {activeTab === 'jewelry' && <JewelryView partners={partners} movements={movements} onAddPartner={() => setModal({ type: 'partner', data: null })} onAddMovement={(type) => setModal({ type: 'movement', data: type })} onRefine={(m) => setModal({ type: 'refine', data: m })} />}
                {activeTab === 'cash' && <CashView history={Array.isArray(cashHistory) ? cashHistory : []} onSave={handleSaveCash} user={user} />}
            </div>

            <GlobalModal isOpen={modal.type === 'task'} onClose={() => setModal({ type: null, data: null })} title={modal.data ? 'Editar Tarea' : 'Nueva Tarea'}>
                <TaskForm 
                    initialData={modal.data} 
                    onSave={handleSaveTask} 
                    onCancel={() => setModal({ type: null, data: null })} 
                    onDelete={handleDeleteTask}
                />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'partner'} onClose={() => setModal({ type: null, data: null })} title="Nuevo Joyero">
                <PartnerForm onSave={handleSavePartner} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'movement'} onClose={() => setModal({ type: null, data: null })} title={modal.data === 'Fundición' ? 'Lote de Fundición' : modal.data === 'Recepción' ? 'Recepción de Oro' : 'Envío a Joyería'} maxWidth="max-w-4xl">
                <MovementForm type={modal.data} partners={partners} onSave={handleSaveMovement} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'refine'} onClose={() => setModal({ type: null, data: null })} title="Cerrar Lote / Afinaje">
                <RefineForm movement={modal.data} onSave={handleUpdateSmelt} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
        </div>
    );
};

// --- SUB-COMPONENTS/VIEWS ---

const GerenciaDashboard = ({ tasks, partners, movements, cashHistory }) => {
    const safeHistory = Array.isArray(cashHistory) ? cashHistory : [];
    const safeMovements = Array.isArray(movements) ? movements : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safePartners = Array.isArray(partners) ? partners : [];

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTasks = safeTasks.filter(t => t.date === today && t.status !== 'Hecha');
    const totalDebt = safePartners.reduce((acc, p) => acc + Number(p.debt_grams || 0), 0);
    const lastCash = safeHistory[0] || { total: 0, observations: 'Sin registros' };
    const smeltingMoves = safeMovements.filter(m => m.type === 'Fundición' && m.status === 'Completado');
    const lastSmelt = smeltingMoves[0];
    const lastSmeltMargin = lastSmelt ? (Number(lastSmelt.received_amount) - Number(lastSmelt.acquisition_cost)) : 0;

    const inProcessWeight = safeMovements
        .filter(m => m.type === 'Envío')
        .reduce((acc, m) => acc + Number(m.weight), 0) - 
        safeMovements.filter(m => m.type === 'Fundición').reduce((acc, m) => acc + Number(m.weight), 0);

    const chartData = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(new Date(), i);
            months.push({ name: format(d, 'MMM', { locale: es }), monthKey: format(d, 'yyyy-MM'), margin: 0 });
        }
        smeltingMoves.forEach(m => {
            const mKey = m.date.substring(0, 7);
            const dataPoint = months.find(d => d.monthKey === mKey);
            if (dataPoint) dataPoint.margin += (Number(m.received_amount) - Number(m.acquisition_cost));
        });
        return months;
    }, [safeMovements]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start"><div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><CheckCircle2 size={24}/></div><span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Agenda</span></div>
                    <div><p className="text-3xl font-black text-[#1A365D]">{todayTasks.length}</p><p className="text-xs text-[#A0AEC0] font-bold">Tareas Hoy</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start"><div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Weight size={24}/></div><span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Metal</span></div>
                    <div><p className="text-3xl font-black text-amber-600">{formatWeight(totalDebt)}</p><p className="text-xs text-[#A0AEC0] font-bold">Deuda Oro</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start"><div className="p-3 bg-green-50 text-green-500 rounded-2xl"><Euro size={24}/></div><span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Caja</span></div>
                    <div><p className="text-3xl font-black text-green-600">{formatPrice(lastCash.total)} €</p><p className="text-xs text-[#A0AEC0] font-bold">Arqueo</p></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border-2 border-coral-100 shadow-xl shadow-coral-50 flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start"><div className="p-3 bg-coral-50 text-[#FF8C9D] rounded-2xl"><TrendingUp size={24}/></div><span className="text-[10px] font-black text-[#FF8C9D] uppercase tracking-widest">Margen</span></div>
                    <div><p className="text-3xl font-black text-[#FF8C9D]">+{formatPrice(lastSmeltMargin)} €</p><p className="text-xs text-[#A0AEC0] font-bold">Realizado</p></div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
                    <h3 className="text-lg font-black text-[#1A365D] tracking-tighter mb-8">RENDIMIENTO HISTÓRICO</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#A0AEC0'}} dy={10} /><YAxis hide /><Tooltip cursor={{fill: '#F8F9FB'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 800 }} /><Bar dataKey="margin" radius={[10, 10, 10, 10]} barSize={40}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.margin > 0 ? '#FF8C9D' : '#E2E8F0'} />)}</Bar></BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="space-y-6">
                    {inProcessWeight > 500 && <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[32px] animate-pulse"><h4 className="text-amber-700 font-black text-xs uppercase flex items-center gap-2"><AlertCircle size={16}/> ALERTA</h4><p className="text-xs font-bold text-amber-600 mt-2">{formatWeight(inProcessWeight)} fuera de tienda.</p></div>}
                    <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm"><h4 className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4">Próximos Eventos</h4><div className="space-y-2">{todayTasks.length === 0 && <p className="text-xs text-[#A0AEC0] italic italic">Sin eventos.</p>}{todayTasks.slice(0, 5).map(task => (<div key={task.id} className="flex items-center gap-2 p-3 bg-[#F4F7FA] rounded-2xl"><div className={`w-2 h-2 rounded-full ${task.priority === 'Alta' ? 'bg-red-400' : 'bg-blue-400'}`} /><span className="text-xs font-bold text-[#1A365D] truncate">{task.title}</span></div>))}</div></div>
                </div>
            </div>
        </div>
    );
};

const TasksView = ({ tasks, onEdit, onAdd, loadData, currentStore }) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const [month, setMonth] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);
    const [view, setView] = useState('calendar'); // 'calendar' or 'list'

    const startDate = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const projectTasks = (physicalTasks) => {
        const projected = [];
        const horizon = addMonths(new Date(), 6); // Project 6 months ahead
        
        // Only project from "Pendiente" recurring tasks to avoid duplicates
        physicalTasks.filter(t => t.recurring && t.status !== 'Hecha').forEach(task => {
            let current = parseISO(task.date);
            const limit = task.recurring_end_date ? parseISO(task.recurring_end_date) : horizon;
            const stopDate = limit < horizon ? limit : horizon;
            
            // Generate up to 50 instances to prevent infinite loops
            for (let i = 0; i < 50; i++) {
                const nextDate = getNextOccurrenceDate(format(current, 'yyyy-MM-dd'), task);
                if (!nextDate || nextDate > format(stopDate, 'yyyy-MM-dd')) break;
                
                projected.push({
                    ...task,
                    id: `virtual-${task.id}-${nextDate}`,
                    date: nextDate,
                    isVirtual: true
                });
                current = parseISO(nextDate);
            }
        });
        return projected;
    };

    // Frontend version of getNextOccurrence
    const getNextOccurrenceDate = (currentDateStr, task) => {
        try {
            const { periodicity, recurring_days, recurring_month_day, recurring_interval = 1, recurring_type = 'simple' } = task;
            let next = parseISO(currentDateStr);
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
                next = addMonths(next, interval);
                if (recurring_type === 'on_day' && recurring_month_day) {
                    next.setDate(Number(recurring_month_day));
                }
            } else if (periodicity === 'Anual') {
                next = addYears(next, interval);
            } else {
                return null;
            }
            return format(next, 'yyyy-MM-dd');
        } catch (e) { return null; }
    };

    const allTasks = [...safeTasks, ...projectTasks(safeTasks)];

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
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
            {/* Main Content: Calendar/List */}
            <div className="flex-1 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase tabular-nums">
                            Agenda <span className="text-[#FF8C9D]">TikTak</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Planificación y seguimiento de tareas</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1 rounded-2xl border border-slate-100 flex gap-1 shadow-sm">
                            <button 
                                onClick={() => setView('calendar')}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${view === 'calendar' ? 'bg-[#1A365D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                Calendario
                            </button>
                            <button 
                                onClick={() => setView('list')}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${view === 'list' ? 'bg-[#1A365D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                Lista
                            </button>
                        </div>
                        <button 
                            onClick={onAdd} 
                            className="bg-[#FF8C9D] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-coral-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> Nueva Tarea
                        </button>
                    </div>
                </div>

                {view === 'calendar' ? (
                    <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden text-sm">
                        <div className="p-8 flex justify-between items-center bg-white border-b border-[#F4F7FA]">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter">
                                    {format(month, 'MMMM yyyy', { locale: es })}
                                </h3>
                                <button 
                                    onClick={() => setMonth(new Date())}
                                    className="text-[9px] font-black text-[#FF8C9D] uppercase tracking-widest px-3 py-1 bg-coral-50 rounded-lg hover:bg-coral-100 transition-colors"
                                >
                                    Hoy
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setMonth(subMonths(month, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl text-slate-400 border border-slate-100 transition-all"><ChevronLeft size={20}/></button>
                                <button onClick={() => setMonth(addMonths(month, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl text-slate-400 border border-slate-100 transition-all"><ChevronRight size={20}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 bg-[#F8F9FB] border-b border-[#E2E8F0]">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                                <div key={d} className="p-4 text-center text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 bg-slate-50/20">
                            {days.map((day, i) => {
                                const dayTasks = allTasks.filter(t => isSameDay(parseISO(t.date), day));
                                const isCurrentMonth = isSameMonth(day, month);
                                const isTodayDay = isToday(day);

                                return (
                                    <div 
                                        key={i} 
                                        className={`min-h-[140px] p-3 border-r border-b border-[#E2E8F0] transition-all relative ${!isCurrentMonth ? 'opacity-10' : 'hover:bg-white'} ${isTodayDay ? 'bg-[#FF8C9D]/5' : ''}`}
                                    >
                                        <div className={`text-[10px] font-black mb-3 flex items-center justify-center w-7 h-7 rounded-lg transition-all ${isTodayDay ? 'bg-[#FF8C9D] text-white shadow-lg shadow-coral-100' : 'text-slate-300'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1.5 overflow-y-auto max-h-[90px] custom-scrollbar pr-1">
                                             {dayTasks.map(t => (
                                                 <button 
                                                     key={t.id} 
                                                     onClick={() => setSelectedTask(t)} 
                                                     className={`w-full text-left text-[8px] px-2.5 py-1.5 rounded-xl font-black truncate uppercase transition-all active:scale-95 flex items-center gap-1.5 ${
                                                         t.status === 'Hecha' 
                                                         ? 'bg-green-50 text-green-500 border border-green-100' 
                                                         : t.priority === 'Alta'
                                                         ? 'bg-red-50 text-red-500 border border-red-100'
                                                         : t.isVirtual
                                                         ? 'bg-slate-50 text-slate-400 border border-dashed border-slate-200 opacity-60'
                                                         : 'bg-blue-50 text-[#1A365D] border border-blue-100 shadow-sm'
                                                     }`}
                                                 >
                                                     <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status === 'Hecha' ? 'bg-green-500' : t.priority === 'Alta' ? 'bg-red-500' : t.isVirtual ? 'bg-slate-300' : 'bg-[#1A365D]'}`} />
                                                     {t.title}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {allTasks.length === 0 ? (
                            <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 font-bold text-sm">No hay tareas programadas.</p>
                            </div>
                        ) : (
                            allTasks.sort((a, b) => a.date.localeCompare(b.date)).map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => setSelectedTask(t)}
                                    className={`bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-6 group ${t.isVirtual ? 'opacity-60 border-dashed' : ''}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isToday(parseISO(t.date)) ? 'bg-[#FF8C9D] text-white shadow-xl shadow-coral-100' : t.isVirtual ? 'bg-slate-50 text-slate-300' : 'bg-[#F4F7FA] text-slate-400'}`}>
                                        <span className="text-xs font-black uppercase leading-none">{format(parseISO(t.date), 'MMM', { locale: es })}</span>
                                        <span className="text-xl font-black leading-tight">{format(parseISO(t.date), 'd')}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${t.priority === 'Alta' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-[#1A365D]'}`}>{t.priority}</span>
                                            {t.recurring && <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-coral-50 text-[#FF8C9D] flex items-center gap-1 uppercase"><Clock size={8}/> {t.isVirtual ? 'Proyectada' : 'Periódica'}</span>}
                                        </div>
                                        <h4 className="text-sm font-black text-[#1A365D] uppercase truncate">{t.title}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold truncate mt-1">{t.description || 'Sin descripción'}</p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleStatus(t); }}
                                            className={`p-3 rounded-2xl transition-all ${t.status === 'Hecha' ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-300 hover:bg-green-50 hover:text-green-500'}`}
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Side Panel: Task Details */}
            <div className={`w-full lg:w-96 shrink-0 transition-all ${selectedTask ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none hidden lg:block'}`}>
                {selectedTask ? (
                    <div className="bg-[#1A365D] text-white p-8 rounded-[40px] shadow-2xl space-y-8 sticky top-32 border border-blue-800">
                        <div className="flex justify-between items-start">
                             <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${selectedTask.status === 'Hecha' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-coral-500/20 text-[#FF8C9D] border border-coral-500/30'}`}>
                                {selectedTask.isVirtual ? 'Programada' : selectedTask.status}
                             </div>
                             <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-2xl font-black tracking-tight leading-tight uppercase">{selectedTask.title}</h3>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-200 bg-white/5 px-3 py-2 rounded-xl">
                                    <CalendarIcon size={14} className="text-[#FF8C9D]" /> {format(parseISO(selectedTask.date), "EEEE, d 'de' MMMM", { locale: es })}
                                </div>
                                {selectedTask.recurring && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-200 bg-white/5 px-3 py-2 rounded-xl">
                                        <Clock size={14} className="text-[#FF8C9D]" /> {selectedTask.periodicity} (Cada {selectedTask.recurring_interval})
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-8">
                            <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Instrucciones</label>
                            <div className="bg-white/5 p-6 rounded-[32px] min-h-[150px] text-xs font-bold leading-relaxed text-blue-100 whitespace-pre-wrap">
                                {selectedTask.description || <span className="italic opacity-30 tracking-normal">Sin instrucciones detalladas...</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-6">
                            <button 
                                onClick={() => toggleStatus(selectedTask)}
                                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${
                                    selectedTask.status === 'Hecha' 
                                    ? 'bg-blue-800 text-blue-300' 
                                    : 'bg-[#FF8C9D] text-white shadow-lg shadow-coral-500/20'
                                }`}
                            >
                                <Check size={16} /> {selectedTask.isVirtual ? 'CONFIRMAR Y COMPLETAR' : selectedTask.status === 'Hecha' ? 'COMPLETADA' : 'MARCAR HECHA'}
                            </button>
                            <button 
                                onClick={() => {
                                    if(selectedTask.isVirtual) {
                                        alert('Para editar esta tarea futura, primero complétala o edita la tarea actual de la serie.');
                                        return;
                                    }
                                    onEdit(selectedTask);
                                }}
                                className={`flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${selectedTask.isVirtual ? 'opacity-30' : ''}`}
                            >
                                <Edit3 size={16} /> EDITAR
                            </button>
                            <button 
                                onClick={() => deleteTask(selectedTask.id)}
                                className="col-span-2 py-4 text-red-400 font-black text-[10px] uppercase hover:text-red-300 transition-colors"
                            >
                                ELIMINAR TAREA
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-slate-300">
                            <CalendarIcon size={32} />
                        </div>
                        <h4 className="text-sm font-black text-[#1A365D] uppercase tracking-tighter">Detalles de Tarea</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">Selecciona una tarea del calendario para ver sus instrucciones y gestionarla.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const JewelryView = ({ partners, movements, onAddPartner, onAddMovement, onRefine }) => {
    const safeMovements = Array.isArray(movements) ? movements : [];
    const safePartners = Array.isArray(partners) ? partners : [];
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-black text-[#1A365D] tracking-tighter">Operativa de Joyería</h2><div className="flex gap-2"><button onClick={onAddPartner} className="bg-white border-2 border-slate-100 p-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50"><UserPlus size={18}/></button><button onClick={() => onAddMovement('Recepción')} className="bg-white border-2 border-slate-100 text-[#1A365D] px-6 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50">Recibir</button><button onClick={() => onAddMovement('Envío')} className="bg-[#F4F7FA] text-[#1A365D] px-6 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200">Enviar</button><button onClick={() => onAddMovement('Fundición')} className="bg-[#FF8C9D] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-coral-100">Fundición</button></div></div>
                    <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden text-sm"><table className="w-full text-left uppercase text-[10px] font-bold"><thead className="bg-[#F4F7FA] font-black text-[#A0AEC0] tracking-widest border-b"><tr><th className="p-5 pl-10">Fecha</th><th className="p-5">Tipo</th><th className="p-5">Socio</th><th className="p-5">Peso</th><th className="p-5">Estado</th><th className="p-5 text-right pr-10">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{safeMovements.map(m => (<tr key={m.id} className="hover:bg-slate-50"><td className="p-5 pl-10 font-bold text-[#1A365D]">{format(parseISO(m.date), 'dd/MM/yyyy')}</td><td className="p-5"><span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${m.type === 'Envío' ? 'bg-blue-100 text-blue-600' : m.type === 'Recepción' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>{m.type}</span></td><td className="p-5">{m.partner_name}</td><td className="p-5 font-mono">{m.weight} gr</td><td className="p-5"><span className={`text-[9px] font-black ${m.status?.includes('Pendiente') ? 'text-coral-400' : 'text-green-500'}`}>{m.status}</span></td><td className="p-5 text-right pr-10">{m.status?.includes('Pendiente') && <button onClick={() => onRefine(m)} className="bg-[#1A365D] text-white text-[9px] font-black px-4 py-2 rounded-xl">REFINAR</button>}</td></tr>))}</tbody></table></div>
                </div>
                <div className="w-full lg:w-80 bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm h-fit">
                    <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest mb-6 flex items-center justify-between">CONTROLES DE METAL <ArrowUpRight size={16} className="text-[#FF8C9D]"/></h3>
                    <div className="space-y-4">{safePartners.filter(p => Number(p.debt_grams) > 0).map(p => (<div key={p.id} className="flex justify-between items-center p-4 bg-coral-50 rounded-2xl"><div><p className="text-[10px] font-black text-[#1A365D] uppercase">{p.name}</p><p className="text-[8px] font-bold text-coral-400">Pendiente Libro</p></div><p className="font-black text-[#FF8C9D]">{p.debt_grams}g</p></div>))}</div>
                </div>
            </div>
        </div>
    );
};

const CashView = ({ history, onSave, user }) => {
    const safeHistory = Array.isArray(history) ? history : [];
    const [localDate, setLocalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [counts, setCounts] = useState(() => { const o = {}; BILLS.concat(COINS).forEach(v => o[v] = 0); return o; });
    const [others, setOthers] = useState({ vales: 0, tickets: 0, cheques: 0 });
    const [obs, setObs] = useState('');
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        const log = safeHistory.find(l => l.date === localDate);
        if (log) { setCounts(log.denominations || counts); setOthers(log.others || others); setObs(log.observations || ''); setClosed(log.is_closed); }
        else { const e = {}; BILLS.concat(COINS).forEach(v => e[v] = 0); setCounts(e); setOthers({ vales: 0, tickets: 0, cheques: 0 }); setObs(''); setClosed(false); }
    }, [localDate, safeHistory]);

    const total = useMemo(() => {
        let t = 0; Object.entries(counts).forEach(([v, q]) => t += Number(v) * Number(q));
        Object.values(others).forEach(v => t += Number(v)); return t;
    }, [counts, others]);

    const saveAction = (isClosing) => {
        onSave({ date: localDate, denominations: counts, others, observations: obs, total, is_closed: isClosing, closed_at: isClosing ? new Date().toISOString() : null, closed_by: isClosing ? user.username : null });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row justify-between items-end gap-6 text-sm">
                <div className="space-y-3 w-full md:w-auto"><h2 className="text-2xl font-black text-[#1A365D] tracking-tighter">Arqueo de Fondos</h2><input type="date" className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold" value={localDate} onChange={e => setLocalDate(e.target.value)}/></div>
                <div className="text-right w-full md:w-auto"><div className="flex flex-col items-end">{closed && <span className="bg-coral-100 text-[#FF8C9D] text-[8px] font-black p-1 rounded mb-2 px-2"><Lock size={8} className="inline mr-1"/> AUDITADO</span>}<p className="text-6xl font-black text-[#FF8C9D] tracking-tighter leading-none tabular-nums">{total.toLocaleString('es-ES')}€</p></div><p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mt-1">Total Auditoría</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Calculadora de Billetes</h3>
                    {BILLS.map(b => (
                        <div key={b} className="flex items-center gap-4"><div className="w-16 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black">{b}€</div><input type="number" disabled={closed} className="flex-1 bg-slate-50 border-none rounded-xl p-2 text-center font-black" value={counts[b] || ''} onChange={e => setCounts({...counts, [b]: e.target.value})}/><div className="w-20 text-right font-black text-slate-300">{(b * (counts[b] || 0)).toLocaleString()}€</div></div>
                    ))}
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Otros Documentos</h3>
                        {Object.keys(others).map(k => (
                            <div key={k} className="flex items-center gap-4"><div className="w-24 font-black uppercase text-[10px] text-slate-400">{k}</div><input type="number" step="0.01" disabled={closed} className="flex-1 bg-slate-50 border-none rounded-xl p-3 font-bold" value={others[k] || ''} onChange={e => setOthers({...others, [k]: e.target.value})}/></div>
                        ))}
                    </div>
                    <div className="flex gap-4">{!closed && <><button onClick={() => saveAction(false)} className="flex-1 bg-white border-2 border-slate-100 py-4 rounded-[28px] font-black text-[10px] uppercase">Borrador</button><button onClick={() => saveAction(true)} className="flex-1 bg-[#FF8C9D] text-white py-4 rounded-[28px] font-black text-[10px] uppercase shadow-lg shadow-coral-100">Cerrar Caja</button></>}</div>
                </div>
            </div>
        </div>
    );
};

// --- FORMS ---

const TaskForm = ({ initialData, onSave, onCancel, onDelete }) => {
    const [data, setData] = useState(initialData || { 
        title: '', 
        date: format(new Date(), 'yyyy-MM-dd'), 
        priority: 'Media', 
        periodicity: 'Manual', 
        recurring: false, 
        assigned_to: '', 
        description: '',
        recurring_interval: 1,
        recurring_type: 'simple',
        recurring_days: [],
        recurring_end_date: ''
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

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Fecha de Inicio</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="date" 
                                required 
                                className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 pl-12 font-bold text-[#1A365D]" 
                                value={data.date} 
                                onChange={e => setData({...data, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Prioridad</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer" 
                            value={data.priority} 
                            onChange={e => setData({...data, priority: e.target.value})}
                        >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media (Normal)</option>
                            <option value="Alta">Alta (Urgente)</option>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Día del mes</label>
                                    <input 
                                        type="number" 
                                        min="1" max="31"
                                        placeholder="Ej: 15"
                                        className="w-full bg-white border-none rounded-xl p-3 font-bold text-[#1A365D]" 
                                        value={data.recurring_month_day || ''} 
                                        onChange={e => setData({...data, recurring_month_day: e.target.value, recurring_type: 'on_day'})}
                                    />
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

const PartnerForm = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [info, setInfo] = useState('');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, contact_info: info }); }} className="space-y-6">
            <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nombre Comercial</label><input type="text" required className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold" value={name} onChange={e => setName(e.target.value)}/></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Información</label><input type="text" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold" value={info} onChange={e => setInfo(e.target.value)}/></div>
            <div className="flex gap-4 pt-4"><button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400">CANCELAR</button><button type="submit" className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px]">GUARDAR</button></div>
        </form>
    );
};

const MovementForm = ({ type: movType, partners, onSave, onCancel }) => {
    const safePartners = Array.isArray(partners) ? partners : [];
    const [lines, setLines] = useState([{ karat: '18k', weight: '', cost_gr: '' }]);
    const [data, setData] = useState({ partner_id: '', date: format(new Date(), 'yyyy-MM-dd'), debt_added: 0, is_debt_adjustment: false });
    const totalW = lines.reduce((a, l) => a + Number(l.weight || 0), 0);
    const totalC = lines.reduce((a, l) => a + (Number(l.weight || 0) * Number(l.cost_gr || 0)), 0);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({...data, type: movType, weight: totalW, cost: totalC, karats_data: lines, status: movType === 'Fundición' ? 'Pendiente' : 'Completado'}); }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Joyero</label><select required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.partner_id} onChange={e => setData({...data, partner_id: e.target.value})}><option value="">Socio...</option>{safePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Fecha</label><input type="date" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.date} onChange={e => setData({...data, date: e.target.value})}/></div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase">Detalle Pesos</h4><button type="button" onClick={() => setLines([...lines, { karat: '18k', weight: '', cost_gr: '' }])} className="text-[#FF8C9D] font-black text-[10px]">+ AÑADIR FILA</button></div>
                {lines.map((l, i) => (
                    <div key={i} className="flex gap-2">
                        <select className="bg-white rounded-lg p-2 text-xs font-bold" value={l.karat} onChange={e => { const nl = [...lines]; nl[i].karat = e.target.value; setLines(nl); }}><option>24k</option><option>18k</option><option>14k</option><option>9k</option></select>
                        <input type="number" step="0.01" required className="flex-1 bg-white rounded-lg p-2 text-xs font-bold" placeholder="Gr" value={l.weight} onChange={e => { const nl = [...lines]; nl[i].weight = e.target.value; setLines(nl); }}/>
                        <input type="number" step="0.01" required className="flex-1 bg-white rounded-lg p-2 text-xs font-bold" placeholder="€/g" value={l.cost_gr} onChange={e => { const nl = [...lines]; nl[i].cost_gr = e.target.value; setLines(nl); }}/>
                        {lines.length > 1 && <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="text-red-300 px-2"><Trash2 size={14}/></button>}
                    </div>
                ))}
                <div className="pt-2 border-t border-dashed flex justify-between font-black text-[10px] uppercase"><span>Total Peso: {totalW.toFixed(2)}g</span><span className="text-coral-400">Total Coste: {totalC.toFixed(2)}€</span></div>
            </div>
            {movType === 'Recepción' && <div><label className="text-[10px] font-black text-amber-500 uppercase block mb-1">Faltan Gramos por pagar</label><input type="number" step="0.01" className="w-full border-2 border-amber-100 bg-amber-50 rounded-xl p-3 font-black" value={data.debt_added} onChange={e => setData({...data, debt_added: e.target.value})}/></div>}
            {movType === 'Envío' && <div className="flex items-center gap-2 font-bold text-xs uppercase"><input type="checkbox" className="w-4 h-4" checked={data.is_debt_adjustment} onChange={e => setData({...data, is_debt_adjustment: e.target.checked})}/> Descontar del Ledger</div>}
            <button type="submit" className="w-full py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">PROCESAR MOVIMIENTO</button>
        </form>
    );
};

const RefineForm = ({ movement, onSave, onCancel }) => {
    const [ref, setRef] = useState('');
    const [rec, setRec] = useState('');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(movement.id, ref, rec); }} className="space-y-6">
            <div className="text-center mb-6"><div className="p-4 bg-coral-50 text-[#FF8C9D] rounded-full w-fit mx-auto mb-2"><TrendingUp/></div><p className="text-xs font-black text-slate-400">{movement.partner_name} | {movement.weight}g</p></div>
            <div><label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Afinaje Resultante (%)</label><input type="number" step="0.1" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black" value={ref} onChange={e => setRef(e.target.value)}/></div>
            <div><label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Importe Final (€)</label><input type="number" step="0.01" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black text-green-600" value={rec} onChange={e => setRec(e.target.value)}/></div>
            <button type="submit" className="w-full py-5 bg-[#FF8C9D] text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">FINALIZAR Y ARCHIVAR</button>
        </form>
    );
};

export default Gerencia;

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
