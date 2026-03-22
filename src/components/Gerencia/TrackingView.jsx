import React, { useState, useEffect, useMemo } from 'react';
import { 
    Activity, 
    Search, 
    Clock, 
    Users, 
    AlertCircle, 
    CheckCircle2,
    Calendar,
    ChevronDown,
    ArrowUpDown
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const GLASS_STYLE = "bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[32px]";

const TrackingView = ({ currentStore, employees = [] }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'daysAssigned', direction: 'desc' });

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const res = await fetch('/api/daily-organizer/tracking/summary', {
                    headers: { 'x-store-id': currentStore || localStorage.getItem('tiktak_current_store') }
                });
                const result = await res.json();
                setData(result);
            } catch (e) {
                console.error('Error loading tracking data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchTracking();
    }, [currentStore]);

    const sortedData = useMemo(() => {
        let items = [...data];
        if (searchTerm) {
            items = items.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        items.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return items;
    }, [data, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getStaffName = (id) => {
        const emp = (employees || []).find(e => String(e.id) === String(id));
        return emp ? (emp.alias || emp.firstName) : `Emp ${id}`;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Historial...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">Seguimiento de Tareas</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Control de cumplimiento y repetición</p>
                </div>
                
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                        type="text"
                        placeholder="Buscar tarea registrada..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* MAIN TABLE */}
            <div className={`${GLASS_STYLE} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th onClick={() => handleSort('title')} className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-500 transition-colors">
                                    <div className="flex items-center gap-2">Tarea <ArrowUpDown size={12}/></div>
                                </th>
                                <th onClick={() => handleSort('status')} className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-500 transition-colors">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Edad</th>
                                <th onClick={() => handleSort('daysAssigned')} className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-500 transition-colors text-center">
                                    <div className="flex items-center justify-center gap-2">Asignaciones <ArrowUpDown size={12}/></div>
                                </th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Personal</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Última Vez</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((task, idx) => {
                                const isDelayed = task.daysAssigned > 1 && task.status !== 'Hecha';
                                const createdDate = task.created_at ? parseISO(task.created_at) : null;
                                const ageDays = createdDate ? differenceInDays(new Date(), createdDate) : 0;
                                
                                return (
                                    <tr key={task.id} className={`border-b border-slate-50 group hover:bg-slate-50/50 transition-all ${isDelayed ? 'bg-amber-50/30' : ''}`}>
                                        <td className="p-6 min-w-[250px]">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{task.title}</span>
                                                    {task.type === 'battery' && (
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black rounded-md border border-indigo-100">PLAN</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase opacity-60">{task.category}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase w-fit flex items-center gap-2 ${task.status === 'Hecha' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                                                {task.status === 'Hecha' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                                {task.status}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-black ${ageDays > 7 ? 'text-red-500' : 'text-slate-600'}`}>{ageDays} <span className="text-[9px] opacity-40">DÍAS</span></span>
                                                <span className="text-[8px] font-bold text-slate-300 uppercase">En Sistema</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-lg font-black ${isDelayed ? 'text-amber-600' : 'text-slate-700'}`}>
                                                    {task.daysAssigned}
                                                </span>
                                                {isDelayed && (
                                                    <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1">
                                                        <AlertCircle size={8}/> Reincidente
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex -space-x-2">
                                                {task.assignedStaffIds.map(id => (
                                                    <div 
                                                        key={id} 
                                                        className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[10px] font-black text-white hover:z-10 transition-transform hover:scale-110 cursor-help"
                                                        title={getStaffName(id)}
                                                    >
                                                        {getStaffName(id).substring(0, 2).toUpperCase()}
                                                    </div>
                                                ))}
                                                {task.assignedStaffIds.length === 0 && (
                                                    <span className="text-[9px] text-slate-300 italic">Nunca</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase">
                                                    <Calendar size={12} className="text-indigo-400" />
                                                    {task.historyDates && task.historyDates[0] ? format(parseISO(task.historyDates[0]), "d 'de' MMM", { locale: es }) : 'N/A'}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase">Registro Org.</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {sortedData.length === 0 && (
                        <div className="p-20 text-center text-slate-300 flex flex-col items-center gap-4">
                            <Activity size={48} className="opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se han encontrado registros de seguimiento</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingView;
