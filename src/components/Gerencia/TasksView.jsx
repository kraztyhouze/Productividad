import React, { useState } from 'react';
import { 
    Layers, 
    Calendar as CalendarIcon, 
    List, 
    Plus, 
    CheckCircle2, 
    ChevronRight, 
    X,
    Clock,
    Layout,
    ShieldAlert,
    Swords
} from 'lucide-react';
import { 
    format, 
    parseISO, 
    isSameDay, 
    isSameMonth, 
    isToday, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';
import BatteriesView from './BatteriesView';
import MiniCalendar from './MiniCalendar';
import UpcomingTimeline from './UpcomingTimeline';
import { projectTasksForHorizon } from '../../utils/dateUtils';
import WarRoomOrganizer from './WarRoomOrganizer';

const TasksView = ({ 
    tasks, 
    batteries, 
    onEdit, 
    onAdd, 
    onAddBattery, 
    onEditBattery, 
    onAddBatteryItem, 
    onDeleteBatteryItem, 
    onCheckBattery, 
    onDeleteBattery, 
    onPostponeBattery, 
    onCheckTask,
    onDeleteTask,
    onManageZones,
    onMoveBattery,
    zones, 
    activeZoneId,
    onDownloadWeeklyPDF
}) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const [month, setMonth] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);
    const [view, setView] = useState('batteries'); // 'batteries', 'calendar', 'list', 'organizer'

    const startDate = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const filteredTasks = safeTasks.filter(t => !activeZoneId || t.zone_id == activeZoneId);
    const displayTasks = filteredTasks.filter(t => t.type !== 'jewelry_alert');
    const allTasks = [...displayTasks, ...projectTasksForHorizon(displayTasks)];

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-10 items-start pb-10 px-0 sm:px-4">
            {/* PANEL CENTRAL (75%) */}
            <div className="flex-1 w-full lg:max-w-[calc(100%-360px)] space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="bg-white p-1 rounded-2xl border border-[#E5E7EB] shadow-sm flex gap-1">
                        {[
                            { id: 'batteries', label: 'Baterías', icon: Layers },
                            { id: 'calendar', label: 'Agenda', icon: CalendarIcon },
                            { id: 'list', label: 'Lista', icon: List },
                            { id: 'organizer', label: 'Organizador', icon: Swords }
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
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-10">
                        {(Array.isArray(zones) && zones.length > 0 ? zones : [{id: 'general', name: 'ZONA GENERAL'}]).map(zone => {
                            const zoneBatteries = (Array.isArray(batteries) ? batteries : []).filter(b => String(b.zone_id) === String(zone.id));
                            const zoneTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.zone_id == zone.id && t.status !== 'Hecha');
                            
                            let total = 0, done = 0;
                            zoneBatteries.forEach(b => { (b.items || []).forEach(i => { total++; if(i.is_done) done++; }); });
                            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                            return (
                                <div key={zone.id} className="bg-white rounded-[24px] lg:rounded-[48px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden hover:shadow-2xl lg:hover:translate-y-[-4px] transition-all duration-700">
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
                                                <h3 className="text-lg font-[900] text-[#1A365D] uppercase tracking-tighter leading-none">{zone.name || 'ZONA'}</h3>
                                                <div className="flex items-center gap-2 mt-2 opacity-40">
                                                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">{(zoneBatteries || []).length} Planes Activos</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => onAdd({ zone_id: zone.id })} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#FF8C9D] hover:border-[#FF8C9D] transition-all shadow-sm">
                                            <Plus size={20} />
                                        </button>
                                    </header>
                                    
                                    <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar bg-white">
                                        <BatteriesView 
                                            batteries={zoneBatteries} onEdit={onEditBattery} onAddExtra={onAddBatteryItem} onDeleteExtra={onDeleteBatteryItem} onCheck={onCheckBattery} onDelete={onDeleteBattery} onPostpone={onPostponeBattery}
                                            onMove={onMoveBattery}
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
                                         <button onClick={() => onAddBattery()} className="px-6 py-3 bg-white border border-slate-200 text-[#1A365D] rounded-2xl text-[10px] font-black uppercase shadow-sm hover:shadow-xl transition-all">Nuevo Despliegue</button>
                                    </footer>
                                </div>
                            );
                        })}

                        {/* SECCIÓN ESPECIAL PARA BATERÍAS HUÉRFANAS (SIN ZONA ASIGNADA) */}
                        {((Array.isArray(batteries) ? batteries : []).some(b => !b.zone_id || !zones.some(z => z.id == b.zone_id))) && (
                            <div className="bg-red-50 rounded-[48px] border-2 border-dashed border-red-200 flex flex-col overflow-hidden animate-pulse">
                                <header className="p-10 border-b border-red-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4 text-red-600">
                                        <ShieldAlert size={28} />
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tighter leading-none">Baterías sin Zona</h3>
                                            <p className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-60">Asigna estas baterías para que sean visibles en el panel</p>
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-red-600 opacity-30">!</div>
                                </header>
                                <div className="p-8 space-y-4">
                                    <BatteriesView 
                                        batteries={(Array.isArray(batteries) ? batteries : []).filter(b => !b.zone_id || !zones.some(z => z.id == b.zone_id))} 
                                        onEdit={onEditBattery} onAddExtra={onAddBatteryItem} onDeleteExtra={onDeleteBatteryItem} onCheck={onCheckBattery} onDelete={onDeleteBattery}
                                        hideHeader={true} isCompact={true}
                                    />
                                </div>
                            </div>
                        )}
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

                {view === 'organizer' && (
                    <WarRoomOrganizer 
                        tasks={tasks}
                        batteries={batteries}
                        date={format(month, 'yyyy-MM-dd')}
                        currentStore={localStorage.getItem('tiktak_current_store')}
                    />
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
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t.date ? (t.date.includes('-') ? format(parseISO(t.date), "EEEE d MMM", { locale: es }) : t.date) : 'POR DEFINIR'}</span>
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
                                            {selectedTask.date ? (selectedTask.date.includes('-') ? format(parseISO(selectedTask.date), "EEEE d MMMM yyyy", { locale: es }).toUpperCase() : selectedTask.date) : 'PENDIENTE'}
                                        </div>
                                    </div>
                                    <div className="space-y-6 bg-white/5 p-10 rounded-[56px] border border-white/5 backdrop-blur-sm">
                                        <label className="text-[11px] font-black text-blue-300 uppercase tracking-[0.4em]">Especificaciones de Tarea</label>
                                        <p className="text-lg font-medium leading-relaxed opacity-90 whitespace-pre-wrap tracking-tight">{selectedTask.description || 'No hay descripción detallada.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5 pt-4">
                                        <button onClick={() => onCheckTask(selectedTask)} className={`py-7 rounded-[40px] font-black text-[12px] uppercase tracking-widest transition-all ${selectedTask.status === 'Hecha' ? 'bg-green-500 text-white shadow-2xl shadow-green-500/40' : 'bg-white text-[#1A365D] shadow-2xl shadow-black/20'}`}>{selectedTask.status === 'Hecha' ? 'Cerrar' : 'Confirmar'}</button>
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
            </aside>
        </div>
    );
};

export default TasksView;
