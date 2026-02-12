import React, { useState } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { BarChart, FileText, Filter, Download, Trash2, Loader, Search, Gem, Package, FileSpreadsheet, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

const Reports = () => {
    const { dailyRecords, dailyGroups, activeSessions, deleteNoDeal } = useProductivity();
    const { employees } = useTeam();
    const { user } = useAuth();
    const { currentStore } = useStore();

    const isManagerial = user?.role === ROLES.MANAGER;

    if (!dailyRecords || !dailyGroups || !employees) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <Loader className="animate-spin" size={32} />
                <p>Cargando datos del informe...</p>
            </div>
        );
    }

    // ... rest of component logic ...

    // Date Range State
    // Default to current month (Local Time)
    const today = new Date();
    const firstDayOfMonth = format(startOfMonth(today), 'yyyy-MM-dd');
    const currentDay = format(today, 'yyyy-MM-dd');

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(currentDay);
    const [reportType, setReportType] = useState('performance'); // 'performance' | 'no-deals'
    const [noDealsData, setNoDealsData] = useState([]);
    const [noDealsTab, setNoDealsTab] = useState('jewelry');
    const [searchTerm, setSearchTerm] = useState('');



    // --- DATE PRESET LOGIC ---
    const [showPresets, setShowPresets] = useState(false);
    const presets = [
        { label: 'Hoy', value: 'today' },
        { label: 'Ayer', value: 'yesterday' },
        { label: 'Esta Semana', value: 'thisWeek' },
        { label: 'Semana Pasada', value: 'lastWeek' },
        { label: 'Este Mes', value: 'thisMonth' },
        { label: 'Mes Pasado', value: 'lastMonth' },
    ];

    const handlePreset = (preset) => {
        const today = new Date();
        let start, end;
        switch (preset) {
            case 'today':
                start = today; end = today; break;
            case 'yesterday':
                start = subDays(today, 1); end = subDays(today, 1); break;
            case 'thisWeek':
                start = startOfWeek(today, { weekStartsOn: 1 }); end = today; break;
            case 'lastWeek':
                start = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
                end = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
                break;
            case 'thisMonth':
                start = startOfMonth(today); end = today; break;
            case 'lastMonth':
                start = startOfMonth(subMonths(today, 1));
                end = endOfMonth(subMonths(today, 1));
                break;
            default: return;
        }
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
        setShowPresets(false);
    };

    const exportJewelryCSV = () => {
        const jewelryData = noDealsData.filter(i => i.type === 'jewelry');

        // Professional Excel HTML Table (XLS)
        let tableHTML = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Informe Joyería</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <style>
                    table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
                    th { background-color: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold; }
                    td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: middle; }
                    .num { mso-number-format:"\#\,\#\#0\.00"; text-align: right; }
                    .text { mso-number-format:"\@"; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr style="background-color: #e2e8f0;">
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Teléfono</th>
                            <th>Precio/gr (€)</th>
                            <th>Oferta Total (€)</th>
                            <th>Gramos</th>
                            <th>Empleado</th>
                            <th>Notas / Razón</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        jewelryData.forEach(item => {
            const emp = employees.find(e => e.id === item.employee_id);
            const notesClean = (item.notes || '') + (item.reason ? ` - ${item.reason}` : '');

            tableHTML += `
                <tr>
                    <td class="text">${item.date}</td>
                    <td class="text">${item.customer_name || ''}</td>
                    <td class="text">${item.customer_phone || ''}</td>
                    <td class="num">${(item.price_per_gram || '').toString().replace('.', ',')}</td>
                    <td class="num">${(item.price_offered || '').toString().replace('.', ',')}</td>
                    <td class="num">${(item.grams || '').toString().replace('.', ',')}</td>
                    <td>${emp?.alias || emp?.first_name || item.employee_id}</td>
                    <td>${notesClean}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></body></html>`;

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `no_compras_joyeria_${new Date().toISOString().split('T')[0]}.xls`;
        link.click();
    };

    // Fetch No Deals
    React.useEffect(() => {
        if (reportType === 'no-deals') {
            const storeId = currentStore || 'store_1';
            fetch(`/api/no-deals?start=${startDate}&end=${endDate}`, {
                headers: {
                    'x-store-id': storeId
                }
            })
                .then(res => res.json())
                .then(data => setNoDealsData(data))
                .catch(err => console.error(err));
        }
    }, [reportType, startDate, endDate, currentStore]);

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

    // Calculate stats including active sessions if 'today' is in range
    const todayStr = new Date().toISOString().split('T')[0];
    const stats = getAggregatedStats();

    if (todayStr >= startDate && todayStr <= endDate && activeSessions) {
        activeSessions.forEach(session => {
            const empId = parseInt(session.employeeId);
            if (!stats[empId]) {
                stats[empId] = {
                    totalSeconds: 0,
                    standard: 0, jewelry: 0, recoverable: 0, totalGroups: 0,
                    daysActive: new Set([todayStr])
                };
            }
            const duration = (new Date() - new Date(session.startTime)) / 1000;
            stats[empId].totalSeconds += duration;
            stats[empId].daysActive.add(todayStr);
        });
    }

    // Sort by Total Groups desc
    const sortedEmpIds = Object.keys(stats).sort((a, b) => stats[b].totalGroups - stats[a].totalGroups);

    return (
        <div className="space-y-6 pb-10">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <FileText className="text-pink-500" size={32} />
                        Informes
                    </h1>
                    <p className="text-slate-400 font-medium ml-1 mt-1 text-sm">Analiza el rendimiento del equipo por rangos de fecha.</p>
                </div>

                {/* ADVANCED DATE PICKER */}
                <div className="flex flex-col sm:flex-row gap-4 bg-[#1e293b]/80 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-xl relative z-20">

                    {/* Presets Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPresets(!showPresets)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/5 active:scale-95 w-full sm:w-auto justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <CalendarIcon size={14} className="text-pink-500" />
                                <span>Rangos Rápidos</span>
                            </span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${showPresets ? 'rotate-180' : ''}`} />
                        </button>

                        {showPresets && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowPresets(false)}></div>
                                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-2 z-20 flex flex-col gap-1 anim-pop">
                                    {presets.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => handlePreset(p.value)}
                                            className="text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

                    {/* Date Inputs */}
                    <div className="flex items-center gap-2 bg-slate-900/50 rounded-xl px-3 py-1 border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-1">Desde</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-white text-xs font-mono focus:outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                        </div>
                        <div className="text-slate-600">→</div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-1">Hasta</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-white text-xs font-mono focus:outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <div className="flex gap-4">
                <button
                    onClick={() => setReportType('performance')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${reportType === 'performance' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    Rendimiento
                </button>
                <button
                    onClick={() => setReportType('no-deals')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${reportType === 'no-deals' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    Informe No Compras
                </button>
            </div>

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

                {reportType === 'performance' ? (
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
                ) : (
                    // NO DEALS TABLE
                    <div className="space-y-6">
                        {/* Tabs & Search */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 p-2 rounded-2xl">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setNoDealsTab('jewelry')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${noDealsTab === 'jewelry' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Gem size={16} /> Joyería
                                </button>
                                <button
                                    onClick={() => setNoDealsTab('other')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${noDealsTab === 'other' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Package size={16} /> Otros
                                    <span className="bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px] text-slate-400 border border-white/5">
                                        {noDealsData.filter(i => i.type !== 'jewelry').length}
                                    </span>
                                </button>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente, modelo..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-pink-500 outline-none placeholder:text-slate-600"
                                    />
                                </div>
                                {noDealsTab === 'jewelry' && (
                                    <button
                                        onClick={exportJewelryCSV}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-green-600/20 border border-green-400/20"
                                    >
                                        <FileSpreadsheet size={16} /> Excel
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    {noDealsTab === 'jewelry' ? (
                                        <tr className="text-[10px] font-bold text-slate-500 uppercase border-b border-white/5 bg-slate-900/20">
                                            <th className="pb-4 pl-6 pt-4">Fecha / Empleado</th>
                                            <th className="pb-4 pt-4 text-amber-500">Cliente</th>
                                            <th className="pb-4 pt-4 text-right">Precio/gr</th>
                                            <th className="pb-4 pt-4 text-right">Gramos</th>
                                            <th className="pb-4 pt-4 text-right">Oferta</th>
                                            <th className="pb-4 pt-4">Notas</th>
                                            {isManagerial && <th className="pb-4 pt-4 text-center">Acciones</th>}
                                        </tr>
                                    ) : (
                                        <tr className="text-[10px] font-bold text-slate-500 uppercase border-b border-white/5 bg-slate-900/20">
                                            <th className="pb-4 pl-6 pt-4">Fecha / Empleado</th>
                                            <th className="pb-4 pt-4 text-blue-400">Producto</th>
                                            <th className="pb-4 pt-4 text-right">Pide</th>
                                            <th className="pb-4 pt-4 text-right">Oferta</th>
                                            <th className="pb-4 pt-4">Notas</th>
                                            {isManagerial && <th className="pb-4 pt-4 text-center">Acciones</th>}
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {noDealsData
                                        .filter(item => {
                                            const type = item.type || 'other';
                                            if (type !== noDealsTab) return false;

                                            if (!searchTerm) return true;
                                            const s = searchTerm.toLowerCase();
                                            return (
                                                (item.customer_name?.toLowerCase().includes(s)) ||
                                                (item.customer_phone?.toLowerCase().includes(s)) ||
                                                (item.brand?.toLowerCase().includes(s)) ||
                                                (item.model?.toLowerCase().includes(s)) ||
                                                (item.notes?.toLowerCase().includes(s)) ||
                                                (item.reason?.toLowerCase().includes(s))
                                            );
                                        })
                                        .map(item => {
                                            const emp = employees.find(e => e.id === item.employee_id);
                                            return (
                                                <tr key={item.id} className="group hover:bg-pink-500/5 transition-colors">
                                                    <td className="py-4 pl-6">
                                                        <div className="font-mono text-slate-400 text-xs">{item.date}</div>
                                                        <div className="font-bold text-slate-200 text-xs mt-1">{emp?.alias || '?'}</div>
                                                    </td>

                                                    {noDealsTab === 'jewelry' ? (
                                                        <>
                                                            <td className="py-4">
                                                                <div className="font-bold text-slate-200">{item.customer_name || 'Anónimo'}</div>
                                                                <div className="text-xs text-amber-500/70 font-mono">{item.customer_phone}</div>
                                                            </td>
                                                            <td className="py-4 text-right font-mono text-slate-400">{item.price_per_gram ? `${item.price_per_gram}€` : '-'}</td>
                                                            <td className="py-4 text-right font-mono text-slate-400">{item.grams ? `${item.grams}gr` : '-'}</td>
                                                            <td className="py-4 text-right font-bold text-white font-mono">{item.price_offered ? `${item.price_offered}€` : '-'}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="py-4">
                                                                <div className="font-bold text-slate-200">{item.brand} {item.model}</div>
                                                                {item.price_sale && <div className="text-xs text-green-400 font-mono mt-1">PVP Futuro: {item.price_sale}€</div>}
                                                            </td>
                                                            <td className="py-4 text-right font-mono text-slate-400">{item.price_asked ? `${item.price_asked}€` : '-'}</td>
                                                            <td className="py-4 text-right font-bold text-white font-mono">{item.price_offered ? `${item.price_offered}€` : '-'}</td>
                                                        </>
                                                    )}

                                                    <td className="py-4 text-slate-400 text-xs max-w-[200px] truncate">
                                                        <span className="text-red-400 font-bold block mb-1">{item.reason}</span>
                                                        {item.notes}
                                                    </td>

                                                    {isManagerial && (
                                                        <td className="py-4 text-center">
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm('¿Eliminar registro?')) {
                                                                        await deleteNoDeal(item.id);
                                                                        setNoDealsData(prev => prev.filter(i => i.id !== item.id));
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    {noDealsData.filter(i => (i.type || 'other') === noDealsTab).length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-600 italic">
                                                No hay registros en esta categoría.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
