import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Skull, Zap, Clock, ShieldAlert, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AnomalyPanel = ({ dailyStats, transactionLogs, employees, selectedDate, isManagerial }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [dismissedIds, setDismissedIds] = useState(new Set());

    const sessionAnomalies = useMemo(() => {
        const anomalies = [];
        transactionLogs.forEach(log => {
            const start = new Date(log.start_time);
            const end = log.end_time ? new Date(log.end_time) : new Date();
            const logDate = start.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
            if (logDate !== selectedDate) return;

            const durationMin = (end - start) / 60000;
            const empName = employees.find(e => String(e.id) === String(log.employee_id))?.alias || `Emp #${log.employee_id}`;
            const anomalyId = `${log.employee_id}-${log.start_time}-${log.type}`;

            if (durationMin > 90) {
                anomalies.push({
                    id: anomalyId, type: 'GHOST', severity: 'high',
                    text: `Sesión fantasma de ${empName} (${Math.round(durationMin)} min).`,
                    time: format(start, 'HH:mm')
                });
            }

            const isSales = ['standard', 'jewelry', 'recoverable'].includes(log.type);
            if (isSales && durationMin < 3) {
                anomalies.push({
                    id: anomalyId, type: 'FLASH', severity: 'medium',
                    text: `Venta ultrarrápida de ${empName} (< 3 min).`,
                    time: format(start, 'HH:mm')
                });
            }
        });
        return anomalies;
    }, [transactionLogs, selectedDate, employees]);

    const statsAnomalies = useMemo(() => {
        const anomalies = [];
        Object.keys(dailyStats).forEach(empId => {
            const stat = dailyStats[empId];
            const hours = stat.totalSeconds / 3600;
            if (hours > 12) {
                anomalies.push({
                    id: `overwork-${empId}`, type: 'OVERWORK', severity: 'medium',
                    text: `${stat.name} lleva > 12 horas en turno.`,
                    time: 'Turno'
                });
            }
        });
        return anomalies;
    }, [dailyStats]);

    const allAnomalies = [...sessionAnomalies, ...statsAnomalies].filter(a => !dismissedIds.has(a.id));
    const highSeverity = allAnomalies.filter(a => a.severity === 'high').length;

    const handleDismiss = (anomalyId) => setDismissedIds(prev => new Set([...prev, anomalyId]));
    const handleDismissAll = () => setDismissedIds(prev => new Set([...prev, ...allAnomalies.map(a => a.id)]));

    if (allAnomalies.length === 0) return null;

    return (
        <div className={`mt-6 rounded-[32px] border transition-all overflow-hidden shadow-sm ${highSeverity > 0 ? 'bg-red-50 border-red-100' : 'bg-[#FFFBEB] border-amber-100'}`}>
            <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${highSeverity > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-400 text-white'}`}>
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h4 className={`font-black text-sm uppercase tracking-tighter ${highSeverity > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                            Alertas de Integridad
                        </h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${highSeverity > 0 ? 'text-red-400' : 'text-amber-500'}`}>
                            {allAnomalies.length} incidencias ({highSeverity} críticas)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isManagerial && isExpanded && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDismissAll(); }}
                            className="text-[10px] font-black uppercase tracking-widest text-[#718096] whitespace-nowrap px-4 py-2 bg-white/60 hover:bg-white rounded-xl border border-white shadow-sm transition-all"
                        >
                            Limpiar Todo
                        </button>
                    )}
                    <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
                        {isExpanded ? <ChevronDown size={18} className="#718096" /> : <ChevronRight size={18} className="#718096" />}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="bg-white/40 backdrop-blur-sm border-t border-white/20"
                    >
                        <div className="p-4 flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {allAnomalies.map((a) => (
                                <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-white shadow-sm hover:shadow-md transition-all group">
                                    <div className="w-8 h-8 rounded-xl bg-[#F4F7FA] flex items-center justify-center shrink-0">
                                        {a.type === 'GHOST' && <Skull size={16} className="text-red-400" />}
                                        {a.type === 'FLASH' && <Zap size={16} className="text-amber-400" />}
                                        {a.type === 'OVERWORK' && <Clock size={16} className="text-[#A0AEC0]" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-[#1A365D] font-bold uppercase tracking-tighter">{a.text}</p>
                                    </div>

                                    <span className="text-[10px] font-black text-[#A0AEC0] bg-white px-3 py-1 rounded-full border border-[#E2E8F0] shadow-sm font-mono">
                                        {a.time}
                                    </span>

                                    {isManagerial && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDismiss(a.id); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-[#A0AEC0] hover:text-red-500 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 border border-[#E2E8F0]"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnomalyPanel;
