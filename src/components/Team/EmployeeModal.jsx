import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const EmployeeModal = ({
    isOpen,
    onClose,
    onSave,
    editingEmployee,
    roles,
    getStats
}) => {
    // Form and Date State
    const [formData, setFormData] = useState({});

    // Default Date Range (Current Month) - duplicated logic but okay for default UI state
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDay = today.toISOString().split('T')[0];

    const [statsStart, setStatsStart] = useState(firstDay);
    const [statsEnd, setStatsEnd] = useState(currentDay);

    useEffect(() => {
        if (isOpen) {
            // Reset dates on open
            setStatsStart(firstDay);
            setStatsEnd(currentDay);

            if (editingEmployee) {
                setFormData({
                    ...editingEmployee,
                    isBuyer: editingEmployee.isBuyer !== undefined ? editingEmployee.isBuyer : false,
                    canCountCash: editingEmployee.canCountCash !== undefined ? editingEmployee.canCountCash : false,
                    isInterviewer: editingEmployee.isInterviewer !== undefined ? editingEmployee.isInterviewer : false,
                    isActive: editingEmployee.isActive !== undefined ? editingEmployee.isActive : true,
                    showInWarRoom: editingEmployee.showInWarRoom !== undefined ? editingEmployee.showInWarRoom : true,
                    alias: editingEmployee.alias || ''
                });
            } else {
                setFormData({
                    firstName: '', lastName: '', alias: '', email: '', phone: '', address: '',
                    role: (roles.length > 0 ? roles[0].name : 'Empleado'), contractType: 'Indefinido', contractHours: 40,
                    username: '', password: '',
                    isBuyer: false, canCountCash: false, isInterviewer: false, isActive: true,
                    showInWarRoom: true
                });
            }
        }
    }, [isOpen, editingEmployee, roles]);

    const handleInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const name = e.target.name;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            contractHours: Number(formData.contractHours),
            isBuyer: formData.isBuyer,
            canCountCash: formData.canCountCash,
            isInterviewer: formData.isInterviewer,
            isActive: formData.isActive,
            showInWarRoom: formData.showInWarRoom
        };
        onSave(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A365D]/20 backdrop-blur-sm p-4 overflow-y-auto transition-all">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl my-4 border border-[#E2E8F0] flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]">
                    <h2 className="text-xl font-black text-[#1A365D] tracking-tight flex items-center gap-2">
                        {editingEmployee ? 'Editar Ficha' : 'Nueva Ficha'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-[#EDF2F7] rounded-full text-[#718096] transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <form id="employeeForm" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-[#A0AEC0] uppercase tracking-widest">Información Personal</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#718096] ml-1">Nombre</label>
                                    <input required name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[#1A365D] text-sm focus:border-[#FF8C9D] outline-none transition-all placeholder:text-[#A0AEC0]" placeholder="Nombre" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#718096] ml-1">Apellidos</label>
                                    <input required name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[#1A365D] text-sm focus:border-[#FF8C9D] outline-none transition-all placeholder:text-[#A0AEC0]" placeholder="Apellidos" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-[#FF8C9D] ml-1 uppercase tracking-wider">Alias (Nombre Público)</label>
                                    <input name="alias" value={formData.alias || ''} onChange={handleInputChange} className="w-full bg-[#FFF5F7] border border-[#FF8C9D]/30 rounded-xl p-3 text-[#1A365D] text-sm font-bold focus:border-[#FF8C9D] outline-none transition-all" placeholder="Ej: Juanma (Si vacío usa el Nombre)" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-[#718096] ml-1">Email Corporativo</label>
                                    <input required name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[#1A365D] text-sm focus:border-[#FF8C9D] outline-none transition-all" placeholder="Email" />
                                </div>
                            </div>

                            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] space-y-5">
                                <h3 className="text-xs font-black text-[#A0AEC0] uppercase tracking-widest">Rol y Acceso</h3>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#718096] ml-1">Asignar Rol</label>
                                    <select name="role" value={formData.role || ''} onChange={handleInputChange} className="w-full p-3 bg-white border border-[#E2E8F0] rounded-xl text-[#1A365D] text-sm outline-none focus:border-[#FF8C9D] transition-all cursor-pointer">
                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-[#718096] ml-1">Usuario</label>
                                        <input required name="username" value={formData.username || ''} onChange={handleInputChange} className="w-full p-3 bg-white border border-[#E2E8F0] rounded-xl text-[#1A365D] text-sm outline-none focus:border-[#FF8C9D] transition-all" placeholder="Usuario" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-[#718096] ml-1">Contraseña</label>
                                        <input required={!editingEmployee} type="password" autoComplete="new-password" name="password" value={formData.password || ''} onChange={handleInputChange} className="w-full p-3 bg-white border border-[#E2E8F0] rounded-xl text-[#1A365D] text-sm outline-none focus:border-[#FF8C9D] transition-all" placeholder={editingEmployee ? "Sin cambios" : "••••••••"} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-[#FF8C9D]/20 rounded-2xl hover:border-[#FF8C9D]/50 transition-all shadow-sm group">
                                        <input type="checkbox" name="isBuyer" checked={formData.isBuyer === true} onChange={handleInputChange} className="accent-[#FF8C9D] w-5 h-5 rounded-md" />
                                        <span className="text-sm font-bold text-[#1A365D] group-hover:text-[#FF8C9D] transition-colors">Autorizado para Compras</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-blue-100 rounded-2xl hover:border-blue-300 transition-all shadow-sm group">
                                        <input type="checkbox" name="canCountCash" checked={formData.canCountCash === true} onChange={handleInputChange} className="accent-blue-400 w-5 h-5 rounded-md" />
                                        <span className="text-sm font-bold text-[#1A365D] group-hover:text-blue-500 transition-colors">Autorizado para Arqueo de Caja</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl transition-all shadow-sm group ${['Gerente', 'Supervisor', 'Responsable'].includes(formData.role) ? 'cursor-pointer hover:border-[#1A365D]/30' : 'opacity-50 cursor-not-allowed'}`}>
                                        <input 
                                            type="checkbox" 
                                            name="isInterviewer" 
                                            checked={formData.isInterviewer === true && ['Gerente', 'Supervisor', 'Responsable'].includes(formData.role)} 
                                            onChange={handleInputChange} 
                                            disabled={!['Gerente', 'Supervisor', 'Responsable'].includes(formData.role)}
                                            className="accent-[#1A365D] w-5 h-5 rounded-md" 
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#1A365D] transition-colors">Habilitar como Entrevistador 1:1</span>
                                            {!['Gerente', 'Supervisor', 'Responsable'].includes(formData.role) && <span className="text-[8px] font-black text-red-400 uppercase">Solo para perfiles de gestión</span>}
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-[#FF8C9D]/20 rounded-2xl hover:border-[#FF8C9D]/50 transition-all shadow-sm group">
                                        <input type="checkbox" name="has11Meetings" checked={formData.has11Meetings !== false} onChange={handleInputChange} className="accent-[#FF8C9D] w-5 h-5 rounded-md" />
                                        <span className="text-sm font-bold text-[#1A365D] group-hover:text-[#FF8C9D] transition-colors">Participa en Reuniones Individuales</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-green-100 rounded-2xl hover:border-green-300 transition-all shadow-sm group">
                                        <input type="checkbox" name="isActive" checked={formData.isActive !== false} onChange={handleInputChange} className="accent-green-500 w-5 h-5 rounded-md" />
                                        <span className="text-sm font-bold text-[#1A365D] group-hover:text-green-600 transition-colors">Empleado Activo</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-indigo-100 rounded-2xl hover:border-indigo-300 transition-all shadow-sm group">
                                        <input type="checkbox" name="showInWarRoom" checked={formData.showInWarRoom !== false} onChange={handleInputChange} className="accent-indigo-500 w-5 h-5 rounded-md" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#1A365D] group-hover:text-indigo-600 transition-colors">Visible en War Room</span>
                                            <span className="text-[8px] font-black text-indigo-400 uppercase">Aparece en el banco de staff para asignar tareas</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Productivity Stats */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-[#A0AEC0] uppercase tracking-widest">Rendimiento (Compras)</h3>

                            {/* Date Controls */}
                            <div className="bg-white p-2 rounded-2xl border border-[#E2E8F0] flex gap-2 shadow-sm">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[9px] text-[#A0AEC0] font-black uppercase ml-2">Desde</label>
                                    <input type="date" value={statsStart} onChange={e => setStatsStart(e.target.value)} className="w-full bg-[#F4F7FA] border-none rounded-xl p-2.5 text-xs text-[#1A365D] font-bold outline-none ring-1 ring-[#E2E8F0] focus:ring-[#FF8C9D] transition-all" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[9px] text-[#A0AEC0] font-black uppercase ml-2">Hasta</label>
                                    <input type="date" value={statsEnd} onChange={e => setStatsEnd(e.target.value)} className="w-full bg-[#F4F7FA] border-none rounded-xl p-2.5 text-xs text-[#1A365D] font-bold outline-none ring-1 ring-[#E2E8F0] focus:ring-[#FF8C9D] transition-all" />
                                </div>
                            </div>

                            {/* Stats Display */}
                            {editingEmployee ? (
                                <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] space-y-6 shadow-inner">
                                    {(() => {
                                        const stats = getStats(editingEmployee.id, statsStart, statsEnd);
                                        return (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] text-center shadow-sm">
                                                        <div className="text-3xl font-black text-[#FF8C9D]">{stats.totalGroups}</div>
                                                        <div className="text-[10px] uppercase text-[#A0AEC0] font-bold tracking-tighter">Total Grupos</div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] text-center shadow-sm">
                                                        <div className="text-3xl font-black text-[#1A365D]">{stats.gph}</div>
                                                        <div className="text-[10px] uppercase text-[#A0AEC0] font-bold tracking-tighter">Media G/H</div>
                                                    </div>
                                                </div>

                                                <div className="pt-2 grid grid-cols-3 gap-3 text-center">
                                                    <div className="bg-[#FDF2F8] p-3 rounded-xl border border-[#FBCFE8]">
                                                        <div className="text-base font-black text-[#BE185D]">{stats.jewelry}</div>
                                                        <div className="text-[9px] font-bold text-[#DB2777] uppercase">Joyería</div>
                                                    </div>
                                                    <div className="bg-[#EFF6FF] p-3 rounded-xl border border-[#DBEAFE]">
                                                        <div className="text-base font-black text-[#1D4ED8]">{stats.standard}</div>
                                                        <div className="text-[9px] font-bold text-[#2563EB] uppercase">General</div>
                                                    </div>
                                                    <div className="bg-[#FFFBEB] p-3 rounded-xl border border-[#FEF3C7]">
                                                        <div className="text-base font-black text-[#B45309]">{stats.recoverable}</div>
                                                        <div className="text-[9px] font-bold text-[#D97706] uppercase">Recup.</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-2">
                                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E2E8F0]">
                                                        <span className="text-xs font-bold text-[#718096]">Días Trabajados</span>
                                                        <span className="text-sm font-black text-[#1A365D]">{stats.activeDays}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E2E8F0]">
                                                        <span className="text-xs font-bold text-[#718096]">Total Horas Acumuladas</span>
                                                        <span className="text-sm font-black text-[#1A365D]">{stats.totalHours}h</span>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] border-dashed">
                                    <div className="text-3xl mb-2">👤</div>
                                    <p className="text-xs font-bold text-[#A0AEC0] italic">
                                        Guarda el empleado primero para<br/>poder visualizar sus estadísticas.
                                    </p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
                
                <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC] flex justify-end gap-4 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-[#718096] hover:bg-[#EDF2F7] transition-all">Cancelar</button>
                    <button type="submit" form="employeeForm" className="px-10 py-2.5 bg-[#FF8C9D] hover:bg-[#e87589] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#FF8C9D]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                        <Save size={18} /> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeModal;
