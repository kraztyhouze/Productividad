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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
            <div className="bg-[#1e293b]/90 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Gestionar Roles</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                    <input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Nuevo Rol (ej. Supervisor)"
                        className="flex-1 bg-[#0f172a]/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-pink-500 transition-colors"
                    />
                    <button type="submit" disabled={!newRoleName.trim()} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-600/20 transition-all"><Plus size={20} /></button>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {roles.map(role => (
                        <div key={role} className="flex justify-between items-center p-3 bg-[#0f172a]/30 rounded-xl border border-white/5 group hover:bg-[#0f172a]/50 transition-colors">
                            <span className="text-sm text-slate-200 font-medium">{role}</span>
                            {role !== 'Gerente' && role !== 'Puesto Compras' && (
                                <button onClick={() => onDeleteRole(role)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                            )}
                            {(role === 'Gerente' || role === 'Puesto Compras') && <Lock size={14} className="text-slate-600" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleManagerModal;
