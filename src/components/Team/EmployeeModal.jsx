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
                    alias: editingEmployee.alias || ''
                });
            } else {
                setFormData({
                    firstName: '', lastName: '', alias: '', email: '', phone: '', address: '',
                    role: (roles.length > 0 ? roles[0].name : 'Empleado'), contractType: 'Indefinido', contractHours: 40,
                    username: '', password: '',
                    isBuyer: false
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
            isBuyer: formData.isBuyer
        };
        onSave(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto transition-all">
            <div className="bg-[#1e293b]/90 rounded-3xl shadow-2xl w-full max-w-4xl my-4 border border-white/10 flex flex-col max-h-[90vh] backdrop-blur-xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-3xl shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">{editingEmployee ? 'Editar Ficha' : 'Nueva Ficha'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <form id="employeeForm" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <input required name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className="input-field col-span-1 bg-[#0f172a]/50 border-white/10 rounded-lg p-2.5 text-slate-200 text-sm focus:border-pink-500 outline-none transition-colors" placeholder="Nombre" />
                                <input required name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className="input-field col-span-1 bg-[#0f172a]/50 border-white/10 rounded-lg p-2.5 text-slate-200 text-sm focus:border-pink-500 outline-none transition-colors" placeholder="Apellidos" />
                                <div className="col-span-2 relative mt-4">
                                    <label className="text-[10px] absolute -top-2 left-2 bg-[#1e293b] px-1 text-pink-400 font-bold z-10 rounded">Alias (Nombre Público)</label>
                                    <input name="alias" value={formData.alias || ''} onChange={handleInputChange} className="input-field w-full bg-[#0f172a]/50 border-white/10 rounded-lg p-2.5 text-slate-200 text-sm border-pink-500/30 font-bold focus:border-pink-500 outline-none" placeholder="Ej: Juanma (Si vacío usa el Nombre)" />
                                </div>
                                <input required name="email" value={formData.email || ''} onChange={handleInputChange} className="input-field col-span-2 bg-[#0f172a]/50 border-white/10 rounded-lg p-2.5 text-slate-200 text-sm focus:border-pink-500 outline-none" placeholder="Email" />
                            </div>

                            <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5 space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase">Rol y Acceso</label>
                                <select name="role" value={formData.role || ''} onChange={handleInputChange} className="w-full p-2.5 bg-[#0f172a]/50 border border-white/10 rounded-lg text-slate-200 text-sm outline-none focus:border-pink-500">
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required name="username" value={formData.username || ''} onChange={handleInputChange} className="w-full p-2 bg-[#0f172a]/50 border-white/10 rounded text-slate-200 text-sm outline-none focus:border-pink-500" placeholder="Usuario" />
                                    <input required name="password" value={formData.password || ''} onChange={handleInputChange} className="w-full p-2 bg-[#0f172a]/50 border-white/10 rounded text-slate-200 text-sm outline-none focus:border-pink-500" placeholder="Contraseña" />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl hover:bg-pink-500/20 transition-colors">
                                    <input type="checkbox" name="isBuyer" checked={formData.isBuyer === true} onChange={handleInputChange} className="accent-pink-500 w-5 h-5" />
                                    <span className="text-sm font-bold text-pink-100">Autorizado Compras</span>
                                </label>
                            </div>
                        </div>

                        {/* Right Side: Productivity Stats */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase">Estadísticas de Compras (Cerradas)</h3>

                            {/* Date Controls */}
                            <div className="bg-slate-900/30 p-2 rounded-xl border border-white/5 flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Desde</label>
                                    <input type="date" value={statsStart} onChange={e => setStatsStart(e.target.value)} className="w-full bg-[#0f172a]/50 border border-white/10 rounded-lg p-1 text-xs text-white focus:border-pink-500 outline-none" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Hasta</label>
                                    <input type="date" value={statsEnd} onChange={e => setStatsEnd(e.target.value)} className="w-full bg-[#0f172a]/50 border border-white/10 rounded-lg p-1 text-xs text-white focus:border-pink-500 outline-none" />
                                </div>
                            </div>

                            {/* Stats Display */}
                            {editingEmployee ? (
                                <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5 space-y-4">
                                    {(() => {
                                        const stats = getStats(editingEmployee.id, statsStart, statsEnd);
                                        return (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-[#0f172a]/60 p-3 rounded-lg border border-white/5 text-center">
                                                        <div className="text-2xl font-bold text-pink-400">{stats.totalGroups}</div>
                                                        <div className="text-[10px] uppercase text-slate-500 font-bold">Total Grupos</div>
                                                    </div>
                                                    <div className="bg-[#0f172a]/60 p-3 rounded-lg border border-white/5 text-center">
                                                        <div className="text-2xl font-bold text-slate-200">{stats.gph}</div>
                                                        <div className="text-[10px] uppercase text-slate-500 font-bold">Media G/H</div>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
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

                                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
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
                <div className="p-6 border-t border-white/5 bg-white/5 rounded-b-3xl shrink-0 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors">Cancelar</button>
                    <button type="submit" form="employeeForm" className="px-8 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all"><Save size={18} /> Guardar</button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeModal;
