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
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1e293b]/60 backdrop-blur-xl p-10 text-white border border-white/5 shadow-2xl relative">
                {/* Subtle Pink Glow - Left */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
                            Hola, <span className="text-pink-500">{user?.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-medium">Bienvenido a tu panel TikTak.</p>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="bg-slate-950/50 px-6 py-4 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-pink-500/20 transition-colors">
                                <Calendar className="text-pink-500" size={24} />
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Fecha</p>
                                    <p className="text-lg font-bold text-slate-200">{currentTime.toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="bg-slate-950/50 px-6 py-4 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-pink-500/20 transition-colors">
                                <Sun className="text-amber-500" size={24} />
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sevilla</p>
                                    <p className="text-lg font-bold text-slate-200">{weather.temp}°C {weather.condition}</p>
                                </div>
                            </div>
                            <div className="hidden lg:block ml-4">
                                <p className="text-5xl font-mono font-bold text-slate-700/50">{currentTime.toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* YESTERDAY SUMMARY - COL 1 */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                        <TrendingUp className="text-pink-500" /> Resumen Ayer
                    </h2>

                    <div className="bg-[#1e293b]/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:border-pink-500/20 transition-all duration-500">
                        {/* Status Badge */}
                        {!isYesterdayClosed && <div className="absolute top-4 right-4 text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">Sin cerrar</div>}
                        {isYesterdayClosed && <div className="absolute top-4 right-4 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1"><CheckCircle size={10} /> Cerrado</div>}

                        <div className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-4">Total Grupos</div>
                        <div className="text-7xl font-extrabold text-white tracking-tighter drop-shadow-2xl">
                            {yesterdayTotalGroups}
                        </div>

                        {/* Progress Bar Visual (Decorative) */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 mb-6 overflow-hidden">
                            <div className="h-full bg-pink-500/80 rounded-full" style={{ width: '75%' }}></div>
                        </div>

                        <div className="w-full space-y-3">
                            {sortedYesterdayEmps.slice(0, 3).map((emp, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                    <span className="text-slate-300 font-medium">{emp.name}</span>
                                    <span className="text-pink-400 font-mono font-bold">{emp.groups}</span>
                                </div>
                            ))}
                            {sortedYesterdayEmps.length === 0 && <div className="text-center text-slate-600 text-xs italic py-4">Sin actividad registrada</div>}
                        </div>
                    </div>
                </div>

                {/* MONTHLY STATS - COL 2 & 3 */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                            <BarChart className="text-pink-500 accent-glow" /> Mensual ({capitalizedMonth})
                        </h2>
                    </div>

                    <div className="bg-[#1e293b]/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[11px] font-bold text-slate-500 uppercase border-b border-white/5 bg-slate-900/20">
                                        <th className="p-5 pl-6">Empleado</th>
                                        <th className="p-5 text-center">Tiempo</th>
                                        <th className="p-5 text-center text-slate-400">Gen</th>
                                        <th className="p-5 text-center text-slate-400">Joy</th>
                                        <th className="p-5 text-center text-slate-400">Rec</th>
                                        <th className="p-5 text-center text-pink-500">Total</th>
                                        <th className="p-5 text-right pr-6">G/H</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {sortedMonthlyEmps.map(emp => {
                                        const employee = employees.find(e => e.id === parseInt(emp.id));
                                        const name = employee ? (employee.alias || employee.firstName) : emp.name;
                                        const hours = emp.time / 3600;
                                        const gph = hours > 0 ? (emp.total / hours).toFixed(1) : '0.0';

                                        return (
                                            <tr key={emp.id} className="hover:bg-pink-500/5 transition-colors group">
                                                <td className="p-5 pl-6 font-bold text-slate-200 group-hover:text-pink-200 transition-colors">{name}</td>
                                                <td className="p-5 text-center font-mono text-slate-500">{Math.round(hours)}h</td>
                                                <td className="p-5 text-center font-mono text-slate-400">{emp.standard}</td>
                                                <td className="p-5 text-center font-mono text-slate-400">{emp.jewelry}</td>
                                                <td className="p-5 text-center font-mono text-slate-400">{emp.recoverable}</td>
                                                <td className="p-5 text-center font-bold text-pink-500 text-lg">{emp.total}</td>
                                                <td className="p-5 text-right pr-6 font-mono text-slate-300">{gph}</td>
                                            </tr>
                                        );
                                    })}
                                    {sortedMonthlyEmps.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-slate-600 italic">No hay datos este mes.</td>
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
