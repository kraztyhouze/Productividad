import React from 'react';
import { ShoppingBag, Edit2, Trash2, User, UserCheck, Users } from 'lucide-react';

const EmployeeCard = ({ emp, displayName, stats, onEdit, onDelete, onToggleInterviewer, onToggle11 }) => {
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

                {/* 1:1 Meetings Toggle (Direct Action) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggle11(emp.id, !emp.has11Meetings); }}
                    className={`absolute top-3 right-28 p-2 rounded-xl transition-all border ${emp.has11Meetings ? 'bg-[#FF8C9D] text-white border-[#FF8C9D]' : 'bg-white text-slate-300 border-slate-100 hover:border-[#FF8C9D]/20'}`}
                    title={emp.has11Meetings ? "Deshabilitar Reuniones 1:1" : "Habilitar Reuniones 1:1"}
                >
                    <Users size={14} />
                </button>

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
                
                {/* Status Toggle (Direct Action) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit({ ...emp, isActive: !emp.isActive }); }}
                    className={`absolute top-3 right-20 p-2 rounded-xl transition-all border ${!emp.isActive ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-300 border-slate-100 hover:border-amber-500/20'}`}
                    title={emp.isActive ? "Desactivar Empleado" : "Activar Empleado"}
                >
                    <Trash2 size={14} />
                </button>
                
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
                        className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all" 
                        title="Eliminar por Completo"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default EmployeeCard;
