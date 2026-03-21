import React, { useState } from 'react';
import { format } from 'date-fns';

const ScheduleForm = ({ employees, onSave, onCancel }) => {
    const [data, setData] = useState({ 
        employee_id: '', 
        scheduled_date: format(new Date(), "yyyy-MM-dd'T'HH:mm") 
    });

    const safeEmployees = Array.isArray(employees) ? employees : [];

    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Empleado</label>
                <select 
                    value={data.employee_id} 
                    onChange={e => setData({...data, employee_id: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-[#1A365D] outline-none"
                >
                    <option value="">Elegir de la lista...</option>
                    {safeEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre || e.alias || e.username}</option>
                    ))}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha y Hora</label>
                <input 
                    type="datetime-local" 
                    value={data.scheduled_date} 
                    onChange={e => setData({...data, scheduled_date: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-[#1A365D] outline-none" 
                />
            </div>
            <div className="flex gap-4 pt-4">
                <button 
                    onClick={onCancel} 
                    className="flex-1 py-4 rounded-2xl font-black text-[10px] text-slate-400 uppercase bg-slate-50 hover:bg-slate-100 transition-all"
                >
                    Cancelar
                </button>
                <button 
                    onClick={() => { if(data.employee_id) onSave(data); }} 
                    className="flex-1 py-4 rounded-2xl font-black text-[10px] text-white uppercase bg-[#1A365D] hover:bg-indigo-600 shadow-lg shadow-indigo-100 transition-all"
                >
                    Confirmar Cita
                </button>
            </div>
        </div>
    );
};

export default ScheduleForm;
