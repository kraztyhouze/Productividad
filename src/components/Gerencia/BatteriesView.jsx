import React from 'react';
import { 
    Layers, 
    Edit3, 
    Trash2, 
    Calendar as CalendarIcon, 
    Clock, 
    Check, 
    Plus, 
    PlusCircle,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const BatteriesView = ({ 
    batteries, 
    onAdd, 
    onCheck, 
    onDelete, 
    onEdit, 
    onAddExtra, 
    onDeleteExtra, 
    onPostpone, 
    onMove,
    hideHeader, 
    isCompact, 
    activeZoneId,
    onDownloadWeeklyPDF 
}) => {
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
                            onClick={onDownloadWeeklyPDF}
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
                                                    <button onClick={() => onMove(b.id, 'up')} className="p-2 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"><ChevronUp size={16}/></button>
                                                    <button onClick={() => onMove(b.id, 'down')} className="p-2 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"><ChevronDown size={16}/></button>
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
                                                    onClick={() => onAddExtra(b.id)}
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
                                                <button onClick={() => onMove(b.id, 'up')} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><ChevronUp size={12}/></button>
                                                <button onClick={() => onMove(b.id, 'down')} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><ChevronDown size={12}/></button>
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
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => onCheck(item)}
                                                        className={`w-5 h-5 rounded-full border-2 transition-all shrink-0 flex items-center justify-center ${item.is_done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200'}`}
                                                    >
                                                        {item.is_done && <Check size={10} strokeWidth={4}/>}
                                                    </button>
                                                    <span className={`text-[10px] font-bold uppercase truncate flex-1 ${item.is_done ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{item.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => onAddExtra(b.id)}
                                            className="w-full mt-2 p-2 border border-dashed border-slate-100 rounded-xl text-[8px] font-black text-slate-400 uppercase hover:border-blue-200 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                                        >
                                            <PlusCircle size={10}/> Tarea Extra
                                        </button>
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

export default BatteriesView;
