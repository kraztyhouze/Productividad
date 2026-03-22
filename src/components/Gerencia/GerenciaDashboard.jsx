import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Pocket, 
    Calculator, 
    Zap, 
    Users, 
    Activity, 
    Award, 
    Euro, 
    PlusCircle, 
    ShieldAlert, 
    Plus, 
    ChevronRight, 
    X,
    FileText,
    Layers,
    Smartphone,
    QrCode
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProductivity } from '../../context/ProductivityContext';
import { 
    ProductivityTrendChart, 
    SalesMixChart 
} from './Charts';

const GlassCard = ({ title, icon: Icon, description, children, action, className = "" }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className={`bg-white/70 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-xl shadow-slate-200/50 flex flex-col group transition-all ${className}`}
    >
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest leading-none">{title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{description}</p>
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div>{children}</div>
    </motion.div>
);

const GerenciaDashboard = ({ tasks, batteries, partners, movements, cashHistory, inventory, orders, cumulativeCashDiff, employees, auditAlerts, meetingSchedules, activeZoneId, onXPBonus, onTabSwitch }) => {
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

        return [...(employees || [])]
            .filter(emp => emp.isBuyer)
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
            (employees || []).filter(emp => emp.isBuyer).forEach(emp => {
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
        return (employees || [])
            .filter(emp => emp.isBuyer)
            .map(emp => {
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

    // --- restored 6. MEETING REMINDERS ---
    const meetingStats = useMemo(() => {
        const active = (meetingSchedules || []).filter(s => s.status === 'Pendiente');
        const done = (meetingSchedules || []).filter(s => s.status === 'Completado').length;
        const total = (meetingSchedules || []).length;
        const next = active.length > 0 ? active.sort((a,b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0] : null;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        return { progress, total, next, done };
    }, [meetingSchedules]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* KPI OVERVIEW GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard title="Joyería en Tránsito" icon={Pocket} description="Pedidos lanzados no recibidos" 
                    action={<div className="flex items-center gap-1 text-[10px] bg-blue-100/50 text-blue-600 px-2 py-1 rounded-full"><Plus size={10}/> {orders.filter(o => o.status !== 'Recibido').length} Pedidos</div>}>
                    <div className="mt-2 text-3xl font-black text-slate-800 tracking-tighter">
                        {orders.filter(o => o.status !== 'Recibido').reduce((acc, o) => acc + Number(o.est_weight || 0), 0).toFixed(1)}g
                    </div>
                </GlassCard>

                <GlassCard title="Control de Caja" icon={Calculator} description="Diferencia acumulada anual"
                    action={<div onClick={() => onTabSwitch('cash')} className="flex items-center gap-1 text-[10px] bg-green-100/50 text-green-600 px-2 py-1 rounded-full cursor-pointer"><ChevronRight size={10}/> Ver Más</div>}>
                    <div className="mt-2 text-3xl font-black text-slate-800 tracking-tighter">
                        {cumulativeCashDiff > 0 ? '+' : ''}{Number(cumulativeCashDiff || 0).toFixed(2)}€
                    </div>
                </GlassCard>

                <GlassCard title="Progreso Baterías" icon={Zap} description="Cumplimiento de objetivos"
                    action={<div onClick={() => onTabSwitch('tasks')} className="flex items-center gap-1 text-[10px] bg-pink-100/50 text-pink-600 px-2 py-1 rounded-full cursor-pointer"><ChevronRight size={10}/> Ver Más</div>}>
                    <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${batteryStats.progress || 0}%` }} className="h-full bg-gradient-to-r from-pink-400 to-rose-500" />
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase">{batteryStats.active}/{batteryStats.total} Completas</div>
                </GlassCard>

                <GlassCard title="Reuniones 1:1" icon={Users} description="Ciclo de evaluación"
                    action={<div onClick={() => onTabSwitch('meetings')} className="flex items-center gap-1 text-[10px] bg-indigo-100/50 text-indigo-600 px-2 py-1 rounded-full cursor-pointer"><ChevronRight size={10}/> Ver Más</div>}>
                    <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${meetingStats.progress || 0}%` }} className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600" />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                        <span>{meetingStats.done}/{meetingStats.total} Completas</span>
                        {meetingStats.next && <span className="text-indigo-500">Prox: {format(parseISO(meetingStats.next.scheduled_date), 'dd/MM')}</span>}
                    </div>
                </GlassCard>

                <GlassCard title="Consola Móvil" icon={Smartphone} description="Acceso a tareas desde smartphone"
                    action={<div onClick={() => window.open('/mobile/tasks', '_blank')} className="flex items-center gap-1 text-[10px] bg-slate-100 text-[#1A365D] px-2 py-1 rounded-full cursor-pointer hover:bg-[#1A365D] hover:text-white transition-all"><QrCode size={10}/> Abrir</div>}>
                    <div className="mt-4 flex flex-col items-center justify-center py-2">
                        <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center gap-2 group hover:border-[#FF8C9D]/30 transition-all cursor-pointer" onClick={() => window.open('/mobile/tasks', '_blank')}>
                            <QrCode size={48} className="text-slate-200 group-hover:text-[#FF8C9D] transition-colors" />
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] group-hover:text-[#FF8C9D]">ESCANEAR PARA MÓVIL</span>
                        </div>
                    </div>
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
                        <div className="space-y-6 mt-6 flex-1">
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
                                        <div className="text-[9px] font-black text-pink-500 uppercase">Gramos</div>
                                    </div>
                                </div>
                            ))}
                            {prodRanking.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-300 text-xs italic">
                                    <Award size={24} className="mb-2 opacity-20" />
                                    Sin datos esta semana
                                </div>
                            )}
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
                        <div className="mt-4 flex flex-col items-center justify-center py-6 text-[#1A365D]">
                            <span className="text-4xl font-black tracking-tighter">{(totalDebt || 0).toFixed(2)}<span className="text-sm ml-1">gr</span></span>
                            <div className="mt-3 px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">Pendiente de regular</div>
                        </div>
                    </GlassCard>
                </div>

                <div className="xl:col-span-3">
                    <GlassCard title="Acciones Rápidas" icon={PlusCircle} description="Accesos directos de gestión">
                        <div className="grid grid-cols-1 gap-3 mt-2">
                            <button onClick={() => onTabSwitch('cash')} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all font-bold text-xs uppercase tracking-tight">
                                <ShieldAlert size={16}/> Revisar Auditoría
                            </button>
                            <button onClick={onXPBonus} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-all font-bold text-xs uppercase tracking-tight">
                                <Zap size={16}/> Bono XP Manual
                            </button>
                            <button onClick={() => onTabSwitch('reports')} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 transition-all font-bold text-xs uppercase tracking-tight">
                                <FileText size={16}/> Informes PDF
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>
            
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
                                        <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Todas las Alertas</h3>
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
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Comprador</div>
                                                </div>
                                            </div>
                                            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-rose-50 flex flex-col items-center">
                                                <span className="text-xl font-black text-rose-500">{a.count}</span>
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Alertas</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {buyingAlerts.length === 0 && <p className="text-center text-slate-300 uppercase italic py-20 font-black text-xs">Sin alertas</p>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GerenciaDashboard;
