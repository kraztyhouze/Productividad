import React, { useState } from 'react';
import { X, Plus, Trash2, Lock } from 'lucide-react';

const RoleManagerModal = ({
    onClose,
    roles,
    onAddRole,
    onDeleteRole
}) => {
    const [newRoleName, setNewRoleName] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (newRoleName.trim()) {
            onAddRole(newRoleName.trim());
            setNewRoleName('');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1A365D]/20 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-[#E2E8F0] p-8 overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-black text-[#1A365D] tracking-tight">Gestionar Roles</h2>
                        <p className="text-[10px] text-[#A0AEC0] font-bold uppercase tracking-widest mt-0.5">Definición de jerarquía</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F4F7FA] rounded-full text-[#718096] transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleAdd} className="flex gap-3 mb-8">
                    <input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Ej. Supervisor"
                        className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A365D] font-medium outline-none focus:border-[#FF8C9D] transition-all placeholder:text-[#A0AEC0]"
                    />
                    <button 
                        type="submit" 
                        disabled={!newRoleName.trim()} 
                        className="bg-[#FF8C9D] hover:bg-[#e87589] text-white px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FF8C9D]/20 transition-all transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                    </button>
                </form>

                <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {roles.map(role => (
                        <div key={role.id || role.name} className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] group hover:bg-white hover:border-[#FF8C9D]/30 transition-all shadow-sm">
                            <span className="text-sm text-[#1A365D] font-bold">{role.name}</span>
                            <div className="flex items-center gap-2">
                                {role.name !== 'Gerente' && role.name !== 'Puesto Compras' && (
                                    <button 
                                        onClick={() => onDeleteRole(role.id)} 
                                        className="text-[#A0AEC0] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                {(role.name === 'Gerente' || role.name === 'Puesto Compras') && (
                                    <div className="bg-[#E2E8F0] p-1.5 rounded-lg">
                                        <Lock size={12} className="text-[#718096]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {roles.length === 0 && (
                        <div className="text-center py-6 text-[10px] text-[#A0AEC0] font-bold uppercase">No hay roles personalizados</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoleManagerModal;
