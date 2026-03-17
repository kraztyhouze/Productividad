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
    Layers,
    X,
    Info
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
    Cell,
    PieChart,
    Pie
} from 'recharts';

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
    return e.alias || `${e.firstName} ${e.lastName || ''}`.trim() || e.username;
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

// --- MAIN PAGE ---
const Gerencia = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const [activeTab, setActiveTab] = useState('summary');
    const [tasks, setTasks] = useState([]);
    const [partners, setPartners] = useState([]);
    const [movements, setMovements] = useState([]);
    const [cashHistory, setCashHistory] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modal, setModal] = useState({ type: null, data: null });

    const loadData = async () => {
        setLoading(true);
        try {
            const h = { 'x-store-id': currentStore };
            const [tRes, pRes, mRes, cRes, bRes, iRes, oRes] = await Promise.all([
                fetch('/api/tasks', { headers: h }),
                fetch('/api/gerencia/goldsmith/partners', { headers: h }),
                fetch('/api/gerencia/goldsmith/movements', { headers: h }),
                fetch('/api/gerencia/cash-control', { headers: h }),
                fetch('/api/task-batteries', { headers: h }),
                fetch('/api/gerencia/goldsmith/inventory', { headers: h }),
                fetch('/api/gerencia/goldsmith/orders', { headers: h })
            ]);
            
            if (tRes.ok) setTasks(await tRes.json());
            if (pRes.ok) setPartners(await pRes.json());
            if (mRes.ok) setMovements(await mRes.json());
            if (cRes.ok) setCashHistory(await cRes.json());
            if (bRes.ok) setBatteries(await bRes.json());
            if (iRes.ok) setInventory(await iRes.json());
            if (oRes.ok) setOrders(await oRes.json());
            
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
        if (res.ok) { 
            setModal({ type: null, data: null }); 
            loadData(); 
            if (movData.type === 'Recepción' && movData.debt_added > 0) {
                sendImmediateNotification("Nueva Deuda de Oro", `Se ha registrado una deuda de ${movData.debt_added}g.`);
            }
        }
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
                {activeTab === 'summary' && <GerenciaDashboard tasks={tasks} partners={partners} movements={movements} cashHistory={cashHistory} inventory={inventory} orders={orders} />}
                {activeTab === 'tasks' && (
                    <TasksView 
                        tasks={tasks} 
                        batteries={batteries}
                        employees={employees}
                        partners={partners}
                        onEdit={(t) => setModal({ type: 'task', data: t })} 
                        onAdd={() => setModal({ type: 'task', data: null })} 
                        onAddBattery={() => setModal({ type: 'battery', data: null })}
                        onCheckBattery={(item) => setModal({ type: 'battery_item_check', data: item })}
                        onDeleteBattery={handleDeleteBattery}
                        loadData={loadData} 
                        currentStore={currentStore} 
                    />
                )}
                {activeTab === 'jewelry' && (
                    <JewelryView 
                        inventory={inventory}
                        orders={orders}
                        partners={partners} 
                        movements={movements} 
                        onAddPartner={() => setModal({ type: 'partner', data: null })} 
                        onEditPartner={(p) => setModal({ type: 'partner', data: p })} 
                        onDeletePartner={handleDeletePartner} 
                        onAddMovement={(type) => setModal({ type: 'movement', data: type })} 
                        onDeleteMovement={handleDeleteMovement} 
                        onRefine={(m) => setModal({ type: 'refine', data: m })}
                        onAddOrder={() => setModal({ type: 'order', data: null })}
                        onReceiveOrder={(o) => setModal({ type: 'order_receive', data: o })}
                    />
                )}
                {activeTab === 'cash' && <CashView history={Array.isArray(cashHistory) ? cashHistory : []} employees={employees} onSave={handleSaveCash} user={user} />}
            </div>

            <GlobalModal isOpen={modal.type === 'task'} onClose={() => setModal({ type: null, data: null })} title={modal.data ? 'Editar Tarea' : 'Nueva Tarea'}>
                <TaskForm 
                    initialData={modal.data} 
                    employees={employees}
                    onSave={handleSaveTask} 
                    onCancel={() => setModal({ type: null, data: null })} 
                    onDelete={handleDeleteTask}
                />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'partner'} onClose={() => setModal({ type: null, data: null })} title={modal.data ? 'Editar Joyero' : 'Nuevo Joyero'}>
                <PartnerForm initialData={modal.data} onSave={handleSavePartner} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'movement'} onClose={() => setModal({ type: null, data: null })} title={modal.data === 'Fundición' ? 'Lote de Fundición' : modal.data === 'Recepción' ? 'Recepción de Oro' : 'Envío a Joyería'} maxWidth="max-w-4xl">
                <MovementForm type={modal.data} partners={partners} onSave={handleSaveMovement} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'refine'} onClose={() => setModal({ type: null, data: null })} title="Cerrar Lote / Afinaje">
                <RefineForm movement={modal.data} onSave={handleUpdateSmelt} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'battery'} onClose={() => setModal({ type: null, data: null })} title="Nueva Batería de Tareas">
                <BatteryForm onSave={handleSaveBattery} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'battery_item_check'} onClose={() => setModal({ type: null, data: null })} title="Confirmar Tarea Realizada">
                <BatteryItemCheckForm item={modal.data} onConfirm={handleToggleBatteryItem} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'order'} onClose={() => setModal({ type: null, data: null })} title="Lanzar Nuevo Pedido">
                <OrderForm partners={partners} onSave={handleSaveOrder} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>

            <GlobalModal isOpen={modal.type === 'order_receive'} onClose={() => setModal({ type: null, data: null })} title="Confirmar Recepción de Pedido">
                <OrderClosureModal order={modal.data} onConfirm={handleReceiveOrder} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
        </div>
    );
};

