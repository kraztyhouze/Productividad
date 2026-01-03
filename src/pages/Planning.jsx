import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { usePlanning } from '../context/PlanningContext';
import { doesTaskOccurOnDate, formatDateKey, isToday } from '../utils/planningUtils';
import { ChevronLeft, ChevronRight, Plus, CheckCircle } from 'lucide-react';

import TaskCard from '../components/Planning/TaskCard';
import NewTaskModal from '../components/Planning/NewTaskModal';
import CommentModal from '../components/Planning/CommentModal';

const Planning = () => {
    const { user } = useAuth();
    const { employees, roles } = useTeam();
    const {
        tasks, addTask, deleteTask, completeTask, completeRecurringInstance, addCommentToTask
    } = usePlanning();

    // States
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [activeTaskForComments, setActiveTaskForComments] = useState(null);

    // --- Handlers ---
    const handlePrevDay = () => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
    const handleNextDay = () => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));

    const handleTaskSave = (taskData) => {
        addTask({
            ...taskData,
            date: formatDateKey(selectedDate),
            author: user.name
        });
        setIsTaskModalOpen(false);
    };

    const handleTaskComplete = (task, dateKey) => {
        if (task.recurrence) {
            completeRecurringInstance(task.id, dateKey, user.getDisplayName ? user.getDisplayName : user.name);
        } else {
            completeTask(task.id, user.getDisplayName ? user.getDisplayName : user.name);
        }
    };

    // Filter Tasks for View
    const getTasksForDate = (date) => {
        return tasks.filter(task => doesTaskOccurOnDate(task, date));
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
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    dateContext={selectedDate}
                                    user={user}
                                    onComplete={handleTaskComplete}
                                    onDelete={deleteTask}
                                    onComments={(t) => {
                                        setActiveTaskForComments(t);
                                        setIsCommentModalOpen(true);
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: Upcoming / Stats */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Próximos 7 días (Críticas)</h3>
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
            <NewTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleTaskSave}
                roles={roles}
            />

            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                task={activeTaskForComments}
                currentUser={user}
                onAddComment={addCommentToTask}
            />
        </div>
    );
};

export default Planning;
