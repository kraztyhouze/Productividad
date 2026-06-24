import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { 
    Building2, 
    Users, 
    Activity, 
    Plus, 
    Search, 
    Save, 
    CheckCircle, 
    Settings, 
    Power, 
    ShieldAlert,
    RefreshCw,
    AlertTriangle,
    Eye,
    TrendingUp,
    Store
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { stores: contextStores, selectStore } = useStore();
    
    // Tabs state
    const [activeTab, setActiveTab] = useState('stats');
    
    // API data states
    const [stats, setStats] = useState(null);
    const [activeSessions, setActiveSessions] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [recentUsage, setRecentUsage] = useState([]);
    const [allStores, setAllStores] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Forms & Modals states
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [newStore, setNewStore] = useState({ id: '', name: '', color: 'from-blue-600 to-blue-800', isActive: true });
    const [selectedModuleStore, setSelectedModuleStore] = useState('store_1');
    const [modulesList, setModulesList] = useState([]);
    const [savingModules, setSavingModules] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [message, setMessage] = useState(null);

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'x-user-id': String(user?.id || '')
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const headers = getHeaders();
            
            // 1. Load Admin Stats
            const statsRes = await fetch('/api/admin/stats', { headers });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats);
                setActiveSessions(statsData.activeSessions);
                setRecentActivity(statsData.recentActivity);
                setRecentUsage(statsData.recentUsage);
            }
            
            // 2. Load all Stores
            const storesRes = await fetch('/api/admin/stores', { headers });
            if (storesRes.ok) {
                const storesData = await storesRes.json();
                setAllStores(storesData);
            }

            // 3. Load all Users
            const usersRes = await fetch('/api/admin/users', { headers });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setAllUsers(usersData);
            }
        } catch (err) {
            console.error("Error loading admin data:", err);
            showNotification('Error al cargar datos del servidor.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
        showNotification('Panel actualizado con éxito.', 'success');
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    // Load modules when selected store for modules tab changes
    useEffect(() => {
        const fetchStoreModules = async () => {
            if (!selectedModuleStore) return;
            try {
                const res = await fetch(`/api/admin/modules/${selectedModuleStore}`, { headers: getHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setModulesList(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        if (activeTab === 'modules') {
            fetchStoreModules();
        }
    }, [selectedModuleStore, activeTab]);

    const showNotification = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    // Store management actions
    const handleAddStore = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/stores', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newStore)
            });
            const data = await res.json();
            if (res.ok) {
                showNotification(`Tienda "${newStore.name}" creada con éxito.`);
                setShowStoreModal(false);
                setNewStore({ id: '', name: '', color: 'from-blue-600 to-blue-800', isActive: true });
                loadData();
            } else {
                alert(data.error || 'Error al crear tienda.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStoreStatus = async (store) => {
        try {
            const updatedStatus = !store.is_active;
            const res = await fetch(`/api/admin/stores/${store.id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({
                    name: store.name,
                    color: store.color,
                    isActive: updatedStatus
                })
            });
            if (res.ok) {
                showNotification(`Tienda "${store.name}" ${updatedStatus ? 'activada' : 'desactivada'}.`);
                loadData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Module management actions
    const handleToggleModule = (moduleKey) => {
        setModulesList(prev => prev.map(m => 
            m.moduleKey === moduleKey ? { ...m, isEnabled: !m.isEnabled } : m
        ));
    };

    const handleSaveModules = async () => {
        try {
            setSavingModules(true);
            const res = await fetch(`/api/admin/modules/${selectedModuleStore}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ modules: modulesList })
            });
            if (res.ok) {
                showNotification('Configuración de visibilidad guardada con éxito.');
            } else {
                alert('Error al guardar módulos.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingModules(false);
        }
    };

    // User management actions
    const handleSaveUserEdit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({
                    role: editingUser.role,
                    storeId: editingUser.storeId,
                    isActive: editingUser.isActive,
                    isMaster: editingUser.isMaster
                })
            });
            if (res.ok) {
                showNotification('Usuario actualizado correctamente.');
                setEditingUser(null);
                loadData();
            } else {
                alert('Error al actualizar usuario.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Format usage chart data
    const getChartData = () => {
        // Group recentUsage by date
        const dates = [...new Set(recentUsage.map(u => u.date))].sort().slice(-7);
        return dates.map(d => {
            const row = { date: d };
            allStores.forEach(s => {
                const match = recentUsage.find(u => u.date === d && u.store_id === s.id);
                row[s.name] = match ? Math.round(parseFloat(match.total_seconds) / 3600 * 10) / 10 : 0;
            });
            return row;
        });
    };

    const filteredUsers = allUsers.filter(u => {
        const query = userSearch.toLowerCase();
        const firstName = (u.firstName || '').toLowerCase();
        const lastName = (u.lastName || '').toLowerCase();
        const alias = (u.alias || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        const storeId = (u.storeId || '').toLowerCase();
        
        return firstName.includes(query) || 
               lastName.includes(query) || 
               alias.includes(query) || 
               role.includes(query) || 
               storeId.includes(query);
    });

    const moduleLabelMap = {
        'dashboard': 'Dashboard Principal (General)',
        'productivity': 'Módulo de Productividad (Compras/Shift)',
        'market': 'Módulo de Precios del Mercado',
        'reports': 'Módulo de Informes de Empleados',
        'gerencia_summary': 'Gerencia - Resumen Ejecutivo',
        'gerencia_tasks': 'Gerencia - Agenda / Tareas',
        'gerencia_team': 'Gerencia - Listado de Equipo',
        'gerencia_tracking': 'Gerencia - Seguimiento de Actividad',
        'gerencia_jewelry': 'Gerencia - Stock e Inventario Joyas',
        'gerencia_meetings': 'Gerencia - Programador Reuniones 1:1',
        'gerencia_cash': 'Gerencia - Conteo Diario de Caja'
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-100 p-4 lg:p-8 font-sans">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-white">TikTak Control Center</h1>
                            <p className="text-slate-400 text-sm font-medium">Panel Maestro de Configuración y Auditoría Global</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    <button 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 border border-slate-700/50"
                        title="Actualizar Datos"
                    >
                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                        <span className="text-sm font-bold">Actualizar</span>
                    </button>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all text-sm"
                    >
                        Volver a la App
                    </button>
                </div>
            </header>

            {/* Notification alert */}
            {message && (
                <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in duration-300 border ${
                    message.type === 'success' 
                        ? 'bg-emerald-950/85 text-emerald-300 border-emerald-800/80 shadow-emerald-900/20' 
                        : 'bg-rose-950/85 text-rose-300 border-rose-800/80 shadow-rose-900/20'
                }`}>
                    <CheckCircle size={20} />
                    <span className="font-semibold text-sm">{message.text}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 mb-8 overflow-x-auto scrollbar-hide gap-2">
                {[
                    { id: 'stats', label: 'Estadísticas y Uso', icon: TrendingUp },
                    { id: 'stores', label: 'Gestionar Tiendas', icon: Store },
                    { id: 'modules', label: 'Módulos y Visibilidad', icon: Settings },
                    { id: 'users', label: 'Permisos de Usuarios', icon: Users }
                ].map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-6 py-3.5 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                                active 
                                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                            }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw size={40} className="animate-spin text-indigo-500" />
                    <span className="text-slate-400 font-bold text-sm">Sincronizando información centralizada...</span>
                </div>
            ) : (
                <div className="space-y-8">

                    {/* TAB 1: STATISTICS */}
                    {activeTab === 'stats' && stats && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            
                            {/* Stats grids */}
                            <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-6">
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                                    <div className="text-indigo-400 mb-2"><Store size={22} /></div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tiendas Totales</p>
                                    <h3 className="text-3xl font-black text-white mt-1">{stats.totalStores} <span className="text-slate-500 text-sm font-normal">({stats.activeStores} Activas)</span></h3>
                                </div>
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                                    <div className="text-emerald-400 mb-2"><Users size={22} /></div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Empleados Registrados</p>
                                    <h3 className="text-3xl font-black text-white mt-1">{stats.totalEmployees} <span className="text-slate-500 text-sm font-normal">({stats.activeEmployees} Activos)</span></h3>
                                </div>
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                                    <div className="text-amber-400 mb-2"><Activity size={22} /></div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sesiones en Vivo</p>
                                    <h3 className="text-3xl font-black text-white mt-1">{stats.activeSessions}</h3>
                                </div>
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                                    <div className="text-cyan-400 mb-2"><CheckCircle size={22} /></div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cajas Cerradas Hoy</p>
                                    <h3 className="text-3xl font-black text-white mt-1">{stats.cashClosures}</h3>
                                </div>
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm col-span-2 md:col-span-1">
                                    <div className="text-rose-400 mb-2"><AlertTriangle size={22} /></div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Descuadre Diario</p>
                                    <h3 className="text-3xl font-black text-white mt-1">{stats.cashDiscrepancies} €</h3>
                                </div>
                            </div>

                            {/* Main Usage Graph */}
                            <div className="xl:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-6">Horas de Operación por Tienda (Últimos 7 días)</h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                            <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} fontWeight="bold" />
                                            <YAxis stroke="#94A3B8" name="Horas" fontSize={11} fontWeight="bold" />
                                            <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                                            <Legend />
                                            {allStores.map((store, idx) => (
                                                <Bar 
                                                    key={store.id} 
                                                    dataKey={store.name} 
                                                    fill={idx === 0 ? '#6366F1' : '#10B981'} 
                                                    radius={[4, 4, 0, 0]} 
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Live Monitor */}
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                                        Monitoreo de Sesiones Activas
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-400">{activeSessions.length} vivas</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2">
                                    {activeSessions.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                                            <Users size={32} className="opacity-40 mb-2" />
                                            <p className="text-xs font-bold">No hay empleados trabajando en este momento</p>
                                        </div>
                                    ) : (
                                        activeSessions.map(session => {
                                            const timeDiff = Math.round((new Date() - new Date(session.start_time)) / 60000);
                                            const nameStr = session.alias || `${session.first_name} ${session.last_name}`;
                                            return (
                                                <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-900/50 flex items-center justify-center font-bold text-xs text-indigo-300 border border-indigo-700/30">
                                                            {session.avatar || nameStr[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-200">{nameStr}</p>
                                                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{session.store_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-mono text-slate-400">{new Date(session.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                                        <p className="text-[10px] font-bold text-emerald-400">{timeDiff} min activo</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Recent Activity Log */}
                            <div className="xl:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-6">Registro de Actividad Reciente (Auditoría)</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                <th className="py-3 px-4">Hora</th>
                                                <th className="py-3 px-4">Tienda</th>
                                                <th className="py-3 px-4">Usuario</th>
                                                <th className="py-3 px-4">Acción / Tipo</th>
                                                <th className="py-3 px-4">Detalles</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {recentActivity.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="py-8 text-center text-slate-500 font-bold">
                                                        Sin actividad reciente en logs.
                                                    </td>
                                                </tr>
                                            ) : (
                                                recentActivity.map(log => {
                                                    const nameStr = log.alias || `${log.first_name || ''} ${log.last_name || ''}`.trim() || `Usuario ID: ${log.employee_id}`;
                                                    let detailsStr = '';
                                                    try {
                                                        const p = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                                        detailsStr = p.action || JSON.stringify(p);
                                                    } catch (e) {
                                                        detailsStr = String(log.details);
                                                    }

                                                    return (
                                                        <tr key={log.id} className="hover:bg-slate-800/20 text-slate-300 font-medium">
                                                            <td className="py-3 px-4 font-mono text-xs text-slate-400">
                                                                {new Date(log.start_time).toLocaleString('es-ES')}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="px-2 py-1 rounded bg-indigo-950/50 text-indigo-400 text-xs font-bold uppercase">
                                                                    {log.store_name || log.store_id}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 font-bold">{nameStr}</td>
                                                            <td className="py-3 px-4 text-xs font-bold uppercase text-slate-400">{log.type}</td>
                                                            <td className="py-3 px-4 text-xs font-mono truncate max-w-xs">{detailsStr}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* TAB 2: STORE MANAGEMENT */}
                    {activeTab === 'stores' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Listado de Tiendas Habilitadas</h3>
                                    <p className="text-slate-400 text-sm">Gestiona la disponibilidad de locales en el selector de acceso público.</p>
                                </div>
                                <button
                                    onClick={() => setShowStoreModal(true)}
                                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all text-sm"
                                >
                                    <Plus size={18} />
                                    Añadir Tienda
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {allStores.map(store => (
                                    <div key={store.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between h-48 relative overflow-hidden group">
                                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 translate-x-1/4 -translate-y-1/4 bg-slate-300`} />
                                        
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-300">
                                                    <Store size={22} />
                                                </div>
                                                <button
                                                    onClick={() => toggleStoreStatus(store)}
                                                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                                                        store.is_active 
                                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25' 
                                                            : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/25'
                                                    }`}
                                                >
                                                    <Power size={12} />
                                                    {store.is_active ? 'Activa' : 'Inactiva'}
                                                </button>
                                            </div>

                                            <h4 className="text-xl font-bold text-white tracking-tight">{store.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1 font-mono">ID: {store.id}</p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-4">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Color de tarjeta</span>
                                            <div className={`w-8 h-4 rounded bg-gradient-to-r ${store.color || 'from-indigo-600 to-indigo-800'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Store creation modal */}
                            {showStoreModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-200">
                                        <h3 className="text-xl font-bold text-white mb-6">Crear Nueva Tienda</h3>
                                        <form onSubmit={handleAddStore} className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Identificador Único (ID)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="ej. store_3"
                                                    value={newStore.id}
                                                    onChange={e => setNewStore({ ...newStore, id: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre Comercial</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="ej. Sevilla 3"
                                                    value={newStore.name}
                                                    onChange={e => setNewStore({ ...newStore, name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gradiente de Estilo (CSS)</label>
                                                <select
                                                    value={newStore.color}
                                                    onChange={e => setNewStore({ ...newStore, color: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-bold"
                                                >
                                                    <option value="from-blue-600 to-blue-800">Azul Cobalto</option>
                                                    <option value="from-emerald-600 to-emerald-800">Verde Esmeralda</option>
                                                    <option value="from-rose-500 to-rose-700">Rosa Coral</option>
                                                    <option value="from-indigo-600 to-indigo-850">Indigo Real</option>
                                                    <option value="from-purple-600 to-purple-800">Violeta Profundo</option>
                                                </select>
                                            </div>
                                            
                                            <div className="flex gap-3 pt-4 border-t border-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowStoreModal(false)}
                                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-sm"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20 text-sm"
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: MODULE CONFIGURATION */}
                    {activeTab === 'modules' && (
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Configurar Secciones Visibles</h3>
                                    <p className="text-slate-400 text-sm">Habilita o deshabilita accesos en la barra lateral para los usuarios de cada sucursal.</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Seleccionar Tienda:</label>
                                    <select
                                        value={selectedModuleStore}
                                        onChange={e => setSelectedModuleStore(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none text-sm font-bold"
                                    >
                                        {allStores.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4 max-w-3xl">
                                {modulesList.length === 0 ? (
                                    <p className="text-slate-500 text-center py-6 font-bold">Cargando módulos de la sucursal...</p>
                                ) : (
                                    modulesList.map(mod => {
                                        const label = moduleLabelMap[mod.moduleKey] || mod.moduleKey;
                                        return (
                                            <div key={mod.moduleKey} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${mod.isEnabled ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                                        <Eye size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-200">{label}</span>
                                                        <p className="text-[10px] text-slate-500 font-mono">Clave: {mod.moduleKey}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleToggleModule(mod.moduleKey)}
                                                    className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${
                                                        mod.isEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full bg-white transition-all duration-300 transform ${
                                                        mod.isEnabled ? 'translate-x-7' : 'translate-x-0'
                                                    }`} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-800 flex justify-end">
                                <button
                                    onClick={handleSaveModules}
                                    disabled={savingModules}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all text-sm"
                                >
                                    <Save size={18} />
                                    {savingModules ? 'Guardando...' : 'Guardar Configuración'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: USER PERMISSIONS */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            
                            {/* Filter Bar */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Control Global de Acceso de Usuarios</h3>
                                    <p className="text-slate-400 text-sm">Activa/desactiva cuentas o traslada personal entre sucursales.</p>
                                </div>

                                <div className="relative max-w-sm w-full">
                                    <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por alias, rol o tienda..."
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Users Table */}
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/20">
                                                <th className="py-3.5 px-6">Usuario</th>
                                                <th className="py-3.5 px-6">Rol</th>
                                                <th className="py-3.5 px-6">Tienda</th>
                                                <th className="py-3.5 px-6">Estado</th>
                                                <th className="py-3.5 px-6">Administrador</th>
                                                <th className="py-3.5 px-6 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center text-slate-500 font-bold">
                                                        No se encontraron usuarios coincidentes.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map(u => {
                                                    const isEditing = editingUser?.id === u.id;
                                                    const storeName = allStores.find(s => s.id === u.storeId)?.name || u.storeId;
                                                    return (
                                                        <tr key={u.id} className="hover:bg-slate-800/10 text-slate-300 font-medium transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-xs text-indigo-400">
                                                                        {u.avatar || u.nombre[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-white">{u.nombre}</p>
                                                                        <p className="text-[10px] text-slate-500 font-mono">Ref ID: {u.id}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            
                                                            <td className="py-4 px-6">
                                                                {isEditing ? (
                                                                    <select
                                                                        value={editingUser.role}
                                                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                                                        className="px-2 py-1 bg-slate-800 border border-slate-750 rounded text-white text-xs font-bold"
                                                                    >
                                                                        <option value="Gerente">Gerente</option>
                                                                        <option value="Supervisor">Supervisor</option>
                                                                        <option value="Responsable">Responsable</option>
                                                                        <option value="Empleado">Empleado</option>
                                                                        <option value="Kiosko">Kiosko</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider">
                                                                        {u.role}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="py-4 px-6">
                                                                {isEditing ? (
                                                                    <select
                                                                        value={editingUser.storeId}
                                                                        onChange={e => setEditingUser({ ...editingUser, storeId: e.target.value })}
                                                                        className="px-2 py-1 bg-slate-800 border border-slate-750 rounded text-white text-xs font-bold"
                                                                    >
                                                                        {allStores.map(s => (
                                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <span className="px-2 py-1 rounded bg-indigo-950/40 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                                                                        {storeName}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="py-4 px-6">
                                                                {isEditing ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingUser({ ...editingUser, isActive: !editingUser.isActive })}
                                                                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                                            editingUser.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                                        }`}
                                                                    >
                                                                        {editingUser.isActive ? 'Activo' : 'Desactivado'}
                                                                    </button>
                                                                ) : (
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                        u.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                                    }`}>
                                                                        {u.isActive ? 'Activo' : 'Desactivado'}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="py-4 px-6">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingUser.isMaster}
                                                                        onChange={e => setEditingUser({ ...editingUser, isMaster: e.target.checked })}
                                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                                                                    />
                                                                ) : (
                                                                    <span className={`text-xs font-bold ${u.isMaster ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                                        {u.isMaster ? 'Master Admin' : 'No'}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="py-4 px-6 text-right">
                                                                {isEditing ? (
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setEditingUser(null)}
                                                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-bold transition-colors"
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                        <button
                                                                            onClick={handleSaveUserEdit}
                                                                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold transition-colors"
                                                                        >
                                                                            Guardar
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setEditingUser({ ...u })}
                                                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
