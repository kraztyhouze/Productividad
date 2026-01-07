import React, { useState, useEffect } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Calendar, TrendingUp, Users, CheckCircle, BarChart as LucideBarChart, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Line, CartesianGrid, Legend } from 'recharts';

const Dashboard = () => {
    const { dailyRecords, closedDays, dailyGroups, activeSessions } = useProductivity();
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


    // --- LAST 7 DAYS & TODAY STATS ---
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        let groups = 0;
        Object.keys(dailyGroups).forEach(key => {
            const [_, kDate] = key.split(/-(.+)/);
            if (kDate === dateStr) {
                const raw = dailyGroups[key];
                groups += typeof raw === 'number' ? raw : ((raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0));
            }
        });
        last7Days.push({ date: dateStr.split('-').slice(1).join('/'), groups, fullDate: dateStr });
    }

    // --- TODAY STATS (Charts) ---
    // We need: Today's Total Groups, Today's Total Hours, and per Employee
    const todayStats = {};
    let todayTotalGroups = 0;

    // 1. Groups (Persistent)
    Object.keys(dailyGroups).forEach(key => {
        const [empIdStr, date] = key.split(/-(.+)/);
        if (date === currentDateStr) {
            const empId = parseInt(empIdStr);
            if (!todayStats[empId]) todayStats[empId] = { groups: 0, seconds: 0, id: empId };

            const raw = dailyGroups[key];
            const total = typeof raw === 'number' ? raw : ((raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0));
            todayStats[empId].groups += total;
            todayTotalGroups += total;
        }
    });

    // 2. Seconds (Historical + Active)
    dailyRecords.forEach(r => {
        if (r.date === currentDateStr) {
            if (!todayStats[r.employeeId]) todayStats[r.employeeId] = { groups: 0, seconds: 0, id: r.employeeId };
            todayStats[r.employeeId].seconds += r.durationSeconds;
        }
    });
    // Active Sessions (Live)
    if (activeSessions) {
        activeSessions.forEach(s => {
            const empId = parseInt(s.employeeId);
            if (!todayStats[empId]) todayStats[empId] = { groups: 0, seconds: 0, id: empId };
            const duration = (currentTime - new Date(s.startTime)) / 1000;
            todayStats[empId].seconds += duration;
        });
    }

    // Prepare Chart Data
    // (Import moved to top)

    const todayChartData = Object.values(todayStats).map(stat => {
        const emp = employees.find(e => e.id === stat.id);
        const hours = stat.seconds / 3600;
        const gph = hours > 0.1 ? (stat.groups / hours) : 0;
        return {
            name: emp ? (emp.alias || emp.firstName) : `Emp ${stat.id}`,
            groups: stat.groups,
            hours: parseFloat(hours.toFixed(1)),
            gph: parseFloat(gph.toFixed(1))
        };
    }).sort((a, b) => b.groups - a.groups);

    const totalHoursToday = todayChartData.reduce((acc, curr) => acc + curr.hours, 0);
    const globalGPH = totalHoursToday > 0 ? (todayTotalGroups / totalHoursToday).toFixed(2) : "0.00";

    return (
        <div className="space-y-8 pb-10">
            {/* HERO SECTION */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1e293b]/60 backdrop-blur-xl p-8 text-white border border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between xl:items-end gap-8">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Panel de Control</h1>
                        <p className="text-slate-400 font-medium">
                            Hola <span className="text-pink-400 font-bold">{user?.name?.split(' ')[0]}</span>. Aquí tienes el pulso de hoy.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 min-w-[140px]">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Hoy</p>
                            <p className="text-3xl font-black text-white">{todayTotalGroups} <span className="text-sm font-normal text-slate-500">grupos</span></p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 min-w-[140px]">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Ritmo Global</p>
                            <p className="text-3xl font-black text-amber-500">{globalGPH} <span className="text-sm font-normal text-slate-500">G/h</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 1: LIVE ACTIVITY & CHARTS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* COL 1: LIVE ATTENDING + LAST 7 DAYS */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    {/* Live Attending */}
                    <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-3xl p-6 border border-white/5">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-green-500 animate-pulse" /> En Directo (Comprando)
                        </h2>
                        <div className="flex flex-col gap-3">
                            {(() => {
                                const activeBuying = activeSessions?.filter(s => s.clientStartTime) || [];
                                if (activeBuying.length === 0) return <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">Sin actividad de compra ahora.</div>

                                return activeBuying.map(s => {
                                    const start = new Date(s.clientStartTime).getTime();
                                    const mins = Math.floor((currentTime - start) / 60000);
                                    // Find current G/H for live indicator
                                    const empStats = todayChartData.find(d => d.name === s.employeeName) || { gph: 0 };

                                    return (
                                        <div key={s.employeeId} className="bg-slate-800 p-4 rounded-2xl flex items-center justify-between border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center font-bold">
                                                    {s.employeeName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{s.employeeName}</p>
                                                    <p className="text-[10px] text-green-400 font-mono animate-pulse">{mins} min activo</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">Ritmo</p>
                                                <p className="text-lg font-mono font-bold text-white">{empStats.gph} G/h</p>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Last 7 Days Chart */}
                    <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex-1 min-h-[300px]">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-pink-500" /> Últimos 7 Días
                        </h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={last7Days}>
                                    <defs>
                                        <linearGradient id="colorGroups" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="groups" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorGroups)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* COL 2 & 3: TODAY'S PRODUCTIVITY CHARTS */}
                <div className="xl:col-span-2 bg-[#1e293b]/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <LucideBarChart size={24} className="text-amber-500" /> Productividad Hoy (Individual)
                        </h2>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <span className="w-3 h-3 bg-pink-500 rounded-sm"></span> Grupos
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <span className="w-3 h-3 bg-amber-500 rounded-full"></span> Tiempo (h)
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={todayChartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid stroke="#334155" opacity={0.3} horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#e2e8f0" fontSize={11} width={100} tickLine={false} axisLine={false} fontWeight={600} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                                <Bar dataKey="groups" name="Grupos" barSize={20} fill="#ec4899" radius={[0, 4, 4, 0]} />
                                <Line dataKey="hours" name="Horas" type="monotone" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* TOTAL SUMMARY FOOTER */}
                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Total Horas (Equipo)</p>
                            <p className="text-2xl font-mono font-bold text-white">{totalHoursToday.toFixed(1)}h</p>
                        </div>
                        <div className="text-center border-l border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Eficiencia Pura</p>
                            <p className="text-2xl font-mono font-bold text-amber-500">{globalGPH}</p>
                            <p className="text-[10px] text-slate-600">Grupos / Hora-Hombre</p>
                        </div>
                        <div className="text-center border-l border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Proyección (Cierre)</p>
                            <p className="text-2xl font-mono font-bold text-blue-400">{(todayTotalGroups * 1.2).toFixed(0)}?</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
