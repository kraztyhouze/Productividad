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

// Helper: format date to YYYY-MM-DD in Madrid timezone
const formatDate = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

// ─── Radial Progress Ring ─────────────────────────────────────────────────────
const RadialProgress = ({ value, max = 100, size = 120, stroke = 10, color = '#FF8C9D', label, sublabel }) => {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    const dash = pct * circ;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90" style={{ display: 'block' }}>
                    {/* Track */}
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
                    {/* Progress */}
                    <circle
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-[#1A365D]">{value}</span>
                    {sublabel && <span className="text-[10px] text-[#A0AEC0] uppercase tracking-wider">{sublabel}</span>}
                </div>
            </div>
            {label && <p className="text-xs font-semibold text-[#718096] text-center">{label}</p>}
        </div>
    );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard = ({ title, value, subValue, icon: Icon, accentColor = '#FF8C9D', trend }) => (
    <div
        className="bg-white rounded-xl p-5 flex flex-col justify-between gap-4 transition-shadow duration-200 cursor-default"
        style={{ boxShadow: 'var(--shadow-card)' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-hover)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
    >
        <div className="flex justify-between items-start">
            <p className="text-xs font-bold uppercase tracking-widest text-[#A0AEC0]">{title}</p>
            <div
                className="p-2 rounded-lg"
                style={{ background: `${accentColor}18` }}
            >
                <Icon size={18} style={{ color: accentColor }} />
            </div>
        </div>
        <div>
            <h3 className="text-3xl font-black text-[#1A365D] leading-none mb-1">{value}</h3>
            <div className="flex items-center gap-2">
                {trend !== undefined && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(trend)}%
                    </span>
                )}
                {subValue && <p className="text-xs text-[#718096]">{subValue}</p>}
            </div>
        </div>
    </div>
);

// ─── Card Wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, className = '', style = {} }) => (
    <div
        className={`bg-white rounded-xl p-6 ${className}`}
        style={{ boxShadow: 'var(--shadow-card)', ...style }}
    >
        {children}
    </div>
);

