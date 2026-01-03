import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useProductivity } from '../context/ProductivityContext';

import {
    Users, Plus, Search, Mail, Phone, Briefcase, Trash2, Edit2,
    X, Save, Calendar, Clock, AlertTriangle, MessageSquare, Key, Shield,
    ChevronLeft, ChevronRight, GripHorizontal, ShoppingBag, Filter, Settings, BadgeCheck, Lock
} from 'lucide-react';

const Team = () => {
    const { user } = useAuth();
    const { employees, roles, addEmployee, deleteEmployee, updateEmployee, addRole, deleteRole, getDisplayName } = useTeam();
    const { dailyRecords, dailyGroups, closedDays } = useProductivity();

    // Default Date Range (Current Month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDay = today.toISOString().split('T')[0];


    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, buyers, responsibles, staff

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false); // For Role Manager
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({});

    // Temp states for sub-forms
    const [newRoleName, setNewRoleName] = useState('');

    // Stats Date Range for Modal
    const [statsStart, setStatsStart] = useState(firstDayOfMonth);
    const [statsEnd, setStatsEnd] = useState(currentDay);

    // --- Effects & Initialization ---
    useEffect(() => {
        if (editingEmployee) {
            setFormData({
                ...editingEmployee,
                isBuyer: editingEmployee.isBuyer !== undefined ? editingEmployee.isBuyer : false,
                alias: editingEmployee.alias || ''
            });
        } else {
            setFormData({
                firstName: '', lastName: '', alias: '', email: '', phone: '', address: '',
                role: roles[0] || 'Empleado', contractType: 'Indefinido', contractHours: 40,
                username: '', password: '',
                isBuyer: false
            });
        }
        // Reset dates when opening modal
        setStatsStart(firstDayOfMonth);
        setStatsEnd(currentDay);
    }, [editingEmployee, isModalOpen, roles]);


    // --- Helpers ---
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    // --- Filtering Logic ---
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.alias && emp.alias.toLowerCase().includes(searchTerm.toLowerCase())) ||
            emp.role.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeFilter === 'buyers') return emp.isBuyer;
        if (activeFilter === 'responsibles') return emp.role.includes('Responsable') || emp.role === 'Gerente';
        if (activeFilter === 'store') return !emp.role.includes('Responsable') && emp.role !== 'Gerente' && emp.role !== 'Puesto Compras';

        return true;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));


    // --- CRUD Handlers ---
    const handleInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const name = e.target.name;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = (id) => confirm('¿Eliminar empleado?') && deleteEmployee(id);

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            contractHours: Number(formData.contractHours),
            isBuyer: formData.isBuyer
        };
        editingEmployee ? updateEmployee(editingEmployee.id, data) : addEmployee(data);
        setIsModalOpen(false);
    };

    // Calculate Stats Helper
    const getStats = (empId, start, end) => {
        // Only closed days
        const relevantDates = closedDays.filter(d => d >= start && d <= end);

        // 1. Calculate Duration from Records (filtered by date and employee)
        const empRecords = dailyRecords.filter(r =>
            r.employeeId === empId &&
            relevantDates.includes(r.date)
        );

        let totalSeconds = 0;
        empRecords.forEach(r => totalSeconds += r.durationSeconds);

        // 2. Calculate Groups from DailyGroups
        let standard = 0, jewelry = 0, recoverable = 0;
        let activeDays = new Set(empRecords.map(r => r.date));

        relevantDates.forEach(date => {
            const key = `${empId}-${date}`;
            const groupData = dailyGroups[key];
            if (groupData) {
                // Determine values
                const val = typeof groupData === 'number'
                    ? { standard: groupData, jewelry: 0, recoverable: 0 }
                    : { standard: groupData.standard || 0, jewelry: groupData.jewelry || 0, recoverable: groupData.recoverable || 0 };

                standard += val.standard;
                jewelry += val.jewelry;
                recoverable += val.recoverable;

                // If they have groups, count as active day even if no time record (edge case fix)
                if (val.standard + val.jewelry + val.recoverable > 0) {
                    activeDays.add(date);
                }
            }
        });

        const totalGroups = standard + jewelry + recoverable;
        const totalHours = totalSeconds / 3600;
        const gph = totalHours > 0 ? (totalGroups / totalHours).toFixed(2) : '0.00';

        return {
            totalGroups,
            totalHours: totalHours.toFixed(1),
            gph,
            activeDays: activeDays.size,
            standard, jewelry, recoverable
        };
    };

    // Role Manager
    const handleAddRole = (e) => {
        e.preventDefault();
        if (newRoleName.trim()) {
            addRole(newRoleName.trim());
            setNewRoleName('');
        }
    };


    // --- Compact Card Component ---
    const EmployeeCard = ({ emp }) => {
        const displayName = getDisplayName(emp);

        return (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/50 p-4 hover:border-slate-600 transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[140px]">
                {/* Header: Avatar + Alias + Role */}
                <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 shrink-0">
                        {displayName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-100 truncate">{displayName}</h3>
                            {emp.isBuyer && <ShoppingBag size={14} className="text-emerald-400" strokeWidth={2.5} />}
                        </div>
                        <p className="text-xs text-blue-400 font-medium truncate">{emp.role}</p>
                        {displayName !== emp.firstName && <p className="text-[10px] text-slate-500 truncate">{emp.firstName}</p>}
                    </div>
                    <div className="flex flex-col gap-1 absolute top-2 right-2 bg-slate-900/90 rounded-lg p-1 border border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingEmployee(emp); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition-colors" title="Editar"><Edit2 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }} className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                </div>

                {/* Footer: Stats Indicators */}
                <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-800/50">
                    {(() => {
                        // Card always shows current month stats
                        const stats = getStats(emp.id, firstDayOfMonth, currentDay);
                        return (
                            <>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-emerald-400">{stats.totalGroups}</span>
                                    <span className="text-[9px] text-slate-500 uppercase">Grupos</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-800">
                                    <span className={`text-xs font-bold ${stats.gph >= 10 ? 'text-blue-400' : 'text-slate-400'}`}>{stats.gph}</span>
                                    <span className="text-[9px] text-slate-500 uppercase">Media</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-800">
                                    <span className="text-xs font-bold text-slate-400">{stats.activeDays}</span>
                                    <span className="text-[9px] text-slate-500 uppercase">Días</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-50">Equipo y Plantilla</h1>
                    <p className="text-slate-400 text-sm">Gestiona usuarios, roles y fichas.</p>
                </div>

                {user.role === ROLES.MANAGER && (
                    <div className="flex gap-2 w-full lg:w-auto">
                        <button onClick={() => setIsRoleModalOpen(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm flex items-center gap-2 border border-slate-700 transition-all">
                            <Settings size={16} /> Roles
                        </button>
                        <button onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all">
                            <Plus size={18} /> Nuevo
                        </button>
                    </div>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/30 p-2 rounded-2xl border border-slate-800/50">
                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-blue-500" />
                </div>

                <div className="flex gap-1 overflow-x-auto w-full pb-1 md:pb-0 custom-scrollbar">
                    {[{ id: 'all', label: 'Todos' }, { id: 'buyers', label: 'Compradores' }, { id: 'responsibles', label: 'Responsables' }, { id: 'store', label: 'Tienda' }].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeFilter === filter.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredEmployees.map(emp => (
                    <EmployeeCard key={emp.id} emp={emp} />
                ))}
            </div>
            {filteredEmployees.length === 0 && (
                <div className="text-center py-10 text-slate-500 border border-slate-800 border-dashed rounded-2xl">No hay empleados que coincidan con el filtro.</div>
            )}

            {/* --- Modals --- */}

            {/* 1. Employee Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl my-4 border border-slate-800 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-3xl shrink-0">
                            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">{editingEmployee ? 'Editar Ficha' : 'Nueva Ficha'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <form id="employeeForm" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Form Code same as before but using 'roles' state for select options */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input required name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="input-field col-span-1 bg-slate-800/50 border-slate-700 rounded-lg p-2.5 text-slate-200 text-sm" placeholder="Nombre" />
                                        <input required name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="input-field col-span-1 bg-slate-800/50 border-slate-700 rounded-lg p-2.5 text-slate-200 text-sm" placeholder="Apellidos" />
                                        <div className="col-span-2 relative mt-4">
                                            <label className="text-[10px] absolute -top-2 left-2 bg-slate-900 px-1 text-blue-400 font-bold z-10">Alias (Nombre Público)</label>
                                            <input name="alias" value={formData.alias || ''} onChange={handleInputChange} className="input-field w-full bg-slate-800/50 border-slate-700 rounded-lg p-2.5 text-slate-200 text-sm border-blue-500/30 font-bold" placeholder="Ej: Juanma (Si vacío usa el Nombre)" />
                                        </div>
                                        <input required name="email" value={formData.email || ''} onChange={handleInputChange} className="input-field col-span-2 bg-slate-800/50 border-slate-700 rounded-lg p-2.5 text-slate-200 text-sm" placeholder="Email" />
                                    </div>

                                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 space-y-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Rol y Acceso</label>
                                        <select name="role" value={formData.role || ''} onChange={handleInputChange} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm">
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required name="username" value={formData.username || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-900 border-slate-700 rounded text-slate-200 text-sm" placeholder="Usuario" />
                                            <input required name="password" value={formData.password || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-900 border-slate-700 rounded text-slate-200 text-sm" placeholder="Contraseña" />
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-fuchsia-900/20 border border-fuchsia-900/30 rounded-xl">
                                            <input type="checkbox" name="isBuyer" checked={formData.isBuyer === true} onChange={handleInputChange} className="accent-fuchsia-500 w-5 h-5" />
                                            <span className="text-sm font-bold text-fuchsia-100">Autorizado Compras</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Right Side: Productivity Stats */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase">Estadísticas de Compras (Cerradas)</h3>

                                    {/* Date Controls */}
                                    <div className="bg-slate-800/30 p-2 rounded-xl border border-slate-800 flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Desde</label>
                                            <input type="date" value={statsStart} onChange={e => setStatsStart(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Hasta</label>
                                            <input type="date" value={statsEnd} onChange={e => setStatsEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs text-white" />
                                        </div>
                                    </div>

                                    {/* Stats Display */}
                                    {editingEmployee ? (
                                        <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-800 space-y-4">
                                            {(() => {
                                                const stats = getStats(editingEmployee.id, statsStart, statsEnd);
                                                return (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-center">
                                                                <div className="text-2xl font-bold text-emerald-400">{stats.totalGroups}</div>
                                                                <div className="text-[10px] uppercase text-slate-500 font-bold">Total Grupos</div>
                                                            </div>
                                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-center">
                                                                <div className="text-2xl font-bold text-blue-400">{stats.gph}</div>
                                                                <div className="text-[10px] uppercase text-slate-500 font-bold">Media G/H</div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-800/50 grid grid-cols-3 gap-2 text-center">
                                                            <div>
                                                                <div className="text-sm font-mono text-purple-300">{stats.jewelry}</div>
                                                                <div className="text-[9px] text-slate-500">Joyería</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-mono text-blue-300">{stats.standard}</div>
                                                                <div className="text-[9px] text-slate-500">General</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-mono text-amber-300">{stats.recoverable}</div>
                                                                <div className="text-[9px] text-slate-500">Recup.</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                                            <span className="text-xs text-slate-400">Días Trabajados</span>
                                                            <span className="text-sm font-bold text-slate-200">{stats.activeDays}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-slate-400">Total Horas</span>
                                                            <span className="text-sm font-bold text-slate-200">{stats.totalHours}h</span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 text-xs italic">
                                            Guarda el empleado para ver estadísticas.
                                        </div>
                                    )}
                                </div>

                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-3xl shrink-0 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:bg-slate-800">Cancelar</button>
                            <button type="submit" form="employeeForm" className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2"><Save size={18} /> Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Role Manager Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-800 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-100">Gestionar Roles</h2>
                            <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAddRole} className="flex gap-2 mb-6">
                            <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Nuevo Rol (ej. Supervisor)" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
                            <button type="submit" disabled={!newRoleName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl disabled:opacity-50"><Plus size={20} /></button>
                        </form>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {roles.map(role => (
                                <div key={role} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/30 group">
                                    <span className="text-sm text-slate-200 font-medium">{role}</span>
                                    {role !== 'Gerente' && role !== 'Puesto Compras' && (
                                        <button onClick={() => deleteRole(role)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                    )}
                                    {(role === 'Gerente' || role === 'Puesto Compras') && <Lock size={14} className="text-slate-600" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Team;
