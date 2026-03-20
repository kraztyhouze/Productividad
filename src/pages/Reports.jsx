import React, { useState } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { BarChart, FileText, Filter, Download, Trash2, Loader, Search, Gem, Package, FileSpreadsheet, Calendar as CalendarIcon, ChevronDown, Info, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

const Reports = () => {
    const { dailyRecords, dailyGroups, activeSessions, deleteNoDeal } = useProductivity();
    const { employees } = useTeam();
    const { user } = useAuth();
    const { currentStore } = useStore();

    const isManagerial = [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role);

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
    const [showGlossary, setShowGlossary] = useState(false);

    const glossaryDefinitions = [
        { term: "Días Activos", def: "Días con al menos una sesión de compra iniciada." },
        { term: "Tiempo Turno", def: "Tiempo total registrado en sesiones de turno." },
        { term: "Tiempo Compras", def: "Tiempo dedicado exclusivamente a la atención de clientes (sesiones de compra)." },
        { term: "Gen / Joy / Rec", def: "Cantidad de grupos comprados por categoría: General, Joyería y Recuperable (Buyback)." },
        { term: "% Eficiencia", def: "Porcentaje del tiempo de turno dedicado a atender clientes. (T. Compras / T. Turno)" },
        { term: "% Mix Joya", def: "Porcentaje de las compras totales que son de joyería." },
        { term: "Gr/h (Compras)", def: "Velocidad de compra: Grupos comprados por hora de atención real." },
        { term: "Gr/h (Turno)", def: "Productividad global: Grupos comprados por hora de turno total." },
        { term: "Hit Rate", def: "Tasa de Éxito: Porcentaje de clientes atendidos que finalizaron en compra." },
        { term: "T. Medio/Cli", def: "Tiempo promedio dedicado a cada cliente (se compre o no)." }
    ];



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

    const exportOtherCSV = () => {
        const otherData = noDealsData.filter(i => (i.type || 'other') !== 'jewelry');

        // Professional Excel HTML Table (XLS)
        let tableHTML = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Informe Otros</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Cliente Pide (€)</th>
                            <th>PVP Futuro (€)</th>
                            <th>Oferta Total (€)</th>
                            <th>Empleado</th>
                            <th>Notas / Razón</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        otherData.forEach(item => {
            const emp = employees.find(e => e.id === item.employee_id);
            const notesClean = (item.notes || '') + (item.reason ? ` - ${item.reason}` : '');

            tableHTML += `
                <tr>
                    <td class="text">${item.date}</td>
                    <td class="text">${item.brand || ''}</td>
                    <td class="text">${item.model || ''}</td>
                    <td class="num">${(item.price_asked || '').toString().replace('.', ',')}</td>
                    <td class="num">${(item.price_sale || '').toString().replace('.', ',')}</td>
                    <td class="num">${(item.price_offered || '').toString().replace('.', ',')}</td>
                    <td>${emp?.alias || emp?.first_name || item.employee_id}</td>
                    <td>${notesClean}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></body></html>`;

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `no_compras_otros_${new Date().toISOString().split('T')[0]}.xls`;
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
        const stats = {}; // { employeeId: { totalSeconds: 0, standard: 0, jewelry: 0, recoverable: 0, totalGroups: 0, daysActive: 0, clientSeconds: 0, noDeal: 0 } }

        // Filter records by date range
        const filteredRecords = dailyRecords.filter(r => r.date >= startDate && r.date <= endDate);

        filteredRecords.forEach(r => {
            if (!stats[r.employeeId]) {
                stats[r.employeeId] = {
                    totalSeconds: 0,
                    standard: 0, jewelry: 0, recoverable: 0, totalGroups: 0,
                    daysActive: new Set(),
                    clientSeconds: 0, noDeal: 0
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
                    stats[empId] = {
                        totalSeconds: 0,
                        standard: 0, jewelry: 0, recoverable: 0, totalGroups: 0,
                        daysActive: new Set(),
                        clientSeconds: 0, noDeal: 0
                    };
                }

                const raw = dailyGroups[key];
                const val = typeof raw === 'number'
                    ? { standard: raw, jewelry: 0, recoverable: 0, clientSeconds: 0, noDeal: 0 }
                    : {
                        standard: raw.standard || 0,
                        jewelry: raw.jewelry || 0,
                        recoverable: raw.recoverable || 0,
                        clientSeconds: raw.clientSeconds || 0,
                        noDeal: raw.noDeal || 0
                    };

                stats[empId].standard += val.standard;
                stats[empId].jewelry += val.jewelry;
                stats[empId].recoverable += val.recoverable;
                stats[empId].clientSeconds += val.clientSeconds;
                stats[empId].noDeal += val.noDeal;

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
                    daysActive: new Set([todayStr]),
                    clientSeconds: 0, noDeal: 0
                };
            }
            const duration = (new Date() - new Date(session.startTime)) / 1000;
            stats[empId].totalSeconds += duration;
            stats[empId].daysActive.add(todayStr);
        });
    }

    // Sort by Total Groups desc
    const sortedEmpIds = Object.keys(stats).sort((a, b) => stats[b].totalGroups - stats[a].totalGroups);


    // --- NO DEALS RENDER ---
    const renderNoDeals = () => {
        // Filter Data
        const filteredData = noDealsData.filter(item => {
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
        });

        return (
            <div className="space-y-6">
                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#F4F7FA] p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="flex gap-2 p-1 bg-white rounded-xl border border-[#E2E8F0]">
                        <button
                            onClick={() => setNoDealsTab('jewelry')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border ${noDealsTab === 'jewelry' ? 'bg-[#FEF3C7] border-amber-300 text-amber-600' : 'border-transparent text-[#718096] hover:text-[#1A365D] hover:bg-[#F4F7FA]'}`}
                        >
                            <Gem size={14} /> Joyería
                        </button>
                        <button
                            onClick={() => setNoDealsTab('other')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border ${noDealsTab === 'other' ? 'bg-[#EBF8FF] border-blue-200 text-blue-600' : 'border-transparent text-[#718096] hover:text-[#1A365D] hover:bg-[#F4F7FA]'}`}
                        >
                            <Package size={14} /> Otros
                            <span className="bg-[#F4F7FA] px-1.5 py-0.5 rounded text-[10px] text-[#718096] border border-[#E2E8F0] min-w-[20px] text-center">
                                {noDealsData.filter(i => (i.type || 'other') !== 'jewelry').length}
                            </span>
                        </button>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72 group">
                            <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-pink-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder={noDealsTab === 'jewelry' ? "Buscar cliente, teléfono..." : "Buscar producto, modelo..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-[#1A365D] focus:border-[#FF8C9D] focus:ring-1 focus:ring-[#FF8C9D]/20 outline-none placeholder:text-[#A0AEC0] transition-all"
                            />
                        </div>
                        {noDealsTab === 'jewelry' && (
                            <button
                                onClick={exportJewelryCSV}
                                className="px-4 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Exportar Excel</span>
                            </button>
                        )}
                        {noDealsTab === 'other' && (
                            <button
                                onClick={exportOtherCSV}
                                className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Exportar Excel</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredData.map(item => {
                        const emp = employees.find(e => e.id === item.employee_id);
                        return (
                            <div key={item.id} className="group relative bg-white hover:bg-[#F4F7FA] rounded-xl border border-[#E2E8F0] hover:border-[#FF8C9D]/30 p-5 transition-all" style={{ boxShadow: 'var(--shadow-card)' }}>
                                <div className="flex flex-col md:flex-row gap-6">

                                    {/* Left Column: Core Info */}
                                    <div className="w-full md:w-64 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-[#E2E8F0] pb-4 md:pb-0 md:pr-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="px-2 py-1 rounded-md bg-[#F4F7FA] text-[10px] font-mono text-[#718096] border border-[#E2E8F0]">
                                                    {format(new Date(item.date), 'dd MMM yyyy')}
                                                </div>
                                                <div className="px-2 py-1 rounded-md bg-[#FFF0F2] text-[10px] font-bold text-[#FF8C9D] border border-[#FFD6DC] flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C9D]"></div>
                                                    {emp?.alias || 'Empleado'}
                                                </div>
                                            </div>

                                            {noDealsTab === 'jewelry' ? (
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-bold text-[#1A365D] tracking-tight">{item.customer_name || 'Cliente Anónimo'}</h3>
                                                    <p className="text-xs font-mono text-amber-600 flex items-center gap-1.5">
                                                        <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                                                        {item.customer_phone || 'Sin Teléfono'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-bold text-[#1A365D] tracking-tight">{item.brand} <span className="text-[#718096] font-normal">{item.model}</span></h3>
                                                    {item.price_sale && (
                                                        <p className="text-xs font-mono text-green-600">PVP Futuro: {item.price_sale}€</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Financials Mini-Grid */}
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div className="bg-[#F4F7FA] rounded-lg p-2 border border-[#E2E8F0]">
                                                <span className="text-[9px] uppercase text-[#718096] font-bold block mb-0.5">Ofertado</span>
                                                <span className="text-sm font-mono font-bold text-[#1A365D]">{item.price_offered || 0}€</span>
                                            </div>
                                            <div className="bg-[#F4F7FA] rounded-lg p-2 border border-[#E2E8F0]">
                                                <span className="text-[9px] uppercase text-[#718096] font-bold block mb-0.5">
                                                    {noDealsTab === 'jewelry' ? 'Gramos' : 'Pedía'}
                                                </span>
                                                <span className="text-sm font-mono font-bold text-[#1A365D]">
                                                    {noDealsTab === 'jewelry' ? `${item.grams || 0}g` : `${item.price_asked || 0}€`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Reasoning & Notes */}
                                    <div className="flex-1 flex flex-col relative min-w-0">
                                        <div className="mb-3">
                                            <span className="text-[10px] uppercase font-bold text-[#718096] tracking-wider mb-1 block">Motivo de no compra</span>
                                            <div className="inline-block px-3 py-1 bg-red-50 border border-red-200 rounded-lg text-red-500 text-xs font-bold">
                                                {item.reason || 'No especificado'}
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-[#F4F7FA] rounded-xl p-3 border border-[#E2E8F0] relative group-hover:border-[#FF8C9D]/30 transition-colors">
                                            <span className="text-[9px] uppercase font-bold text-[#A0AEC0] absolute top-3 right-3 select-none">Notas Internas</span>
                                            <p className="text-sm text-[#718096] leading-relaxed whitespace-pre-wrap pt-4 pr-16 pb-1">
                                                {item.notes || <span className="text-[#A0AEC0] italic">Sin notas adicionales...</span>}
                                            </p>
                                        </div>

                                        {/* Delete Action (Top Right Floating) */}
                                        {isManagerial && (
                                            <div className="absolute top-0 right-0">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('¿Eliminar registro?')) {
                                                            await deleteNoDeal(item.id);
                                                            setNoDealsData(prev => prev.filter(i => i.id !== item.id));
                                                        }
                                                    }}
                                                    className="p-2 bg-white hover:bg-red-50 border border-[#E2E8F0] hover:border-red-200 text-[#A0AEC0] hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 -translate-y-2"
                                                    title="Eliminar Registro"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {filteredData.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 bg-[#F4F7FA] border border-dashed border-[#E2E8F0] rounded-xl">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-[#E2E8F0]">
                                <Search className="text-[#A0AEC0]" size={24} />
                            </div>
                            <h3 className="text-[#1A365D] font-bold mb-1">No se encontraron resultados</h3>
                            <p className="text-[#718096] text-sm">{searchTerm ? `Sin coincidencias para "${searchTerm}"` : 'No hay registros en este periodo'}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- EXPORT PERFORMANCE EXCEL ---
    const exportPerformanceExcel = () => {
        // Professional Excel HTML Table (XLS)
        let tableHTML = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rendimiento</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <style>
                    table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
                    th { background-color: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: bold; }
                    td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: middle; }
                    .text-left { text-align: left; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .text-blue { color: #3b82f6; }
                    .text-red { color: #ef4444; }
                    .text-pink { color: #ec4899; }
                    .text-indigo { color: #6366f1; }
                    .text-yellow { color: #eab308; }
                    .text-amber { color: #f59e0b; }
                    .num { mso-number-format:"\#\,\#\#0"; }
                    .dec { mso-number-format:"\#\,\#\#0\.0"; }
                    .pct { mso-number-format:"0%"; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr style="background-color: #e2e8f0;">
                            <th class="text-left">Empleado</th>
                            <th class="text-left">Rol</th>
                            <th>Días Activos</th>
                            <th>Tiempo Turno</th>
                            <th class="text-blue">Tiempo Compras</th>
                            <th>General</th>
                            <th>Joyería</th>
                            <th>Recuperable</th>
                            <th class="text-red">No Compras</th>
                            <th class="text-pink">Total Grupos</th>
                            <th class="text-indigo">% Eficiencia</th>
                            <th class="text-yellow">% Mix Joya</th>
                            <th class="text-amber">Gr/h (Compras)</th>
                            <th>Gr/h (Turno)</th>
                            <th>Hit Rate</th>
                            <th>T. Medio/Cli</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sortedEmpIds.forEach(empId => {
            const data = stats[empId];
            const emp = employees.find(e => e.id === parseInt(empId));

            // Calculations
            const shiftHours = data.totalSeconds / 3600;
            const buyingHours = data.clientSeconds / 3600;

            const gphBuying = buyingHours > 0 ? (data.totalGroups / buyingHours).toFixed(1) : '0,0';
            const gphShift = shiftHours > 0 ? (data.totalGroups / shiftHours).toFixed(1) : '0,0';

            const efficiency = data.totalSeconds > 0 ? ((data.clientSeconds / data.totalSeconds) * 100).toFixed(0) : 0;
            const jewelryMix = data.totalGroups > 0 ? ((data.jewelry / data.totalGroups) * 100).toFixed(0) : 0;

            const totalInteractions = data.totalGroups + data.noDeal;
            const hitRate = totalInteractions > 0 ? ((data.totalGroups / totalInteractions) * 100).toFixed(0) : 0;

            const avgTime = totalInteractions > 0 ? (data.clientSeconds / totalInteractions) : 0;
            const avgTimeMin = Math.floor(avgTime / 60);
            const avgTimeSec = Math.floor(avgTime % 60);
            const avgTimeStr = `${avgTimeMin}m ${avgTimeSec}s`;

            tableHTML += `
                <tr>
                    <td class="text-left font-bold">${emp?.alias || emp?.firstName || 'Desconocido'}</td>
                    <td class="text-left">${emp?.role || ''}</td>
                    <td class="text-center">${data.daysActive.size}</td>
                    <td class="text-center">${formatDuration(data.totalSeconds)}</td>
                    <td class="text-center text-blue font-bold">${formatDuration(data.clientSeconds)}</td>
                    <td class="text-center num">${data.standard}</td>
                    <td class="text-center num">${data.jewelry}</td>
                    <td class="text-center num">${data.recoverable}</td>
                    <td class="text-center num text-red font-bold">${data.noDeal}</td>
                    <td class="text-center num text-pink font-bold">${data.totalGroups}</td>
                    <td class="text-right text-indigo font-bold">${efficiency}%</td>
                    <td class="text-right text-yellow font-bold">${jewelryMix}%</td>
                    <td class="text-right text-amber font-bold dec">${gphBuying.toString().replace('.', ',')}</td>
                    <td class="text-right dec">${gphShift.toString().replace('.', ',')}</td>
                    <td class="text-right font-bold">${hitRate}%</td>
                    <td class="text-right">${avgTimeStr}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;

        // Add Glossary Table to Excel
        tableHTML += `
            <br/><br/>
            <table>
                <thead>
                    <tr>
                        <th colspan="2" style="background-color: #1e293b; color: white; text-align: left; border: 1px solid #000;">GLOSARIO DE TÉRMINOS</th>
                    </tr>
                </thead>
                <tbody>
                    ${glossaryDefinitions.map(item => `
                        <tr>
                            <td style="background-color: #f3f4f6; font-weight: bold; border: 1px solid #e5e7eb;">${item.term}</td>
                            <td style="border: 1px solid #e5e7eb;">${item.def}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableHTML += `</body></html>`;

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rendimiento_${startDate}_${endDate}.xls`;
        link.click();
    };

    return (
        <div className="space-y-6 pb-10 animate-in">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <h1 className="text-2xl font-black text-[#1A365D] tracking-tight flex items-center gap-3">
                        Informes
                    </h1>
                    <p className="text-[#718096] text-sm mt-0.5">Analiza el rendimiento del equipo por rangos de fecha.</p>
                </div>

                {/* ADVANCED DATE PICKER */}
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-xl border border-[#E2E8F0] shadow-sm relative z-20">

                    {/* Presets Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPresets(!showPresets)}
                            className="flex items-center gap-2 bg-[#F4F7FA] hover:bg-[#E2E8F0] text-[#718096] hover:text-[#1A365D] px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border border-[#E2E8F0] active:scale-95 w-full sm:w-auto justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <CalendarIcon size={14} style={{ color: '#FF8C9D' }} />
                                <span>Rangos Rápidos</span>
                            </span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${showPresets ? 'rotate-180' : ''}`} />
                        </button>

                        {showPresets && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowPresets(false)}></div>
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-2 z-20 flex flex-col gap-0.5" style={{ boxShadow: 'var(--shadow-hover)' }}>
                                    {presets.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => handlePreset(p.value)}
                                            className="text-left px-3 py-2 hover:bg-[#F4F7FA] rounded-lg text-xs font-medium text-[#718096] hover:text-[#1A365D] transition-colors"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-8 bg-[#E2E8F0] hidden sm:block"></div>

                    {/* Date Inputs */}
                    <div className="flex items-center gap-2 bg-[#F4F7FA] rounded-lg px-3 py-1 border border-[#E2E8F0]">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-wider ml-1">Desde</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-[#1A365D] text-xs font-mono focus:outline-none cursor-pointer"
                            />
                        </div>
                        <div className="text-[#A0AEC0]">→</div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-wider ml-1">Hasta</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-[#1A365D] text-xs font-mono focus:outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <div className="flex gap-2">
                <button
                    onClick={() => setReportType('performance')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${reportType === 'performance'
                        ? 'text-white'
                        : 'bg-white text-[#718096] hover:text-[#1A365D] border border-[#E2E8F0]'
                        }`}
                    style={reportType === 'performance' ? { background: '#FF8C9D', boxShadow: '0 4px 12px rgba(255,140,157,0.3)' } : { boxShadow: 'var(--shadow-card)' }}
                >
                    Rendimiento
                </button>
                <button
                    onClick={() => setReportType('no-deals')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${reportType === 'no-deals'
                        ? 'text-white'
                        : 'bg-white text-[#718096] hover:text-[#1A365D] border border-[#E2E8F0]'
                        }`}
                    style={reportType === 'no-deals' ? { background: '#FF8C9D', boxShadow: '0 4px 12px rgba(255,140,157,0.3)' } : { boxShadow: 'var(--shadow-card)' }}
                >
                    Informe No Compras
                </button>
            </div>

            {/* RESULTS CARD */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-lg font-bold text-[#1A365D] flex items-center gap-2">
                        <BarChart size={20} style={{ color: '#FF8C9D' }} />
                        {reportType === 'performance' ? 'Rendimiento' : 'No Compras'}
                        <span className="text-xs font-normal text-[#A0AEC0] ml-2 font-mono">({startDate} — {endDate})</span>
                        {reportType === 'performance' && (
                            <button
                                onClick={() => setShowGlossary(true)}
                                className="ml-2 p-1.5 rounded-full hover:bg-[#F4F7FA] text-[#A0AEC0] hover:text-[#FF8C9D] transition-colors"
                                title="Glosario de Términos"
                            >
                                <Info size={16} />
                            </button>
                        )}
                    </h2>
                    {reportType === 'performance' && (
                        <button
                            onClick={exportPerformanceExcel}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/30 font-bold rounded-xl transition-all text-xs hover:scale-105 active:scale-95"
                        >
                            <FileSpreadsheet size={16} /> Exportar Excel
                        </button>
                    )}
                </div>

                {reportType === 'performance' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[11px] font-bold text-[#718096] uppercase border-b border-[#E2E8F0] bg-[#F4F7FA]">
                                    <th className="pb-4 pl-6 pt-4">Empleado</th>
                                    <th className="pb-4 pt-4 text-center">Días Activos</th>
                                    <th className="pb-4 pt-4 text-center">Tiempo Turno</th>
                                    <th className="pb-4 pt-4 text-center text-blue-500">T. Compras</th>
                                    <th className="pb-4 pt-4 text-center text-[#718096]" title="Grupos General">Gen</th>
                                    <th className="pb-4 pt-4 text-center text-[#718096]" title="Grupos Joyería">Joy</th>
                                    <th className="pb-4 pt-4 text-center text-[#718096]" title="Venta Recuperable">Rec</th>
                                    <th className="pb-4 pt-4 text-center text-red-500">NO</th>
                                    <th className="pb-4 pt-4 text-center text-[#FF8C9D]">Total Grupos</th>
                                    <th className="pb-4 pt-4 text-right text-indigo-500" title="% Tiempo en Compras">% Efic.</th>
                                    <th className="pb-4 pt-4 text-right text-yellow-600" title="% Venta Joyería">% Joya</th>
                                    <th className="pb-4 pt-4 text-right text-amber-600" title="Grupos / Hora (Tiempo Compras)">Gr/h (C)</th>
                                    <th className="pb-4 pt-4 text-right text-[#718096]" title="Grupos / Hora (Tiempo Turno)">Gr/h (T)</th>
                                    <th className="pb-4 pt-4 text-right">Hit Rate</th>
                                    <th className="pb-4 pt-4 text-right pr-6">T. Medio/Cli</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {sortedEmpIds.map(empId => {
                                    const data = stats[empId];
                                    const emp = employees.find(e => e.id === parseInt(empId));

                                    // Calculations
                                    const shiftHours = data.totalSeconds / 3600;
                                    const buyingHours = data.clientSeconds / 3600;

                                    // Productivity Metrics
                                    // 1. Velocity (Gr/h)
                                    const gphBuying = buyingHours > 0 ? (data.totalGroups / buyingHours).toFixed(1) : '0.0';
                                    const gphShift = shiftHours > 0 ? (data.totalGroups / shiftHours).toFixed(1) : '0.0';

                                    // 2. Efficiency (% Time utilized for shopping)
                                    const efficiency = data.totalSeconds > 0 ? ((data.clientSeconds / data.totalSeconds) * 100).toFixed(0) : 0;

                                    // 3. Quality Mix (% Jewelry Sales)
                                    const jewelryMix = data.totalGroups > 0 ? ((data.jewelry / data.totalGroups) * 100).toFixed(0) : 0;

                                    // 4. Hit Rate (Success Rate)
                                    const totalInteractions = data.totalGroups + data.noDeal;
                                    const hitRate = totalInteractions > 0 ? ((data.totalGroups / totalInteractions) * 100).toFixed(0) : 0;

                                    // 5. Avg Time per Client
                                    const avgTime = totalInteractions > 0 ? (data.clientSeconds / totalInteractions) : 0;
                                    const avgTimeMin = Math.floor(avgTime / 60);
                                    const avgTimeSec = Math.floor(avgTime % 60);

                                    return (
                                        <tr key={empId} className="group hover:bg-[#FFF0F2] transition-colors">
                                            <td className="py-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-[#F4F7FA] flex items-center justify-center font-bold text-[#718096] border border-[#E2E8F0] group-hover:bg-[#FF8C9D] group-hover:text-white group-hover:border-[#FF8C9D] transition-all text-xs">
                                                        {emp?.alias || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#1A365D] text-sm group-hover:text-[#FF8C9D] transition-colors">{emp?.firstName}</p>
                                                        <p className="text-[10px] text-[#A0AEC0] uppercase tracking-wide">{emp?.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center font-mono text-[#718096] text-sm">
                                                {data.daysActive.size}
                                            </td>
                                            <td className="py-4 text-center font-mono text-[#718096] text-sm">
                                                {formatDuration(data.totalSeconds)}
                                            </td>
                                            <td className="py-4 text-center font-mono text-blue-500 font-bold text-sm">
                                                {formatDuration(data.clientSeconds)}
                                            </td>

                                            <td className="py-4 text-center font-mono text-[#718096] text-sm">{data.standard}</td>
                                            <td className="py-4 text-center font-mono text-[#718096] text-sm">{data.jewelry}</td>
                                            <td className="py-4 text-center font-mono text-[#718096] text-sm">{data.recoverable}</td>
                                            <td className="py-4 text-center font-mono text-red-500 font-bold text-sm">{data.noDeal}</td>

                                            <td className="py-4 text-center">
                                                <span className="bg-pink-500/10 text-pink-500 px-3 py-1 rounded-lg font-bold font-mono text-lg border border-pink-500/20">
                                                    {data.totalGroups}
                                                </span>
                                            </td>

                                            <td className="py-4 text-right font-mono font-bold text-indigo-400">
                                                {efficiency}%
                                            </td>
                                            <td className="py-4 text-right font-mono font-bold text-yellow-500">
                                                {jewelryMix}%
                                            </td>

                                            <td className="py-4 text-right font-mono font-bold text-amber-500">
                                                {gphBuying}
                                            </td>
                                            <td className="py-4 text-right font-mono font-bold text-slate-400">
                                                {gphShift}
                                            </td>

                                            <td className="py-4 text-right font-mono">
                                                <span className={`${hitRate < 50 ? 'text-red-500' : hitRate > 80 ? 'text-green-500' : 'text-amber-500'}`}>{hitRate}%</span>
                                            </td>

                                            <td className="py-4 text-right pr-6 font-mono text-slate-400">
                                                {avgTimeMin}m {avgTimeSec}s
                                            </td>
                                        </tr>
                                    )
                                })}
                                {sortedEmpIds.length === 0 && (
                                    <tr>
                                        <td colSpan="14" className="py-12 text-center text-slate-600 italic text-sm">
                                            No hay datos para el rango de fechas seleccionado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // NO DEALS TABLE REPLACEMENT
                    renderNoDeals()
                )}
            </div>

            {/* GLOSSARY MODAL */}
            {showGlossary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A365D]/40 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white/95 border border-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center px-10 py-8 border-b border-[#F4F7FA]">
                            <h3 className="text-3xl font-black text-[#1A365D] tracking-tighter flex items-center gap-4">
                                <div className="p-2.5 bg-[#FFF0F3] rounded-2xl border border-[#FF8C9D]/20 shadow-sm">
                                    <Info className="text-[#FF8C9D]" size={30} />
                                </div>
                                Glosario de Métricas
                            </h3>
                            <button
                                onClick={() => setShowGlossary(false)}
                                className="w-12 h-12 flex items-center justify-center bg-[#F4F7FA] hover:bg-[#E2E8F0] rounded-2xl text-[#A0AEC0] hover:text-[#1A365D] transition-all shadow-sm active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto custom-scrollbar bg-white/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {glossaryDefinitions.map((item, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] hover:border-[#FF8C9D]/30 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
                                        <h4 className="text-[#FF8C9D] font-black text-[10px] uppercase tracking-[0.2em] mb-3 group-hover:scale-110 transition-transform origin-left">{item.term}</h4>
                                        <p className="text-[#718096] text-xs leading-relaxed font-bold opacity-80">{item.def}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#F4F7FA] bg-[#F4F7FA]/50">
                            <p className="text-center text-[#A0AEC0] text-[9px] font-black uppercase tracking-[0.3em] opacity-50">
                                Este glosario también se adjunta al final de los archivos Excel exportados.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
