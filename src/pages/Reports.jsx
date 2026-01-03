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
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <FileText className="text-pink-500" size={32} />
                        Informes
                    </h1>
                    <p className="text-slate-400 font-medium ml-1 mt-1 text-sm">Analiza el rendimiento del equipo por rangos de fecha.</p>
                </div>

                {/* DATE RANGE PICKER */}
                <div className="bg-[#1e293b]/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex items-center gap-4 shadow-lg">
                    <div className="flex items-center gap-2 pl-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Desde</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-pink-500 outline-none transition-colors font-mono"
                        />
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hasta</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-pink-500 outline-none transition-colors font-mono"
                        />
                    </div>
                    <button className="bg-pink-600 hover:bg-pink-500 text-white p-2 rounded-xl transition-all shadow-lg shadow-pink-600/20">
                        <Filter size={16} />
                    </button>
                </div>
            </header>

            {/* RESULTS CARD */}
            <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <BarChart size={24} className="text-pink-500" />
                        Resultados del Periodo
                        <span className="text-xs font-normal text-slate-500 ml-2 font-mono">({startDate} — {endDate})</span>
                    </h2>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl transition-all text-xs border border-white/5 hover:border-white/10">
                        <Download size={16} /> Exportar CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] font-bold text-slate-500 uppercase border-b border-white/5 bg-slate-900/20">
                                <th className="pb-4 pl-6 pt-4">Empleado</th>
                                <th className="pb-4 pt-4 text-center">Días Activos</th>
                                <th className="pb-4 pt-4 text-center">Tiempo (H)</th>
                                <th className="pb-4 pt-4 text-center text-slate-400" title="Grupos General">Gen</th>
                                <th className="pb-4 pt-4 text-center text-slate-400" title="Grupos Joyería">Joy</th>
                                <th className="pb-4 pt-4 text-center text-slate-400" title="Venta Recuperable">Rec</th>
                                <th className="pb-4 pt-4 text-center text-pink-500">Total Grupos</th>
                                <th className="pb-4 pt-4 text-right pr-6">Media (G/H)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedEmpIds.map(empId => {
                                const data = stats[empId];
                                const emp = employees.find(e => e.id === parseInt(empId));
                                const hours = data.totalSeconds / 3600;
                                const gph = hours > 0 ? (data.totalGroups / hours).toFixed(2) : '0.00';

                                return (
                                    <tr key={empId} className="group hover:bg-pink-500/5 transition-colors">
                                        <td className="py-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-white/5 group-hover:bg-pink-600 group-hover:text-white group-hover:border-pink-500 transition-all text-xs">
                                                    {emp?.alias || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 text-sm group-hover:text-pink-200 transition-colors">{emp?.firstName}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{emp?.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center font-mono text-slate-500 text-sm">
                                            {data.daysActive.size}
                                        </td>
                                        <td className="py-4 text-center font-mono text-slate-400 text-sm">
                                            {hours.toFixed(1)}
                                        </td>

                                        {/* Detailed Groups */}
                                        <td className="py-4 text-center font-mono text-slate-500 text-sm">
                                            {data.standard}
                                        </td>
                                        <td className="py-4 text-center font-mono text-slate-500 text-sm">
                                            {data.jewelry}
                                        </td>
                                        <td className="py-4 text-center font-mono text-slate-500 text-sm">
                                            {data.recoverable}
                                        </td>

                                        <td className="py-4 text-center">
                                            <span className="bg-pink-500/10 text-pink-500 px-3 py-1 rounded-lg font-bold font-mono text-sm border border-pink-500/20">
                                                {data.totalGroups}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`text-lg font-bold font-mono ${parseFloat(gph) > 10 ? 'text-white' : 'text-slate-500'}`}>
                                                    {gph}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {sortedEmpIds.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-slate-600 italic text-sm">
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
