import React, { useState, useEffect } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Clock, RefreshCw, Trash2, UserPlus, Check, X, Watch, Pencil, BarChart2, Box, Save, Settings } from 'lucide-react';
import InfoPanel from '../components/Productivity/InfoPanel';
import CloseDayModal from '../components/Productivity/CloseDayModal';
import EditTimeModal from '../components/Productivity/EditTimeModal';
import EditShiftTimeModal from '../components/Productivity/EditShiftTimeModal';
import EditStatsModal from '../components/Productivity/EditStatsModal';
import NoDealModal from '../components/Productivity/NoDealModal';
import VisualLocationsModal from '../components/Productivity/VisualLocationsModal';


const REJECTION_REASONS = [
    "Precio pide muy alto",
    "Artículo roto / mal estado",
    "No compramos este artículo",
    "Cliente indeciso",
    "Sin documentación / IMEI Blacklist",
    "Otro"
];

const Productivity = () => {
    const {
        activeSessions, dailyRecords, startSession, endSession,
        dailyGroups, updateDailyGroups, closedDays, closeDay, reopenDay,
        getUnclosedPastDays, dayIncidents, updateDayIncident,
        updateRecord, addManualRecord, deleteEmployeeDayData,
        productFamilies, addProductFamily, removeProductFamily,
        addNoDealDetail, toggleClientSession,
        goldPrice, updateGoldPrice, updateEmployeeShiftTime
    } = useProductivity();

    const { employees } = useTeam();
    const { user } = useAuth();
    const { currentStore } = useStore();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [needInput, setNeedInput] = useState("");
    const [overstockInput, setOverstockInput] = useState("");

    // Location Categories
    const LOCATION_CATEGORIES = ['LETRAS', 'VOLÚMENES', 'PATINETES', 'ALMACEN / PARED', 'RESERVA'];
    const [activeLocationCategory, setActiveLocationCategory] = useState(null); // null means closed

    // Live Client State (Derived from Persistent Active Sessions)
    const activeClientModalState = useState(null);
    const [activeClientModal, setActiveClientModal] = activeClientModalState;
    const [shopActiveSeconds, setShopActiveSeconds] = useState(0);
    const [maxConcurrent, setMaxConcurrent] = useState(0);

    // Helper to map active client sessions for easy lookup
    const clientSessions = {};
    activeSessions.forEach(s => {
        if (s.clientStartTime) {
            clientSessions[s.employeeId] = new Date(s.clientStartTime).getTime();
        }
    });

    // Editing State
    const [editingRecord, setEditingRecord] = useState(null);
    const [editingShiftTime, setEditingShiftTime] = useState(null);
    const [editingStats, setEditingStats] = useState(null);

    const [noDealDetail, setNoDealDetail] = useState(null);

    // Auto-Close Settings
    const [closingHours, setClosingHours] = useState({ midday: '', night: '' });

    // Fetch Closing Hours
    useEffect(() => {
        const storeId = currentStore || 'store_1';
        fetch('/api/settings/closing-hours', {
            headers: { 'x-store-id': storeId }
        })
            .then(res => res.json())
            .then(data => setClosingHours({ midday: data.midday_close || '', night: data.night_close || '' }))
            .catch(err => console.error("Error fetching closing hours", err));
    }, [currentStore]);

    const handleSaveClosingHours = async () => {
        try {
            const storeId = currentStore || 'store_1';
            await fetch('/api/settings/closing-hours', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-store-id': storeId
                },
                body: JSON.stringify({ midday_close: closingHours.midday, night_close: closingHours.night })
            });
            alert('Horarios de cierre automático actualizados.');
        } catch (err) {
            alert('Error al guardar horarios.');
        }
    };

    const [externalPrices, setExternalPrices] = useState(null);
    const [showGoldDetails, setShowGoldDetails] = useState(false);

    // Fetch External Gold Prices
    useEffect(() => {
        const fetchGold = async () => {
            try {
                const res = await fetch('/api/gold-prices');
                if (res.ok) {
                    const data = await res.json();
                    setExternalPrices(data);
                }
            } catch (err) { console.error("Failed to fetch gold prices", err); }
        };
        fetchGold();
        const interval = setInterval(fetchGold, 1800000); // 30 mins
        return () => clearInterval(interval);
    }, []);



    const handleGoldPriceUpdate = async () => {
        // Allow Managers, Supervisors, Responsibles
        const allowedRoles = [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE];
        if (!allowedRoles.includes(user?.role)) {
            alert("No tienes permisos para modificar el precio.");
            return;
        }

        const newPrice = prompt("Introduce el nuevo precio del oro (€/gr):", goldPrice);
        if (newPrice !== null && newPrice.trim() !== "" && !isNaN(newPrice)) {
            try {
                await updateGoldPrice(newPrice);
            } catch (e) {
                alert("Error al guardar precio.");
            }
        }
    };

    const handleAddNeed = () => {
        if (needInput.trim()) {
            addProductFamily(needInput, 'need', selectedDate);
            setNeedInput("");
        }
    };

    const handleAddOverstock = () => {
        if (overstockInput.trim()) {
            addProductFamily(overstockInput, 'overstock', selectedDate);
            setOverstockInput("");
        }
    };

    const isManagerial = user?.role === ROLES.MANAGER;
    const canEditPanels = [ROLES.MANAGER, ROLES.RESPONSIBLE, ROLES.SUPERVISOR].includes(user?.role);
    const canEditTimes = [ROLES.MANAGER, ROLES.SUPERVISOR].includes(user?.role);
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const isDayClosed = closedDays.includes(selectedDate);
    const unclosedDays = getUnclosedPastDays();

    // Ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Shop Active Timer & Max Concurrent Logic
    useEffect(() => {
        const interval = setInterval(() => {
            const activeBuyingCount = Object.keys(clientSessions).length;
            if (activeBuyingCount > maxConcurrent) {
                setMaxConcurrent(activeBuyingCount);
            }
        }, 1000);

        // ... (Merged intervals logic remains same as it depends on activeSessions/dailyRecords) ...
        const intervals = [];
        dailyRecords.filter(r => r.date === selectedDate).forEach(r => {
            if (r.startTime && r.endTime) intervals.push({ start: new Date(r.startTime).getTime(), end: new Date(r.endTime).getTime() });
        });
        if (isToday) {
            activeSessions.forEach(s => {
                if (s.startTime) intervals.push({ start: new Date(s.startTime).getTime(), end: Date.now() });
            });
        }
        intervals.sort((a, b) => a.start - b.start);
        const merged = [];
        if (intervals.length > 0) {
            let current = intervals[0];
            for (let i = 1; i < intervals.length; i++) {
                if (intervals[i].start <= current.end) current.end = Math.max(current.end, intervals[i].end);
                else { merged.push(current); current = intervals[i]; }
            }
            merged.push(current);
        }
        const totalMs = merged.reduce((acc, curr) => acc + (curr.end - curr.start), 0);
        setShopActiveSeconds(totalMs / 1000);

        return () => clearInterval(interval);
    }, [activeSessions, dailyRecords, selectedDate, isToday, maxConcurrent]); // Removed clientSessions from dependency as it is derived 

    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getGroupCounts = (empId, date) => {
        const key = `${empId}-${date}`;
        const raw = dailyGroups[key] || { standard: 0, jewelry: 0, recoverable: 0, noDeal: 0, clientSeconds: 0 };
        const totalSold = (raw.standard || 0) + (raw.jewelry || 0) + (raw.recoverable || 0);
        const totalInteractions = totalSold + (raw.noDeal || 0);
        return { ...raw, totalSold, totalInteractions, standard: raw.standard || 0, jewelry: raw.jewelry || 0, recoverable: raw.recoverable || 0, noDeal: raw.noDeal || 0, clientSeconds: raw.clientSeconds || 0 };
    };

    const getDailyStats = () => {
        const stats = {};

        // 1. From Records (Time)
        dailyRecords.filter(r => r.date === selectedDate).forEach(r => {
            if (!stats[r.employeeId]) stats[r.employeeId] = { totalSeconds: 0, sessions: 0, name: r.employeeName };
            stats[r.employeeId].totalSeconds += r.durationSeconds;
            stats[r.employeeId].sessions += 1;
        });

        // 2. From Active Sessions (Live Time)
        if (isToday) {
            activeSessions.forEach(s => {
                if (!stats[s.employeeId]) stats[s.employeeId] = { totalSeconds: 0, sessions: 0, name: s.employeeName };
                const currentDuration = (currentTime - new Date(s.startTime)) / 1000;
                stats[s.employeeId].totalSeconds += currentDuration;
            });
        }

        // 3. From Groups (Sales without time records?)
        // Ensure consistency with Reports: If they have data, they must appear.
        Object.keys(dailyGroups).forEach(key => {
            if (key.endsWith(`-${selectedDate}`)) {
                const empIdStr = key.replace(`-${selectedDate}`, '');
                const empId = parseInt(empIdStr);

                // If not already in stats (no time record), add them
                if (!stats[empId]) {
                    // Try to resolve name
                    const empObj = employees.find(e => e.id === empId);
                    const name = empObj ? (empObj.alias || empObj.firstName) : `Emp #${empId}`;
                    stats[empId] = { totalSeconds: 0, sessions: 0, name };
                }
            }
        });

        return stats;
    };
    const dailyStats = getDailyStats();

    // Client Interaction Logic
    const startClient = async (empId) => {
        await toggleClientSession(empId, true);
        setActiveClientModal(empId);
    };

    const endClient = async (empId, type, reason = null) => {
        const start = clientSessions[empId];
        if (!start) return;

        const durationSec = Math.round((Date.now() - start) / 1000);

        // Update Stats
        const currentData = getGroupCounts(empId, selectedDate);
        const updates = {
            clientSeconds: (currentData.clientSeconds || 0) + durationSec
        };

        if (type === 'noDeal') {
            updates.noDeal = (currentData.noDeal || 0) + 1;
            setNoDealDetail({ empId, reason, date: selectedDate });
        } else {
            updates[type] = (currentData[type] || 0) + 1;
        }

        await updateDailyGroups(empId, selectedDate, updates);
        await toggleClientSession(empId, false); // End in DB
        setActiveClientModal(null);
    };

    // Render Logic

    // ... (Keep existing helpers like calculateShopActiveTime, etc. simplified for brevity if logic unchanged)
    // I will inline the simple ones needed for display.

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-4 relative">

            {/* TOP SECTION: TEAM GRID */}
            <div className="flex-[3] flex gap-6 min-h-0">
                <div className="w-2/3 bg-[#1e293b]/60 backdrop-blur-xl rounded-[2.5rem] p-0 border border-white/5 flex flex-col shadow-2xl relative overflow-hidden">

                    {/* AUTO-CLOSE SETTINGS BAR (Manager/Supervisor/Responsible) */}
                    {canEditPanels && (
                        <div className="bg-slate-900/80 backdrop-blur border-b border-white/5 px-6 py-2 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Settings size={14} className="text-pink-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Config Cierre Automático</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Mediodía</span>
                                    <input
                                        type="time"
                                        value={closingHours.midday}
                                        onChange={e => setClosingHours({ ...closingHours, midday: e.target.value })}
                                        className="bg-slate-800 border border-white/10 rounded px-2 py-0.5 text-xs text-white font-mono focus:border-pink-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Noche</span>
                                    <input
                                        type="time"
                                        value={closingHours.night}
                                        onChange={e => setClosingHours({ ...closingHours, night: e.target.value })}
                                        className="bg-slate-800 border border-white/10 rounded px-2 py-0.5 text-xs text-white font-mono focus:border-pink-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveClosingHours}
                                    className="p-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors flex items-center gap-1"
                                    title="Guardar Configuración"
                                >
                                    <Save size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="p-6 flex flex-col h-full overflow-hidden">
                        {/* ... (Team Grid Header & Content - unchanged) ... */}
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                                    <ShoppingBag className="text-pink-500" size={24} />
                                    Productividad & Kiosco
                                </h1>
                                <p className="text-slate-400 font-medium ml-1 text-xs">
                                    {isToday ? "Gestiona tus clientes en tiempo real." : `Viendo registros del día ${selectedDate}`}
                                </p>
                            </div>
                            <div className="text-right flex gap-4 items-center">
                                {isManagerial && (
                                    <>
                                        <button
                                            onClick={() => setShowCloseModal(true)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isDayClosed
                                                ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30'
                                                }`}
                                        >
                                            {isDayClosed ? 'Día Cerrado (Ver)' : 'Cerrar Día'}
                                        </button>
                                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-900 text-white border border-slate-800 rounded-lg px-2 py-1 font-mono text-xs focus:border-pink-500 outline-none" />
                                    </>
                                )}
                                <p className="text-3xl font-mono font-bold text-slate-200 tracking-tighter">{currentTime.toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto custom-scrollbar flex-1 content-start p-2 -mx-2">
                            {employees.filter(e => e.isBuyer).map(emp => {
                                const session = activeSessions.find(s => String(s.employeeId) === String(emp.id));
                                const isClientActive = !!clientSessions[emp.id];
                                const isSessionActive = !!session || isClientActive;

                                return (
                                    <div
                                        key={emp.id}
                                        onClick={() => {
                                            if (!isToday) return;
                                            if (isClientActive) { setActiveClientModal(emp.id); return; }
                                            if (!isSessionActive) { startSession(emp.id, `${emp.firstName} ${emp.lastName}`); return; }
                                            startClient(emp.id);
                                        }}
                                        className={`relative rounded-2xl p-2 flex flex-col gap-1 transition-all duration-300 border h-28 overflow-hidden group select-none cursor-pointer 
                                        ${isClientActive ? 'bg-amber-500 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] scale-[1.02] z-10' :
                                                isSessionActive ? 'bg-slate-800 border-pink-500/50 hover:border-pink-500' :
                                                    'bg-slate-800/40 border-white/5 opacity-60 hover:opacity-100 hover:bg-slate-800'
                                            }`}
                                    >
                                        {isSessionActive && !isClientActive && (isManagerial || emp.id === user?.id) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm('¿Terminar turno de ' + emp.alias + '?')) endSession(emp.id); }}
                                                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-black/20 hover:bg-red-500 rounded-full z-20 transition-all backdrop-blur-sm"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}

                                        {!isSessionActive ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform opacity-70 group-hover:opacity-100">
                                                <div className="w-10 h-10 rounded-xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-sm font-bold text-slate-400 group-hover:border-pink-500 group-hover:text-pink-500 transition-colors">
                                                    {emp.firstName.substring(0, 1)}
                                                </div>
                                                <p className="text-xl font-black text-slate-400 group-hover:text-white uppercase tracking-tight">{emp.alias || emp.firstName}</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col h-full w-full relative">
                                                <div className="flex items-center gap-2 mb-2 px-1 relative z-10">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shadow-lg ${isClientActive ? 'bg-black text-amber-500 border-black' : 'bg-pink-600 border-pink-500 text-white'}`}>
                                                        {emp.firstName.substring(0, 1)}
                                                    </div>
                                                    <p className={`font-black text-lg truncate leading-none uppercase tracking-tight ${isClientActive ? 'text-black' : 'text-white'}`}>
                                                        {emp.alias || emp.firstName}
                                                    </p>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    {isClientActive ? (
                                                        <div className="flex flex-col items-center animate-pulse">
                                                            <Clock size={32} className="text-black mb-1" />
                                                            <span className="font-black text-black text-sm uppercase tracking-widest">En Curso</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <UserPlus size={32} className="text-pink-500 mb-1" />
                                                            <span className="font-bold text-slate-400 text-xs uppercase tracking-widest group-hover:text-white transition-colors">Atender</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* STATS RIGHT - 3 CELLS RESTORED */}
                <div className="w-1/3 flex flex-col gap-4">
                    {/* Cell 1: Gold Price & Shop Active Timer */}
                    <div className="flex gap-4 h-24 shrink-0 transition-transform hover:scale-[1.02]">
                        <div className="flex-1 flex bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 rounded-3xl shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-20 mix-blend-overlay"></div>

                            {/* Left: Editable Main Price */}
                            <div
                                onClick={handleGoldPriceUpdate}
                                className="flex-[3] p-3 flex flex-col justify-center cursor-pointer hover:bg-black/5 transition-colors relative z-10"
                            >
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 text-black mb-0.5">Precio Tienda</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-4xl font-black font-mono tracking-tighter text-black leading-none">{goldPrice}</p>
                                    <span className="text-xs font-bold text-black/60">€/gr</span>
                                </div>
                            </div>

                            {/* Right: External Reference Prices (Permanent) */}
                            <div className="flex-[2] bg-black/10 backdrop-blur-sm border-l border-black/5 p-2 flex flex-col justify-center gap-1.5 relative z-10">
                                {externalPrices ? (
                                    <>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[8px] font-black text-black/50 uppercase tracking-tighter">ANDORRANO</span>
                                            <span className="text-xs font-mono font-bold text-black leading-none">{externalPrices.andorrano}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[8px] font-black text-black/50 uppercase tracking-tighter">QUICKGOLD</span>
                                            <span className="text-xs font-mono font-bold text-black leading-none">{externalPrices.quickgold}</span>
                                        </div>
                                        <div className="text-[7px] text-black/40 text-center font-mono mt-0.5">
                                            {new Date(externalPrices.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-1">
                                        <div className="w-3 h-3 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[8px] font-bold text-black/40">Cargando...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-1/3 bg-slate-800 rounded-3xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest absolute top-3">Tiempo Tienda</p>
                            <span className={`text-xl font-mono font-bold ${Object.keys(clientSessions).length > 0 ? 'text-green-400 animate-pulse' : 'text-slate-400'}`}>
                                {formatDuration(shopActiveSeconds * 1000)}
                            </span>
                            <div className="absolute bottom-2 flex gap-1">
                                {Array.from({ length: Object.keys(clientSessions).length }).map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cell 2 & 3: Needs & Overstock (Grid) */}
                    <div className="flex-1 min-h-0 grid grid-rows-2 gap-4">
                        <InfoPanel
                            title="NECESIDADES"
                            items={productFamilies.filter(f => f.type === 'need')}
                            inputValue={needInput}
                            setInputValue={setNeedInput}
                            onAdd={handleAddNeed}
                            onRemove={removeProductFamily}
                            isManagerial={canEditPanels}
                            theme="emerald"
                            placeholder="Añadir necesidad..."
                            className="w-full h-full"
                        />
                        <InfoPanel
                            title="SOBRESTOCK"
                            items={productFamilies.filter(f => f.type === 'overstock')}
                            inputValue={overstockInput}
                            setInputValue={setOverstockInput}
                            onAdd={handleAddOverstock}
                            onRemove={removeProductFamily}
                            isManagerial={canEditPanels}
                            theme="red"
                            placeholder="Añadir sobrestock..."
                            className="w-full h-full"
                        />
                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION: DETAILED TABLE */}
            <div className="flex-[1] bg-[#1e293b]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-6 min-h-0 shadow-xl flex flex-col">
                <div className="overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-slate-400 uppercase border-b border-white/5">
                                <th className="pb-3 pl-2">Empleado</th>
                                <th className="pb-3">Tiempo Turno</th>
                                <th className="pb-3 text-center text-blue-400">T. Compras</th>
                                <th className="pb-3 text-center text-slate-400">Gen</th>
                                <th className="pb-3 text-center text-slate-400">Joy</th>
                                <th className="pb-3 text-center text-slate-400">Rec</th>
                                <th className="pb-3 text-center text-red-500">NO</th>
                                <th className="pb-3 text-right text-pink-500">Total</th>
                                <th className="pb-3 text-right text-amber-500">Gr/h</th>
                                <th className="pb-3 text-right">Hit Rate</th>
                                <th className="pb-3 text-right">T. Medio/Cli</th>
                                {isManagerial && <th className="pb-3 text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/5">
                            {Object.keys(dailyStats).map(empId => {
                                const stat = dailyStats[empId];
                                const data = getGroupCounts(empId, selectedDate);
                                const hitRate = data.totalInteractions > 0 ? ((data.totalSold / data.totalInteractions) * 100).toFixed(0) : 0;
                                const avgTime = data.totalInteractions > 0 ? (data.clientSeconds / data.totalInteractions).toFixed(0) : 0;

                                // Logic: Groups / Buying Hour
                                const buyingHours = data.clientSeconds / 3600;
                                const groupsPerHour = buyingHours > 0 ? (data.totalSold / buyingHours).toFixed(1) : "0.0";

                                const avgTimeMin = Math.floor(avgTime / 60);
                                const avgTimeSec = avgTime % 60;

                                const employeeData = employees.find(e => e.id === parseInt(empId));
                                const displayName = employeeData ? (employeeData.alias || employeeData.firstName) : stat.name;

                                return (
                                    <tr key={empId} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-3 pl-2 font-bold text-slate-300">{displayName}</td>
                                        <td className="py-3 font-mono text-slate-400 text-xs">{formatDuration(stat.totalSeconds * 1000)}</td>
                                        <td className="py-3 text-center font-mono text-blue-400 font-bold">{formatDuration(data.clientSeconds * 1000)}</td>

                                        <td className="py-3 text-center font-mono text-slate-300">{data.standard}</td>
                                        <td className="py-3 text-center font-mono text-slate-300">{data.jewelry}</td>
                                        <td className="py-3 text-center font-mono text-slate-300">{data.recoverable}</td>
                                        <td className="py-3 text-center font-bold text-red-500 font-mono">{data.noDeal}</td>

                                        <td className="py-3 text-right font-bold text-pink-500 text-lg">{data.totalSold}</td>
                                        <td className="py-3 text-right font-mono font-bold text-amber-500">{groupsPerHour}</td>

                                        <td className="py-3 text-right font-mono">
                                            <span className={`${hitRate < 50 ? 'text-red-500' : hitRate > 80 ? 'text-green-500' : 'text-amber-500'}`}>{hitRate}%</span>
                                        </td>
                                        <td className="py-3 text-right font-mono text-slate-400">
                                            {avgTimeMin}m {avgTimeSec}s
                                        </td>
                                        {isManagerial && (
                                            <td className="py-2.5 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingStats({ empId: parseInt(empId), date: selectedDate, currentStats: data })}
                                                    className="p-1 hover:bg-amber-500/20 text-slate-500 hover:text-amber-400 rounded" title="Modificar Grupos"
                                                >
                                                    <BarChart2 size={12} />
                                                </button>
                                                {canEditTimes && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditingShiftTime({ empId: parseInt(empId), employeeName: displayName, totalSeconds: stat.totalSeconds })}
                                                            className="p-1 hover:bg-green-500/20 text-slate-500 hover:text-green-400 rounded" title="Editar Tiempo Turno"
                                                        >
                                                            <Clock size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingRecord({ empId: empId, durationSeconds: data.clientSeconds })}
                                                            className="p-1 hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 rounded" title="Editar Tiempo Compras"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`¿Eliminar todos los datos de ${displayName} para este día?`)) {
                                                            deleteEmployeeDayData(empId, selectedDate);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded" title="Eliminar Empleado del Día"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS */}

            {/* EDIT TIME MODAL */}
            {
                editingRecord && (
                    <EditTimeModal
                        record={editingRecord}
                        onClose={() => setEditingRecord(null)}
                        onSave={(newSeconds) => {
                            if (editingRecord.empId) {
                                updateDailyGroups(editingRecord.empId, selectedDate, { clientSeconds: newSeconds });
                                setEditingRecord(null);
                            }
                        }}
                    />
                )
            }

            {/* EDIT SHIFT TIME MODAL */}
            {
                editingShiftTime && (
                    <EditShiftTimeModal
                        employeeId={editingShiftTime.empId}
                        employeeName={editingShiftTime.employeeName}
                        currentSeconds={editingShiftTime.totalSeconds}
                        onClose={() => setEditingShiftTime(null)}
                        onSave={(newSeconds) => {
                            updateEmployeeShiftTime(editingShiftTime.empId, selectedDate, newSeconds);
                            setEditingShiftTime(null);
                        }}
                    />
                )
            }

            {
                showCloseModal && (
                    <CloseDayModal
                        date={selectedDate}
                        onClose={() => setShowCloseModal(false)}
                        onConfirm={async (text) => {
                            await updateDayIncident(selectedDate, text);
                            await closeDay(selectedDate, { max_concurrent: maxConcurrent, observation: text });
                            setShowCloseModal(false);
                        }}
                        initialIncidentText={dayIncidents[selectedDate] || ''}
                        maxConcurrent={maxConcurrent}
                        isClosed={isDayClosed}
                        onReopen={async () => {
                            if (confirm('¿Estás seguro de reabrir este día?')) {
                                await reopenDay(selectedDate);
                                setShowCloseModal(false);
                            }
                        }}
                    />
                )
            }

            {/* EDIT STATS MODAL */}
            {
                editingStats && (
                    <EditStatsModal
                        empId={editingStats.empId}
                        date={editingStats.date}
                        currentStats={editingStats.currentStats}
                        onClose={() => setEditingStats(null)}
                        onSave={(newStats) => {
                            updateDailyGroups(editingStats.empId, editingStats.date, newStats);
                            setEditingStats(null);
                        }}
                    />
                )
            }

            {/* NO DEAL DETAIL MODAL */}
            {
                noDealDetail && (
                    <NoDealModal
                        onClose={() => setNoDealDetail(null)}
                        employeeId={noDealDetail.empId}
                        reasonRaw={noDealDetail.reason}
                        onSave={async (details) => {
                            await addNoDealDetail({
                                ...details,
                                date: noDealDetail.date,
                                employee_id: noDealDetail.empId,
                                reason: noDealDetail.reason
                            });
                            setNoDealDetail(null);
                        }}
                    />
                )
            }

            {/* CLIENT INTERACTION MODAL */}
            {
                activeClientModal && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex justify-center items-center p-4 animate-in fade-in duration-200">
                        <div className="bg-[#1e293b] w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl relative">
                            {/* Timer Header */}
                            <div className="text-center mb-8">
                                <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2 animate-pulse">Atendiendo Cliente...</p>
                                <ClientTimer startTime={clientSessions[activeClientModal]} />
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => endClient(activeClientModal, 'standard')} className="bg-slate-700 hover:bg-green-600 text-white p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group">
                                    <Check size={24} className="group-hover:scale-125 transition-transform" />
                                    <span>Compra General</span>
                                </button>
                                <button onClick={() => endClient(activeClientModal, 'jewelry')} className="bg-slate-700 hover:bg-amber-500 hover:text-black text-white p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group">
                                    <Watch size={24} className="group-hover:scale-125 transition-transform" />
                                    <span>Compra Joyería</span>
                                </button>
                                <button onClick={() => endClient(activeClientModal, 'recoverable')} className="bg-slate-700 hover:bg-blue-600 text-white p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group">
                                    <RefreshCw size={24} className="group-hover:scale-125 transition-transform" />
                                    <span>Recuperable</span>
                                </button>
                                <button onClick={() => setActiveClientModal(activeClientModal + '_REJECT')} className="bg-slate-700 hover:bg-red-600 text-white p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group">
                                    <X size={24} className="group-hover:scale-125 transition-transform" />
                                    <span>No Trato / Rechazo</span>
                                </button>
                            </div>

                            <div className="mt-8 pt-4 border-t border-white/5 text-center">
                                <button onClick={() => setActiveClientModal(null)} className="text-xs text-slate-500 hover:text-white underline">Ocultar (Seguir Crono)</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* REJECTION REASON MODAL */}
            {
                activeClientModal && typeof activeClientModal === 'string' && activeClientModal.includes('_REJECT') && (
                    <div className="absolute inset-0 z-[60] bg-black/90 flex justify-center items-center p-4">
                        <div className="bg-[#1e293b] w-full max-w-md rounded-3xl p-6 border border-red-500/30 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6 text-center">Motivo del Rechazo</h3>
                            <div className="flex flex-col gap-3">
                                {REJECTION_REASONS.map(reason => (
                                    <button
                                        key={reason}
                                        onClick={() => endClient(parseInt(activeClientModal), 'noDeal', reason)}
                                        className="p-3 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-white/5 rounded-xl text-left text-sm font-medium transition-colors"
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setActiveClientModal(null)} className="mt-4 w-full py-3 text-slate-500 hover:text-white text-sm">Cancelar / Cerrar</button>
                        </div>
                    </div>
                )
            }

            {/* VISUAL LOCATIONS MODAL */}
            <VisualLocationsModal
                isOpen={!!activeLocationCategory}
                onClose={() => setActiveLocationCategory(null)}
                category={activeLocationCategory}
            />

            {/* LOCATION BUTTONS DOCK (Footer) */}
            <div className="w-full flex justify-end shrink-0">
                <div className="bg-[#0f172a]/90 backdrop-blur-md border border-orange-500/20 rounded-2xl p-3 pl-4 pr-3 shadow-[0_0_40px_-10px_rgba(249,115,22,0.1)] flex flex-col gap-3 group transition-all hover:border-orange-500/40">
                    <div className="flex items-center gap-2 select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_currentColor] animate-pulse"></div>
                        <span className="text-[10px] font-black text-orange-500 tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                            Ubicaciones VR
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {LOCATION_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveLocationCategory(cat)}
                                className="h-10 px-3 bg-slate-800 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/50 rounded-lg transition-all text-[10px] font-bold text-slate-400 hover:text-orange-400 uppercase tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div >
    );
};

// Sub-component for Live Timer
const ClientTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        // Initial set
        setElapsed(Date.now() - startTime);

        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime || isNaN(elapsed)) {
        return <span className="text-6xl font-black font-mono text-white tracking-widest tabular-nums">00:00</span>;
    }

    const seconds = Math.max(0, Math.floor(elapsed / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return (
        <span className="text-6xl font-black font-mono text-white tracking-widest tabular-nums">
            {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
        </span>
    );
};

export default Productivity;
