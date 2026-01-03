import React from 'react';
import { CheckCircle, MessageSquare, Trash2, Repeat } from 'lucide-react';
import { formatDateKey, getPriorityColor } from '../../utils/planningUtils';

const TaskCard = ({
    task,
    dateContext,
    user,
    onComplete,
    onDelete,
    onComments
}) => {
    // Check if completed for this specific date (if recurring)
    const dateKey = formatDateKey(dateContext);
    const isRecurring = !!task.recurrence;
    const isCompleted = isRecurring
        ? task.completions?.some(c => c.date === dateKey)
        : task.status === 'completed';

    const handleComplete = () => {
        // The parent is responsible for calling the right context function
        // We just pass necessary info if needed, or parent handles it based on task prop
        onComplete(task, dateKey);
    };

    return (
        <div className={`p-4 rounded-xl border flex gap-3 group relative transition-all ${isCompleted ? 'bg-slate-900/40 border-slate-800 opacity-60' : `${getPriorityColor(task.type)} bg-opacity-10`}`}>
            <button
                onClick={handleComplete}
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
                        <button onClick={(e) => { e.stopPropagation(); onComments(task); }} className="text-slate-400 hover:text-blue-400"><MessageSquare size={16} /></button>
                        {!isRecurring && <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>}
                    </div>
                </div>
                {task.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>}

                <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                    {task.assignedTo?.map(role => (
                        <span key={role} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                            {role}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
