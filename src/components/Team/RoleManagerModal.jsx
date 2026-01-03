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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-100">Gestionar Roles</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
                </div>

                <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                    <input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Nuevo Rol (ej. Supervisor)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                    <button type="submit" disabled={!newRoleName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl disabled:opacity-50"><Plus size={20} /></button>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {roles.map(role => (
                        <div key={role} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/30 group">
                            <span className="text-sm text-slate-200 font-medium">{role}</span>
                            {role !== 'Gerente' && role !== 'Puesto Compras' && (
                                <button onClick={() => onDeleteRole(role)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
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