// --- SUB-COMPONENTS/VIEWS ---

const GerenciaDashboard = ({ tasks, partners, movements, cashHistory, inventory, orders }) => {
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

    const donutData = (Array.isArray(inventory) ? inventory : []).map(item => ({
        name: item.category,
        value: Number(item.total_weight)
    })).filter(d => d.value > 0);

    const transitOrderWeight = (Array.isArray(orders) ? orders : []).filter(o => o.status === 'Pedido Lanzado').reduce((acc, o) => acc + Number(o.est_weight), 0);
    const inOpsWeight = safeMovements.filter(m => m.status === 'Pendiente').reduce((acc, m) => acc + Number(m.weight), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Strategic Jewelry Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#1A365D] p-8 rounded-[40px] text-white flex gap-6 items-center shadow-2xl relative overflow-hidden">
                    <div className="flex-1 z-10">
                        <h4 className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-2">Distribución Metal</h4>
                        <div className="h-28 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={2} dataKey="value">
                                        {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#FFF'} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="w-1/2 space-y-1.5 z-10">
                         {donutData.slice(0, 3).map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name] }} />
                                <span className="text-[7px] font-black uppercase text-blue-100 truncate">{d.name}</span>
                                <span className="text-[8px] font-black text-blue-300 ml-auto">{d.value}g</span>
                            </div>
                        ))}
                    </div>
                    <Layers className="absolute -bottom-6 -right-6 text-white/5 w-32 h-32" />
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Oro Flotante (Tránsito) <TrendingUp size={14} className="text-blue-500" />
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-300 uppercase">Pedidos Lanzados</span>
                            <span className="text-xl font-black text-[#1A365D]">{transitOrderWeight.toFixed(2)} gr</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-300 uppercase">En Fundiciones</span>
                            <span className="text-xl font-black text-blue-400">{inOpsWeight.toFixed(2)} gr</span>
                        </div>
                        <div className="pt-3 border-t border-dashed border-slate-100 flex justify-between items-center text-[#FF8C9D]">
                            <span className="text-[9px] font-black uppercase">Total Exterior</span>
                            <span className="text-sm font-black">{(transitOrderWeight + inOpsWeight).toFixed(2)} gr</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Control de Pedidos</h4>
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-blue-50 text-blue-500 rounded-3xl"><Package size={28}/></div>
                        <div>
                            <p className="text-3xl font-black text-[#1A365D]">{(Array.isArray(orders) ? orders : []).filter(o => o.status === 'Pedido Lanzado').length}</p>
                            <p className="text-xs text-[#A0AEC0] font-bold uppercase tracking-tighter">Entradas Pendientes</p>
                        </div>
                    </div>
                </div>
            </div>

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

