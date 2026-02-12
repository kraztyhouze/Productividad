import React, { useState } from 'react';
import { X } from 'lucide-react';

const NewTaskModal = ({
    isOpen,
    onClose,
    onSave,
    roles
}) => {
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        type: 'normal', // normal, priority, critical
        assignedTo: [],
    });

    const [recurrenceSettings, setRecurrenceSettings] = useState({
        enabled: false,
        type: 'weekly',
        weekDays: [],
        endDate: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const finalRecurrence = recurrenceSettings.enabled ? {
            type: recurrenceSettings.type,
            weekDays: recurrenceSettings.weekDays,
            endDate: recurrenceSettings.endDate || null
        } : null;

        onSave({
            ...newTask,
            recurrence: finalRecurrence
        });

        // Reset form done by unmounting or optional reset here? 
        // Since we likely close modal on save, we might rely on parent closing it.
        // But if we want to reset for next time:
        setNewTask({ title: '', description: '', type: 'normal', assignedTo: [] });
        setRecurrenceSettings({ enabled: false, type: 'weekly', weekDays: [], endDate: '' });
    };

    const toggleWeekDay = (dayIndex) => {
        setRecurrenceSettings(prev => {
            const days = prev.weekDays.includes(dayIndex)
                ? prev.weekDays.filter(d => d !== dayIndex)
                : [...prev.weekDays, dayIndex];
            return { ...prev, weekDays: days };
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
            <div className="bg-[#1e293b]/90 rounded-2xl shadow-2xl w-full max-w-lg border border-white/10 flex flex-col max-h-[90vh] backdrop-blur-xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white">Nueva Tarea</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    <form id="newTaskForm" onSubmit={handleSubmit} className="space-y-4">
                        <input required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Título de la tarea" className="w-full bg-[#0f172a]/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 transition-colors" />
                        <textarea resize="none" rows="3" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Descripción (opcional)" className="w-full bg-[#0f172a]/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 transition-colors" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Prioridad</label>
                                <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })} className="w-full bg-[#0f172a]/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-pink-500 transition-colors">
                                    <option value="normal">Normal</option>
                                    <option value="priority">Prioritaria</option>
                                    <option value="critical">Crítica</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Asignar a</label>
                                <div className="bg-[#0f172a]/50 border border-white/10 rounded-xl px-3 py-2 h-[42px] overflow-hidden relative group">
                                    <p className="text-xs text-slate-300 pt-1 leading-tight">{newTask.assignedTo.join(', ') || 'Seleccionar...'}</p>
                                    <select
                                        multiple
                                        value={newTask.assignedTo}
                                        onChange={e => {
                                            const val = Array.from(e.target.selectedOptions, option => option.value);
                                            setNewTask({ ...newTask, assignedTo: val.includes('Todos') ? roles : val });
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    >
                                        <option value="Todos">Todos</option>
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/30 rounded-xl p-4 border border-white/5">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={recurrenceSettings.enabled} onChange={e => setRecurrenceSettings({ ...recurrenceSettings, enabled: e.target.checked })} className="w-4 h-4 accent-pink-500" />
                                <span className="text-sm font-bold text-slate-300">Repetir periódicamente</span>
                            </label>

                            {recurrenceSettings.enabled && (
                                <div className="mt-4 space-y-3 pl-7 animate-in slide-in-from-top-2">
                                    <div className="flex gap-2">
                                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                                            <button
                                                type="button"
                                                key={d}
                                                onClick={() => toggleWeekDay(i + 1)} // 1=Mon
                                                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${recurrenceSettings.weekDays.includes(i + 1) ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'bg-[#0f172a]/50 text-slate-500 hover:bg-slate-800'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="date" value={recurrenceSettings.endDate} onChange={e => setRecurrenceSettings({ ...recurrenceSettings, endDate: e.target.value })} className="bg-[#0f172a]/50 text-xs text-white p-2 rounded-lg border border-white/10 w-full outline-none focus:border-pink-500" placeholder="Fecha fin (opcional)" />
                                </div>
                            )}
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-white/5 bg-white/5 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-slate-400 font-bold hover:bg-white/5 hover:text-white transition-colors">Cancelar</button>
                    <button type="submit" form="newTaskForm" className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-600/20 transition-all">Crear Tarea</button>
                </div>
            </div>
        </div>
    );
};

export default NewTaskModal;
