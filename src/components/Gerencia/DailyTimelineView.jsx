import React from 'react';
import { format } from 'date-fns';

const DailyTimelineView = ({ tasks, employees, onEdit }) => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.date === today);

    const getEmpName = (e) => e.alias || e.firstName || e.first_name || 'Sin Nombre';

    return (
        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden text-sm animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                    <div className="grid grid-cols-[100px_repeat(auto-fill,minmax(200px,1fr))] border-b border-[#F4F7FA]">
                        <div className="p-6 bg-slate-50 border-r border-[#E2E8F0]"></div>
                        {(employees || []).map(e => (
                            <div key={e.id} className="p-6 font-black text-[#1A365D] uppercase tracking-tighter text-center bg-slate-50 border-r border-[#E2E8F0]">
                                {getEmpName(e)}
                            </div>
                        ))}
                    </div>
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                        {hours.map(hour => {
                            return (
                                <div key={hour} className="grid grid-cols-[100px_repeat(auto-fill,minmax(200px,1fr))] border-b border-dashed border-[#F4F7FA] min-h-[80px]">
                                    <div className="p-4 bg-slate-50/50 border-r border-[#E2E8F0] flex items-center justify-center font-black text-[10px] text-slate-400">
                                        {hour}
                                    </div>
                                    {(employees || []).map(emp => {
                                        const empName = getEmpName(emp);
                                        const task = todayTasks.find(t => t.assigned_to === empName && (t.time || '09:00').startsWith(hour.substring(0, 2)));
                                        return (
                                            <div key={emp.id} className="p-2 border-r border-[#F4F7FA] relative flex items-center justify-center">
                                                {task && (
                                                    <button 
                                                        onClick={() => onEdit(task)}
                                                        className={`w-full p-3 rounded-2xl text-[9px] font-black uppercase transition-all hover:scale-[1.02] shadow-sm ${
                                                            task.status === 'Hecha' ? 'bg-green-50 text-green-500 border border-green-100' :
                                                            task.priority === 'Alta' ? 'bg-red-50 text-red-500 border border-red-100 shadow-red-100' :
                                                            'bg-blue-50 text-[#1A365D] border border-blue-100 shadow-blue-50'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span>{task.time || '--:--'}</span>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Hecha' ? 'bg-green-500' : task.priority === 'Alta' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                        </div>
                                                        <div className="truncate">{task.title}</div>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyTimelineView;
