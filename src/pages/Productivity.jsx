import React, { useState, useEffect, useRef } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { useTeam } from '../context/TeamContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Clock, RefreshCw, Trash2, UserPlus, Check, X, Watch, Pencil, BarChart2, Box, Save, Settings, Megaphone, AlertTriangle, UserX, Activity, LayoutGrid, List } from 'lucide-react';
import { format } from 'date-fns';
import InfoPanel from '../components/Productivity/InfoPanel';
import CloseDayModal from '../components/Productivity/CloseDayModal';
import EditTimeModal from '../components/Productivity/EditTimeModal';
import EditShiftTimeModal from '../components/Productivity/EditShiftTimeModal';
import EditStatsModal from '../components/Productivity/EditStatsModal';
import NoDealModal from '../components/Productivity/NoDealModal';
import VisualLocationsModal from '../components/Productivity/VisualLocationsModal';
import ProductivityTimeline from '../components/Productivity/ProductivityTimeline';
import AnomalyPanel from '../components/Productivity/AnomalyPanel';
import GamifiedCard from '../components/Productivity/GamifiedCard';
import KioskoModal from '../components/Productivity/KioskoModal';
import ReactDOM from 'react-dom/client';
import { ProductivityWidget } from '../components/Productivity/ProductivityWidget';


// REJECTION_REASONS removed as per request to simplify flow

