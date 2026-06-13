import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Lock, 
    UserCheck, 
    PlusCircle, 
    Layers, 
    Clock, 
    Calendar as CalendarIcon, 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Check, 
    Save, 
    FileText, 
    Trash2,
    AlertTriangle,
    TrendingUp,
    Users,
    Timer
} from 'lucide-react';
import { format, parseISO, differenceInDays, differenceInCalendarMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import MeetingForm from './MeetingForm';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calcula el estado de seguimiento de un empleado respecto a sus reuniones.
 * @returns {{ status: 'done'|'warning'|'overdue'|'never', label: string, daysAgo: number|null, lastDate: Date|null }}
 */
function getMeetingStatus(lastMeeting) {
    if (!lastMeeting) {
        return { status: 'never', label: 'Sin reunión', daysAgo: null, lastDate: null };
    }

    const lastDate = parseISO(lastMeeting.date);
    const daysAgo = differenceInDays(new Date(), lastDate);
    const monthsAgo = differenceInCalendarMonths(new Date(), lastDate);

    if (monthsAgo === 0) {
        return { status: 'done', label: `Hace ${daysAgo === 0 ? 'hoy' : `${daysAgo}d`}`, daysAgo, lastDate };
    } else if (monthsAgo <= 2) {
        return { status: 'warning', label: `Hace ${daysAgo}d`, daysAgo, lastDate };
    } else {
        return { status: 'overdue', label: `Hace ${daysAgo}d`, daysAgo, lastDate };
    }
}

const STATUS_CONFIG = {
    done:    { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', border: 'border-emerald-100', icon: <Check size={12}/>, iconBg: 'bg-emerald-500 text-white', label: 'Al día' },
    warning: { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-600 border-amber-100', border: 'border-amber-100', icon: <Clock size={12}/>, iconBg: 'bg-amber-400 text-white', label: 'Atención' },
    overdue: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-600 border-rose-100', border: 'border-rose-100', icon: <AlertTriangle size={12}/>, iconBg: 'bg-rose-500 text-white', label: 'Urgente' },
    never:   { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-500 border-slate-100', border: 'border-slate-200', icon: <X size={12}/>, iconBg: 'bg-slate-400 text-white', label: 'Nunca' },
};

// ─── Component ─────────────────────────────────────────────────────────────────

const MeetingsView = ({ storeId, employees, user, schedules, onSchedule, onManageCriteria, onDeleteSchedule, meetings }) => {
    const [selectedInterviewer, setSelectedInterviewer] = useState(user?.nombre || 'Gerente');
    const [trackingFilter, setTrackingFilter] = useState('all'); // 'all' | 'done' | 'pending'

    const safeEmployees = Array.isArray(employees) ? employees : [];
    const activeEmployees = useMemo(() => safeEmployees.filter(e => e.has11Meetings !== false), [safeEmployees]);
    const safeHistory = Array.isArray(meetings.history) ? meetings.history : [];
    const safeSchedules = Array.isArray(schedules) ? schedules : [];

    // ─── Calcular estado de cada empleado ─────────────────────────────────────
    const employeeStatusMap = useMemo(() => {
        const map = {};
        for (const emp of activeEmployees) {
            // Buscar la reunión más reciente de este empleado
            const empMeetings = safeHistory
                .filter(h => String(h.employee_id) === String(emp.id))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastMeeting = empMeetings[0] || null;
            map[emp.id] = getMeetingStatus(lastMeeting);
        }
        return map;
    }, [activeEmployees, safeHistory]);

    // ─── Estadísticas del equipo ───────────────────────────────────────────────
    const teamStats = useMemo(() => {
        const total = activeEmployees.length;
        const done = activeEmployees.filter(e => employeeStatusMap[e.id]?.status === 'done').length;
        const warning = activeEmployees.filter(e => employeeStatusMap[e.id]?.status === 'warning').length;
        const overdue = activeEmployees.filter(e => ['overdue', 'never'].includes(employeeStatusMap[e.id]?.status)).length;
        
        // Empleados más urgentes (ordenados por días sin reunión, los de 'never' van al final con 9999)
        const urgentList = [...activeEmployees]
            .map(e => ({ emp: e, info: employeeStatusMap[e.id] }))
            .filter(({ info }) => info.status !== 'done')
            .sort((a, b) => {
                const dA = a.info.daysAgo ?? 9999;
                const dB = b.info.daysAgo ?? 9999;
                return dB - dA; // más días = más urgente
            })
            .slice(0, 5);

        return { total, done, warning, overdue, urgentList, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
    }, [activeEmployees, employeeStatusMap]);

    // ─── Filtro de empleados ───────────────────────────────────────────────────
    const filteredEmployees = useMemo(() => {
        if (trackingFilter === 'all') return activeEmployees;
        if (trackingFilter === 'done') return activeEmployees.filter(e => employeeStatusMap[e.id]?.status === 'done');
        if (trackingFilter === 'pending') return activeEmployees.filter(e => employeeStatusMap[e.id]?.status !== 'done');
        return activeEmployees;
    }, [activeEmployees, employeeStatusMap, trackingFilter]);

    // ─── Vista de formulario de reunión ───────────────────────────────────────
    if (meetings.selectedEmployee) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => meetings.setSelectedEmployee(null)}
                        className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] hover:text-[#1A365D] transition-colors"
                    >
                        <ChevronLeft size={16}/> Volver al Organizador
                    </button>
                    {meetings.isSaving ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full animate-pulse">
                            <Save size={12}/> Autoguardando...
                        </div>
                    ) : meetings.lastSaved && (
                        <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-2">
                             <Check size={12}/> Guardado {format(meetings.lastSaved, 'HH:mm:ss')}
                        </div>
                    )}
                </div>
                <MeetingForm 
                    employee={meetings.selectedEmployee} 
                    interviewer={{ id: user.id || 'gerente', name: selectedInterviewer, role: user.role }}
                    onFinish={async () => {
                        const success = await meetings.finishMeeting(meetings.selectedEmployee.id);
                        if (success) meetings.refresh();
                    }} 
                />
            </motion.div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white flex flex-col lg:flex-row justify-between items-start gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Lock size={10} className="fill-indigo-600"/> Blindaje Criptográfico Activo
                        </span>
                        <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase">Organizador <span className="text-indigo-500">1:1</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Evaluación de talento con persistencia segura AES-256</p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Interviewer Selector */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 flex items-center gap-3 pr-4 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white"><UserCheck size={20}/></div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Entrevistador actual</p>
                            <input 
                                className="bg-transparent border-none p-0 text-xs font-black text-[#1A365D] outline-none" 
                                value={selectedInterviewer}
                                onChange={e => setSelectedInterviewer(e.target.value)}
                                placeholder="Escribe tu nombre..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onManageCriteria} className="bg-white px-5 py-3 rounded-2xl border border-slate-100 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-500 transition-all flex items-center gap-2 shadow-sm">
                            <Layers size={14}/> Criterios
                        </button>
                        <button onClick={onSchedule} className="bg-[#1A365D] px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                            <PlusCircle size={14}/> Programar
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                {/* ─── Sidebar Izquierdo ──────────────────────────────────────── */}
                <div className="xl:col-span-1 space-y-6">

                    {/* Panel de Progreso Mensual */}
                    <div className="bg-[#1A365D] p-6 rounded-[32px] text-white">
                        <div className="flex items-center gap-2 mb-5">
                            <TrendingUp size={16} className="text-indigo-300"/>
                            <h3 className="text-xs font-black uppercase tracking-widest">Progreso Mensual</h3>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[9px] font-bold text-indigo-300 uppercase">Completadas este mes</span>
                                <span className="text-2xl font-black text-white">{teamStats.done}<span className="text-sm text-indigo-300">/{teamStats.total}</span></span>
                            </div>
                            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${teamStats.progress}%` }}
                                />
                            </div>
                            <div className="text-right text-[9px] font-black text-emerald-400 mt-1">{teamStats.progress}%</div>
                        </div>

                        {/* Contador de estados */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-emerald-500/20 rounded-2xl p-3 text-center border border-emerald-400/20">
                                <div className="text-xl font-black text-emerald-400">{teamStats.done}</div>
                                <div className="text-[8px] font-bold text-emerald-300/70 uppercase">Al día</div>
                            </div>
                            <div className="bg-amber-500/20 rounded-2xl p-3 text-center border border-amber-400/20">
                                <div className="text-xl font-black text-amber-400">{teamStats.warning}</div>
                                <div className="text-[8px] font-bold text-amber-300/70 uppercase">Atención</div>
                            </div>
                            <div className="bg-rose-500/20 rounded-2xl p-3 text-center border border-rose-400/20">
                                <div className="text-xl font-black text-rose-400">{teamStats.overdue}</div>
                                <div className="text-[8px] font-bold text-rose-300/70 uppercase">Urgente</div>
                            </div>
                        </div>
                    </div>

                    {/* Más Urgentes */}
                    {teamStats.urgentList.length > 0 && (
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-rose-500"/> Más Urgentes
                            </h3>
                            <div className="space-y-3">
                                {teamStats.urgentList.map(({ emp, info }) => {
                                    const cfg = STATUS_CONFIG[info.status];
                                    return (
                                        <div key={emp.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => meetings.setSelectedEmployee(emp)}>
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${cfg.iconBg}`}>
                                                {(emp.nombre || emp.firstName || 'E').charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-[#1A365D] truncate group-hover:text-indigo-500 transition-colors">
                                                    {emp.nombre || `${emp.firstName} ${emp.lastName}` || 'Empleado'}
                                                </p>
                                                <p className={`text-[9px] font-bold ${cfg.badge.split(' ')[1]}`}>
                                                    {info.status === 'never' ? 'Sin reunión registrada' : info.label}
                                                </p>
                                            </div>
                                            <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0"/>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Próximas Citas */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Clock size={14} className="text-indigo-500"/> Próximas Citas
                        </h3>
                        <div className="space-y-3">
                            {safeSchedules.filter(s => s.status === 'Pendiente').length === 0 && (
                                <div className="text-center p-6 border border-dashed border-slate-200 rounded-3xl">
                                    <CalendarIcon className="mx-auto w-7 h-7 text-slate-200 mb-2"/>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase italic">Sin citas programadas</p>
                                </div>
                            )}
                            {safeSchedules.filter(s => s.status === 'Pendiente').map(s => {
                                const emp = safeEmployees.find(e => String(e.id) === String(s.employee_id));
                                return (
                                    <div key={s.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-indigo-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-black text-[#1A365D] truncate pr-2">{emp?.nombre || emp?.firstName || 'Empleado'}</span>
                                            <button onClick={() => onDeleteSchedule(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                                                <X size={12}/>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500">
                                            <CalendarIcon size={10}/>
                                            {format(parseISO(s.scheduled_date), 'dd MMM, HH:mm', { locale: es })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ─── Grid de Empleados ─────────────────────────────────────── */}
                <div className="xl:col-span-3">
                    {/* Filtros */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {[
                            { key: 'all', label: `Todos (${activeEmployees.length})` },
                            { key: 'pending', label: `Pendientes (${activeEmployees.length - teamStats.done})` },
                            { key: 'done', label: `Al día (${teamStats.done})` },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setTrackingFilter(f.key)}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${
                                    trackingFilter === f.key 
                                        ? 'bg-[#1A365D] text-white shadow-md' 
                                        : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200 hover:text-indigo-500'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map(emp => {
                            const info = employeeStatusMap[emp.id];
                            const cfg = STATUS_CONFIG[info.status];
                            const nextSched = safeSchedules.find(s => String(s.employee_id) === String(emp.id) && s.status === 'Pendiente');

                            return (
                                <div 
                                    key={emp.id} 
                                    className={`bg-white p-7 rounded-[36px] border-2 transition-all group flex flex-col justify-between hover:shadow-xl ${cfg.border}`}
                                >
                                    {/* Header de la tarjeta */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 ${cfg.iconBg}`}>
                                                {(emp.nombre || emp.firstName || 'E').charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-black text-[#1A365D] uppercase leading-tight truncate">
                                                    {emp.nombre || `${emp.firstName} ${emp.lastName}` || 'Empleado'}
                                                </h3>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{emp.role}</p>
                                            </div>
                                        </div>
                                        {/* Badge de estado */}
                                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase border flex-shrink-0 ${cfg.badge}`}>
                                            {cfg.icon}
                                            {cfg.label}
                                        </span>
                                    </div>

                                    {/* Info de seguimiento */}
                                    <div className="space-y-3 mb-4">
                                        {/* Última reunión */}
                                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">Última reunión</span>
                                                {info.lastDate && (
                                                    <span className="text-[9px] font-black text-slate-500">
                                                        {format(info.lastDate, 'dd MMM yyyy', { locale: es })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}/>
                                                <p className={`text-xs font-black ${
                                                    info.status === 'done' ? 'text-emerald-600' :
                                                    info.status === 'warning' ? 'text-amber-600' :
                                                    info.status === 'overdue' ? 'text-rose-600' :
                                                    'text-slate-400'
                                                }`}>
                                                    {info.status === 'never' 
                                                        ? 'Sin reuniones registradas'
                                                        : info.status === 'done'
                                                        ? `${info.daysAgo === 0 ? 'Hoy mismo' : `Hace ${info.daysAgo} días`}`
                                                        : `Hace ${info.daysAgo} días — necesita atención`
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Próxima cita */}
                                        {nextSched && (
                                            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-2">
                                                <CalendarIcon size={12} className="text-indigo-500 flex-shrink-0"/>
                                                <span className="text-[10px] font-black text-indigo-600">
                                                    Cita: {format(parseISO(nextSched.scheduled_date), "dd MMM 'a las' HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón de acción */}
                                    <button 
                                        onClick={() => meetings.setSelectedEmployee(emp)}
                                        className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${
                                            info.status === 'done' 
                                                ? 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100' 
                                                : 'bg-[#1A365D] text-white hover:bg-indigo-600 shadow-lg shadow-indigo-100'
                                        }`}
                                    >
                                        {info.status === 'done' ? 'Revisar' : 'Iniciar Reunión'}
                                        <ChevronRight size={14}/>
                                    </button>
                                </div>
                            );
                        })}

                        {filteredEmployees.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                <Users className="w-12 h-12 text-slate-200 mb-4"/>
                                <p className="text-sm font-black text-slate-400 uppercase">Sin empleados en esta categoría</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingsView;
