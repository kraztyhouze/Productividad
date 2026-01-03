import React, { useState } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useProductivity } from '../context/ProductivityContext';
import { Plus, Search, Settings } from 'lucide-react';

import EmployeeCard from '../components/Team/EmployeeCard';
import EmployeeModal from '../components/Team/EmployeeModal';
import RoleManagerModal from '../components/Team/RoleManagerModal';

const Team = () => {
    const { user } = useAuth();
    const { employees, roles, addEmployee, deleteEmployee, updateEmployee, addRole, deleteRole, getDisplayName } = useTeam();
    const { dailyRecords, dailyGroups, closedDays } = useProductivity();

    // Default Date Range (Current Month) for Cards
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDay = today.toISOString().split('T')[0];

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, buyers, responsibles, staff

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    // --- Helpers ---
    // Calculate Stats Helper (Used by both Cards and Modal)
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
    const handleDelete = (id) => confirm('¿Eliminar empleado?') && deleteEmployee(id);

    const handleSaveEmployee = (data) => {
        editingEmployee ? updateEmployee(editingEmployee.id, data) : addEmployee(data);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Equipo y Plantilla</h1>
                    <p className="text-slate-400 text-sm font-medium ml-1">Gestiona usuarios, roles y fichas.</p>
                </div>

                {user.role === ROLES.MANAGER && (
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button onClick={() => setIsRoleModalOpen(true)} className="px-5 py-2.5 bg-slate-950/50 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                            <Settings size={16} /> Roles
                        </button>
                        <button onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }} className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-pink-600/20 flex items-center gap-2 transition-all">
                            <Plus size={18} /> Nuevo
                        </button>
                    </div>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1e293b]/60 backdrop-blur-xl p-2 rounded-2xl border border-white/5 shadow-lg">
                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-pink-500 transition-colors" />
                </div>

                <div className="flex gap-1 overflow-x-auto w-full pb-1 md:pb-0 custom-scrollbar">
                    {[{ id: 'all', label: 'Todos' }, { id: 'buyers', label: 'Compradores' }, { id: 'responsibles', label: 'Responsables' }, { id: 'store', label: 'Tienda' }].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${activeFilter === filter.id ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-600/20' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredEmployees.map(emp => (
                    <EmployeeCard
                        key={emp.id}
                        emp={emp}
                        displayName={getDisplayName(emp)}
                        stats={getStats(emp.id, firstDayOfMonth, currentDay)}
                        onEdit={(e) => { setEditingEmployee(e); setIsModalOpen(true); }}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
            {filteredEmployees.length === 0 && (
                <div className="text-center py-20 text-slate-500 border border-white/5 border-dashed rounded-3xl bg-[#1e293b]/20">No hay empleados que coincidan con el filtro.</div>
            )}

            {/* --- Modals --- */}
            <EmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEmployee}
                editingEmployee={editingEmployee}
                roles={roles}
                getStats={getStats}
            />

            {isRoleModalOpen && (
                <RoleManagerModal
                    onClose={() => setIsRoleModalOpen(false)}
                    roles={roles}
                    onAddRole={addRole}
                    onDeleteRole={deleteRole}
                />
            )}
        </div>
    );
};

export default Team;
