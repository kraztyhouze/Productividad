import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { usePlanning } from '../context/PlanningContext';
import { doesTaskOccurOnDate, formatDateKey } from '../utils/planningUtils';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
    CheckCircle, MessageSquare, Trash2, Clock, Users, X,
    AlertCircle, Star, Sun, Lock, Repeat, CalendarDays, Send
} from 'lucide-react';

const Planning = () => {
    const { user } = useAuth();
    const { employees, roles, getDisplayName } = useTeam();
    const {
        tasks, addTask, deleteTask, completeTask, completeRecurringInstance, addCommentToTask,
        holidays, setHoliday, removeHoliday
    } = usePlanning();

    // States
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [activeTaskForComments, setActiveTaskForComments] = useState(null);

    // Form States
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        type: 'normal', // normal, priority, critical
        assignedTo: [],
        recurrence: null // { type: 'weekly', weekDays: [1,3,5] }
    });
    const [recurrenceSettings, setRecurrenceSettings] = useState({
        enabled: false,
        type: 'weekly',
        weekDays: [],
        endDate: ''
    });

    const [newComment, setNewComment] = useState('');

    // --- Helpers ---
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 Sun - 6 Sat
        // Adjust for Monday start (1)
        const offset = (firstDay + 6) % 7;
        return { days, offset };
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getPriorityColor = (type) => {
        if (type === 'critical') return 'border-red-500 bg-red-500/10 text-red-200';
        if (type === 'priority') return 'border-amber-500 bg-amber-500/10 text-amber-200';
        return 'border-blue-500 bg-blue-500/10 text-blue-200';
    };

    const getWeekDays = (date) => {
        const current = new Date(date);
        const day = current.getDay() || 7; // 1 Mon ... 7 Sun
        if (day !== 1) current.setHours(-24 * (day - 1));

        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return days;
    };


    // --- Handlers ---
    const handlePrevDay = () => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
    const handleNextDay = () => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));

    const handleTaskSubmit = (e) => {
        e.preventDefault();
        const finalRecurrence = recurrenceSettings.enabled ? {
            type: recurrenceSettings.type,
            weekDays: recurrenceSettings.weekDays,
            endDate: recurrenceSettings.endDate || null
        } : null;

        addTask({
            ...newTask,
            date: formatDateKey(selectedDate),
            recurrence: finalRecurrence,
            author: user.name
        });
        setIsTaskModalOpen(false);
        setNewTask({ title: '', description: '', type: 'normal', assignedTo: [], recurrence: null });
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

    // Filter Tasks for View
    const getTasksForDate = (date) => {
        return tasks.filter(task => doesTaskOccurOnDate(task, date));
    };

    // --- Renderers ---

    const TaskCard = ({ task, dateContext }) => {
        // Check if completed for this specific date (if recurring)
        const dateKey = formatDateKey(dateContext);
        const isRecurring = !!task.recurrence;
        const isCompleted = isRecurring
            ? task.completions?.some(c => c.date === dateKey)
            : task.status === 'completed';

        return (
            <div className={`p-4 rounded-xl border flex gap-3 group relative transition-all ${isCompleted ? 'bg-slate-900/40 border-slate-800 opacity-60' : `${getPriorityColor(task.type)} bg-opacity-10`}`}>
                <button
                    onClick={() => isRecurring
                        ? completeRecurringInstance(task.id, dateKey, user.getDisplayName ? user.getDisplayName : user.name)
                        : completeTask(task.id, user.getDisplayName ? user.getDisplayName : user.name)
                    }
                    disabled={isCompleted}
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-500 hover:border-emerald-500'}`}
                >
                    {isCompleted && <CheckCircle size={14} />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                            {isRecurring && <Repeat size={12} className="inline ml-2 text-slate-500" />}
                        </h4>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setActiveTaskForComments(task); setIsCommentModalOpen(true); }} className="text-slate-400 hover:text-blue-400"><MessageSquare size={16} /></button>
                            {!isRecurring && <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>}
                        </div>
                    </div>
                    {task.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>}

                    <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                        {task.assignedTo.map(role => (
                            <span key={role} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                                {role}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-50">Planificación y Tareas</h1>
                    <p className="text-slate-400 text-sm">Gestiona la agenda y asigna prioridades.</p>
                </div>
                <button onClick={() => setIsTaskModalOpen(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all">
                    <Plus size={18} /> Nueva Tarea
                </button>
            </div>

            {/* Calendar Strip (Daily View) */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/50 p-4 flex items-center justify-between">
                <button onClick={handlePrevDay} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ChevronLeft /></button>
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-slate-100 capitalize">{selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                    {isToday(selectedDate) && <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase">Hoy</span>}
                </div>
                <button onClick={handleNextDay} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ChevronRight /></button>
            </div>

            {/* Task Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Main Task List */}
                <div className="lg:col-span-2 bg-slate-900/30 rounded-2xl border border-slate-800/50 p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tareas para hoy</h3>
                        {getTasksForDate(selectedDate).length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <CheckCircle size={48} className="mx-auto text-slate-600 mb-4" />
                                <p className="text-slate-500 text-sm">Todo despejado para este día</p>
                            </div>
                        ) : (
                            getTasksForDate(selectedDate).map(task => (
                                <TaskCard key={task.id} task={task} dateContext={selectedDate} />
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: Upcoming / Stats */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Próximos 7 días</h3>
                        <div className="space-y-3">
                            {/* Simple Logic to show upcoming high priority tasks */}
                            {tasks
                                .filter(t => t.type === 'critical' && !doesTaskOccurOnDate(t, selectedDate))
                                .slice(0, 3)
                                .map(t => (
                                    <div key={t.id} className="text-sm p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                        <div className="font-bold text-red-200">{t.title}</div>
                                        <div className="text-xs text-red-400/70 mt-1">{t.recurrence ? 'Recurrente' : 'Puntual'}</div>
                                    </div>
                                ))}
                            {tasks.filter(t => t.type === 'critical').length === 0 && (
                                <p className="text-xs text-slate-500 italic">No hay tareas críticas próximas.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-800 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Nueva Tarea</h2>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                            <form id="newTaskForm" onSubmit={handleTaskSubmit} className="space-y-4">
                                <input required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Título de la tarea" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
                                <textarea resize="none" rows="3" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Descripción (opcional)" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Prioridad</label>
                                        <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
                                            <option value="normal">Normal</option>
                                            <option value="priority">Prioritaria</option>
                                            <option value="critical">Crítica</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Asignar a</label>
                                        {/* Simplified Assignment - Just roles for now or use Multiselect */}
                                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 h-[42px] overflow-hidden relative group">
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

                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={recurrenceSettings.enabled} onChange={e => setRecurrenceSettings({ ...recurrenceSettings, enabled: e.target.checked })} className="w-4 h-4 accent-blue-500" />
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
                                                        className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${recurrenceSettings.weekDays.includes(i + 1) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                            <input type="date" value={recurrenceSettings.endDate} onChange={e => setRecurrenceSettings({ ...recurrenceSettings, endDate: e.target.value })} className="bg-slate-800 text-xs text-white p-2 rounded-lg border border-slate-700 w-full" placeholder="Fecha fin (opcional)" />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setIsTaskModalOpen(false)} className="px-6 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-800">Cancelar</button>
                            <button type="submit" form="newTaskForm" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Crear Tarea</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Modal */}
            {isCommentModalOpen && activeTaskForComments && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                            <h3 className="font-bold text-white truncate max-w-[200px]">{activeTaskForComments.title}</h3>
                            <button onClick={() => setIsCommentModalOpen(false)}><X className="text-slate-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">
                            {activeTaskForComments.comments?.length === 0 && <p className="text-center text-slate-500 text-sm mt-10">No hay comentarios aún.</p>}
                            {activeTaskForComments.comments?.map(c => (
                                <div key={c.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-xs font-bold text-blue-400">{c.author}</span>
                                        <span className="text-[10px] text-slate-600">{new Date(c.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-300">{c.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
                            <div className="relative">
                                <input
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newComment.trim()) {
                                            addCommentToTask(activeTaskForComments.id, user.name, newComment);
                                            setNewComment('');
                                        }
                                    }}
                                    placeholder="Escribe un comentario..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={() => {
                                        if (newComment.trim()) {
                                            addCommentToTask(activeTaskForComments.id, user.name, newComment);
                                            setNewComment('');
                                        }
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:bg-slate-700 rounded-lg"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planning;
