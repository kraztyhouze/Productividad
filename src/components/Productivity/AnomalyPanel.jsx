import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Skull, Zap, Clock, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

const AnomalyPanel = ({ dailyStats, transactionLogs, employees, selectedDate }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // 1. Analyze logs for specific session anomalies
    const sessionAnomalies = useMemo(() => {
        const anomalies = [];
        transactionLogs.forEach(log => {
            const start = new Date(log.start_time);
            const end = log.end_time ? new Date(log.end_time) : new Date();
            // Ensure log belongs to selected date (start time)
            const logDate = start.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
            if (logDate !== selectedDate) return;

            const durationMin = (end - start) / 60000;
            const empName = employees.find(e => String(e.id) === String(log.employee_id))?.alias || `Emp #${log.employee_id}`;

            if (durationMin > 90) {
                anomalies.push({
                    type: 'GHOST',
                    severity: 'high',
                    text: `Sesión fantasma de ${empName} (${Math.round(durationMin)} min).`,
                    time: format(start, 'HH:mm')
                });
            }

            const isSales = ['standard', 'jewelry', 'recoverable'].includes(log.type);
            if (isSales && durationMin < 3) {
                anomalies.push({
                    type: 'FLASH',
                    severity: 'medium',
                    text: `Venta ultrarrápida de ${empName} (< 3 min).`,
                    time: format(start, 'HH:mm')
                });
            }
        });
        return anomalies;
    }, [transactionLogs, selectedDate, employees]);

    // 2. Analyze aggregated stats for productivity anomalies
    const statsAnomalies = useMemo(() => {
        const anomalies = [];
        Object.keys(dailyStats).forEach(empId => {
            const stat = dailyStats[empId]; // { totalSeconds, sessions, name }
            // Note: dailyStats in Productivity.jsx structure might be different?
            // Checking Productivity.jsx: dailyStats[empId] = { totalSeconds, sessions, name }
            // And data comes from getGroupCounts(empId, selectedDate).
            // I need access to group counts here too? 
            // Productivity.jsx lines 601-626 calculates critical metrics.
            // I should probably move that logic here OR pass the full calculated dataset.
            // For now, I'll rely on session anomalies which are more "integrity" related.

            const hours = stat.totalSeconds / 3600;
            if (hours > 12) {
                anomalies.push({
                    type: 'OVERWORK',
                    severity: 'medium',
                    text: `${stat.name} lleva > 12 horas en turno.`,
                    time: 'Turno'
                });
            }
        });
        return anomalies;
    }, [dailyStats]);

    const allAnomalies = [...sessionAnomalies, ...statsAnomalies];
    const highSeverity = allAnomalies.filter(a => a.severity === 'high').length;

    if (allAnomalies.length === 0) return null;

    return (
        <div className={`mt-4 rounded-xl border transition-all overflow-hidden ${highSeverity > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
            <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${highSeverity > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-white'}`}>
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${highSeverity > 0 ? 'text-red-400' : 'text-amber-400'}`}>
                            Integridad de Datos Detectada
                        </h4>
                        <p className="text-[10px] text-slate-400">
                            {allAnomalies.length} incidencias ({highSeverity} críticas)
                        </p>
                    </div>
                </div>
                {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
            </div>

            {isExpanded && (
                <div className="bg-[#0f172a]/50 p-3 flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {allAnomalies.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 border-b border-white/5 last:border-0">
                            {a.type === 'GHOST' && <Skull size={14} className="text-indigo-400 shrink-0" />}
                            {a.type === 'FLASH' && <Zap size={14} className="text-yellow-400 shrink-0" />}
                            {a.type === 'OVERWORK' && <Clock size={14} className="text-slate-400 shrink-0" />}

                            <div className="flex-1">
                                <p className="text-xs text-slate-300 font-medium">{a.text}</p>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded border border-white/5">
                                {a.time}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnomalyPanel;
