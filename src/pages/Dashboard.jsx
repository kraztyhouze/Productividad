import React, { useState, useEffect } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import {
    TrendingUp, Users, Clock, ShoppingBag,
    Activity, Gem, Package, RefreshCw,
    ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { useStore } from '../context/StoreContext';

const Dashboard = () => {
    const { dailyRecords, dailyGroups, activeSessions, closedDays } = useProductivity();
    const { employees } = useTeam();
    const { user } = useAuth();

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- FETCH EXTENDED STATS ---
    const [extendedStats, setExtendedStats] = useState({
        yesterday: null,
        month: null,
        monthlyTop: []
    });
    const { currentStore } = useStore(); // Need this for headers if calling manually, but we can reuse context helper if exposed or just fetch.
    // Dashboard doesn't import useStore directly but useProductivity, let's just use fetch relative.

    useEffect(() => {
        const fetchStats = async () => {
            const storeId = localStorage.getItem('tiktak_current_store') || 'store_1'; // Fallback
            const headers = { 'x-store-id': storeId };
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
            const monthStr = todayStr.substring(0, 7);

            try {
                // Parallel fetch
                const [dayRes, monthRes] = await Promise.all([
                    fetch(`/api/dashboard/stats?date=${yesterdayStr}`, { headers }),
                    fetch(`/api/dashboard/stats?month=${monthStr}`, { headers })
                ]);

                const todayRes = await fetch(`/api/dashboard/stats?date=${todayStr}`, { headers });

                const dayData = await dayRes.json();
                const monthData = await monthRes.json();
                const todayData = await todayRes.json();

                setExtendedStats({
                    yesterday: dayData,
                    month: monthData,
                    today: todayData, // For union time/concurrency
                    monthlyTop: monthData.monthlyTop || []
                });
            } catch (e) { console.error("Stats fetch error", e); }
        };
        fetchStats();
        // Refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- DATA AGGREGATION HELPERS ---
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Calculate Today's Metrics
    let todayGroups = 0;
    let todayJewelry = 0;
    let todayStandard = 0;
    let todayRecoverable = 0;
    let todayClientSeconds = 0; // Time spending shopping
    let todayShiftSeconds = 0;  // Total clocked time
    let todayNoDeals = 0;       // Missed opportunities

    // From Daily Groups (Completed Transactions)
    Object.keys(dailyGroups).forEach(key => {
        const [empIdStr, date] = key.split(/-(.+)/);
        if (date === todayStr) {
            const raw = dailyGroups[key];
            const data = typeof raw === 'number'
                ? { standard: raw, jewelry: 0, recoverable: 0, clientSeconds: 0, noDeal: 0 }
                : {
                    standard: raw.standard || 0,
                    jewelry: raw.jewelry || 0,
                    recoverable: raw.recoverable || 0,
                    clientSeconds: raw.clientSeconds || 0,
                    noDeal: raw.noDeal || 0
                };

            todayGroups += (data.standard + data.jewelry + data.recoverable);
            todayJewelry += data.jewelry;
            todayStandard += data.standard;
            todayRecoverable += data.recoverable;
            todayClientSeconds += data.clientSeconds;
            todayNoDeals += data.noDeal;
        }
    });

    // From Daily Records (Shift Time - Finished)
    dailyRecords.forEach(r => {
        if (r.date === todayStr) {
            todayShiftSeconds += r.durationSeconds;
        }
    });

    // From Active Sessions (Live Data)
    if (activeSessions) {
        activeSessions.forEach(s => {
            const duration = (currentTime - new Date(s.startTime)) / 1000;
            todayShiftSeconds += duration;

            if (s.clientStartTime) {
                const clientDuration = (currentTime - new Date(s.clientStartTime)) / 1000;
                todayClientSeconds += clientDuration;
            }
        });
    }

    // Derived Metrics
    const efficiency = todayShiftSeconds > 0 ? ((todayClientSeconds / todayShiftSeconds) * 100).toFixed(1) : 0;
    const jewelryMix = todayGroups > 0 ? ((todayJewelry / todayGroups) * 100).toFixed(1) : 0;
    const groupsPerHour = todayClientSeconds > 0 ? (todayGroups / (todayClientSeconds / 3600)).toFixed(2) : "0.0";

    // New Quality Metrics
    const totalInteractions = todayGroups + todayNoDeals;
    const hitRate = totalInteractions > 0 ? ((todayGroups / totalInteractions) * 100).toFixed(1) : 0;
    const recoverableRate = todayGroups > 0 ? ((todayRecoverable / todayGroups) * 100).toFixed(1) : 0;

    // 2. Weekly Trend Data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

        let dayGroups = 0;
        Object.keys(dailyGroups).forEach(key => {
            if (key.endsWith(`-${dateStr}`)) {
                const raw = dailyGroups[key];
                const val = typeof raw === 'number'
                    ? raw
                    : ((raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0));
                dayGroups += val;
            }
        });
        last7Days.push({ date: dateStr, label: dayLabel, groups: dayGroups });
    }

    // 3. Category Data (Donut)
    const categoryData = [
        { name: 'General', value: todayStandard, color: '#94a3b8' }, // Slate 400
        { name: 'Joyería', value: todayJewelry, color: '#f59e0b' }, // Amber 500
        { name: 'Recuperable', value: todayRecoverable, color: '#3b82f6' }, // Blue 500
    ].filter(d => d.value > 0);

    // 4. Leaderboard (Groups Today)
    const activeEmpIds = new Set(activeSessions?.map(s => parseInt(s.employeeId)) || []);

    // We want all employees who have activity today OR are currently active
    const leaderboard = employees
        .filter(emp => emp.isBuyer)
        .map(emp => {
            // Calculate specific groups for this employee today
            let empGroups = 0;
            const key = `${emp.id}-${todayStr}`;
            const raw = dailyGroups[key];
            if (raw) {
                empGroups = typeof raw === 'number' ? raw : ((raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0));
            }
            return { ...emp, groups: empGroups };
        })
        .filter(emp => emp.groups > 0 || activeEmpIds.has(emp.id)) // Only show if they have done something or are here
        .sort((a, b) => b.groups - a.groups)
        .slice(0, 5); // Top 5


    // --- COMPONENTS ---

    const KPICard = ({ title, value, subValue, icon: Icon, colorClass, gradient }) => (
        <div className={`relative overflow-hidden rounded-2xl p-5 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform bg-[#1e293b]/60 backdrop-blur-xl`}>
            <div className={`absolute inset-0 opacity-10 ${gradient}`}></div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-white">{value}</h3>
                    {subValue && <p className={`text-xs font-mono mt-1 ${colorClass}`}>{subValue}</p>}
                </div>
                <div className={`p-3 rounded-xl bg-white/5 ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <Activity className="text-pink-500" />
                        Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm font-medium mt-1">
                        Resumen en tiempo real del <span className="text-slate-200 font-bold">{todayStr}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-[#1e293b]/50 px-4 py-2 rounded-xl border border-white/5 shadow-lg">
                    <Clock size={16} className="text-slate-400" />
                    <span className="font-mono text-xl font-bold text-white">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Compras"
                    value={todayGroups}
                    subValue={`${groupsPerHour} G/h (Ritmo)`}
                    icon={ShoppingBag}
                    colorClass="text-pink-500"
                    gradient="bg-gradient-to-br from-pink-500 to-purple-600"
                />
                <KPICard
                    title="Tiempo Comprando"
                    value={extendedStats.today?.timeStats?.unionSeconds
                        ? `${Math.floor(extendedStats.today.timeStats.unionSeconds / 3600)}h ${Math.floor((extendedStats.today.timeStats.unionSeconds % 3600) / 60)}m`
                        : `${Math.floor(todayClientSeconds / 3600)}h ${Math.floor((todayClientSeconds % 3600) / 60)}m`
                    }
                    subValue={extendedStats.today?.timeStats?.unionSeconds ? "Tiempo Real (Unión)" : "Acumulado Hoy"}
                    icon={Clock}
                    colorClass="text-blue-400"
                    gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                />
                <KPICard
                    title="Eficacia Global"
                    value={`${efficiency}%`}
                    subValue="% Tiempo productivo"
                    icon={TrendingUp}
                    colorClass="text-emerald-400"
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                />
                <KPICard
                    title="Mix Compras Joyería"
                    value={`${jewelryMix}%`}
                    subValue={`${todayJewelry} grupos joya`}
                    icon={Gem}
                    colorClass="text-amber-400"
                    gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                />
            </div>

            {/* EXTENDED STATS BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* COMPARISON BOX */}
                <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 flex flex-col justify-center gap-2">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Hoy vs Ayer</span>
                            <span className="text-xl font-black text-white">{todayGroups} <span className="text-sm font-normal text-slate-500">vs</span> {extendedStats.yesterday?.totalGroups || 0}</span>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${todayGroups >= (extendedStats.yesterday?.totalGroups || 0) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {extendedStats.yesterday?.totalGroups > 0 ? (((todayGroups - extendedStats.yesterday.totalGroups) / extendedStats.yesterday.totalGroups) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                    </div>
                    {/* Compact Breakdown */}
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                        <div className="bg-slate-800/50 rounded p-1">
                            <span className="text-slate-400 block">Joya</span>
                            <span className="text-amber-400 font-bold">{todayJewelry} <span className="text-slate-600">/ {extendedStats.yesterday?.groupsBreakdown?.jewelry || 0}</span></span>
                        </div>
                        <div className="bg-slate-800/50 rounded p-1">
                            <span className="text-slate-400 block">Std</span>
                            <span className="text-white font-bold">{todayStandard} <span className="text-slate-600">/ {extendedStats.yesterday?.groupsBreakdown?.standard || 0}</span></span>
                        </div>
                        <div className="bg-slate-800/50 rounded p-1">
                            <span className="text-slate-400 block">Recup</span>
                            <span className="text-blue-400 font-bold">{todayRecoverable} <span className="text-slate-600">/ {extendedStats.yesterday?.groupsBreakdown?.recoverable || 0}</span></span>
                        </div>
                    </div>
                </div>

                {/* MONTHLY STATS */}
                <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent"></div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Mes Actual</span>
                        <div className="flex items-baseline gap-2">
                            <span className="block text-2xl font-black text-white">
                                {extendedStats.monthlyTop?.reduce((acc, curr) => acc + curr.groups, 0) || 0}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Compras</span>
                        </div>
                    </div>
                    <div className="text-right z-10">
                        <span className="block text-[10px] text-slate-400 mb-1">Mejor Día</span>
                        <span className="text-sm font-bold text-white">{extendedStats.month?.monthStats?.maxDailyGroups || '-'}</span>
                    </div>
                </div>

                {/* PEAK USERS */}
                <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 flex flex-col justify-center relative">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pico Simultáneo</span>
                        <Users size={16} className="text-pink-500" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white leading-none">
                            {extendedStats.today?.timeStats?.maxConcurrent || 0}
                        </span>
                        <span className="text-[10px] text-slate-500 mb-1">Compradores a la vez</span>
                    </div>
                    <div className="mt-2 flex -space-x-2 overflow-hidden py-1">
                        {extendedStats.today?.timeStats?.peakUsers?.length > 0 ? (
                            extendedStats.today.timeStats.peakUsers.slice(0, 5).map((uid, i) => {
                                const emp = employees.find(e => String(e.id) === String(uid));
                                return (
                                    <div key={i} title={emp?.alias} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-[8px] text-white font-bold">
                                        {emp?.alias?.charAt(0) || '?'}
                                    </div>
                                )
                            })
                        ) : (
                            <span className="text-[10px] text-slate-600 italic">Sin datos de pico</span>
                        )}
                        {extendedStats.today?.timeStats?.peakUsers?.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold">
                                +{extendedStats.today.timeStats.peakUsers.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT SPLIT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT COLUMN (2/3) - CHARTS */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* WEEKLY TREND CHART */}
                    <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-xl relative overflow-hidden group min-h-[300px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar size={18} className="text-slate-400" />
                                Tendencia de Compras (Semanal)
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Grupos Diarios</span>
                            </div>
                        </div>

                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={last7Days}>
                                    <defs>
                                        <linearGradient id="colorGroups" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="label"
                                        stroke="#475569"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#475569"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                                        cursor={{ stroke: '#334155', strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="groups"
                                        stroke="#ec4899"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorGroups)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CATEGORY ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* DONUT CHART (Category Distribution) */}
                        <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-xl relative min-h-[300px] flex flex-col">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Distribución Hoy</h3>
                            <div className="flex-1 flex items-center justify-center relative">
                                {todayGroups === 0 ? (
                                    <div className="text-slate-600 text-xs italic">Sin datos hoy</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                                            <Legend
                                                verticalAlign="bottom"
                                                align="center"
                                                iconType="circle"
                                                formatter={(value) => <span className="text-slate-300 text-xs font-bold ml-1">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                {/* Center Label */}
                                {todayGroups > 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                        <span className="text-2xl font-black text-white">{todayGroups}</span>
                                        <span className="text-[10px] text-slate-500 uppercase">Total</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MINI STATS / INSIGHTS */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-[#1e293b]/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-xl flex-1 flex flex-col justify-center gap-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Métricas de Calidad</h3>

                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="p-3 bg-red-500/20 text-red-500 rounded-xl">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-0.5">Ratio Conversión</p>
                                        <p className="font-bold text-white text-lg">
                                            {hitRate}% <span className="text-xs font-normal text-slate-500">Hit Rate</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl">
                                        <RefreshCw size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-0.5">% Recuperable</p>
                                        <p className="font-bold text-white text-lg">
                                            {recoverableRate}% <span className="text-xs font-normal text-slate-500">Volverán</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN (1/3) - LIVE & RANKING */}
                <div className="flex flex-col gap-6">

                    {/* LIVE ACTIVITY */}
                    <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Compras en Curso
                        </h3>

                        <div className="space-y-3 min-h-[100px]">
                            {activeSessions && activeSessions.filter(s => s.clientStartTime).length > 0 ? (
                                activeSessions.filter(s => s.clientStartTime).map(s => {
                                    const mins = Math.floor((currentTime - new Date(s.clientStartTime)) / 60000);
                                    return (
                                        <div key={s.employeeId} className="flex items-center gap-4 p-3 bg-slate-800 rounded-2xl border border-white/5 shadow-lg animate-in slide-in-from-right duration-300">
                                            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-white border border-white/10">
                                                {s.employeeName.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-white text-sm">{s.employeeName}</p>
                                                <p className="text-xs text-green-400 font-mono">Comprando · {mins}m</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_currentColor]"></div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                                    <ShoppingBag size={32} className="mb-2" />
                                    <p className="text-xs">Sin compras activas...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MONTHLY LEADERBOARD */}
                    <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 shadow-xl flex-1 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={16} /> Top Mes (Productividad)
                        </h3>
                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {extendedStats.monthlyTop.map((empData, index) => {
                                const emp = employees.find(e => String(e.id) === String(empData.id)) || { alias: `Emp ${empData.id}` };
                                const name = emp.alias || emp.firstName;
                                const prod = empData.efficiency ? (empData.efficiency * 100).toFixed(0) : 0;

                                return (
                                    <div key={empData.id} className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors group cursor-default border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded ${index === 0 ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500'}`}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">Eficiencia: <span className={prod > 70 ? 'text-green-400' : 'text-slate-400'}>{prod}%</span></p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-white">{empData.groups} <span className="text-[10px] font-normal text-slate-500">gr.</span></span>
                                            <span className="text-[10px] text-blue-400 font-mono">{(empData.clientSeconds / 3600).toFixed(1)}h</span>
                                        </div>
                                    </div>
                                )
                            })}
                            {extendedStats.monthlyTop.length === 0 && (
                                <p className="text-xs text-slate-500 italic text-center py-12">Cargando datos del mes...</p>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Dashboard;
