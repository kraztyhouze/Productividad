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
    const [activeFilter, setActiveFilter] = useState('all'); // all, buyers, responsibles, store, inactive

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
        const role = emp.role || '';
        const firstName = emp.firstName || '';
        const alias = emp.alias || '';

        const matchesSearch =
            firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeFilter === 'inactive') return emp.isActive === false;
        
        // Default: If not specifically filtered for inactive, only show active
        if (!emp.isActive && activeFilter !== 'inactive') return false;

        if (activeFilter === 'buyers') return emp.isBuyer;
        if (activeFilter === 'responsibles') return role.includes('Responsable') || role === 'Gerente';
        if (activeFilter === 'store') return !role.includes('Responsable') && role !== 'Gerente' && role !== 'Puesto Compras';

        return true;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));


    // --- CRUD Handlers ---
    const handleDelete = (id) => confirm('¿Eliminar empleado?') && deleteEmployee(id);

    const handleSaveEmployee = (data) => {
        editingEmployee ? updateEmployee(editingEmployee.id, data) : addEmployee(data);
        setIsModalOpen(false);
    };

    const handleToggleInterviewer = (id, value) => {
        updateEmployee(id, { isInterviewer: value });
    };

    const handleToggle11 = (id, value) => {
        updateEmployee(id, { has11Meetings: value });
    };

    return (
        <div className="space-y-6 pb-10 animate-in">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#1A365D] tracking-tight">Equipo y Plantilla</h1>
                    <p className="text-[#718096] text-sm mt-0.5">Gestiona usuarios, roles y fichas.</p>
                </div>

                {(user.role === ROLES.MANAGER || user.role === ROLES.SUPERVISOR || user.role === ROLES.RESPONSIBLE) && (
                    <div className="flex gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsRoleModalOpen(true)}
                            className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#718096] hover:text-[#1A365D] hover:border-[#FF8C9D] rounded-xl font-semibold text-xs flex items-center gap-2 transition-all"
                            style={{ boxShadow: 'var(--shadow-card)' }}
                        >
                            <Settings size={16} /> Roles
                        </button>
                        <button
                            onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
                            className="px-6 py-2.5 text-white rounded-xl font-semibold text-xs flex items-center gap-2 transition-all"
                            style={{ background: '#FF8C9D', boxShadow: '0 4px 12px rgba(255,140,157,0.35)' }}
                        >
                            <Plus size={18} /> Nuevo
                        </button>
                    </div>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-3 rounded-xl border border-[#E2E8F0]" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F4F7FA] border border-[#E2E8F0] rounded-xl text-[#1A365D] text-sm outline-none focus:border-[#FF8C9D] transition-colors placeholder:text-[#A0AEC0]"
                    />
                </div>

                <div className="flex gap-1 overflow-x-auto w-full pb-1 md:pb-0">
                    {[
                        { id: 'all', label: 'Todos Activos' }, 
                        { id: 'buyers', label: 'Compradores' }, 
                        { id: 'responsibles', label: 'Responsables' }, 
                        { id: 'store', label: 'Tienda' },
                        { id: 'inactive', label: 'Inactivos' }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeFilter === filter.id
                                     ? 'text-white'
                                     : 'text-[#718096] hover:text-[#1A365D] hover:bg-[#F4F7FA]'
                                }`}
                            style={activeFilter === filter.id ? { background: '#FF8C9D' } : {}}
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
                        onToggleInterviewer={handleToggleInterviewer}
                        onToggle11={handleToggle11}
                    />
                ))}
            </div>
            {filteredEmployees.length === 0 && (
                <div className="text-center py-20 text-[#A0AEC0] border border-[#E2E8F0] border-dashed rounded-2xl bg-white text-sm" style={{ boxShadow: 'var(--shadow-card)' }}>No hay empleados que coincidan con el filtro.</div>
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
