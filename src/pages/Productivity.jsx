import React, { useState, useEffect } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { Users, ShoppingBag, Clock, UserCheck, AlertCircle, Archive, Lock, RefreshCw, Plus, X } from 'lucide-react';

const Productivity = () => {
    const {
        activeSessions, dailyRecords, startSession, endSession,
        dailyGroups, updateDailyGroups, closedDays, closeDay, reopenDay,
        getUnclosedPastDays, dayIncidents, updateDayIncident,
        updateRecord, addManualRecord
    } = useProductivity();

    const { employees } = useTeam();
    const { user } = useAuth();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [incidentText, setIncidentText] = useState('');

    // Manual Entry State
    const [manualEntry, setManualEntry] = useState({
        empId: '',
        hours: '',
        minutes: '',
        standardGroups: '',
        jewelryGroups: '',
        recoverableGroups: ''
    });

    const isManagerial = user?.role === ROLES.MANAGER || user?.role === ROLES.RESPONSIBLE;
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

    // Global active time
    const globalActiveTime = activeSessions.reduce((acc, s) => acc + (currentTime - new Date(s.startTime)), 0);

    const handleUserClick = (emp) => {
        if (!isToday && !isManagerial) return;
        if (!isToday) return;

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

    const handleCloseDay = () => {
        updateDayIncident(selectedDate, incidentText);
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

    const handleSaveManualRecord = () => {
        if (!manualEntry.empId) return alert('Selecciona un empleado');

        const emp = employees.find(e => e.id === parseInt(manualEntry.empId));
        const totalSeconds = (parseInt(manualEntry.hours || 0) * 3600) + (parseInt(manualEntry.minutes || 0) * 60);

        const hasGroups = manualEntry.standardGroups || manualEntry.jewelryGroups || manualEntry.recoverableGroups;

        if (totalSeconds === 0 && !hasGroups) return alert('Introduce tiempo o grupos');

        // Add Time Record
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

        // Add Groups Record (Additive)
        if (hasGroups) {
            const current = getGroupCounts(emp.id, selectedDate);
            updateDailyGroups(emp.id, selectedDate, {
                standard: (current.standard || 0) + (parseInt(manualEntry.standardGroups) || 0),
                jewelry: (current.jewelry || 0) + (parseInt(manualEntry.jewelryGroups) || 0),
                recoverable: (current.recoverable || 0) + (parseInt(manualEntry.recoverableGroups) || 0)
            });
        }

        setShowManualModal(false);
        setManualEntry({ empId: '', hours: '', minutes: '', standardGroups: '', jewelryGroups: '', recoverableGroups: '' });
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6">

            {/* LEFT: EMPLOYEE SELECTOR */}
            <div className="w-2/3 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight flex items-center gap-3">
                            <ShoppingBag className="text-emerald-500" size={32} />
                            Productividad
                        </h1>
                        <p className="text-slate-400 font-medium ml-1">
                            {isToday ? "Selecciona tu usuario para fichar actividad." : `Viendo registros del día ${selectedDate}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-4 justify-end">
                            {isManagerial && (
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1 font-mono text-sm"
                                />
                            )}
                            <div>
                                <p className="text-4xl font-mono font-bold text-slate-200">{currentTime.toLocaleTimeString()}</p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{currentTime.toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {isManagerial && unclosedDays.length > 0 && (
                    <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-2 text-amber-200">
                            <AlertCircle size={20} />
                            <span className="font-bold">¡Atención! Hay días anteriores sin cerrar:</span>
                            <div className="flex gap-2">
                                {unclosedDays.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setSelectedDate(d)}
                                        className="underline hover:text-white"
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar flex-1 content-start pr-2">
                    {employees.filter(e => e.isBuyer).map(emp => {
                        const session = activeSessions.find(s => s.employeeId === emp.id);
                        const displayName = emp.alias || emp.firstName;
                        const isSessionActive = !!session;

                        return (
                            <button
                                key={emp.id}
                                onClick={() => handleUserClick(emp)}
                                disabled={!isToday}
                                className={`relative aspect-square rounded-3xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 border-2 ${isSessionActive
                                    ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 z-10'
                                    : isToday
                                        ? 'bg-red-900/80 border-red-800 hover:bg-red-800 hover:border-red-500 hover:scale-[1.02]'
                                        : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2 ${isSessionActive ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-red-950 text-red-200 border-red-800'
                                    }`}>
                                    {emp.alias || emp.firstName.substring(0, 3).toUpperCase()}
                                </div>
                                <div className="text-center w-full overflow-hidden">
                                    <p className={`font-bold text-lg truncate w-full ${isSessionActive ? 'text-white' : 'text-red-100'}`}>{emp.firstName}</p>
                                </div>
                                {isSessionActive && (
                                    <div className="mt-2 bg-black/20 px-3 py-1 rounded-full font-mono text-sm font-bold text-white animate-pulse">
                                        {formatDuration(currentTime - new Date(session.startTime))}
                                    </div>
                                )}
                                {isSessionActive && <span className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full animate-ping"></span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: LIVE STATUS & STATS */}
            <div className="w-1/3 flex flex-col gap-6">

                {/* GLOBAL LIVE WIDGET */}
                {isToday && (
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-6 border border-indigo-500/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock size={16} /> Tiempo Activo Total
                        </h2>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-mono font-bold text-white tracking-tight">
                                {formatDuration(globalActiveTime)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-sm text-indigo-200 filter backdrop-blur-md bg-white/5 p-3 rounded-xl border border-white/10">
                            <Users size={16} />
                            <span className="font-bold">{activeSessions.length}</span> empleados comprando ahora
                        </div>
                    </div>
                )}

                {/* SUMMARY TABLE */}
                <div className="flex-1 bg-slate-950/50 rounded-[2.5rem] border border-slate-800/50 p-6 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                            <UserCheck size={20} className="text-emerald-500" />
                            Resumen {isToday ? 'Hoy' : selectedDate}
                        </h2>
                        {isManagerial && !isDayClosed && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowManualModal(true)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                                    title="Añadir registro manual"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIncidentText(dayIncidents[selectedDate] || '');
                                        setShowCloseModal(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    <Archive size={14} /> Cerrar Día
                                </button>
                            </div>
                        )}
                        {isDayClosed && (
                            <div className="flex items-center gap-4">
                                {dayIncidents[selectedDate] && (
                                    <span className="text-xs text-slate-400 italic max-w-[200px] truncate" title={dayIncidents[selectedDate]}>
                                        Nota: {dayIncidents[selectedDate]}
                                    </span>
                                )}
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20">
                                    <Lock size={14} /> Archivado
                                </span>
                                {isManagerial && (
                                    <>
                                        <button
                                            onClick={() => setShowManualModal(true)}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-200 rounded-lg transition-colors border border-amber-500/30"
                                            title="Añadir registro manual (Día cerrado)"
                                        >
                                            <Plus size={14} />
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (confirm('¿Seguro que quieres reabrir este día?')) {
                                                    reopenDay(selectedDate);
                                                }
                                            }}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                                            title="Reabrir día"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar -mr-2 pr-2">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-800">
                                    <th className="pb-2 pl-2">Empleado</th>
                                    <th className="pb-2">Tiempo</th>
                                    <th className="pb-2 text-center text-blue-400" title="Grupos Generales">G.Gen</th>
                                    <th className="pb-2 text-center text-purple-400" title="Joyería">Joy.</th>
                                    <th className="pb-2 text-center text-amber-400" title="Venta Recuperable">V.Rec</th>
                                    <th className="pb-2 text-right text-emerald-400" title="Total Grupos">Tot</th>
                                    <th className="pb-2 text-right">G/H</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-800/50">
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
                                            <td className="py-3 pl-2 max-w-[100px]">
                                                <div className="font-bold text-slate-300 truncate">{displayName}</div>
                                                {isActive && <div className="text-[10px] text-emerald-400 font-bold animate-pulse">Comprando...</div>}
                                            </td>
                                            <td
                                                className={`py-3 font-mono text-slate-400 text-xs ${!isDayClosed && isManagerial ? 'cursor-pointer hover:text-white hover:bg-slate-700/50 rounded px-1' : ''}`}
                                                title={!isDayClosed && isManagerial ? "Clic para editar tiempo" : ""}
                                                onClick={() => handleTimeEdit(empId, stat.totalSeconds, displayName)}
                                            >
                                                {formatDuration(stat.totalSeconds * 1000)}
                                            </td>

                                            {/* Inputs for Groups */}
                                            <td className="py-3 text-center">
                                                <input
                                                    type="number"
                                                    disabled={!isManagerial || isDayClosed}
                                                    value={groupCounts.standard || ''}
                                                    onChange={(e) => handleGroupsUpdate(empId, 'standard', e.target.value)}
                                                    placeholder="-"
                                                    className={`w-10 bg-slate-900 border border-slate-700 rounded text-center text-slate-200 text-xs py-1 focus:border-blue-500 outline-none ${(!isManagerial || isDayClosed) ? 'opacity-50 cursor-not-allowed hidden-arrows' : ''}`}
                                                />
                                            </td>
                                            <td className="py-3 text-center">
                                                <input
                                                    type="number"
                                                    disabled={!isManagerial || isDayClosed}
                                                    value={groupCounts.jewelry || ''}
                                                    onChange={(e) => handleGroupsUpdate(empId, 'jewelry', e.target.value)}
                                                    placeholder="-"
                                                    className={`w-10 bg-slate-900 border border-slate-700 rounded text-center text-slate-200 text-xs py-1 focus:border-purple-500 outline-none ${(!isManagerial || isDayClosed) ? 'opacity-50 cursor-not-allowed hidden-arrows' : ''}`}
                                                />
                                            </td>
                                            <td className="py-3 text-center">
                                                <input
                                                    type="number"
                                                    disabled={!isManagerial || isDayClosed}
                                                    value={groupCounts.recoverable || ''}
                                                    onChange={(e) => handleGroupsUpdate(empId, 'recoverable', e.target.value)}
                                                    placeholder="-"
                                                    className={`w-10 bg-slate-900 border border-slate-700 rounded text-center text-slate-200 text-xs py-1 focus:border-amber-500 outline-none ${(!isManagerial || isDayClosed) ? 'opacity-50 cursor-not-allowed hidden-arrows' : ''}`}
                                                />
                                            </td>

                                            <td className="py-3 text-right font-bold text-emerald-400 text-xs">
                                                {groupCounts.total}
                                            </td>
                                            <td className="py-3 text-right font-bold text-slate-300 text-xs">
                                                {gph}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {Object.keys(dailyStats).length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-500 italic">
                                            Sin registros
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* INCIDENT MODAL OVERLAY */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Cerrar Día {selectedDate}</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Añade observaciones o incidencias antes de archivar. Una vez cerrado, no se podrán modificar los datos.
                        </p>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm min-h-[100px] focus:border-blue-500 outline-none mb-4"
                            placeholder="Ej: Fulanito olvidó fichar salida..."
                            value={incidentText}
                            onChange={e => setIncidentText(e.target.value)}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCloseDay}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                            >
                                Confirmar y Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MANUAL ENTRY MODAL */}
            {showManualModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowManualModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Plus size={20} className="text-emerald-500" />
                            Añadir Registro
                        </h3>
                        <p className="text-slate-400 text-xs mb-6">
                            Para el día <span className="text-white font-mono font-bold">{selectedDate}</span>
                            {isDayClosed && <span className="text-amber-500 block mt-1 font-bold">¡DÍA CERRADO! Se modificará el archivo.</span>}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Empleado</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                    value={manualEntry.empId}
                                    onChange={e => setManualEntry({ ...manualEntry, empId: e.target.value })}
                                >
                                    <option value="">Selecciona...</option>
                                    {employees.filter(e => e.isBuyer).map(e => (
                                        <option key={e.id} value={e.id}>{e.alias || e.firstName} {e.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Horas</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                        placeholder="0"
                                        value={manualEntry.hours}
                                        onChange={e => setManualEntry({ ...manualEntry, hours: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Minutos</label>
                                    <input
                                        type="number"
                                        min="0" max="59"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                        placeholder="0"
                                        value={manualEntry.minutes}
                                        onChange={e => setManualEntry({ ...manualEntry, minutes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800 mt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-3">Grupos (Añadir a exist.)</label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-blue-300">G. General</span>
                                        <input
                                            type="number" min="0" placeholder="0"
                                            className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-right outline-none focus:border-blue-500"
                                            value={manualEntry.standardGroups}
                                            onChange={e => setManualEntry({ ...manualEntry, standardGroups: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-purple-300">Joyería</span>
                                        <input
                                            type="number" min="0" placeholder="0"
                                            className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-right outline-none focus:border-purple-500"
                                            value={manualEntry.jewelryGroups}
                                            onChange={e => setManualEntry({ ...manualEntry, jewelryGroups: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-amber-300">V. Recuperable</span>
                                        <input
                                            type="number" min="0" placeholder="0"
                                            className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-right outline-none focus:border-amber-500"
                                            value={manualEntry.recoverableGroups}
                                            onChange={e => setManualEntry({ ...manualEntry, recoverableGroups: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveManualRecord}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4 transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Guardar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Productivity;
