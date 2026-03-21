import React from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MiniCalendar = ({ currentMonth, onMonthChange, tasks }) => {
    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] border border-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h4>
                <div className="flex gap-2">
                    <button onClick={() => onMonthChange(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"><ChevronLeft size={14}/></button>
                    <button onClick={() => onMonthChange(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"><ChevronRight size={14}/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-[8px] font-black text-slate-300 mb-2">{d}</div>
                ))}
                {days.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDay = isToday(day);
                    const hasTasks = Array.isArray(tasks) && tasks.some(t => isSameDay(parseISO(t.date), day));
                    
                    return (
                        <div 
                            key={i} 
                            className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[9px] font-black relative cursor-pointer transition-all
                                ${!isCurrentMonth ? 'text-slate-200' : isTodayDay ? 'bg-[#FF8C9D] text-white shadow-lg shadow-coral-100' : 'text-slate-600 hover:bg-slate-50'}
                            `}
                        >
                            {format(day, 'd')}
                            {hasTasks && !isTodayDay && <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MiniCalendar;
