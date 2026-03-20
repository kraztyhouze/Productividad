import React from 'react';
import { ShoppingBag, Edit2, Trash2, User, UserCheck } from 'lucide-react';

const EmployeeCard = ({ emp, displayName, stats, onEdit, onDelete, onToggleInterviewer }) => {
    return (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:border-[#FF8C9D]/50 transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[160px] shadow-sm hover:shadow-md">
            {/* Header: Avatar + Alias + Role */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF8C9D] to-[#FFB7C5] flex items-center justify-center shadow-sm shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <User strokeWidth={2} className="text-white w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#1A365D] truncate">{displayName}</h3>
                        {emp.isBuyer && <ShoppingBag size={14} className="text-[#FF8C9D]" strokeWidth={2.5} />}
                    </div>
                    <p className="text-xs text-[#718096] font-semibold truncate">{emp.role}</p>
                    {displayName !== emp.firstName && <p className="text-[10px] text-[#A0AEC0] truncate">{emp.firstName}</p>}
                </div>

                {/* Interviewer Toggle (Direct Action) */}
                {['Gerente', 'Supervisor', 'Responsable'].includes(emp.role) && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleInterviewer(emp.id, !emp.isInterviewer); }}
                        className={`absolute top-3 right-12 p-2 rounded-xl transition-all border ${emp.isInterviewer ? 'bg-[#1A365D] text-white border-[#1A365D]' : 'bg-white text-slate-300 border-slate-100 hover:border-[#1A365D]/20'}`}
                        title={emp.isInterviewer ? "Desmarcar como Entrevistador" : "Marcar como Entrevistador"}
                    >
                        <UserCheck size={14} />
                    </button>
                )}
                
                {/* Actions Overlay */}
                <div className="flex flex-col gap-1 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg border border-[#E2E8F0] shadow-sm p-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(emp); }} 
                        className="p-1.5 text-[#718096] hover:text-[#FF8C9D] hover:bg-[#FFF5F7] rounded-md transition-all" 
                        title="Editar"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(emp.id); }} 
                        className="p-1.5 text-[#A0AEC0] hover:text-red-500 hover:bg-red-50 rounded-md transition-all" 
                        title="Eliminar"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Footer: Stats Indicators */}
            <div className="grid grid-cols-3 gap-1 pt-4 border-t border-[#F1F5F9]">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-[#FF8C9D]">{stats.totalGroups}</span>
                    <span className="text-[9px] text-[#A0AEC0] uppercase font-bold tracking-wider">Grupos</span>
                </div>
                <div className="flex flex-col items-center border-l border-[#F1F5F9]">
                    <span className={`text-xs font-bold ${parseFloat(stats.gph) >= 10 ? 'text-[#38A169]' : 'text-[#718096]'}`}>{stats.gph}</span>
                    <span className="text-[9px] text-[#A0AEC0] uppercase font-bold tracking-wider">Media</span>
                </div>
                <div className="flex flex-col items-center border-l border-[#F1F5F9]">
                    <span className="text-sm font-bold text-[#4A5568]">{stats.activeDays}</span>
                    <span className="text-[9px] text-[#A0AEC0] uppercase font-bold tracking-wider">Días</span>
                </div>
            </div>
        </div>
    );
};

export default EmployeeCard;
