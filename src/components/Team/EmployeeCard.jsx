import React from 'react';
import { ShoppingBag, Edit2, Trash2 } from 'lucide-react';

const EmployeeCard = ({ emp, displayName, stats, onEdit, onDelete }) => {
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
                    <button onClick={(e) => { e.stopPropagation(); onEdit(emp); }} className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition-colors" title="Editar"><Edit2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(emp.id); }} className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                </div>
            </div>

            {/* Footer: Stats Indicators */}
            <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-800/50">
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
            </div>
        </div>
    );
};

export default EmployeeCard;
