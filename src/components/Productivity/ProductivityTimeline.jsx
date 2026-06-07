import React, { useMemo } from 'react';
import { format, differenceInSeconds, parseISO } from 'date-fns';
import { AlertTriangle, Clock, ShoppingBag, Zap, Skull, Moon } from 'lucide-react';

const ProductivityTimeline = ({
    selectedDate,
    dailyRecords,
    transactionLogs,
    activeSessions,
    employees
}) => {
    // Helpers to classify widget blocks
    const getBlockStyle = (log, anomaly) => {
        if (log.type === 'idle_time') return 'bg-slate-650/40 border-slate-500/30 text-slate-400';
        if (log.type === 'call_time') return 'bg-blue-500/30 border-blue-400/20 text-blue-200';
        if (anomaly) return anomaly.color + ' border-transparent text-white';
        return 'bg-emerald-500/80 border-emerald-400/50 text-white/80';
    };

    const getBlockTitle = (log, anomaly) => {
        const start = format(new Date(log.start_time), 'HH:mm:ss');
        const end = log.end_time ? format(new Date(log.end_time), 'HH:mm:ss') : 'Activo';
        
        let diffSec = 0;
        if (log.details) {
            try {
                const parsed = JSON.parse(log.details);
                diffSec = parsed.durationSeconds || 0;
            } catch (e) {
                if (log.end_time) {
                    diffSec = Math.round((new Date(log.end_time) - new Date(log.start_time)) / 1000);
                }
            }
        } else if (log.end_time) {
            diffSec = Math.round((new Date(log.end_time) - new Date(log.start_time)) / 1000);
        }

        const durText = diffSec >= 60 ? `${Math.floor(diffSec / 60)}m ${diffSec % 60}s` : `${diffSec}s`;
        
        let typeName = log.type;
        if (log.type === 'idle_time') typeName = 'Tiempo Muerto (Widget)';
        else if (log.type === 'call_time') typeName = 'Tiempo de Llamada (Widget)';
        else if (log.type === 'standard') typeName = 'Compra Estándar';
        else if (log.type === 'jewelry') typeName = 'Compra Joyas';
        else if (log.type === 'recoverable') typeName = 'Compra Recuperable';
        else if (log.type === 'noDeal') typeName = 'Sin Trato';

        return `${typeName} | ${start} - ${end} (${durText}) ${anomaly ? '- ' + anomaly.text : ''}`;
    };

    // 1. Filter Data for Selected Date
    const dateRecords = useMemo(() => {
        return dailyRecords.filter(r => r.date === selectedDate);
    }, [dailyRecords, selectedDate]);

    const dateLogs = useMemo(() => {
        return transactionLogs.filter(l => {
            if (!l.start_time) return false;
            // Handle snake_case from DB
            const d = new Date(l.start_time);
            // Format to YYYY-MM-DD in local time to match selectedDate
            // Assuming selectedDate is YYYY-MM-DD string
            // Simple check: does ISO string start with date? 
            // Better: use same format logic as active sessions
            const localDate = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
            return localDate === selectedDate;
        });
    }, [transactionLogs, selectedDate]);

    // 2. Identify Employees to Show
    const activeEmployeeIds = useMemo(() => {
        const ids = new Set();
        dateRecords.forEach(r => ids.add(String(r.employeeId)));
        dateLogs.forEach(l => ids.add(String(l.employee_id))); // Note: snake_case from DB

        // Add currently active sessions if today
        if (selectedDate === new Date().toISOString().split('T')[0]) {
            activeSessions.forEach(s => ids.add(String(s.employeeId)));
        }

        return Array.from(ids);
    }, [dateRecords, dateLogs, activeSessions, selectedDate]);

    const timelineEmployees = useMemo(() => {
        return employees.filter(e => activeEmployeeIds.includes(String(e.id)));
    }, [employees, activeEmployeeIds]);

    // 3. Define Time Range (10:00 - 22:00 default, or auto-expand)
    const { startHour, endHour, totalSeconds } = useMemo(() => {
        let minTime = 10 * 3600; // 10:00
        let maxTime = 22 * 3600; // 22:00

        const checkTime = (dateStr) => {
            if (!dateStr) return;
            const d = new Date(dateStr);
            const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
            if (seconds < minTime) minTime = Math.max(0, seconds - 1800); // Pad 30m
            if (seconds > maxTime) maxTime = Math.min(24 * 3600, seconds + 1800); // Pad 30m
        };

        dateRecords.forEach(r => { checkTime(r.startTime); checkTime(r.endTime); });
        dateLogs.forEach(l => { checkTime(l.start_time); checkTime(l.end_time); });

        return {
            startHour: minTime / 3600,
            endHour: maxTime / 3600,
            totalSeconds: maxTime - minTime
        };
    }, [dateRecords, dateLogs]);

    // Helper: Position (0-100%)
    const getPosition = (dateStr) => {
        if (!dateStr) return 0;
        const d = new Date(dateStr);
        const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        const startSeconds = startHour * 3600;
        return Math.max(0, Math.min(100, ((seconds - startSeconds) / totalSeconds) * 100));
    };

    const getWidth = (startStr, endStr) => {
        if (!startStr) return 0;
        const end = endStr ? new Date(endStr) : new Date(); // If no end, assume active now (for active sessions)
        const start = new Date(startStr);
        const diff = (end - start) / 1000;
        return Math.max(0.5, (diff / totalSeconds) * 100); // Min width 0.5%
    };

    // 4. Anomaly Detection (Per Block)
    const getAnomaly = (log) => {
        const start = new Date(log.start_time);
        const end = log.end_time ? new Date(log.end_time) : new Date();
        const durationMin = (end - start) / 60000;

        // Check "No Deal" or "Sale"
        const isSales = ['standard', 'jewelry', 'recoverable'].includes(log.type);
        const isNoDeal = log.type === 'noDeal';

        if (durationMin > 90) return { type: 'ghost', icon: <Skull size={12} />, color: 'bg-indigo-500', text: 'Sesión Fantasma (>90m)' };
        if (isSales && durationMin < 3) return { type: 'flash', icon: <Zap size={12} />, color: 'bg-yellow-500', text: 'Flash Sale (<3m)' };

        // Late Night
        if (start.getHours() >= 22 || start.getHours() < 7) return { type: 'night', icon: <Moon size={12} />, color: 'bg-purple-500', text: 'Horas Extrañas' };

        return null;
    };

    if (activeEmployeeIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-white/5 bg-[#1e293b]/60 rounded-3xl">
                <Clock size={48} className="mb-4 opacity-50" />
                <p>No hay actividad registrada para este día.</p>
            </div>
        );
    }

    // Generate Hourly Grid Lines
    const gridLines = [];
    for (let h = Math.ceil(startHour); h < endHour; h++) {
        gridLines.push(h);
    }

    return (
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-6 shadow-xl flex flex-col overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="text-pink-500" />
                Línea de Tiempo
                <span className="text-xs font-normal text-slate-400 ml-auto bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                    {format(new Date(selectedDate), 'dd MMM yyyy')}
                </span>
            </h3>

            <div className="flex-1 overflow-x-auto custom-scrollbar relative">
                <div className="w-full relative pb-4">

                    {/* Time Header */}
                    <div className="flex border-b border-white/10 mb-4 pb-2 relative h-8 text-sm text-slate-400 font-mono">
                        {/* Name Column Spacer */}
                        <div className="w-44 shrink-0 sticky left-0 bg-[#1e293b] z-20"></div>

                        {/* Timeline Area */}
                        <div className="flex-1 relative">
                            {gridLines.map(h => (
                                <div
                                    key={h}
                                    className="absolute top-0 bottom-0 border-l border-slate-600/60 flex flex-col items-start pl-1 h-full"
                                    style={{ left: `${((h * 3600 - startHour * 3600) / totalSeconds) * 100}%` }}
                                >
                                    <span>{h}:00</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Employee Rows */}
                    <div className="flex flex-col gap-4">
                        {timelineEmployees.map(emp => {
                            // Data for this employee
                            const shifts = dateRecords.filter(r => String(r.employeeId) === String(emp.id));
                            const logs = dateLogs.filter(l => String(l.employee_id) === String(emp.id));

                            // Check for active session
                            const activeSession = activeSessions.find(s => String(s.employeeId) === String(emp.id));

                            return (
                                <div key={emp.id} className="flex relative group hover:bg-white/5 p-2 rounded-xl transition-colors">
                                    {/* Name Column */}
                                    <div className="w-44 shrink-0 sticky left-0 z-10 flex flex-col justify-center pr-4 bg-[#1e293b]/80 backdrop-blur-sm">
                                        <p className="font-bold text-sm text-slate-200 truncate">{emp.alias || emp.firstName}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{shifts.length} turnos · {logs.length} ops</p>
                                    </div>

                                    {/* Timeline Track */}
                                    <div className="flex-1 relative h-20 bg-slate-900/60 rounded-lg overflow-hidden border border-slate-600/40">
                                        {/* Grid Lines Overlay */}
                                        {gridLines.map(h => (
                                            <div
                                                key={`grid-${h}`}
                                                className="absolute top-0 bottom-0 border-l border-slate-600/40"
                                                style={{ left: `${((h * 3600 - startHour * 3600) / totalSeconds) * 100}%` }}
                                            />
                                        ))}

                                        {/* 1. SHIFTS (Blue Base) */}
                                        {shifts.map(shift => (
                                            <div
                                                key={shift.id}
                                                className="absolute top-0 bottom-0 bg-blue-500/20 border-l border-r border-blue-500/30"
                                                style={{
                                                    left: `${getPosition(shift.startTime)}%`,
                                                    width: `${getWidth(shift.startTime, shift.endTime)}%`
                                                }}
                                                title={`Turno: ${format(new Date(shift.startTime), 'HH:mm')} - ${shift.endTime ? format(new Date(shift.endTime), 'HH:mm') : 'Activo'}`}
                                            >
                                                {!shift.endTime && <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400 animate-pulse" />}
                                            </div>
                                        ))}

                                        {/* Active Shift Indicator */}
                                        {activeSession && !activeSession.clientStartTime && selectedDate === new Date().toISOString().split('T')[0] && (
                                            <div
                                                className="absolute top-0 bottom-0 bg-blue-500/20 border-l border-blue-500/30 dashed-r"
                                                style={{
                                                    left: `${getPosition(activeSession.startTime)}%`,
                                                    width: `${getWidth(activeSession.startTime)}%`
                                                }}
                                            >
                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 animate-pulse" />
                                            </div>
                                        )}

                                        {/* 2. TRANSACTIONS (Green Overlay / Widget Overlays) */}
                                        {logs.map((log, idx) => {
                                            const anomaly = getAnomaly(log);
                                            const blockStyle = getBlockStyle(log, anomaly);
                                            const blockTitle = getBlockTitle(log, anomaly);

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`absolute top-3 bottom-3 rounded-md border border-white/10 shadow-sm cursor-help hover:z-20 hover:scale-[1.03] transition-all flex items-center justify-center text-[10px] font-bold ${blockStyle}`}
                                                    style={{
                                                        left: `${getPosition(log.start_time)}%`,
                                                        width: `${getWidth(log.start_time, log.end_time)}%`,
                                                        minWidth: '8px'
                                                    }}
                                                    title={blockTitle}
                                                >
                                                    {anomaly && <div className="text-white drop-shadow-md pb-4">{anomaly.icon}</div>}
                                                </div>
                                            );
                                        })}

                                        {/* Active Shopping Session */}
                                        {activeSession && activeSession.clientStartTime && selectedDate === new Date().toISOString().split('T')[0] && (
                                            <div
                                                className="absolute top-2 bottom-2 bg-amber-500 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] rounded-md animate-pulse z-10"
                                                style={{
                                                    left: `${getPosition(activeSession.clientStartTime)}%`,
                                                    width: `${getWidth(activeSession.clientStartTime)}%`,
                                                    minWidth: '10px'
                                                }}
                                                title="Cliente en curso..."
                                            >
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-500 uppercase whitespace-nowrap">En Curso</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-8 flex flex-wrap gap-6 justify-center text-xs text-slate-400 border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500/20 border border-blue-500/30 rounded"></div> Turno Activo</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-500/80 rounded"></div> Compra Normal</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-500 rounded border border-amber-400"></div> En Curso</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-650/40 border border-slate-500/30 rounded"></div> T. Muerto (Widget)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500/30 border border-blue-400/20 rounded"></div> T. Llamada (Widget)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center text-white"><Skull size={10} /></div> &gt;90min</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center text-white"><Zap size={10} /></div> &lt;3min</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductivityTimeline;
