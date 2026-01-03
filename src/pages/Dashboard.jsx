import React, { useState, useEffect } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Calendar, TrendingUp, Users, CheckCircle, BarChart, Clock } from 'lucide-react';

const Dashboard = () => {
    const { dailyRecords, closedDays, dailyGroups } = useProductivity();
    const { employees } = useTeam();
    const { user } = useAuth();

    const [currentTime, setCurrentTime] = useState(new Date());
    // Mock Weather Data (Sevilla)
    const [weather] = useState({ temp: 24, condition: 'Soleado' });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- DATE HELPERS ---
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Month Start
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const currentDateStr = today.toISOString().split('T')[0];

    // Month Name
    const monthName = today.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // --- YESTERDAY STATS ---
    const isYesterdayClosed = closedDays.includes(yesterdayStr);
    let yesterdayTotalGroups = 0;
    const yesterdayEmpStats = {}; // { empId: { time: 0, groups: 0, name: '' } }

    // 1. Time from records match yesterday
    dailyRecords.forEach(r => {
        if (r.date === yesterdayStr) {
            if (!yesterdayEmpStats[r.employeeId]) yesterdayEmpStats[r.employeeId] = { time: 0, groups: 0, name: r.employeeName };
            yesterdayEmpStats[r.employeeId].time += r.durationSeconds;
        }
    });

    // 2. Groups from dailyGroups match yesterday
    Object.keys(dailyGroups).forEach(key => {
        const [empIdStr, date] = key.split(/-(.+)/);
        if (date === yesterdayStr) {
            const empId = parseInt(empIdStr);
            if (!yesterdayEmpStats[empId]) yesterdayEmpStats[empId] = { time: 0, groups: 0, name: 'Desconocido' };

            const raw = dailyGroups[key];
            let total = 0;
            if (typeof raw === 'number') {
                total = raw;
            } else {
                total = (raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0);
            }
            yesterdayEmpStats[empId].groups += total;
            yesterdayTotalGroups += total;
        }
    });

    const sortedYesterdayEmps = Object.values(yesterdayEmpStats).sort((a, b) => b.groups - a.groups);


    // --- MONTHLY STATS ---
    const getMonthlyStats = () => {
        const stats = {}; // { empId: { time, standard, jewelry, recoverable, total, days } }

        // Aggregate Time
        dailyRecords.forEach(r => {
            if (r.date >= firstDayOfMonth && r.date <= currentDateStr) {
                if (!stats[r.employeeId]) stats[r.employeeId] = { time: 0, standard: 0, jewelry: 0, recoverable: 0, total: 0, days: new Set(), name: r.employeeName };
                stats[r.employeeId].time += r.durationSeconds;
                stats[r.employeeId].days.add(r.date);
            }
        });

        // Aggregate Groups
        Object.keys(dailyGroups).forEach(key => {
            const [empIdStr, date] = key.split(/-(.+)/);
            if (date >= firstDayOfMonth && date <= currentDateStr) {
                const empId = parseInt(empIdStr);
                if (!stats[empId]) stats[empId] = { time: 0, standard: 0, jewelry: 0, recoverable: 0, total: 0, days: new Set(), name: '?' };

                const raw = dailyGroups[key];
                const val = typeof raw === 'number'
                    ? { standard: raw, jewelry: 0, recoverable: 0 }
                    : { standard: raw.standard || 0, jewelry: raw.jewelry || 0, recoverable: raw.recoverable || 0 };

                stats[empId].standard += val.standard;
                stats[empId].jewelry += val.jewelry;
                stats[empId].recoverable += val.recoverable;
                stats[empId].total += (val.standard + val.jewelry + val.recoverable);
            }
        });

        return stats;
    };

    const monthlyStats = getMonthlyStats();
    const sortedMonthlyEmps = Object.keys(monthlyStats)
        .map(id => ({ ...monthlyStats[id], id }))
        .sort((a, b) => b.total - a.total);


    return (
        <div className="space-y-8 pb-10">
            {/* HERO SECTION */}
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-blue-900 to-slate-900 p-10 text-white shadow-2xl border border-blue-800/50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
                            Hola, <span className="text-blue-400">{user?.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-xl text-blue-200/80 font-medium">Bienvenido a tu panel de control.</p>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/10">
                                <Calendar className="text-blue-300" size={24} />
                                <div>
                                    <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Fecha</p>
                                    <p className="text-lg font-bold">{currentTime.toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/10">
                                <Sun className="text-amber-400" size={24} />
                                <div>
                                    <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Sevilla</p>
                                    <p className="text-lg font-bold">{weather.temp}°C {weather.condition}</p>
                                </div>
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-5xl font-mono font-bold text-white/90">{currentTime.toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* YESTERDAY SUMMARY - COL 1 */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" /> Resumen Ayer
                    </h2>

                    <div className="bg-slate-950/50 rounded-3xl p-6 border border-slate-800/50 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                        {!isYesterdayClosed && <div className="absolute top-4 right-4 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/30">Sin cerrar</div>}
                        {isYesterdayClosed && <div className="absolute top-4 right-4 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1"><CheckCircle size={10} /> Cerrado</div>}

                        <div className="text-slate-400 font-medium text-sm uppercase tracking-widest mt-2">Total Grupos</div>
                        <div className="text-7xl font-bold text-white tracking-tighter drop-shadow-lg">
                            {yesterdayTotalGroups}
                        </div>
                        <div className="w-full mt-4 space-y-3">
                            {sortedYesterdayEmps.slice(0, 3).map((emp, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2 last:border-0">
                                    <span className="text-slate-300 font-bold">{emp.name}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{emp.groups}</span>
                                </div>
                            ))}
                            {sortedYesterdayEmps.length === 0 && <div className="text-center text-slate-500 text-xs italic">Sin actividad</div>}
                        </div>
                    </div>
                </div>

                {/* MONTHLY STATS - COL 2 & 3 */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
                            <BarChart className="text-blue-500" /> Mensual ({capitalizedMonth})
                        </h2>
                    </div>

                    <div className="bg-slate-950/50 rounded-3xl border border-slate-800/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 bg-slate-900/30">
                                        <th className="p-4">Empleado</th>
                                        <th className="p-4 text-center">Tiempo</th>
                                        <th className="p-4 text-center text-blue-400">Gen</th>
                                        <th className="p-4 text-center text-purple-400">Joy</th>
                                        <th className="p-4 text-center text-amber-400">Rec</th>
                                        <th className="p-4 text-center text-emerald-400">Total</th>
                                        <th className="p-4 text-right">G/H</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30 text-sm">
                                    {sortedMonthlyEmps.map(emp => {
                                        const employee = employees.find(e => e.id === parseInt(emp.id));
                                        const name = employee ? (employee.alias || employee.firstName) : emp.name;
                                        const hours = emp.time / 3600;
                                        const gph = hours > 0 ? (emp.total / hours).toFixed(1) : '0.0';

                                        return (
                                            <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold text-slate-300">{name}</td>
                                                <td className="p-4 text-center font-mono text-slate-400">{Math.round(hours)}h</td>
                                                <td className="p-4 text-center font-mono text-blue-300/70">{emp.standard}</td>
                                                <td className="p-4 text-center font-mono text-purple-300/70">{emp.jewelry}</td>
                                                <td className="p-4 text-center font-mono text-amber-300/70">{emp.recoverable}</td>
                                                <td className="p-4 text-center font-bold text-emerald-400">{emp.total}</td>
                                                <td className="p-4 text-right font-mono text-slate-300">{gph}</td>
                                            </tr>
                                        );
                                    })}
                                    {sortedMonthlyEmps.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-8 text-center text-slate-500 italic">No hay datos este mes.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
