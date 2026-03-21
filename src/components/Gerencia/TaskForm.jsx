import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    Trash2 
} from 'lucide-react';

const TaskForm = ({ initialData, employees, zones, onSave, onCancel, onDelete }) => {
    // Helper to safely format dates for input fields
    const safeDate = (dateStr) => {
        try {
            if (!dateStr || typeof dateStr !== 'string') return format(new Date(), 'yyyy-MM-dd');
            const d = parseISO(dateStr);
            return !isValid(d) ? format(new Date(), 'yyyy-MM-dd') : format(d, 'yyyy-MM-dd');
        } catch (e) {
            console.error("TaskForm Date Error:", e);
            return format(new Date(), 'yyyy-MM-dd');
        }
    };

    const getEmpName = (e) => e.nombre || e.alias || e.username || 'Empleado';

    const [data, setData] = useState({ 
        title: initialData?.title || '', 
        date: safeDate(initialData?.date),
        time: initialData?.time || '09:00',
        priority: initialData?.priority || 'Media', 
        priority_level: initialData?.priority_level || initialData?.priority || 'Media',
        periodicity: initialData?.periodicity || 'Manual', 
        recurring: !!initialData?.recurring, 
        assigned_to: initialData?.assigned_to || '', 
        description: initialData?.description || '',
        category: initialData?.category || 'Gerencia',
        zone_id: initialData?.zone_id || '',
        recurring_interval: initialData?.recurring_interval || 1,
        recurring_type: initialData?.recurring_type || 'simple',
        recurring_days: Array.isArray(initialData?.recurring_days) ? initialData?.recurring_days : [],
        recurring_end_date: initialData?.recurring_end_date || '',
        recurring_month_day: initialData?.recurring_month_day || '',
        id: initialData?.id || null
    });

    const isEdit = !!initialData?.id;

    const days = [
        { key: 'L', label: 'L' },
        { key: 'M', label: 'M' },
        { key: 'X', label: 'X' },
        { key: 'J', label: 'J' },
        { key: 'V', label: 'V' },
        { key: 'S', label: 'S' },
        { key: 'D', label: 'D' }
    ];

    const toggleDay = (day) => {
        const current = Array.isArray(data.recurring_days) ? data.recurring_days : [];
        if (current.includes(day)) {
            setData({ ...data, recurring_days: current.filter(d => d !== day) });
        } else {
            setData({ ...data, recurring_days: [...current, day] });
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-8">
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Título de la Tarea</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Ej: Revisar inventario de vitrinas"
                            className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white transition-all rounded-2xl p-4 font-bold text-[#1A365D]" 
                            value={data.title} 
                            onChange={e => setData({...data, title: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Instrucciones Detalladas</label>
                        <textarea 
                            rows={4}
                            placeholder="Describe paso a paso lo que debe hacerse..."
                            className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white transition-all rounded-2xl p-4 font-bold text-[#1A365D] resize-none" 
                            value={data.description} 
                            onChange={e => setData({...data, description: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Fecha Inicio</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="date" 
                                required 
                                className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 pl-12 font-bold text-[#1A365D] text-xs" 
                                value={data.date} 
                                onChange={e => setData({...data, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Hora</label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="time" 
                                className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 pl-12 font-bold text-[#1A365D] text-xs" 
                                value={data.time} 
                                onChange={e => setData({...data, time: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Departamento / Categoría</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.category} 
                            onChange={e => setData({...data, category: e.target.value})}
                        >
                            <option value="Gerencia">Gerencia (Azul TikTak)</option>
                            <option value="Ventas">Ventas (Verde Esmeralda)</option>
                            <option value="Joyería / Finanzas">Joyería / Finanzas</option>
                            <option value="Limpieza">Limpieza</option>
                            <option value="Administración">Administración</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Nivel de Prioridad</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.priority_level} 
                            onChange={e => setData({...data, priority_level: e.target.value, priority: e.target.value})}
                        >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente (Resaltada)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Ubicación / Zona</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.zone_id} 
                            onChange={e => setData({...data, zone_id: e.target.value})}
                        >
                            <option value="">Sin Zona Específica</option>
                            {(zones || []).map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Asignar a</label>
                        <select 
                            className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-bold text-[#1A365D] appearance-none cursor-pointer text-xs" 
                            value={data.assigned_to} 
                            onChange={e => setData({...data, assigned_to: e.target.value})}
                        >
                            <option value="">Sin Asignar</option>
                            {(employees || []).map(e => (
                                <option key={e.id} value={getEmpName(e)}>{getEmpName(e)} ({e.role})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Recurrence Section */}
                <div className="bg-[#F8F9FB] p-6 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                             Periodicidad <Clock size={14} className="text-[#FF8C9D]" />
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-lg border-slate-300 text-[#FF8C9D] focus:ring-[#FF8C9D]/20"
                                checked={data.recurring} 
                                onChange={e => setData({ ...data, recurring: e.target.checked, periodicity: e.target.checked ? 'Diario' : 'Manual' })} 
                            />
                            <span className="text-[10px] font-black text-[#A0AEC0] uppercase">Tarea Periódica</span>
                        </label>
                    </div>

                    {data.recurring && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Repetir cada...</label>
                                    <select 
                                        className="w-full bg-white border-none rounded-xl p-3 font-bold text-[#1A365D]" 
                                        value={data.periodicity} 
                                        onChange={e => setData({...data, periodicity: e.target.value})}
                                    >
                                        <option value="Diario">Días</option>
                                        <option value="Semanal">Semanas</option>
                                        <option value="Mensual">Meses</option>
                                        <option value="Anual">Años</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Intervalo</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="w-full bg-white border-none rounded-xl p-3 font-bold text-[#1A365D]" 
                                        value={data.recurring_interval} 
                                        onChange={e => setData({...data, recurring_interval: e.target.value})}
                                    />
                                </div>
                            </div>

                            {data.periodicity === 'Semanal' && (
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 text-center">Días de la semana</label>
                                    <div className="flex justify-between gap-1">
                                        {days.map(d => {
                                            const active = Array.isArray(data.recurring_days) && data.recurring_days.includes(d.key);
                                            return (
                                                <button 
                                                    key={d.key}
                                                    type="button"
                                                    onClick={() => toggleDay(d.key)}
                                                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${active ? 'bg-[#FF8C9D] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                                                >
                                                    {d.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {data.periodicity === 'Mensual' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Día concreto del mes</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number" 
                                            min="1" max="31"
                                            placeholder="Ej: 15"
                                            className="flex-1 bg-white border-none rounded-xl p-3 font-black text-[#1A365D]" 
                                            value={data.recurring_month_day || ''} 
                                            onChange={e => setData({...data, recurring_month_day: e.target.value, recurring_type: 'on_day'})}
                                        />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Se repetirá el día {data.recurring_month_day || 'X'}</span>
                                    </div>
                                    <p className="text-[8px] text-slate-400 italic">Si el día es 31, se ajustará automáticamente al último día de meses más cortos.</p>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Finalizar repetición (Opcional)</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-white border-none rounded-xl p-3 font-bold text-[#1A365D]" 
                                    value={data.recurring_end_date || ''} 
                                    onChange={e => setData({...data, recurring_end_date: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 pt-4">
                <button 
                    type="submit" 
                    className="w-full py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1A365D]/20 hover:scale-[1.01] transition-all"
                >
                    {isEdit ? 'GUARDAR CAMBIOS' : 'CREAR TAREA'}
                </button>
                <div className="flex gap-3">
                    {isEdit && (
                        <button 
                            type="button" 
                            onClick={() => onDelete(data.id)}
                            className="flex-1 py-4 bg-red-50 text-red-400 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100 transition-colors"
                        >
                            ELIMINAR
                        </button>
                    )}
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-100 transition-colors"
                    >
                        CANCELAR
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TaskForm;
