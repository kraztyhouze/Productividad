import React, { useState } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { BarChart, FileText, Filter, Download } from 'lucide-react';

const Reports = () => {
    const { dailyRecords, dailyGroups } = useProductivity();
    const { employees } = useTeam();

    // Date Range State
    // Default to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDay = today.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(currentDay);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    // --- AGGREGATION LOGIC ---
    const getAggregatedStats = () => {
        const stats = {}; // { employeeId: { totalSeconds: 0, standard: 0, jewelry: 0, recoverable: 0, totalGroups: 0, daysActive: 0 } }

        // Filter records by date range
        const filteredRecords = dailyRecords.filter(r => r.date >= startDate && r.date <= endDate);

        filteredRecords.forEach(r => {
            if (!stats[r.employeeId]) {
                stats[r.employeeId] = {
                    totalSeconds: 0,
                    standard: 0, jewelry: 0, recoverable: 0, totalGroups: 0,
                    daysActive: new Set()
                };
            }
            stats[r.employeeId].totalSeconds += r.durationSeconds;
            stats[r.employeeId].daysActive.add(r.date);
        });

        // Now aggregate Groups for the range
        Object.keys(dailyGroups).forEach(key => {
            const [empIdStr, date] = key.split(/-(.+)/); // Split only on first dash
            const empId = parseInt(empIdStr);
            if (date >= startDate && date <= endDate) {
                if (!stats[empId]) {
                    stats[empId] = { totalSeconds: 0, standard: 0, jewelry: 0, recoverable: 0, totalGroups: 0, daysActive: new Set() };
                }

                const raw = dailyGroups[key];
                const val = typeof raw === 'number'
                    ? { standard: raw, jewelry: 0, recoverable: 0 }
                    : { standard: raw.standard || 0, jewelry: raw.jewelry || 0, recoverable: raw.recoverable || 0 };

                stats[empId].standard += val.standard;
                stats[empId].jewelry += val.jewelry;
                stats[empId].recoverable += val.recoverable;

                // Recalculate total just to be sure
                stats[empId].totalGroups += (val.standard + val.jewelry + val.recoverable);
            }
        });

        return stats;
    };

    const stats = getAggregatedStats();

    // Sort by Total Groups desc
    const sortedEmpIds = Object.keys(stats).sort((a, b) => stats[b].totalGroups - stats[a].totalGroups);

    return (
        <div className="space-y-6 pb-10">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight flex items-center gap-3">
                        <FileText className="text-fuchsia-500" size={32} />
                        Informes y Estadísticas
                    </h1>
                    <p className="text-slate-400 font-medium ml-1 mt-1">Analiza el rendimiento del equipo por rangos de fecha.</p>
                </div>

                {/* DATE RANGE PICKER */}
                <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-700 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Desde</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-sm text-white focus:border-fuchsia-500 outline-none"
                        />
                    </div>
                    <div className="w-px h-8 bg-slate-800"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Hasta</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-sm text-white focus:border-fuchsia-500 outline-none"
                        />
                    </div>
                    <button className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-lg transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </header>

            {/* RESULTS CARD */}
            <div className="bg-slate-950/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800/50 p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                        <BarChart size={24} className="text-pink-500" />
                        Resultados del Periodo
                        <span className="text-sm font-normal text-slate-500 ml-2">({startDate} al {endDate})</span>
                    </h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors text-sm">
                        <Download size={16} /> Exportar CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800/50">
                                <th className="pb-4 pl-4">Empleado</th>
                                <th className="pb-4 text-center">Días Activos</th>
                                <th className="pb-4 text-center">Tiempo (Horas)</th>
                                <th className="pb-4 text-center text-blue-400" title="Grupos General">G. Gen</th>
                                <th className="pb-4 text-center text-purple-400" title="Grupos Joyería">G. Joy</th>
                                <th className="pb-4 text-center text-amber-400" title="Venta Recuperable">V. Rec</th>
                                <th className="pb-4 text-center text-emerald-400">Total Grupos</th>
                                <th className="pb-4 text-right pr-4">Media (G/H)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {sortedEmpIds.map(empId => {
                                const data = stats[empId];
                                const emp = employees.find(e => e.id === parseInt(empId));
                                const name = emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${empId}`;
                                const hours = data.totalSeconds / 3600;
                                const gph = hours > 0 ? (data.totalGroups / hours).toFixed(2) : '0.00';

                                return (
                                    <tr key={empId} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                                                    {emp?.alias || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200">{emp?.firstName}</p>
                                                    <p className="text-xs text-slate-500">{emp?.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center font-mono text-slate-400">
                                            {data.daysActive.size}
                                        </td>
                                        <td className="py-4 text-center font-mono text-slate-300">
                                            {hours.toFixed(1)} h
                                        </td>

                                        {/* Detailed Groups */}
                                        <td className="py-4 text-center font-mono text-blue-300/70">
                                            {data.standard}
                                        </td>
                                        <td className="py-4 text-center font-mono text-purple-300/70">
                                            {data.jewelry}
                                        </td>
                                        <td className="py-4 text-center font-mono text-amber-300/70">
                                            {data.recoverable}
                                        </td>

                                        <td className="py-4 text-center">
                                            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg font-bold font-mono border border-emerald-500/20">
                                                {data.totalGroups}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`text-lg font-bold ${parseFloat(gph) > 10 ? 'text-blue-400' : 'text-slate-400'}`}>
                                                    {gph}
                                                </span>
                                                <span className="text-xs text-slate-600 uppercase">G/H</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {sortedEmpIds.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-500 italic">
                                        No hay datos para el rango de fechas seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
