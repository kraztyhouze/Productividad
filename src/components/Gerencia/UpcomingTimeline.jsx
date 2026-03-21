import React from 'react';
import { format, startOfDay, addDays, isSameDay, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const UpcomingTimeline = ({ tasks, onSelectTask }) => {
    const today = startOfDay(new Date());
    const horizon = addDays(today, 14);
    
    const upcomingDays = [];
    for (let d = today; d <= horizon; d = addDays(d, 1)) {
        const dayTasks = (Array.isArray(tasks) ? tasks : []).filter(t => isSameDay(parseISO(t.date), d));
        if (dayTasks.length > 0) {
            upcomingDays.push({ date: d, tasks: dayTasks });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cronograma Próximo</h4>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {upcomingDays.map((day, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-slate-100 py-1">
                        <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-slate-200" />
                        <div className="mb-2">
                            <span className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter">
                                {isToday(day.date) ? 'HOY' : format(day.date, 'EEEE d', { locale: es })}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {day.tasks.map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => onSelectTask(t)}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center gap-3
                                        ${t.status === 'Hecha' ? 'bg-green-50/50 border-green-100 text-green-600' : 'bg-white border-[#E2E8F0] text-[#1A365D] shadow-sm'}
                                    `}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'Hecha' ? 'bg-green-500' : t.priority === 'Alta' ? 'bg-rose-500' : 'bg-blue-400'}`} />
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase truncate">{t.title}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.time || 'TODO EL DÍA'}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                {upcomingDays.length === 0 && (
                    <p className="text-center text-[10px] text-slate-300 italic py-10 uppercase tracking-widest">Sin tareas próximos</p>
                )}
            </div>
        </div>
    );
};

export default UpcomingTimeline;
