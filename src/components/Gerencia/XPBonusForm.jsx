import React, { useState } from 'react';
import { Award, Send } from 'lucide-react';

const XPBonusForm = ({ employees, onSave, onCancel }) => {
    const [data, setData] = useState({
        employeeId: '',
        xp: 100,
        reason: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.employeeId || !data.xp || !data.reason) return alert('Por favor, rellena todos los campos.');
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                    <Award size={32} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Recompensa Manual</h4>
                    <p className="text-[10px] font-bold text-blue-500/80 leading-relaxed uppercase tracking-tighter">
                        Asigna puntos de experiencia adicionales por logros extraordinarios o tareas fuera de su rol habitual.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Empleado Seleccionado</label>
                    <select 
                        className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-black text-[#1A365D]"
                        value={data.employeeId}
                        onChange={e => setData({ ...data, employeeId: e.target.value })}
                    >
                        <option value="">Seleccionar Persona...</option>
                        {(employees || []).map(e => (
                            <option key={e.id} value={e.id}>{e.nombre || e.alias || e.username}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Cantidad de XP</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-black text-[#1A365D] pl-10"
                            value={data.xp}
                            onChange={e => setData({ ...data, xp: Number(e.target.value) })}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-xs">XP</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Motivo de la Bonificación</label>
                <textarea 
                    className="w-full bg-[#F4F7FA] border-none rounded-2xl p-5 font-bold text-slate-600 resize-none h-32"
                    placeholder="Ej: Excelente gestión de inventario, ayuda en mudanza, etc..."
                    value={data.reason}
                    onChange={e => setData({ ...data, reason: e.target.value })}
                />
            </div>

            <div className="flex gap-4 pt-4">
                <button 
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    className="flex-[2] py-5 bg-blue-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Send size={16} /> Otorgar Bonus
                </button>
            </div>
        </form>
    );
};

export default XPBonusForm;
