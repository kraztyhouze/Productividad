import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Lock, 
    UserCheck, 
    PlusCircle, 
    Layers, 
    Clock, 
    Calendar as CalendarIcon, 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Check, 
    Save, 
    FileText, 
    Trash2 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import MeetingForm from './MeetingForm';

const MeetingsView = ({ storeId, employees, user, schedules, onSchedule, onManageCriteria, onDeleteSchedule, meetings }) => {
    const [selectedInterviewer, setSelectedInterviewer] = useState(user?.nombre || 'Gerente');
    
    const safeEmployees = Array.isArray(employees) ? employees : [];
    const activeEmployees = useMemo(() => safeEmployees.filter(e => e.has11Meetings !== false), [safeEmployees]);
    const safeHistory = Array.isArray(meetings.history) ? meetings.history : [];
    const safeSchedules = Array.isArray(schedules) ? schedules : [];

    if (meetings.selectedEmployee) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => meetings.setSelectedEmployee(null)}
                        className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] hover:text-[#1A365D] transition-colors"
                    >
                        <ChevronLeft size={16}/> Volver al Organizador
                    </button>
                    {meetings.isSaving ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full animate-pulse">
                            <Save size={12}/> Autoguardando...
                        </div>
                    ) : meetings.lastSaved && (
                        <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-2">
                             <Check size={12}/> Guardado {format(meetings.lastSaved, 'HH:mm:ss')}
                        </div>
                    )}
                </div>
                <MeetingForm 
                    employee={meetings.selectedEmployee} 
                    interviewer={{ id: user.id || 'gerente', name: selectedInterviewer, role: user.role }}
                    onFinish={async () => {
                        const success = await meetings.finishMeeting(meetings.selectedEmployee.id);
                        if (success) meetings.refresh();
                    }} 
                />
            </motion.div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header with Security Banner */}
            <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white flex flex-col lg:flex-row justify-between items-start gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Lock size={10} className="fill-indigo-600"/> Blindaje Criptográfico Activo
                        </span>
                        <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase">Organizador <span className="text-indigo-500">1:1</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Evaluación de talento con persistencia segura AES-256</p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Interviewer Selector */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 flex items-center gap-3 pr-4 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white"><UserCheck size={20}/></div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Entrevistador actual</p>
                            <input 
                                className="bg-transparent border-none p-0 text-xs font-black text-[#1A365D] outline-none" 
                                value={selectedInterviewer}
                                onChange={e => setSelectedInterviewer(e.target.value)}
                                placeholder="Escribe tu nombre..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onManageCriteria} className="bg-white px-5 py-3 rounded-2xl border border-slate-100 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-500 transition-all flex items-center gap-2 shadow-sm">
                            <Layers size={14}/> Criterios
                        </button>
                        <button onClick={onSchedule} className="bg-[#1A365D] px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                            <PlusCircle size={14}/> Programar
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* MEMORANDUM SECTION */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Clock size={16} className="text-indigo-500"/> Próximas Citas
                        </h3>
                        <div className="space-y-4">
                            {safeSchedules.filter(s => s.status === 'Pendiente').length === 0 && (
                                <div className="text-center p-8 border border-dashed border-slate-200 rounded-3xl">
                                    <CalendarIcon className="mx-auto w-8 h-8 text-slate-200 mb-2"/>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase italic">Sin citas esta semana</p>
                                </div>
                            )}
                            {safeSchedules.filter(s => s.status === 'Pendiente').map(s => {
                                const emp = safeEmployees.find(e => String(e.id) === String(s.employee_id));
                                return (
                                    <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-indigo-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-black text-[#1A365D] truncate pr-2">{emp?.nombre || emp?.firstName || 'Empleado'}</span>
                                            <button onClick={() => onDeleteSchedule(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                                                <X size={12}/>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500">
                                            {format(parseISO(s.scheduled_date), 'dd MMM, HH:mm', { locale: es })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* EMPLOYEES GRID */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-fit">
                    {activeEmployees.map(emp => {
                        const lastMeeting = safeHistory.find(h => String(h.employee_id) === String(emp.id));
                        const isDoneThisMonth = lastMeeting && format(parseISO(lastMeeting.date), 'yyyy-MM') === format(new Date(), 'yyyy-MM');
                        const nextSched = safeSchedules.find(s => String(s.employee_id) === String(emp.id) && s.status === 'Pendiente');

                        return (
                            <div key={emp.id} className={`bg-white p-8 rounded-[40px] border transition-all group flex flex-col justify-between ${isDoneThisMonth ? 'border-emerald-100 shadow-sm opacity-80' : 'border-[#E2E8F0] shadow-sm hover:shadow-xl'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${isDoneThisMonth ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                            {(emp.nombre || emp.firstName || 'E').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-[#1A365D] uppercase leading-tight">{emp.nombre || `${emp.firstName} ${emp.lastName}` || 'Empleado'}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.role}</p>
                                        </div>
                                    </div>
                                    {isDoneThisMonth ? (
                                        <div className="flex flex-col items-end">
                                            <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg shadow-emerald-100 mb-1"><Check size={14}/></div>
                                            <span className="text-[8px] font-black text-emerald-500 uppercase">Hecha</span>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 text-amber-500 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-amber-100 italic">Pendiente</div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-[28px] border border-slate-100">
                                        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-2">
                                            <span>Estado Mensual</span>
                                        </div>
                                        <p className="text-xs font-black text-[#1A365D]">
                                            {isDoneThisMonth ? 'Completado este mes' : (nextSched ? `Cita: ${format(parseISO(nextSched.scheduled_date), 'dd/MM')}` : 'Sin programar')}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => meetings.setSelectedEmployee(emp)}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 transition-all ${isDoneThisMonth ? 'bg-slate-50 text-slate-400 hover:bg-slate-100' : 'bg-[#1A365D] text-white hover:bg-indigo-600 shadow-lg shadow-indigo-100'}`}
                                    >
                                        {isDoneThisMonth ? 'REVISAR' : 'EVALUAR'}
                                        <ChevronRight size={16}/>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MeetingsView;
