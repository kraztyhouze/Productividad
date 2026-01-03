import React, { useState, useEffect } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { Users, ShoppingBag, Clock, UserCheck, AlertCircle, Lock, RefreshCw, Plus, Trash2 } from 'lucide-react';
import InfoPanel from '../components/Productivity/InfoPanel';
import ManualEntryModal from '../components/Productivity/ManualEntryModal';
import CloseDayModal from '../components/Productivity/CloseDayModal';

const Productivity = () => {
    const {
        activeSessions, dailyRecords, startSession, endSession,
        dailyGroups, updateDailyGroups, closedDays, closeDay, reopenDay,
        getUnclosedPastDays, dayIncidents, updateDayIncident,
        updateRecord, addManualRecord, deleteEmployeeDayData,
        productFamilies, addProductFamily, removeProductFamily
    } = useProductivity();

    const { employees } = useTeam();
    const { user } = useAuth();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);

    // Removed local form states (manualEntry, incidentText) as they are now handled by modals

    const isManagerial = user?.role === ROLES.MANAGER;

    // We remove the specific 'canManageSessions' variable and just use isManagerial 
    // or we can keep it as an alias if we want to be semantic, but logic is same now.
    // The user mentioned "Usuario de kiosco de compras", we assume they have Manager role or we'd need a specific username check.

    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const isDayClosed = closedDays.includes(selectedDate);
    const unclosedDays = getUnclosedPastDays();

    // Ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Helper to safe get group counts (handling legacy number format)
    const getGroupCounts = (empId, date) => {
        // dailyGroups key format: empId-date
        const key = `${empId}-${date}`;
        const raw = dailyGroups[key];

        // Default
        const defaults = { standard: 0, jewelry: 0, recoverable: 0, total: 0 };

        if (raw === undefined || raw === null) return defaults;

        if (typeof raw === 'number') {
            return { ...defaults, standard: raw, total: raw };
        }

        const total = (raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0);
        return {
            standard: raw.standard || 0,
            jewelry: raw.jewelry || 0,
            recoverable: raw.recoverable || 0,
            total
        };
    };

    // Calculate aggregated stats for SELECTED DATE
    const getDailyStats = () => {
        const stats = {};

        // Process completed records
        dailyRecords
            .filter(r => r.date === selectedDate)
            .forEach(r => {
                if (!stats[r.employeeId]) stats[r.employeeId] = { totalSeconds: 0, sessions: 0, name: r.employeeName };
                stats[r.employeeId].totalSeconds += r.durationSeconds;
                stats[r.employeeId].sessions += 1;
            });

        // Add Active Sessions time ONLY if selectedDate is TODAY
        if (isToday) {
            activeSessions.forEach(s => {
                if (!stats[s.employeeId]) stats[s.employeeId] = { totalSeconds: 0, sessions: 0, name: s.employeeName };
                const currentDuration = (currentTime - new Date(s.startTime)) / 1000;
                stats[s.employeeId].totalSeconds += currentDuration;
            });
        }

        return stats;
    };

    const dailyStats = getDailyStats();

    // Calculate Global Active Time (Time with at least 1 person buying)
    const calculateShopActiveTime = () => {
        if (!isToday && selectedDate !== new Date().toISOString().split('T')[0]) {
            // For past days, we could calculate it but let's focus on today/selected as requested
            // Actually logic works for any date if we filter records correctly
        }

        // 1. Get all intervals [start, end]
        const intervals = [];

        // Completed records
        dailyRecords
            .filter(r => r.date === selectedDate)
            .forEach(r => {
                intervals.push({ start: new Date(r.startTime).getTime(), end: new Date(r.endTime).getTime() });
            });

        // Active sessions (only if today)
        if (isToday) {
            activeSessions.forEach(s => {
                intervals.push({ start: new Date(s.startTime).getTime(), end: currentTime.getTime() });
            });
        }

        if (intervals.length === 0) return 0;

        // 2. Sort by start time
        intervals.sort((a, b) => a.start - b.start);

        // 3. Merge overlaps
        const merged = [];
        let current = intervals[0];

        for (let i = 1; i < intervals.length; i++) {
            const next = intervals[i];
            if (next.start < current.end) {
                // Warning: intervals might overlap entirely or partially
                // We take the max end time
                current.end = Math.max(current.end, next.end);
            } else {
                merged.push(current);
                current = next;
            }
        }
        merged.push(current);

        // 4. Sum up
        return merged.reduce((acc, interval) => acc + (interval.end - interval.start), 0);
    };

    const globalActiveTime = calculateShopActiveTime();

    const handleUserClick = (emp) => {
        if (!isToday) return;

        // Strict permission check
        if (!isManagerial) {
            alert("Solo gerencia o el puesto de compras pueden realizar acciones.");
            return;
        }

        const isActive = activeSessions.find(s => s.employeeId === emp.id);
        if (isActive) {
            if (confirm(`¿Detener sesión de compra para ${emp.firstName}?`)) {
                endSession(emp.id);
            }
        } else {
            startSession(emp.id, `${emp.firstName} ${emp.lastName}`);
        }
    };

    const handleGroupsUpdate = (empId, field, value) => {
        updateDailyGroups(empId, selectedDate, { [field]: parseInt(value) || 0 });
    };

    const handleCloseDay = (text) => {
        updateDayIncident(selectedDate, text);
        closeDay(selectedDate);
        setShowCloseModal(false);
    };

    const handleTimeEdit = (empId, currentSeconds, displayName) => {
        if (!isManagerial || isDayClosed) return;
        const currentMinutes = (currentSeconds / 60).toFixed(0);
        const newMinutesStr = prompt(`Editar minutos totales para ${displayName}.`, currentMinutes);

        if (newMinutesStr !== null) {
            const newTotalSeconds = parseFloat(newMinutesStr) * 60;
            if (!isNaN(newTotalSeconds)) {
                const diff = newTotalSeconds - currentSeconds;
                if (diff !== 0) {
                    const adjustmentRecord = {
                        id: Date.now(),
                        employeeId: parseInt(empId),
                        employeeName: displayName,
                        startTime: new Date().toISOString(),
                        endTime: new Date().toISOString(),
                        durationSeconds: diff,
                        date: selectedDate,
                        groups: 0,
                        isManual: true
                    };
                    addManualRecord(adjustmentRecord);
                }
            }
        }
    };

    const handleSaveManualRecord = (entryData) => {
        const emp = employees.find(e => e.id === parseInt(entryData.empId));
        const totalSeconds = (parseInt(entryData.hours || 0) * 3600) + (parseInt(entryData.minutes || 0) * 60);

        const hasGroups = entryData.standardGroups || entryData.jewelryGroups || entryData.recoverableGroups;

        // Validation is done in modal, but double check doesn't hurt or just trust modal
        if (totalSeconds > 0) {
            addManualRecord({
                id: Date.now(),
                employeeId: emp.id,
                employeeName: emp.alias || emp.firstName,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                durationSeconds: totalSeconds,
                date: selectedDate,
                groups: 0,
                isManual: true
            });
        }

        if (hasGroups) {
            const current = getGroupCounts(emp.id, selectedDate);
            updateDailyGroups(emp.id, selectedDate, {
                standard: (current.standard || 0) + (parseInt(entryData.standardGroups) || 0),
                jewelry: (current.jewelry || 0) + (parseInt(entryData.jewelryGroups) || 0),
                recoverable: (current.recoverable || 0) + (parseInt(entryData.recoverableGroups) || 0)
            });
        }

        setShowManualModal(false);
    };

    // --- PRODUCT FAMILY LOGIC ---
    const [needInput, setNeedInput] = useState('');
    const [overstockInput, setOverstockInput] = useState('');

    const handleAddFamily = (type) => {
        const input = type === 'need' ? needInput : overstockInput;
        const setInput = type === 'need' ? setNeedInput : setOverstockInput;

        if (!input.trim()) return;

        addProductFamily(input, type, selectedDate);
        setInput('');
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-4">

            {/* TOP SECTION: LIVE & TEAM (Flex 2 to take more space) */}
            <div className="flex-[2] flex gap-6 min-h-0">
                {/* LEFT: EMPLOYEE SELECTOR */}
                <div className="w-2/3 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-6 border border-slate-800/50 flex flex-col shadow-2xl relative">

                    {/* Visual Only Mode Banner */}
                    {!isManagerial && (
                        <div className="absolute top-0 left-0 w-full bg-yellow-500/20 backdrop-blur-md rounded-t-[2.5rem] py-1 px-6 border-b border-yellow-500/30 flex items-center justify-center gap-2 z-20">
                            <Lock size={12} className="text-yellow-200" />
                            <span className="text-[10px] font-bold text-yellow-100 uppercase tracking-wider">
                                Modo Visualización - Solo Puesto de Compras / Gerencia pueden editar
                            </span>
                        </div>
                    )}

                    <div className={`flex justify-between items-center mb-4 ${!isManagerial ? 'mt-4' : ''}`}>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-50 tracking-tight flex items-center gap-2">
                                <ShoppingBag className="text-emerald-500" size={24} />
                                Productividad
                            </h1>
                            <p className="text-slate-400 font-medium ml-1 text-xs">
                                {isToday ? "Selecciona tu usuario para fichar." : `Viendo registros del día ${selectedDate}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-4 justify-end">
                                {isManagerial && (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs"
                                    />
                                )}
                                <div>
                                    <p className="text-3xl font-mono font-bold text-slate-200">{currentTime.toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isManagerial && unclosedDays.length > 0 && (
                        <div className="mb-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-2 text-amber-200 text-xs">
                                <AlertCircle size={16} />
                                <span className="font-bold">¡Días sin cerrar!:</span>
                                <div className="flex gap-2">
                                    {unclosedDays.map(d => (
                                        <button key={d} onClick={() => setSelectedDate(d)} className="underline hover:text-white">{d}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-4 xl:grid-cols-5 gap-2 overflow-y-auto custom-scrollbar flex-1 content-start pr-1">
                        {employees.filter(e => e.isBuyer).map(emp => {
                            const session = activeSessions.find(s => s.employeeId === emp.id);
                            const displayName = emp.alias || emp.firstName;
                            const isSessionActive = !!session;

                            return (
                                <button
                                    key={emp.id}
                                    onClick={() => handleUserClick(emp)}
                                    // disabled={!isToday} // We handle disabled visually/alert, kept button active to catch click
                                    className={`relative rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 border-2 h-24 ${isSessionActive
                                        ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105 z-10'
                                        : isToday
                                            ? isManagerial
                                                ? 'bg-red-900/80 border-red-800 hover:bg-red-800 hover:border-red-500 hover:scale-[1.02] cursor-pointer'
                                                : 'bg-red-900/80 border-red-800 opacity-80 cursor-not-allowed hidden-hover'
                                            : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isSessionActive ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-red-950 text-red-200 border-red-800'
                                        }`}>
                                        {emp.alias || emp.firstName.substring(0, 3).toUpperCase()}
                                    </div>
                                    <div className="text-center w-full overflow-hidden">
                                        <p className={`font-bold text-xs truncate w-full ${isSessionActive ? 'text-white' : 'text-red-100'}`}>{emp.firstName}</p>
                                    </div>
                                    {isSessionActive && (
                                        <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
                                    )}
                                    {isSessionActive && (
                                        <div className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white">
                                            {formatDuration(currentTime - new Date(session.startTime))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: LIVE STATUS & STATS */}
                <div className="w-1/3 flex flex-col gap-4">

                    {/* GLOBAL LIVE WIDGET */}
                    {isToday && (
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-5 border border-indigo-500/30 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock size={14} /> Tiempo Activo Total
                            </h2>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-mono font-bold text-white tracking-tight">
                                    {formatDuration(globalActiveTime)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-indigo-200 filter backdrop-blur-md bg-white/5 p-2 rounded-xl border border-white/10">
                                <Users size={14} />
                                <span className="font-bold">{activeSessions.length}</span> empleados comprando
                            </div>
                        </div>
                    )}

                    {/* SUMMARY TABLE */}
                    <div className="flex-1 bg-slate-950/50 rounded-[2.5rem] border border-slate-800/50 p-5 flex flex-col overflow-hidden min-h-0">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <UserCheck size={16} className="text-emerald-500" />
                                Resumen
                            </h2>
                            {isManagerial && !isDayClosed && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setShowManualModal(true)}
                                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors border border-slate-700"
                                        title="Añadir registro manual"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowCloseModal(true)}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-colors"
                                    >
                                        <Trash2 size={12} className="rotate-180" /> Cerrar {/* Archive icon replaced or repurposed */}
                                    </button>
                                </div>
                            )}
                            {isDayClosed && (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded border border-red-500/20">
                                        <Lock size={10} /> Archivado
                                    </span>
                                    {isManagerial && (
                                        <button onClick={() => { if (confirm('¿Reabrir?')) reopenDay(selectedDate); }} className="p-1 bg-slate-800 text-slate-400 rounded"><RefreshCw size={12} /></button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="overflow-y-auto custom-scrollbar -mr-2 pr-2">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[9px] font-bold text-slate-500 uppercase border-b border-slate-800">
                                        <th className="pb-1 pl-1">Emp</th>
                                        <th className="pb-1">T</th>
                                        <th className="pb-1 text-center text-blue-400">Gen</th>
                                        <th className="pb-1 text-center text-purple-400">Joy</th>
                                        <th className="pb-1 text-center text-amber-400">Rec</th>
                                        <th className="pb-1 text-right text-emerald-400">Tot</th>
                                        <th className="pb-1 text-right">G/H</th>
                                        {isManagerial && !isDayClosed && <th className="w-6"></th>}
                                    </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-slate-800/50">
                                    {Object.keys(dailyStats).map(empId => {
                                        const stat = dailyStats[empId];
                                        const groupCounts = getGroupCounts(empId, selectedDate);
                                        const hours = stat.totalSeconds / 3600;
                                        const gph = hours > 0 ? (groupCounts.total / hours).toFixed(1) : '0.0';
                                        const isActive = isToday && activeSessions.some(s => s.employeeId === parseInt(empId));
                                        const employeeData = employees.find(e => e.id === parseInt(empId));
                                        const displayName = employeeData ? (employeeData.alias || employeeData.firstName) : stat.name;

                                        return (
                                            <tr key={empId} className="group hover:bg-slate-800/30 transition-colors">
                                                <td className="py-2 pl-1 max-w-[80px] truncate font-bold text-slate-300">
                                                    {displayName}
                                                    {isActive && <span className="block text-[8px] text-emerald-400 animate-pulse">On</span>}
                                                </td>
                                                <td
                                                    className={`py-2 font-mono text-slate-400 text-[10px] ${!isDayClosed && isManagerial ? 'cursor-pointer hover:text-white' : ''}`}
                                                    onClick={() => handleTimeEdit(empId, stat.totalSeconds, displayName)}
                                                >
                                                    {formatDuration(stat.totalSeconds * 1000)}
                                                </td>
                                                <td className="py-2 text-center">
                                                    <input type="number" disabled={!isManagerial || isDayClosed} value={groupCounts.standard || ''} onChange={(e) => handleGroupsUpdate(empId, 'standard', e.target.value)} className="w-8 bg-transparent text-center text-slate-200 outline-none focus:text-blue-400 placeholder-slate-700" placeholder="-" />
                                                </td>
                                                <td className="py-2 text-center">
                                                    <input type="number" disabled={!isManagerial || isDayClosed} value={groupCounts.jewelry || ''} onChange={(e) => handleGroupsUpdate(empId, 'jewelry', e.target.value)} className="w-8 bg-transparent text-center text-slate-200 outline-none focus:text-purple-400 placeholder-slate-700" placeholder="-" />
                                                </td>
                                                <td className="py-2 text-center">
                                                    <input type="number" disabled={!isManagerial || isDayClosed} value={groupCounts.recoverable || ''} onChange={(e) => handleGroupsUpdate(empId, 'recoverable', e.target.value)} className="w-8 bg-transparent text-center text-slate-200 outline-none focus:text-amber-400 placeholder-slate-700" placeholder="-" />
                                                </td>
                                                <td className="py-2 text-right font-bold text-emerald-400">{groupCounts.total}</td>
                                                <td className="py-2 text-right text-slate-400">{gph}</td>
                                                {isManagerial && !isDayClosed && (
                                                    <td className="py-2 text-right pr-1">
                                                        <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Borrar todo de ${displayName}?`)) deleteEmployeeDayData(parseInt(empId), selectedDate); }} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION: INFO WINDOW (NECESIDAD / SOBRESTOCK) */}
            {/* BOTTOM SECTION: INFO WINDOW (NECESIDAD / SOBRESTOCK) */}
            <div className="flex-[1] flex gap-6 min-h-0 max-h-[250px]">
                <InfoPanel
                    title="Necesidad (Faltas)"
                    theme="emerald"
                    items={productFamilies.filter(f => f.type === 'need' && f.date === selectedDate)}
                    inputValue={needInput}
                    setInputValue={setNeedInput}
                    onAdd={() => handleAddFamily('need')}
                    onRemove={removeProductFamily}
                    isManagerial={isManagerial}
                    placeholder="Añadir familia..."
                />
                <InfoPanel
                    title="Sobrestock (Exceso)"
                    theme="red"
                    items={productFamilies.filter(f => f.type === 'overstock' && f.date === selectedDate)}
                    inputValue={overstockInput}
                    setInputValue={setOverstockInput}
                    onAdd={() => handleAddFamily('overstock')}
                    onRemove={removeProductFamily}
                    isManagerial={isManagerial}
                    placeholder="Añadir familia..."
                />
            </div>

            {/* KEEP MODALS OUTSIDE OF THE FLEX STRUCTURE */}
            {/* INCIDENT MODAL OVERLAY */}
            {showCloseModal && (
                <CloseDayModal
                    onClose={() => setShowCloseModal(false)}
                    onConfirm={handleCloseDay}
                    date={selectedDate}
                    initialIncidentText={dayIncidents[selectedDate] || ''}
                />
            )}

            {/* MANUAL ENTRY MODAL */}
            {showManualModal && (
                <ManualEntryModal
                    onClose={() => setShowManualModal(false)}
                    onSave={handleSaveManualRecord}
                    employees={employees}
                    selectedDate={selectedDate}
                    isDayClosed={isDayClosed}
                />
            )}
        </div>
    );
};

export default Productivity;
