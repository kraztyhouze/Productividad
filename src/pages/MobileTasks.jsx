import React, { useState, useMemo } from 'react';
import { 
    Layers, 
    Check, 
    ChevronRight, 
    Smartphone, 
    User, 
    Calendar,
    ArrowLeft,
    Box,
    CheckCircle2,
    Clock,
    Zap,
    AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useGerencia } from '../hooks/useGerencia';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MobileTasks = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const navigate = useNavigate();
    const data = useGerencia();

    const [selectedBattery, setSelectedBattery] = useState(null);
    const [selectedZone, setSelectedZone] = useState('all');

    const filteredZones = useMemo(() => {
        return data.zones || [];
    }, [data.zones]);

    const activeBatteries = useMemo(() => {
        let filtered = (data.batteries || []).filter(b => {
             const endDate = parseISO(b.end_date);
             // Show active or recently expired
             return true; 
        });

        if (selectedZone !== 'all') {
            filtered = filtered.filter(b => b.zone_id == selectedZone);
        }

        return filtered.sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [data.batteries, selectedZone]);

    const handleCheckItem = async (itemId, currentStatus) => {
        try {
            const res = await fetch(`/api/task-batteries/items/${itemId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-store-id': currentStore
                },
                body: JSON.stringify({ 
                    is_done: !currentStatus, 
                    completed_by: user?.nombre || user?.username || 'Anónimo'
                })
            });
            if (res.ok) {
                data.refresh();
                // If it was the last item in a battery, maybe some feedback?
            }
        } catch (e) {
            console.error(e);
        }
    };

    const stats = useMemo(() => {
        let total = 0;
        let done = 0;
        activeBatteries.forEach(b => {
            (b.items || []).forEach(i => {
                total++;
                if (i.is_done) done++;
            });
        });
        return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
    }, [activeBatteries]);

    if (data.loading && !data.isRefreshing) {
        return (
            <div className="min-h-screen bg-[#1A365D] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Zap size={48} className="text-[#FF8C9D] animate-pulse" />
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Cargando Tareas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-24 font-sans text-[#1A365D]">
            {/* STICKY HEADER */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black tracking-tighter uppercase">Consola Tareas</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        <User size={12} className="text-blue-500" />
                        <span className="text-[9px] font-black uppercase text-blue-600 truncate max-w-[80px]">{user?.nombre || 'USER'}</span>
                    </div>
                </div>

                {/* ZONE SELECTOR (CHIPS) */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
                    <button 
                        onClick={() => setSelectedZone('all')}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedZone === 'all' ? 'bg-[#1A365D] text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                    >
                        TODOS
                    </button>
                    {filteredZones.map(z => (
                        <button 
                            key={z.id}
                            onClick={() => setSelectedZone(z.id)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedZone == z.id ? 'bg-[#1A365D] text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                        >
                            {z.name}
                        </button>
                    ))}
                </div>
            </header>

            {/* PROGRESS SUMMARY */}
            <div className="p-6">
                <div className="bg-[#1A365D] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/40">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Estado Operativa</p>
                            <h2 className="text-4xl font-black tracking-tighter">{stats.percent}%</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Completadas</p>
                            <h2 className="text-2xl font-black tracking-tighter tabular-nums">{stats.done}<span className="text-sm opacity-30 mx-1">/</span>{stats.total}</h2>
                        </div>
                    </div>
                    <div className="mt-8 h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#FF8C9D] to-rose-400"
                        />
                    </div>
                    <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
                </div>
            </div>

            {/* BATTERIES LIST */}
            <div className="px-6 space-y-6">
                {activeBatteries.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                         <Box size={40} className="mb-4" />
                         <p className="text-xs font-black uppercase tracking-widest">No hay baterías activas</p>
                    </div>
                ) : (
                    activeBatteries.map(b => {
                        const bTotal = b.items?.length || 0;
                        const bDone = (b.items || []).filter(i => i.is_done).length;
                        const bPercent = bTotal > 0 ? Math.round((bDone / bTotal) * 100) : 0;
                        const isExpanded = selectedBattery === b.id;

                        return (
                            <div 
                                key={b.id} 
                                className={`bg-white rounded-[40px] border border-slate-100 shadow-sm transition-all ${isExpanded ? 'ring-2 ring-[#FF8C9D]/30 border-[#FF8C9D]/20' : ''}`}
                            >
                                <div 
                                    className="p-8 flex items-center justify-between"
                                    onClick={() => setSelectedBattery(isExpanded ? null : b.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">{b.zone_name || 'GNR'}</span>
                                            {bPercent === 100 && <CheckCircle2 size={12} className="text-green-500" />}
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tighter truncate leading-none text-[#1A365D]">{b.title}</h3>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase mt-2">{bDone} de {bTotal} completadas</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-50" />
                                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className={`${bPercent === 100 ? 'text-green-500' : 'text-[#FF8C9D]'} transition-all`} strokeDasharray={126} strokeDashoffset={126 - (126 * bPercent) / 100} />
                                            </svg>
                                            <span className="text-[9px] font-black">{bPercent}%</span>
                                        </div>
                                        <ChevronRight size={20} className={`text-slate-200 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-slate-50/50 rounded-b-[40px] px-4 pb-8"
                                        >
                                            <div className="space-y-3">
                                                {(b.items || []).map(item => (
                                                    <div 
                                                        key={item.id}
                                                        onClick={(e) => { e.stopPropagation(); handleCheckItem(item.id, item.is_done); }}
                                                        className={`flex items-center gap-4 p-5 rounded-[28px] transition-all border ${item.is_done ? 'bg-green-50 border-green-100 text-green-700 shadow-inner' : 'bg-white border-white shadow-sm ring-1 ring-slate-100 active:scale-95'}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${item.is_done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200'}`}>
                                                            {item.is_done && <Check size={18} strokeWidth={4} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[13px] font-black uppercase tracking-tight leading-none ${item.is_done ? 'opacity-40 line-through' : ''}`}>
                                                                {item.description}
                                                            </p>
                                                            {item.is_done && item.completed_by && (
                                                                <p className="text-[8px] font-black uppercase opacity-60 mt-1 italic">Visto por {item.completed_by}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* SYNC INDICATOR */}
            {data.isRefreshing && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#FF8C9D] rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actualizando...</span>
                </div>
            )}
        </div>
    );
};

export default MobileTasks;