const AccountStatusWidget = ({ partners }) => {
    const totalDebt = (partners || []).reduce((acc, p) => acc + Number(p.debt_grams || 0), 0);
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-[50] flex flex-col items-end gap-3">
            {expanded && (
                <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-[#E2E8F0] w-80 mb-2 animate-in slide-in-from-bottom-4 duration-300">
                    <h4 className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4">Liquidaciones Pendientes</h4>
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {partners.filter(p => Number(p.debt_grams) > 0).map(p => (
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
                        {hours.map(hour => (
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TasksView = ({ tasks, batteries, onEdit, onAdd, onAddBattery, onCheckBattery, onDeleteBattery, loadData, currentStore, employees }) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const [month, setMonth] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);
    const [view, setView] = useState('calendar'); // 'calendar', 'list', 'daily'

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
                if (recurring_type === 'on_day' && recurring_month_day) {
                    // Safety to avoid date jumps on short months
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
        <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
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
                            <button 
                                onClick={() => setView('daily')}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${view === 'daily' ? 'bg-[#1A365D] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                Diaria
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={onAddBattery} 
                                className="bg-[#1A365D] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={16} /> BATERÍA
                            </button>
                            <button 
                                onClick={onAdd} 
                                className="bg-[#FF8C9D] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-coral-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={16} /> TAREA
                            </button>
                        </div>
                    </div>
                </div>

                {view === 'calendar' && (
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
                )}

                {view === 'list' && (
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
                                            {t.category && <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">{t.category}</span>}
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

                {view === 'daily' && (
                    <DailyTimelineView 
                        tasks={allTasks} 
                        employees={employees} 
                        onEdit={onEdit} 
                        onToggleStatus={toggleStatus} 
                    />
                )}
            </div>

            {/* Side Panel: Task Details & Batteries */}
            <div className="w-full xl:w-[450px] shrink-0 space-y-8">
                {selectedTask && (
                    <div className="bg-[#1A365D] text-white p-8 rounded-[40px] shadow-2xl space-y-6 border border-blue-800 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-start">
                             <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${selectedTask.status === 'Hecha' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#FF8C9D]/20 text-[#FF8C9D] border border-[#FF8C9D]/30'}`}>
                                {selectedTask.isVirtual ? 'Programada' : selectedTask.status}
                             </div>
                             {selectedTask.category && (
                                 <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30 ml-2">
                                     {selectedTask.category}
                                 </div>
                             )}
                             <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 ml-auto"><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">{selectedTask.title}</h3>
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-200 bg-white/5 px-3 py-2 rounded-xl w-fit">
                                    <CalendarIcon size={14} className="text-[#FF8C9D]" /> {format(parseISO(selectedTask.date), "EEEE, d 'de' MMMM", { locale: es })}
                                </div>
                                {selectedTask.assigned_to && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-200 bg-white/5 px-3 py-2 rounded-xl w-fit capitalize">
                                        <Users size={14} className="text-[#FF8C9D]" /> {selectedTask.assigned_to}
                                    </div>
                                )}
                                {selectedTask.recurring && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-200 bg-white/5 px-3 py-2 rounded-xl w-fit">
                                        <Clock size={14} className="text-[#FF8C9D]" /> {selectedTask.periodicity}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4 border-t border-white/10 pt-6">
                            <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Instrucciones</label>
                            <div className="bg-white/5 p-6 rounded-[32px] min-h-[80px] text-xs font-bold leading-relaxed text-blue-100 whitespace-pre-wrap">
                                {selectedTask.description || <span className="italic opacity-30">Sin instrucciones especiales...</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <button onClick={() => toggleStatus(selectedTask)} className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${selectedTask.status === 'Hecha' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white text-[#1A365D]'}`}>
                                <Check size={16}/> {selectedTask.status === 'Hecha' ? 'COMPLETADA' : 'COMPLETAR'}
                            </button>
                            <button onClick={() => { if(!selectedTask.isVirtual) { onEdit(selectedTask); setSelectedTask(null); } else { alert('Edita la tarea principal de la serie.'); } }} className={`py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase ${selectedTask.isVirtual ? 'opacity-30' : ''}`}>EDITAR</button>
                        </div>
                    </div>
                )}

                <div className="bg-white/40 backdrop-blur-sm p-8 rounded-[40px] border border-white shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-[#1A365D] uppercase tracking-[0.3em]">Baterías Activas</h4>
                        <Layers size={16} className="text-[#FF8C9D] animate-pulse" />
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <BatteriesView 
                            batteries={batteries} 
                            hideHeader 
                            isCompact 
                            onCheck={onCheckBattery} 
                            onDelete={onDeleteBattery} 
                        />
                    </div>
                </div>
            </div>
            <AccountStatusWidget partners={partners} />
        </div>
    );
};

const GoldsmithInventoryPanel = ({ inventory }) => {
    return (
        <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
            <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest mb-6 flex items-center gap-2">
                Matriz de Agrupaciones (Inventario Real) <Layers size={16} className="text-[#FF8C9D]"/>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inventory.map(item => {
                    const avgCost = item.total_weight > 0 ? item.total_cost / item.total_weight : 0;
                    const isLow = Number(item.total_weight) < Number(item.restock_threshold);
                    return (
                        <div key={item.id} className={`p-5 rounded-[32px] border-2 transition-all ${isLow ? 'bg-orange-50 border-orange-200' : 'bg-[#F8F9FB] border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter">{item.category}</p>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#CCC' }} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black text-[#1A365D]">{Number(item.total_weight).toFixed(2)} gr</p>
                                <div className="flex flex-col gap-0.5 mt-2">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Coste: {formatPrice(item.total_cost)}€</span>
                                    <span className="text-[8px] font-black text-[#1A365D] uppercase bg-blue-50 px-2 py-0.5 rounded-md w-fit">{avgCost.toFixed(2)}€/g</span>
                                </div>
                            </div>
                            {isLow && <p className="text-[7px] font-black text-orange-600 uppercase mt-2 flex items-center gap-1"><AlertCircle size={8}/> REPOSICIÓN</p>}
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

const JewelryView = ({ inventory, orders, partners, movements, onAddPartner, onEditPartner, onDeletePartner, onAddMovement, onDeleteMovement, onRefine, onAddOrder, onReceiveOrder }) => {
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
                        <GoldsmithInventoryPanel inventory={safeInventory} />
                        
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
                <JewelryReport movements={safeMovements} partners={safePartners} />
            )}
        </div>
    );
};

const JewelryReport = ({ movements, partners }) => {
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
            if (m.type === 'Envío') res.totalWeight += Number(m.weight || 0);
            else if (m.type === 'Fundición' && m.status === 'Completado') {
                const cost = Number(m.acquisition_cost || 0);
                const received = Number(m.received_amount || 0);
                res.totalCost += cost;
                res.receivedVal += received;
                res.benefit += (received - cost);
            }
        });
        return res;
    }, [filteredMovements]);

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
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black ${m.type === 'Envío' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
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

const CashView = ({ history, onSave, employees, user }) => {
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
        is_closed: false
    });

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
            closed_by: user.username
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4 w-full md:w-auto">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase">Conteo de Caja</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registro diario de fondos y descuadres</p>
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
                    {diff !== 0 && (
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${diff > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {diff > 0 ? 'Sobra dinero' : 'Falta dinero'}
                        </span>
                    )}
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
                                Guardar Borrador
                            </button>
                            <button 
                                onClick={() => handleSave(true)} 
                                className="flex-1 bg-[#1A365D] text-white py-5 rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Cerrar y Firmar Caja
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
        </div>
    );
};

// --- FORMS ---

const TaskForm = ({ initialData, employees, onSave, onCancel, onDelete }) => {
    const [data, setData] = useState(initialData || { 
        title: '', 
        date: format(new Date(), 'yyyy-MM-dd'), 
        time: '09:00',
        priority: 'Media', 
        periodicity: 'Manual', 
        recurring: false, 
        assigned_to: '', 
        description: '',
        category: 'General',
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
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Categoría</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.category} 
                            onChange={e => setData({...data, category: e.target.value})}
                        >
                            <option value="General">General</option>
                            <option value="Limpieza">Limpieza</option>
                            <option value="Inventario">Inventario</option>
                            <option value="Joyería / Finanzas">Joyería / Finanzas</option>
                            <option value="Administración">Administración</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Prioridad</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.priority} 
                            onChange={e => setData({...data, priority: e.target.value})}
                        >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
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

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ id: initialData?.id, name, contact_info: info, phone, email, debt_type: debtType, debt_formula: debtFormula }); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nombre Comercial / Profesional</label><input type="text" required className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-[#1A365D]" value={name} onChange={setName ? (e => setName(e.target.value)) : undefined} /></div>
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
                    <label className="text-[10px] font-black text-blue-400 uppercase block mb-2">Coste Total de la Operativa (€)</label>
                    <input type="number" step="0.01" required className="w-full bg-white border-2 border-transparent focus:border-blue-300 rounded-xl p-4 font-black text-blue-900" placeholder="Ej: 4500.00" value={data.total_cost} onChange={e => setData({...data, total_cost: e.target.value})}/>
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
            
            <button type="submit" disabled={uploading} className="w-full py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50">PROCESAR MOVIMIENTO</button>
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


const BatteriesView = ({ batteries, onAdd, onCheck, onDelete, hideHeader, isCompact }) => {
    const safeBatteries = Array.isArray(batteries) ? batteries : [];

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
                    <button 
                        onClick={onAdd} 
                        className="bg-[#1A365D] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> NUEVA BATERÍA
                    </button>
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
                                                    <button onClick={() => onDelete(b.id)} className="p-2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter mb-2">{b.title}</h3>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full">
                                                    <CalendarIcon size={12} className="text-[#FF8C9D]"/>
                                                    {format(parseISO(b.start_date), 'dd/MM')} — {format(parseISO(b.end_date), 'dd/MM')}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-8 space-y-4 flex-1 bg-slate-50/30">
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
                                                    <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl group/item shadow-sm border border-transparent hover:border-blue-100 transition-all">
                                                        <div className="flex items-center gap-4 overflow-hidden">
                                                            <button 
                                                                onClick={() => onCheck(item)}
                                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${item.is_done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-transparent hover:border-blue-400'}`}
                                                            >
                                                                <Check size={14} strokeWidth={4}/>
                                                            </button>
                                                            <div className="min-w-0">
                                                                <p className={`text-xs font-bold uppercase truncate transition-all ${item.is_done ? 'text-slate-300 line-through' : 'text-[#1A365D]'}`}>{item.description}</p>
                                                                {item.is_done && (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[8px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase">
                                                                            <CheckCircle2 size={8}/> {item.completed_by}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-tighter truncate pr-4">{b.title}</h3>
                                            <span className="text-[9px] font-black text-[#FF8C9D] bg-coral-50 px-2 py-0.5 rounded-lg whitespace-nowrap">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1A365D] transition-all duration-700" style={{ width: `${progress}%` }} />
                                        </div>
                                        <div className="space-y-2">
                                            {(b.items || []).map(item => (
                                                <button 
                                                    key={item.id} 
                                                    onClick={() => onCheck(item)}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group/it"
                                                >
                                                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${item.is_done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200'}`}>
                                                        {item.is_done && <Check size={10} strokeWidth={4}/>}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase truncate ${item.is_done ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{item.description}</span>
                                                </button>
                                            ))}
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

const BatteryForm = ({ onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [items, setItems] = useState(['', '', '']);

    const handleItemChange = (idx, val) => {
        const ni = [...items];
        ni[idx] = val;
        setItems(ni);
    };

    const addItem = () => setItems([...items, '']);
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

    return (
        <form onSubmit={(e) => { 
            e.preventDefault(); 
            const filteredItems = items.filter(i => i.trim() !== '');
            if (filteredItems.length === 0) return alert('Debes añadir al menos una tarea.');
            onSave({ title, start_date: startDate, end_date: endDate, items: filteredItems });
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
                <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Lista de Tareas ({items.filter(i => i.trim()).length})</label>
                        <button type="button" onClick={addItem} className="text-[9px] font-black text-[#FF8C9D] bg-coral-50 hover:bg-coral-100 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">+ AÑADIR FILA</button>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
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
                </div>
            </div>
            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-5 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-5 bg-[#1A365D] text-white rounded-[32px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all">CREAR BATERÍA</button>
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