const Productivity = () => {
    const {
        activeSessions, dailyRecords, startSession, endSession,
        dailyGroups, updateDailyGroups, closedDays, closeDay, reopenDay,
        getUnclosedPastDays, dayIncidents, updateDayIncident,
        updateRecord, addManualRecord, deleteEmployeeDayData,
        productFamilies, addProductFamily, removeProductFamily,
        addNoDealDetail, toggleClientSession, cancelSession,
        goldPrice, updateGoldPrice, updateEmployeeShiftTime, logTransaction, transactionLogs // Added transactionLogs
    } = useProductivity();

    const { employees, updateEmployee } = useTeam();
    const { user } = useAuth();
    const { currentStore } = useStore();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [isClientMode, setIsClientMode] = useState(false);
    const [needInput, setNeedInput] = useState("");
    const [overstockInput, setOverstockInput] = useState("");
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'

    // Location Categories
    const LOCATION_CATEGORIES = ['LETRAS', 'VOLÚMENES', 'PATINETES', 'ALMACEN / PARED', 'RESERVA'];
    const [activeLocationCategory, setActiveLocationCategory] = useState(null); // null means closed
    const [visualLocationsModalOpen, setVisualLocationsModalOpen] = useState(false);
    const [storeMap, setStoreMap] = useState(null);

    // Live Client State
    const [activeClientModal, setActiveClientModal] = useState(null); // ID of employee
    const [rewardModalEmployeeId, setRewardModalEmployeeId] = useState(null); // Just ID, look up fresh object
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

    // Floating Widget Refs & Handlers (Document PiP API)
    const pipWindowRef = useRef(null);
    const pipEmployeeIdRef = useRef(null);
    const pipRootRef = useRef(null);

    // Close floating widget on component unmount
    useEffect(() => {
        return () => {
            if (pipWindowRef.current) {
                pipWindowRef.current.close();
            }
        };
    }, []);

    // Sincronizar dinámicamente el contenido del Widget Flotante al actualizarse el estado del componente padre
    useEffect(() => {
        if (pipRootRef.current && pipEmployeeIdRef.current && pipWindowRef.current) {
            const emp = employees.find(e => String(e.id).trim() === pipEmployeeIdRef.current);
            if (emp) {
                pipRootRef.current.render(
                    <ProductivityWidget 
                        employee={emp} 
                        onClose={() => pipWindowRef.current.close()} 
                        startClient={startClient}
                        endClient={endClient}
                        clientSessions={clientSessions}
                        activeSessions={activeSessions}
                        logTransaction={logTransaction}
                    />
                );
            }
        }
    }, [clientSessions, activeSessions, employees, startClient, endClient, logTransaction]);

    const handleOpenWidget = async (employee) => {
        if (!('documentPictureInPicture' in window)) {
            alert("Tu navegador no soporta el Widget Flotante (requiere Chrome, Edge u Opera 116+).");
            return;
        }

        // Si ya hay una ventana abierta, la cerramos
        if (pipWindowRef.current) {
            pipWindowRef.current.close();
        }

        try {
            const pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 240,
                height: 350,
            });

            pipWindowRef.current = pipWindow;
            pipEmployeeIdRef.current = String(employee.id).trim();

            // Copiar hojas de estilos para aplicar Tailwind
            const allStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
            allStyles.forEach((style) => {
                pipWindow.document.head.appendChild(style.cloneNode(true));
            });

            pipWindow.document.body.style.margin = '0';
            pipWindow.document.body.style.backgroundColor = '#020617'; // bg-slate-950

            const container = pipWindow.document.createElement('div');
            container.id = 'pip-root';
            pipWindow.document.body.appendChild(container);

            const root = ReactDOM.createRoot(container);
            pipRootRef.current = root;
            
            root.render(
                <ProductivityWidget 
                    employee={employee} 
                    onClose={() => pipWindow.close()} 
                    startClient={startClient}
                    endClient={endClient}
                    clientSessions={clientSessions}
                    activeSessions={activeSessions}
                    logTransaction={logTransaction}
                />
            );

            // Desmontar el widget al cerrar la ventana PiP
            pipWindow.addEventListener('pagehide', () => {
                root.unmount();
                pipWindowRef.current = null;
                pipEmployeeIdRef.current = null;
                pipRootRef.current = null;
            });

        } catch (err) {
            console.error('Error al abrir el widget flotante:', err);
        }
    };

    const handleEndSession = (empId) => {
        const idStr = String(empId).trim();
        if (pipEmployeeIdRef.current === idStr && pipWindowRef.current) {
            pipWindowRef.current.close();
        }
        endSession(empId);
    };

    const handleCancelSession = (empId) => {
        const idStr = String(empId).trim();
        if (pipEmployeeIdRef.current === idStr && pipWindowRef.current) {
            pipWindowRef.current.close();
        }
        cancelSession(empId);
    };
    const [editingShiftTime, setEditingShiftTime] = useState(null);
    const [editingStats, setEditingStats] = useState(null);

    const [noDealDetail, setNoDealDetail] = useState(null);

    // Auto-Close & Announcement Settings
    const [settings, setSettings] = useState({ midday: '', night: '', announcement: '' });
    const [showSettings, setShowSettings] = useState(false); // Toggle settings panel

    // Ref to track which close times have already been triggered (to prevent double-triggering within same minute)
    const lastAutoCloseRef = useRef({ midday: null, night: null });

    // Fetch Settings
    useEffect(() => {
        const storeId = currentStore || 'store_1';
        fetch('/api/settings', {
            headers: { 'x-store-id': storeId }
        })
            .then(res => res.json())
            .then(data => setSettings({
                midday: data.midday_close || '',
                night: data.night_close || '',
                announcement: data.announcement || ''
            }))
            .catch(err => console.error("Error fetching settings", err));
    }, [currentStore]);

    // --- AUTO-CLOSE: Check configured times and end all sessions ---
    useEffect(() => {
        if (!isToday) return; // Only run auto-close for today
        if (activeSessions.length === 0) return; // Nothing to close
        if (!settings.midday && !settings.night) return; // No times configured

        const checkAutoClose = () => {
            const now = new Date();
            // Format current time as "HH:MM" for comparison
            const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const tryClose = (configuredTime, refKey) => {
                if (!configuredTime) return;
                // Trigger if current time >= configured time AND we haven't triggered it today yet for this key
                const todayKey = `${format(now, 'yyyy-MM-dd')}-${configuredTime}`;
                if (currentHHMM >= configuredTime && lastAutoCloseRef.current[refKey] !== todayKey) {
                    lastAutoCloseRef.current[refKey] = todayKey;
                    console.log(`[AutoClose] Triggering ${refKey} auto-close at ${currentHHMM} (configured: ${configuredTime})`);
                    // End all active sessions
                    activeSessions.forEach(session => {
                        endSession(session.employeeId);
                    });
                }
            };

            tryClose(settings.midday, 'midday');
            tryClose(settings.night, 'night');
        };

        // Check immediately and then every 30 seconds
        checkAutoClose();
        const autoCloseInterval = setInterval(checkAutoClose, 30000);
        return () => clearInterval(autoCloseInterval);
    }, [settings, activeSessions, isToday]);

    const handleSaveSettings = async () => {
        try {
            const storeId = currentStore || 'store_1';
            await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-store-id': storeId
                },
                body: JSON.stringify({
                    midday_close: settings.midday,
                    night_close: settings.night,
                    announcement: settings.announcement
                })
            });
            alert('Configuración guardada correctamente.');
            setShowSettings(false);
        } catch (err) {
            alert('Error al guardar configuración.');
        }
    };

    const [showGoldDetails, setShowGoldDetails] = useState(false);



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

    const isManagerial = [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role);
    // Responsible can edit panels but NOT necessarily see deep stats? Let's check request.
    // Request: "estadisticas completas solo las pueda ver el gerente y el supervisor".
    // So Responsible/Employee/Kiosk get simplified view.
    const canSeeDeepStats = [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role);

    const canEditPanels = [ROLES.MANAGER, ROLES.RESPONSIBLE, ROLES.SUPERVISOR].includes(user?.role);
    const canEditTimes = [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role);
    const isDayClosed = closedDays.includes(selectedDate);
    const unclosedDays = getUnclosedPastDays();

    // Ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [])
    
    // Shop Active Timer & Max Concurrent Logic
    useEffect(() => {
        const interval = setInterval(() => {
            const activeBuyingCount = Object.keys(clientSessions).length;
            if (activeBuyingCount > maxConcurrent) {
                setMaxConcurrent(activeBuyingCount);
            }

            // Recalculate shop active time
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

        }, 1000);

        return () => clearInterval(interval);
    }, [activeSessions, dailyRecords, selectedDate, isToday, maxConcurrent]); // removed clientSessions dependency so it ticks smoothly

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
                const sessionStart = new Date(s.startTime);
                // Safety: if session started on a different day, use midnight of today as start
                // to avoid 100+ hour sessions from forgotten open sessions
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);
                const effectiveStart = sessionStart < todayMidnight ? todayMidnight : sessionStart;
                const currentDuration = (currentTime - effectiveStart) / 1000;
                stats[s.employeeId].totalSeconds += Math.max(0, currentDuration);
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
    const startClient = async (empId, showModal = true) => {
        await toggleClientSession(empId, true);
        if (showModal) {
            setActiveClientModal(empId);
        }
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

        const groupRes = await updateDailyGroups(empId, selectedDate, updates);

        // Log accurate transaction for stats
        const txRes = await logTransaction(empId, new Date(start).toISOString(), new Date().toISOString(), type, { reason });

        // Gamification: Update XP Local State
        const emp = employees.find(e => e.id === empId);
        if (emp) {
            let g = { ...(emp.gamification || {}) };
            let changed = false;

            // 1. Transaction Response (Absolute Values from Backend)
            if (txRes && txRes.success && txRes.xp !== undefined) {
                g.xp = txRes.xp;
                g.level = txRes.level;
                g.coins = txRes.coins;
                if (txRes.reward) g.pendingRewards = (parseInt(g.pendingRewards) || 0) + 1;
                changed = true;
            }
            // 2. Group Update Response (Delta) - if tx didn't have gamification data (e.g. correction)
            else if (groupRes && groupRes.xpDelta) {
                g.xp = Math.max(0, (g.xp || 0) + groupRes.xpDelta);
                g.level = Math.floor(Math.sqrt(g.xp / 100)) + 1;
                // Coins if available in groupRes? Backend doesn't return coinsDelta yet in daily-groups but we should.
                // But Transaction is main source for sales. Groups update is for corrections.
                changed = true;
            }

            if (changed) {
                updateEmployee(empId, { gamification: g });
            }
        }

        await toggleClientSession(empId, false); // End in DB
        setActiveClientModal(null);
    };

    // Render Logic

    // ... (Keep existing helpers like calculateShopActiveTime, etc. simplified for brevity if logic unchanged)
    // I will inline the simple ones needed for display.

    const handleResetGamification = async (empId) => {
        if (!confirm("¿ESTÁS SEGURO? Esto reiniciará por completo el nivel, experiencia y objetos del empleado. Esta acción no se puede deshacer.")) return;

        try {
            const storeId = currentStore || 'store_1';
            const res = await fetch(`/api/employees/${empId}/reset-gamification`, {
                method: 'POST',
                headers: { 'x-store-id': storeId }
            });

            if (res.ok) {
                const data = await res.json();
                updateEmployee(empId, { gamification: data.employee.gamification });
                alert("Perfil reseteado correctamente.");
            } else {
                alert("Error al resetear perfil.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión.");
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative gap-4 animate-in bg-[#F8F9FB] p-6 -m-6">

            {/* ANNOUNCEMENT TICKER */}
            {settings.announcement && (
                <div className="w-full bg-red-600 text-white overflow-hidden py-1 shrink-0 shadow-lg relative z-20">
                    <div className="animate-marquee whitespace-nowrap font-bold text-sm tracking-widest flex items-center gap-8 uppercase">
                        <span><Megaphone size={14} className="inline mr-2 fill-white text-red-600" /> {settings.announcement}</span>
                        <span><Megaphone size={14} className="inline mr-2 fill-white text-red-600" /> {settings.announcement}</span>
                        <span><Megaphone size={14} className="inline mr-2 fill-white text-red-600" /> {settings.announcement}</span>
                        <span><Megaphone size={14} className="inline mr-2 fill-white text-red-600" /> {settings.announcement}</span>
                    </div>
                </div>
            )}

            {/* TOP SECTION: TEAM GRID */}
            <div className="flex-[3] flex flex-col xl:flex-row gap-6 min-h-0 overflow-hidden">
                <div className="w-full xl:w-2/3 bg-white rounded-2xl p-0 border border-[#E2E8F0] flex flex-col shadow-sm relative overflow-hidden shrink-0" style={{ boxShadow: 'var(--shadow-card)' }}>

                    {/* SETTINGS PANEL */}
                    {canEditPanels && (
                        <div className="bg-[#F4F7FA] border-b border-[#E2E8F0] py-2 px-6 flex flex-col gap-2 relative z-20">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
                                <div className="flex items-center gap-2 text-[#718096] hover:text-[#1A365D] transition-colors">
                                    <Settings size={14} style={{ color: '#FF8C9D' }} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Configuración Tienda / Tablón</span>
                                </div>
                                <span className="text-[10px] text-[#A0AEC0]">{showSettings ? 'Ocultar' : 'Mostrar'}</span>
                            </div>

                            {showSettings && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in">
                                    {/* Closes */}
                                    <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-[#E2E8F0]">
                                        <span className="text-[10px] uppercase font-bold text-[#A0AEC0] w-20">Cierre Auto:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-[#718096]">Mediodía</span>
                                            <input
                                                type="time"
                                                value={settings.midday}
                                                onChange={e => setSettings({ ...settings, midday: e.target.value })}
                                                className="bg-[#F4F7FA] border border-[#E2E8F0] rounded px-2 py-0.5 text-xs text-[#1A365D] font-mono focus:border-[#FF8C9D] outline-none w-20"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-[#718096]">Noche</span>
                                            <input
                                                type="time"
                                                value={settings.night}
                                                onChange={e => setSettings({ ...settings, night: e.target.value })}
                                                className="bg-[#F4F7FA] border border-[#E2E8F0] rounded px-2 py-0.5 text-xs text-[#1A365D] font-mono focus:border-[#FF8C9D] outline-none w-20"
                                            />
                                        </div>
                                    </div>
                                    {/* Announcement */}
                                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E2E8F0]">
                                        <Megaphone size={14} className="text-red-500 shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Mensaje Urgente (Tablón)..."
                                            value={settings.announcement}
                                            onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                                            className="bg-[#F4F7FA] border border-[#E2E8F0] rounded px-2 py-0.5 text-xs text-[#1A365D] flex-1 focus:border-red-400 outline-none"
                                        />
                                        <button
                                            onClick={handleSaveSettings}
                                            className="p-1 px-3 text-white rounded-md text-[10px] font-bold uppercase transition-colors"
                                            style={{ background: '#FF8C9D' }}
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-8 flex flex-col h-full overflow-hidden">
                        {/* ... (Team Grid Header & Content - unchanged) ... */}
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h1 className="text-xl font-black text-[#1A365D] tracking-tight flex items-center gap-2">
                                    <ShoppingBag style={{ color: '#FF8C9D' }} size={22} />
                                    Productividad &amp; Kiosco
                                </h1>
                                <p className="text-[#718096] text-xs mt-0.5">
                                    {isToday ? 'Gestiona tus clientes en tiempo real.' : `Viendo registros del día ${selectedDate}`}
                                </p>
                            </div>

                            {/* VIEW TOGGLE */}
                            <div className="flex bg-[#F4F7FA] p-1 rounded-lg border border-[#E2E8F0] mr-4">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'text-white shadow-sm' : 'text-[#A0AEC0] hover:text-[#1A365D]'}`}
                                    style={viewMode === 'grid' ? { background: '#FF8C9D' } : {}}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'timeline' ? 'text-white shadow-sm' : 'text-[#A0AEC0] hover:text-[#1A365D]'}`}
                                    style={viewMode === 'timeline' ? { background: '#FF8C9D' } : {}}
                                >
                                    <List size={16} />
                                </button>
                            </div>

                            <div className="text-right flex gap-4 items-center">
                                {isManagerial && (
                                    <>
                                        <button
                                            onClick={() => setShowCloseModal(true)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isDayClosed
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                                                }`}
                                        >
                                            {isDayClosed ? 'Día Cerrado (Ver)' : 'Cerrar Día'}
                                        </button>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="bg-[#F4F7FA] text-[#1A365D] border border-[#E2E8F0] rounded-lg px-2 py-1 font-mono text-xs focus:border-[#FF8C9D] outline-none"
                                        />
                                    </>
                                )}
                                <p className="text-3xl font-mono font-bold text-[#1A365D] tracking-tighter">{currentTime.toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div className={`${viewMode === 'timeline' ? 'flex flex-col' : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5'} gap-6 overflow-y-auto custom-scrollbar flex-1 content-start p-2 -mx-2`}>
                            {viewMode === 'timeline' ? (
                                <ProductivityTimeline
                                    selectedDate={selectedDate}
                                    dailyRecords={dailyRecords}
                                    transactionLogs={transactionLogs}
                                    activeSessions={activeSessions}
                                    employees={employees.filter(e => e.isBuyer)}
                                />
                            ) : (
                                employees.filter(e => e.isBuyer).map(emp => {
                                    const session = activeSessions.find(s => String(s.employeeId) === String(emp.id));
                                    const isClientActive = !!clientSessions[emp.id];
                                    const isSessionActive = !!session || isClientActive;
                                    const stats = getGroupCounts(emp.id, selectedDate);

                                    return (
                                        <GamifiedCard
                                            key={emp.id}
                                            emp={emp}
                                            session={session}
                                            isClientActive={isClientActive}
                                            stats={stats}
                                            onClick={() => {
                                                if (!isToday) return;
                                                if (isClientActive) { setActiveClientModal(emp.id); return; }
                                                if (!isSessionActive) { 
                                                    startSession(emp.id, `${emp.firstName} ${emp.lastName}`); 
                                                } else {
                                                    startClient(emp.id);
                                                }
                                            }}
                                            onEndSession={(id) => handleEndSession(id)}
                                            onOpenRewards={(id) => setRewardModalEmployeeId(id)}
                                            onResetGamification={handleResetGamification}
                                            isManagerial={isManagerial}
                                            user={user}
                                            onOpenWidget={handleOpenWidget}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* STATS RIGHT - 3 CELLS RESTORED */}
                <div className="w-full xl:w-1/3 flex flex-col gap-4 min-h-0 overflow-hidden">
                    {/* Cell 1: Gold Price & Shop Active Timer */}
                    <div className="flex gap-4 h-44 shrink-0">
                        {/* WIDGET PRECIOS ORO */}
                        <div 
                            className="flex-1 rounded-[24px] border border-[#F3E5AB] p-4 transition-all duration-300 hover:-translate-y-0.5 relative flex flex-col"
                            style={{ 
                                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF4D6 100%)',
                                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.1)'
                            }}
                        >
                            <span className="absolute top-4 right-4 text-xl">📈</span>
                            
                            {/* BLOQUE SUPERIOR: 18K PRINCIPAL */}
                            <div 
                                className="flex flex-col cursor-pointer group/gold"
                                onClick={handleGoldPriceUpdate}
                            >
                                <span className="text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">Oro 18k</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[32px] font-[900] text-[#1A365D] tracking-tighter leading-none">{goldPrice}</span>
                                    <span className="text-[16px] font-bold text-[#1A365D]/60 whitespace-nowrap">€/gr</span>
                                    <Pencil size={12} className="ml-2 text-[#A0AEC0] opacity-0 group-hover/gold:opacity-100 transition-opacity"/>
                                </div>
                            </div>

                            {/* BLOQUE INFERIOR: GRID OTROS QUILATES */}
                            <div className="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-[#D4AF37]/20">
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-[#A0AEC0] font-bold uppercase">24k</span>
                                    <span className="text-[16px] font-bold text-[#1A365D]">{Math.round(goldPrice * 1.33)}€</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-[#A0AEC0] font-bold uppercase">14k</span>
                                    <span className="text-[16px] font-bold text-[#1A365D]">{Math.round(goldPrice * 0.75)}€</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-[#A0AEC0] font-bold uppercase">9k</span>
                                    <span className="text-[16px] font-bold text-[#1A365D]">{Math.round(goldPrice * 0.40)}€</span>
                                </div>
                            </div>
                        </div>

                        {/* WIDGET TIEMPO TIENDA */}
                        <div 
                            className="w-1/3 bg-white border border-[#F3E5AB] rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-0.5 flex flex-col items-center justify-center relative overflow-hidden"
                            style={{ boxShadow: '0 4px 15px rgba(212, 175, 55, 0.05)' }}
                        >
                            <p className="text-[11px] font-bold text-[#A0AEC0] uppercase tracking-widest mb-2">Tiempo Tienda</p>
                            <span className={`text-[32px] font-mono font-black tracking-tighter ${Object.keys(clientSessions).length > 0 ? 'text-[#FF8C9D] animate-pulse' : 'text-[#1A365D]'}`}>
                                {formatDuration(shopActiveSeconds * 1000)}
                            </span>
                            <div className="mt-4 flex gap-1.5">
                                {Array.from({ length: Math.min(6, Object.keys(clientSessions).length) }).map((_, i) => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-[#FF8C9D] animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                                {Object.keys(clientSessions).length > 6 && <span className="text-[10px] text-[#FF8C9D] font-bold">+{Object.keys(clientSessions).length - 6}</span>}
                            </div>
                            {/* Subtle bottom accent to match 18k pride */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1.5 transition-colors ${Object.keys(clientSessions).length > 0 ? 'bg-[#FF8C9D]' : 'bg-[#F3E5AB]/30'}`} />
                        </div>
                    </div>

                    {/* Cell 2 & 3: Needs & Overstock (Flex) */}
                    <div className="flex-1 min-h-0 flex flex-col gap-4">
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
            <div className="flex-[1] bg-white rounded-3xl border border-[#E2E8F0] p-8 min-h-0 flex flex-col shadow-sm" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {isManagerial && (
                    <AnomalyPanel
                        dailyStats={dailyStats}
                        transactionLogs={transactionLogs}
                        employees={employees}
                        selectedDate={selectedDate}
                        isManagerial={isManagerial}
                    />
                )}

                <div className="overflow-y-auto flex-1 mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-[#A0AEC0] uppercase border-b border-[#E2E8F0]">
                                <th className="pb-3 pl-2">Empleado</th>
                                {canSeeDeepStats && <th className="pb-3 text-center text-[#718096]">Eficiencia/Ocupación</th>}
                                <th className="pb-3 text-center text-[#4299E1]">T. Compras</th>
                                {canSeeDeepStats && (
                                    <>
                                        <th className="pb-3 text-center text-[#A0AEC0]">Gen</th>
                                        <th className="pb-3 text-center text-[#ECC94B]">Joy</th>
                                        <th className="pb-3 text-center text-[#4299E1]">Rec</th>
                                        <th className="pb-3 text-center text-red-500">NO</th>
                                    </>
                                )}
                                <th className="pb-3 text-right" style={{ color: '#FF8C9D' }}>Total</th>
                                {canSeeDeepStats && (
                                    <>
                                        <th className="pb-3 text-right text-[#ECC94B]">Gr/h</th>
                                        <th className="pb-3 text-right">Hit Rate</th>
                                        <th className="pb-3 text-right">T. Medio/Cli</th>
                                    </>
                                )}
                                {isManagerial && <th className="pb-3 text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-[#E2E8F0]">
                            {Object.keys(dailyStats).sort((a, b) => {
                                const nA = employees.find(e => e.id == a)?.firstName || '';
                                const nB = employees.find(e => e.id == b)?.firstName || '';
                                return nA.localeCompare(nB);
                            }).map(empId => {
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

                                // --- METRICS FOR FRAUD DETECTION ---
                                const totalShiftSeconds = Math.max(1, stat.totalSeconds);
                                const totalClientSeconds = data.clientSeconds;
                                const occupationRate = Math.min(100, (totalClientSeconds / totalShiftSeconds) * 100).toFixed(0);
                                const idleTime = Math.max(0, totalShiftSeconds - totalClientSeconds);

                                // Suspicious Criteria: 
                                // 1. Extremely low avg time (< 3 mins) AND Low Occupation (< 30%)
                                // 2. High number of interactions but barely any logged time
                                const isSuspicious = (avgTime < 180 && occupationRate < 30 && data.totalInteractions > 2);

                                // Show suspicion only if allowed
                                const showSuspicion = isSuspicious && canSeeDeepStats;

                                return (
                                    <tr key={empId} className={`group border-b border-transparent hover:bg-[#F4F7FA] transition-colors ${showSuspicion ? 'bg-red-50 border-red-100' : ''}`}>
                                        <td className="py-3 pl-2">
                                            <div className="flex flex-col">
                                                <span className={`font-semibold ${showSuspicion ? 'text-red-500' : 'text-[#1A365D]'}`}>{displayName}</span>
                                                {canSeeDeepStats && <span className="text-[10px] text-[#A0AEC0] font-mono">Turno: {formatDuration(stat.totalSeconds * 1000)}</span>}
                                            </div>
                                        </td>

                                        {canSeeDeepStats && (
                                            <td className="py-5 px-4 w-64">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-end text-[10px] uppercase font-black text-[#A0AEC0] tracking-widest">
                                                        <span>Eficiencia</span>
                                                        <span className={isSuspicious ? 'text-red-500' : 'text-[#1A365D]'}>{occupationRate}%</span>
                                                    </div>
                                                    <div className="w-full h-[10px] bg-[#F1F5F9] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${isSuspicious ? 'bg-red-500' : 'bg-[#48BB78]'}`}
                                                            style={{ width: `${occupationRate}%` }}
                                                        />
                                                    </div>
                                                    {isSuspicious && (
                                                        <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mt-1 animate-pulse">
                                                            <AlertTriangle size={10} /> POSIBLE MANIPULACIÓN
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        )}

                                        <td className="py-3 text-center font-mono text-[#4299E1] font-bold text-xs">
                                            {formatDuration(data.clientSeconds * 1000)}
                                            {canSeeDeepStats && <div className="text-[9px] text-[#A0AEC0] font-normal">Idle: {formatDuration(idleTime * 1000)}</div>}
                                        </td>

                                        {canSeeDeepStats && (
                                            <>
                                                <td className="py-3 text-center font-mono text-[#718096]">{data.standard}</td>
                                                <td className="py-3 text-center font-mono text-[#ECC94B]">{data.jewelry}</td>
                                                <td className="py-3 text-center font-mono text-[#4299E1]">{data.recoverable}</td>
                                                <td className="py-3 text-center font-bold text-red-500 font-mono">{data.noDeal}</td>
                                            </>
                                        )}

                                        <td className="py-3 text-right font-bold text-lg" style={{ color: '#FF8C9D' }}>{data.totalSold}</td>

                                        {canSeeDeepStats && (
                                            <>
                                                <td className="py-3 text-right font-mono font-bold text-[#ECC94B]">{groupsPerHour}</td>
                                                <td className="py-3 text-right font-mono">
                                                    <span className={`${hitRate < 50 ? 'text-red-500' : hitRate > 80 ? 'text-[#48BB78]' : 'text-[#ECC94B]'}`}>{hitRate}%</span>
                                                </td>
                                                <td className="py-3 text-right font-mono text-[#718096]">
                                                    {avgTimeMin}m {avgTimeSec}s
                                                </td>
                                            </>
                                        )}
                                        {isManagerial && (
                                            <td className="py-2.5 text-right flex justify-end gap-2">
                                                {activeSessions.find(s => String(s.employeeId) === empId) && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`¿Cancelar el turno actual de ${displayName} sin guardar?`)) {
                                                                handleCancelSession(empId);
                                                            }
                                                        }}
                                                        className="p-1 hover:bg-orange-500/20 text-slate-500 hover:text-orange-400 rounded transition-colors" title="Cancelar Turno Actual"
                                                    >
                                                        <UserX size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setEditingStats({ empId: parseInt(empId), date: selectedDate, currentStats: data })}
                                                    className="p-1 hover:bg-amber-500/20 text-slate-500 hover:text-amber-400 rounded transition-colors" title="Modificar Grupos"
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
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in">
                        <div className="bg-white w-full max-w-lg rounded-2xl p-8 border border-[#E2E8F0] shadow-2xl relative" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            {/* Timer Header */}
                            <div className="text-center mb-8">
                                <p className="font-bold uppercase tracking-widest text-xs mb-3 animate-soft-pulse" style={{ color: '#FF8C9D' }}>Atendiendo Cliente...</p>
                                <ClientTimer startTime={clientSessions[activeClientModal]} />
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => endClient(activeClientModal, 'standard')} className="bg-[#F4F7FA] hover:bg-[#48BB78] hover:text-white text-[#1A365D] p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group border border-[#E2E8F0] hover:border-[#48BB78]">
                                    <Check size={24} className="group-hover:scale-125 transition-transform" />
                                    <span className="text-sm">Compra General</span>
                                </button>
                                <button onClick={() => endClient(activeClientModal, 'jewelry')} className="bg-[#F4F7FA] hover:bg-[#ECC94B] hover:text-black text-[#1A365D] p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group border border-[#E2E8F0] hover:border-[#ECC94B]">
                                    <Watch size={24} className="group-hover:scale-125 transition-transform" />
                                    <span className="text-sm">Compra Joyería</span>
                                </button>
                                <button onClick={() => endClient(activeClientModal, 'recoverable')} className="bg-[#F4F7FA] hover:bg-[#4299E1] hover:text-white text-[#1A365D] p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group border border-[#E2E8F0] hover:border-[#4299E1]">
                                    <RefreshCw size={24} className="group-hover:scale-125 transition-transform" />
                                    <span className="text-sm">Recuperable</span>
                                </button>
                                <button onClick={() => endClient(activeClientModal, 'noDeal', '')} className="bg-[#F4F7FA] hover:bg-red-500 hover:text-white text-[#1A365D] p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 group border border-[#E2E8F0] hover:border-red-400">
                                    <X size={24} className="group-hover:scale-125 transition-transform" />
                                    <span className="text-sm">No Trato / Rechazo</span>
                                </button>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center">
                                <button onClick={() => setActiveClientModal(null)} className="text-xs text-[#A0AEC0] hover:text-[#1A365D] underline underline-offset-2 transition-colors">Ocultar (Seguir Crono)</button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* VISUAL LOCATIONS MODAL */}
            {visualLocationsModalOpen && (
                <VisualLocationsModal
                    isOpen={visualLocationsModalOpen}
                    onClose={() => setVisualLocationsModalOpen(false)}
                    category={activeLocationCategory} // Keep category prop if still used for filtering
                    storeMap={storeMap} // Assuming storeMap exists in scope or context if needed, or fetch inside
                />
            )}

            {/* KIOSKO / REWARD SHOP MODAL */}
            {rewardModalEmployeeId && (
                <KioskoModal
                    isOpen={!!rewardModalEmployeeId}
                    onClose={() => setRewardModalEmployeeId(null)}
                    employee={employees.find(e => e.id === rewardModalEmployeeId)}
                    updateEmployee={updateEmployee}
                    isManagerial={isManagerial}
                    user={user}
                />
            )}

            {/* LOCATION BUTTONS DOCK (Footer) */}
            <div className="w-full flex justify-end shrink-0">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 pl-4 pr-3 flex flex-col gap-3 group transition-all hover:border-[#FF8C9D]/40" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex items-center gap-2 select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C9D] animate-soft-pulse"></div>
                        <span className="text-[10px] font-black text-[#FF8C9D] tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                            Ubicaciones VR
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {LOCATION_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveLocationCategory(cat)}
                                className="h-9 px-3 bg-[#F4F7FA] hover:bg-[#fff0f2] border border-[#E2E8F0] hover:border-[#FF8C9D]/40 rounded-lg transition-all text-[10px] font-bold text-[#718096] hover:text-[#FF8C9D] uppercase tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95"
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
        return <span className="text-6xl font-black font-mono text-[#1A365D] tracking-widest tabular-nums">00:00</span>;
    }

    const seconds = Math.max(0, Math.floor(elapsed / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return (
        <span className="text-6xl font-black font-mono text-[#1A365D] tracking-widest tabular-nums">
            {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
        </span>
    );
};

export default Productivity;
