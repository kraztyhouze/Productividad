import React from 'react';
import { ShoppingBag, Edit2, Trash2, User } from 'lucide-react';

const EmployeeCard = ({ emp, displayName, stats, onEdit, onDelete }) => {
    return (
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-4 hover:border-pink-500/30 transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[140px] shadow-lg">
            {/* Header: Avatar + Alias + Role */}
            <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-[0_0_15px_-5px_rgba(236,72,153,0.3)] shrink-0 relative overflow-hidden group-hover:shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent"></div>
                    <User strokeWidth={1.5} className="text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)] w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100 truncate">{displayName}</h3>
                        {emp.isBuyer && <ShoppingBag size={14} className="text-pink-400" strokeWidth={2.5} />}
                    </div>
                    <p className="text-xs text-slate-400 font-medium truncate">{emp.role}</p>
                    {displayName !== emp.firstName && <p className="text-[10px] text-slate-500 truncate">{emp.firstName}</p>}
                </div>
                <div className="flex flex-col gap-1 absolute top-2 right-2 bg-[#0f172a]/90 rounded-lg p-1 border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(emp); }} className="p-1.5 text-slate-400 hover:text-pink-400 rounded transition-colors" title="Editar"><Edit2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(emp.id); }} className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                </div>
            </div>

            {/* Footer: Stats Indicators */}
            <div className="grid grid-cols-3 gap-1 pt-3 border-t border-white/5">
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-pink-500">{stats.totalGroups}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Grupos</span>
                </div>
                <div className="flex flex-col items-center border-l border-white/5">
                    <span className={`text-xs font-bold ${parseFloat(stats.gph) >= 10 ? 'text-pink-400' : 'text-slate-400'}`}>{stats.gph}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Media</span>
                </div>
                <div className="flex flex-col items-center border-l border-white/5">
                    <span className="text-xs font-bold text-slate-400">{stats.activeDays}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Días</span>
                </div>
            </div>
        </div>
    );
};

export default EmployeeCard;