const CardTitle = ({ children, icon: Icon, iconColor = '#A0AEC0' }) => (
    <h3 className="text-sm font-bold text-[#718096] uppercase tracking-widest mb-5 flex items-center gap-2">
        {Icon && <Icon size={14} style={{ color: iconColor }} />}
        {children}
    </h3>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { dailyRecords, dailyGroups, activeSessions, closedDays } = useProductivity();
    const { employees } = useTeam();
    const { user } = useAuth();
    const { currentStore } = useStore();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ── Extended Stats ──────────────────────────────────────────────────────
    const [extendedStats, setExtendedStats] = useState({ yesterday: null, month: null, today: null, monthlyTop: [] });
    const [viewedData, setViewedData] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            const storeId = currentStore || localStorage.getItem('tiktak_current_store') || 'store_1';
            const headers = { 'x-store-id': storeId };
            const todayDate = new Date();
            const todayStr = formatDate(todayDate);
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = formatDate(yesterdayDate);
            const monthStr = todayStr.substring(0, 7);

            try {
                const [dayRes, monthRes] = await Promise.all([
                    fetch(`/api/dashboard/stats?date=${yesterdayStr}`, { headers, cache: 'no-store' }),
                    fetch(`/api/dashboard/stats?month=${monthStr}`, { headers, cache: 'no-store' })
                ]);
                const dayData = await dayRes.json();
                const monthData = await monthRes.json();

                let currentViewData = null;
                if (selectedDate === todayStr) {
                    currentViewData = null;
                } else if (selectedDate === yesterdayStr) {
                    currentViewData = dayData.dailyStats;
                } else {
                    const selRes = await fetch(`/api/dashboard/stats?date=${selectedDate}`, { headers, cache: 'no-store' });
                    const selJson = await selRes.json();
                    currentViewData = selJson.dailyStats;
                }

                const todayRes = await fetch(`/api/dashboard/stats?date=${todayStr}`, { headers, cache: 'no-store' });
                const todayJson = await todayRes.json();

                setExtendedStats({ yesterday: dayData, month: monthData, today: todayJson, monthlyTop: monthData.monthlyTop || [] });
                if (selectedDate !== todayStr) setViewedData(currentViewData);
                else setViewedData(null);
            } catch (e) { console.error('Stats fetch error', e); }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 180000);
        return () => clearInterval(interval);
    }, [currentStore, selectedDate]);

    // ── Data Aggregation ────────────────────────────────────────────────────
    const todayStr = formatDate(new Date());
    const isToday = selectedDate === todayStr;

    const sourceGroups = isToday ? dailyGroups : (viewedData?.employeeGroups || {});
    const sourceRecords = isToday ? dailyRecords : (viewedData?.dailyRecords || []);
    const sourceSessions = isToday ? activeSessions : (viewedData?.activeSessions || []);

    let todayGroups = 0, todayJewelry = 0, todayStandard = 0, todayRecoverable = 0;
    let todayClientSeconds = 0, todayShiftSeconds = 0, todayNoDeals = 0;

    Object.keys(sourceGroups).forEach(key => {
        if (key.slice(-10) === todayStr) {
            const raw = sourceGroups[key];
            const data = typeof raw === 'number'
                ? { standard: raw, jewelry: 0, recoverable: 0, clientSeconds: 0, noDeal: 0 }
                : { standard: raw.standard || 0, jewelry: raw.jewelry || 0, recoverable: raw.recoverable || 0, clientSeconds: raw.clientSeconds || 0, noDeal: raw.noDeal || 0 };
            todayGroups += (data.standard + data.jewelry + data.recoverable);
            todayJewelry += data.jewelry;
            todayStandard += data.standard;
            todayRecoverable += data.recoverable;
            todayClientSeconds += data.clientSeconds;
            todayNoDeals += data.noDeal;
        }
    });

    sourceRecords.forEach(r => { if (r.date === todayStr) todayShiftSeconds += r.durationSeconds; });

    if (sourceSessions) {
        sourceSessions.forEach(s => {
            todayShiftSeconds += (currentTime - new Date(s.startTime)) / 1000;
            if (s.clientStartTime) todayClientSeconds += (currentTime - new Date(s.clientStartTime)) / 1000;
        });
    }

    const efficiency = todayShiftSeconds > 0 ? ((todayClientSeconds / todayShiftSeconds) * 100).toFixed(1) : 0;
    const jewelryMix = todayGroups > 0 ? ((todayJewelry / todayGroups) * 100).toFixed(1) : 0;
    const groupsPerHour = todayClientSeconds > 0 ? (todayGroups / (todayClientSeconds / 3600)).toFixed(2) : '0.0';
    const totalInteractions = todayGroups + todayNoDeals;
    const hitRate = totalInteractions > 0 ? ((todayGroups / totalInteractions) * 100).toFixed(1) : 0;
    const recoverableRate = todayGroups > 0 ? ((todayRecoverable / todayGroups) * 100).toFixed(1) : 0;

    // Yesterday comparison
    const yesterdayTotal = extendedStats.yesterday?.totalGroups || 0;
    const todayVsYesterday = yesterdayTotal > 0 ? (((todayGroups - yesterdayTotal) / yesterdayTotal) * 100).toFixed(0) : null;

    // Weekly chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        let dayGroups = 0;
        Object.keys(dailyGroups).forEach(key => {
            if (key.endsWith(`-${dateStr}`)) {
                const raw = dailyGroups[key];
                dayGroups += typeof raw === 'number' ? raw : ((raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0));
            }
        });
        last7Days.push({ date: dateStr, label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }), groups: dayGroups });
    }

    // Hourly chart
    const hourlyData = [];
    for (let h = 10; h <= 21; h++) {
        hourlyData.push({
            hour: `${h}h`,
            today: extendedStats.today?.hourlyStats?.hourly?.[h] || 0,
            yesterday: extendedStats.yesterday?.hourlyStats?.hourly?.[h] || 0
        });
    }

    // Donut data
    const categoryData = [
        { name: 'General', value: todayStandard, color: '#A0AEC0' },
        { name: 'Joyería', value: todayJewelry, color: '#ECC94B' },
        { name: 'Recuperable', value: todayRecoverable, color: '#4299E1' },
    ].filter(d => d.value > 0);

    // Leaderboard
    const activeEmpIds = new Set(sourceSessions?.map(s => parseInt(s.employeeId)) || []);
    const leaderboard = employees
        .filter(emp => emp.isBuyer)
        .map(emp => {
            const key = `${emp.id}-${todayStr}`;
            const raw = sourceGroups[key];
            const groups = raw ? (typeof raw === 'number' ? raw : ((raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0))) : 0;
            return { ...emp, groups };
        })
        .filter(emp => emp.groups > 0 || activeEmpIds.has(emp.id))
        .sort((a, b) => b.groups - a.groups)
        .slice(0, 5);

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-12 animate-in">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#1A365D] flex items-center gap-2">
                        Dashboard
                    </h1>
                    <p className="text-sm text-[#718096] mt-0.5">
                        Resumen en tiempo real · <span className="font-semibold text-[#1A365D]">{todayStr}</span>
                    </p>
                </div>

                {/* Live clock */}
                <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <Clock size={15} className="text-[#A0AEC0]" />
                    <span className="font-mono text-lg font-bold text-[#1A365D]">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#48BB78] animate-soft-pulse" />
                </div>
            </div>

            {/* ── KPI GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Compras"
                    value={todayGroups}
                    subValue={`${groupsPerHour} G/h`}
                    icon={ShoppingBag}
                    accentColor="#FF8C9D"
                    trend={todayVsYesterday !== null ? Number(todayVsYesterday) : undefined}
                />
                <KPICard
                    title="Tiempo Comprando"
                    value={extendedStats.today?.timeStats?.unionSeconds
                        ? `${Math.floor(extendedStats.today.timeStats.unionSeconds / 3600)}h ${Math.floor((extendedStats.today.timeStats.unionSeconds % 3600) / 60)}m`
                        : `${Math.floor(todayClientSeconds / 3600)}h ${Math.floor((todayClientSeconds % 3600) / 60)}m`
                    }
                    subValue="Tiempo productivo unión"
                    icon={Clock}
                    accentColor="#4299E1"
                />
                <KPICard
                    title="Eficacia Global"
                    value={`${efficiency}%`}
                    subValue="% tiempo productivo"
                    icon={TrendingUp}
                    accentColor="#48BB78"
                />
                <KPICard
                    title="Mix Joyería"
                    value={`${jewelryMix}%`}
                    subValue={`${todayJewelry} grupos joya`}
                    icon={Gem}
                    accentColor="#ECC94B"
                />
            </div>

            {/* ── STATS BAR ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Hoy vs Ayer */}
                <Card className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#A0AEC0]">Hoy vs Ayer</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${Number(todayVsYesterday) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {todayVsYesterday !== null ? `${todayVsYesterday > 0 ? '+' : ''}${todayVsYesterday}%` : '—'}
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-[#1A365D]">{todayGroups}</span>
                        <span className="text-lg font-light text-[#A0AEC0] mb-0.5">vs {yesterdayTotal}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0]">
                        {[
                            { label: 'Joya', val: todayJewelry, prev: extendedStats.yesterday?.groupsBreakdown?.jewelry || 0, color: '#ECC94B' },
                            { label: 'Std', val: todayStandard, prev: extendedStats.yesterday?.groupsBreakdown?.standard || 0, color: '#A0AEC0' },
                            { label: 'Recup', val: todayRecoverable, prev: extendedStats.yesterday?.groupsBreakdown?.recoverable || 0, color: '#4299E1' },
                        ].map(item => (
                            <div key={item.label} className="text-center bg-[#F4F7FA] rounded-lg py-1.5">
                                <p className="text-[10px] text-[#A0AEC0] font-semibold">{item.label}</p>
                                <p className="text-sm font-bold" style={{ color: item.color }}>{item.val}</p>
                                <p className="text-[9px] text-[#CBD5E0]">/{item.prev}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Mes Actual */}
                <Card className="flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-[#A0AEC0] mb-2">Mes Actual</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-[#1A365D]">
                                    {extendedStats.month?.monthStats?.totalGroups || 0}
                                </span>
                                <span className="text-xs font-bold text-[#A0AEC0] uppercase">compras</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-[#A0AEC0] mb-1">Mejor día</p>
                            <p className="text-xl font-black text-[#1A365D]">{extendedStats.month?.monthStats?.maxDailyGroups || '—'}</p>
                        </div>
                    </div>
                    {/* Month progress bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] text-[#A0AEC0] mb-1">
                            <span>Progreso del mes</span>
                            <span>{new Date().getDate()} / {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} días</span>
                        </div>
                        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[#FF8C9D] transition-all duration-500"
                                style={{ width: `${(new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100}%` }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Pico Simultáneo */}
                <Card>
                    <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#A0AEC0]">Pico Simultáneo</p>
                        <Users size={14} className="text-[#FF8C9D]" />
                    </div>
                    <div className="flex items-end gap-2 mb-3">
                        <span className="text-3xl font-black text-[#1A365D]">
                            {extendedStats.today?.timeStats?.maxConcurrent || 0}
                        </span>
                        <span className="text-xs text-[#A0AEC0] mb-1">compradores a la vez</span>
                    </div>
                    <div className="flex -space-x-2">
                        {extendedStats.today?.timeStats?.peakUsers?.length > 0 ? (
                            extendedStats.today.timeStats.peakUsers.slice(0, 6).map((uid, i) => {
                                const emp = employees.find(e => String(e.id) === String(uid));
                                return (
                                    <div
                                        key={i}
                                        title={emp?.alias}
                                        className="w-7 h-7 rounded-full bg-[#F4F7FA] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#718096]"
                                    >
                                        {emp?.alias?.charAt(0) || '?'}
                                    </div>
                                );
                            })
                        ) : (
                            <span className="text-[10px] text-[#CBD5E0] italic">Sin datos de pico</span>
                        )}
                    </div>
                </Card>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT: Charts (2/3) */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* Weekly Trend */}
                    <Card>
                        <CardTitle icon={Calendar} iconColor="#A0AEC0">Tendencia Semanal — Compras</CardTitle>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={last7Days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradWeekly" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FF8C9D" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#FF8C9D" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" stroke="#CBD5E0" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                                    <YAxis stroke="#CBD5E0" fontSize={11} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#1A365D', fontSize: 12 }}
                                        itemStyle={{ color: '#FF8C9D', fontWeight: 700 }}
                                        cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                                    />
                                    <Area
                                        type="monotone" dataKey="groups"
                                        stroke="#FF8C9D" strokeWidth={3}
                                        fill="url(#gradWeekly)" fillOpacity={1}
                                        activeDot={{ r: 5, fill: '#FF8C9D', strokeWidth: 2, stroke: '#fff' }}
                                        dot={false}
                                        animationDuration={1200}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Hourly Comparison */}
                    <Card>
                        <div className="flex justify-between items-center mb-5">
                            <CardTitle icon={Clock} iconColor="#4299E1">Evolución Horaria</CardTitle>
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-[#A0AEC0]">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-1 rounded-full bg-[#CBD5E0]" /> Ayer
                                </span>
                                <span className="flex items-center gap-1.5" style={{ color: '#FF8C9D' }}>
                                    <span className="w-2.5 h-1 rounded-full bg-[#FF8C9D]" /> Hoy
                                </span>
                            </div>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradToday" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FF8C9D" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#FF8C9D" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradYesterday" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#CBD5E0" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#CBD5E0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hour" stroke="#CBD5E0" fontSize={10} tickLine={false} axisLine={false} dy={6} />
                                    <YAxis stroke="#CBD5E0" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#1A365D', fontSize: 12 }}
                                        cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                                    />
                                    <Area type="monotone" dataKey="yesterday" stroke="#CBD5E0" strokeWidth={2} fill="url(#gradYesterday)" fillOpacity={1} dot={false} />
                                    <Area type="monotone" dataKey="today" stroke="#FF8C9D" strokeWidth={3} fill="url(#gradToday)" fillOpacity={1} activeDot={{ r: 5, fill: '#FF8C9D', strokeWidth: 2, stroke: '#fff' }} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Turnos */}
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
                            {[
                                { label: 'Mañana', today: extendedStats.today?.hourlyStats?.shifts?.morning || 0, yesterday: extendedStats.yesterday?.hourlyStats?.shifts?.morning || 0 },
                                { label: 'Tarde', today: extendedStats.today?.hourlyStats?.shifts?.afternoon || 0, yesterday: extendedStats.yesterday?.hourlyStats?.shifts?.afternoon || 0 },
                            ].map(s => (
                                <div key={s.label} className="flex flex-col items-center bg-[#F4F7FA] rounded-xl py-3">
                                    <p className="text-[10px] text-[#A0AEC0] font-bold uppercase tracking-wider mb-1">{s.label}</p>
                                    <div className="flex items-end gap-1.5">
                                        <span className="text-xl font-black text-[#1A365D]">{s.today}</span>
                                        <span className="text-xs text-[#A0AEC0] mb-0.5">vs {s.yesterday}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Distribución + Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Donut */}
                        <Card className="flex flex-col">
                            <CardTitle>Distribución Hoy</CardTitle>
                            <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                                {todayGroups === 0 ? (
                                    <p className="text-[#CBD5E0] text-sm italic">Sin datos hoy</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%" cy="50%"
                                                innerRadius={55} outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                                animationBegin={0}
                                                animationDuration={800}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: 12, color: '#1A365D' }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={val => <span style={{ color: '#718096', fontSize: 11, fontWeight: 600 }}>{val}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                {todayGroups > 0 && (
                                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <p className="text-2xl font-black text-[#1A365D]">{todayGroups}</p>
                                        <p className="text-[9px] uppercase text-[#A0AEC0] font-semibold tracking-wider">Total</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Métricas de calidad */}
                        <Card className="flex flex-col justify-between">
                            <CardTitle>Métricas de Calidad</CardTitle>
                            <div className="flex flex-col gap-4">
                                {[
                                    { label: 'Ratio Conversión', sub: 'Hit Rate', value: `${hitRate}%`, pct: Number(hitRate), color: '#48BB78', bg: '#F0FFF4', icon: TrendingUp },
                                    { label: '% Recuperable', sub: 'Volverán', value: `${recoverableRate}%`, pct: Number(recoverableRate), color: '#4299E1', bg: '#EBF8FF', icon: RefreshCw },
                                ].map(m => (
                                    <div key={m.label} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: m.bg }}>
                                        <div className="p-2 rounded-lg bg-white shadow-sm">
                                            <m.icon size={16} style={{ color: m.color }} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-[#718096] font-medium mb-0.5">{m.label}</p>
                                            <div className="flex items-baseline gap-1.5">
                                                <p className="text-xl font-black" style={{ color: m.color }}>{m.value}</p>
                                                <p className="text-xs text-[#A0AEC0]">{m.sub}</p>
                                            </div>
                                            {/* Mini bar */}
                                            <div className="h-1 mt-2 bg-white rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.pct}%`, background: m.color }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                    </div>
                </div>

                {/* RIGHT: Live + Ranking (1/3) */}
                <div className="flex flex-col gap-6">

                    {/* Live Activity */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-[#48BB78] animate-soft-pulse" />
                            <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-widest">Compras en Curso</p>
                        </div>

                        <div className="space-y-2.5 min-h-[80px]">
                            {sourceSessions && sourceSessions.filter(s => s.clientStartTime).length > 0 ? (
                                sourceSessions.filter(s => s.clientStartTime).map(s => {
                                    const mins = Math.floor((currentTime - new Date(s.clientStartTime)) / 60000);
                                    return (
                                        <div key={s.employeeId} className="flex items-center gap-3 p-3 bg-[#F4F7FA] rounded-xl border border-[#E2E8F0]">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF8C9D] to-[#e87589] flex items-center justify-center font-bold text-white text-sm shrink-0">
                                                {s.employeeName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-[#1A365D] truncate">{s.employeeName}</p>
                                                <p className="text-xs text-[#48BB78] font-medium">Comprando · {mins}m</p>
                                            </div>
                                            <span className="w-2 h-2 rounded-full bg-[#48BB78] animate-soft-pulse shrink-0" />
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <ShoppingBag size={28} className="text-[#E2E8F0] mb-2" />
                                    <p className="text-xs text-[#CBD5E0] italic">Sin compras activas...</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Monthly Top */}
                    <Card className="flex-1 flex flex-col">
                        <CardTitle icon={ShoppingBag} iconColor="#FF8C9D">Top Mes — Compras</CardTitle>
                        <div className="space-y-2 flex-1 overflow-y-auto max-h-[480px] pr-1">
                            {[...extendedStats.monthlyTop]
                                .sort((a, b) => b.groups - a.groups)
                                .map((empData, index) => {
                                    const emp = employees.find(e => String(e.id) === String(empData.id)) || { alias: `Emp ${empData.id}` };
                                    const name = emp.alias || emp.firstName;
                                    const prod = empData.efficiency ? (empData.efficiency * 100).toFixed(0) : 0;
                                    const hours = empData.clientSeconds ? (empData.clientSeconds / 3600).toFixed(1) : '0.0';
                                    const medalColors = ['#ECC94B', '#A0AEC0', '#CD7F32'];
                                    const isMedal = index < 3;

                                    return (
                                        <div key={empData.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F4F7FA] transition-colors group cursor-default border border-transparent hover:border-[#E2E8F0]">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold shrink-0"
                                                    style={{
                                                        background: isMedal ? `${medalColors[index]}20` : '#F4F7FA',
                                                        color: isMedal ? medalColors[index] : '#A0AEC0'
                                                    }}
                                                >
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1A365D] group-hover:text-[#FF8C9D] transition-colors">{name}</p>
                                                    <p className="text-[10px] text-[#A0AEC0]">{hours}h comprando</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-[#1A365D] leading-none">{empData.groups}</p>
                                                    <p className="text-[9px] text-[#A0AEC0]">grupos</p>
                                                </div>
                                                <div
                                                    className="px-2 py-1 rounded-lg text-[10px] font-bold"
                                                    style={{
                                                        background: prod >= 70 ? '#F0FFF4' : prod >= 40 ? '#FFFFF0' : '#F4F7FA',
                                                        color: prod >= 70 ? '#48BB78' : prod >= 40 ? '#D69E2E' : '#A0AEC0'
                                                    }}
                                                >
                                                    {prod}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            {extendedStats.monthlyTop.length === 0 && (
                                <p className="text-xs text-[#CBD5E0] italic text-center py-12">Cargando datos del mes...</p>
                            )}
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
