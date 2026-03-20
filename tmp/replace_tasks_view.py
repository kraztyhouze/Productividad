import os

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace the return statement inside TasksView.
# It starts at line 1348: "    return ("
# And ends at line 1616: "    );"

tasks_view_idx = content.find("const TasksView =")
if tasks_view_idx == -1:
    print("TasksView not found")
    exit(1)

start_marker = "    return ("
start_idx = content.find(start_marker, tasks_view_idx)
if start_idx == -1:
    print("Start marker not found")
    exit(1)

end_marker = "const InventoryAdjustmentModal ="
end_comp_idx = content.find(end_marker)
if end_comp_idx == -1:
    print("End marker not found")
    exit(1)

# The return ends with ");" followed by a newline and "};"
real_end_idx = content.rfind("    );", start_idx, end_comp_idx)
if real_end_idx == -1:
    print("Real end idx not found")
    exit(1)

# Add length of ");"
real_end_idx += 6 

new_return = """    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh] animate-in fade-in duration-700">
            {/* LEFT SIDEBAR: Calendar & Upcoming Summary */}
            <div className="w-full lg:w-80 shrink-0 space-y-8 order-2 lg:order-1">
                <MiniCalendar 
                    currentMonth={month} 
                    onMonthChange={setMonth} 
                    tasks={allTasks} 
                />
                
                <UpcomingTimeline 
                    tasks={allTasks} 
                    onSelectTask={(t) => {
                        setSelectedTask(t);
                        setView('list');
                    }} 
                />
                
                <div className="bg-slate-800 text-white p-6 rounded-[32px] shadow-xl space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones Agenda</h4>
                     <button 
                        onClick={onAdd}
                        className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-[#FF8C9D] rounded-2xl transition-all group"
                     >
                        <span className="text-[10px] font-black uppercase tracking-tight group-hover:tracking-widest transition-all">Nueva Tarea</span>
                        <Plus size={16}/>
                     </button>
                     <button 
                        onClick={onAddBattery}
                        className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-blue-500 rounded-2xl transition-all group"
                     >
                        <span className="text-[10px] font-black uppercase tracking-tight group-hover:tracking-widest transition-all">Nueva Batería</span>
                        <PlusCircle size={16}/>
                     </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA: Batteries (Default) or Other Views */}
            <div className="flex-1 space-y-8 order-1 lg:order-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-[#1A365D] tracking-tighter uppercase tabular-nums">
                            Centro de <span className="text-[#FF8C9D]">Control</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestión por zonas y baterías de tareas</p>
                    </div>

                    <div className="bg-white p-1.5 rounded-[24px] border border-slate-100 flex gap-1 shadow-sm shrink-0">
                        <button 
                            onClick={() => setView('batteries')}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'batteries' ? 'bg-[#1A365D] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Baterías
                        </button>
                        <button 
                            onClick={() => setView('calendar')}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'calendar' ? 'bg-[#1A365D] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Calendario
                        </button>
                        <button 
                            onClick={() => setView('list')}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'list' ? 'bg-[#1A365D] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Lista
                        </button>
                    </div>
                </div>

                {/* ZONE SELECTOR */}
                <ZoneFilter 
                    zones={zones} 
                    activeId={activeZoneId} 
                    onSelect={onSelectZone} 
                    onManage={onManageZones}
                />

                <div className="transition-all duration-500">
                    {view === 'batteries' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <BatteriesView 
                                batteries={batteries} 
                                onEdit={onEditBattery}
                                onAddExtra={(bId) => onAddBatteryItem(bId)}
                                onDeleteExtra={onDeleteBatteryItem}
                                onCheck={onCheckBattery}
                                onDelete={onDeleteBattery}
                                onPostpone={onPostponeBattery}
                                activeZoneId={activeZoneId}
                            />
                        </div>
                    )}

                    {view === 'calendar' && (
                        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-7 bg-[#F8F9FB] border-b border-[#E2E8F0]">
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                                    <div key={d} className="p-4 text-center text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 bg-slate-50/20">
                                {days.map((day, i) => {
                                    const dayTasks = allTasks.filter(t => isSameDay(parseISO(t.date), day));
                                    const isCurrentMonth = isSameMonth(day, month);
                                    const isTodayDay = isToday(day);

                                    return (
                                        <div 
                                            key={i} 
                                            className={`min-h-[140px] p-3 border-r border-b border-[#E2E8F0] transition-all relative ${!isCurrentMonth ? 'opacity-30 grayscale-[50%]' : 'hover:bg-white'} ${isTodayDay ? 'bg-[#FF8C9D]/5' : ''}`}
                                        >
                                            <div className={`text-[10px] font-black mb-3 flex items-center justify-center w-7 h-7 rounded-lg transition-all ${isTodayDay ? 'bg-[#FF8C9D] text-white shadow-lg shadow-coral-100 scale-110' : 'text-slate-300'}`}>
                                                {format(day, 'd')}
                                            </div>
                                            <div className="space-y-1.5 overflow-y-auto max-h-[90px] custom-scrollbar pr-1">
                                                 {dayTasks.map(t => (
                                                    <button 
                                                        key={t.id} 
                                                        onClick={() => setSelectedTask(t)} 
                                                        className={`w-full text-left text-[8px] px-2.5 py-1.5 rounded-xl font-black truncate uppercase transition-all shadow-sm border ${t.status === 'Hecha' ? 'bg-green-50 text-green-500 border-green-100' : 'bg-white text-[#1A365D] border-slate-100 hover:border-blue-200'}`}
                                                    >
                                                        {t.title}
                                                    </button>
                                                 ))}
                                             </div>
                                         </div>
                                     );
                                })}
                            </div>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500">
                            <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
                                {allTasks.sort((a,b) => a.date.localeCompare(b.date)).map(t => (
                                    <div 
                                        key={t.id} 
                                        onClick={() => setSelectedTask(t)}
                                        className={`bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all cursor-pointer flex items-center gap-6 group ${selectedTask?.id === t.id ? 'ring-2 ring-[#FF8C9D] bg-pink-50/20' : ''}`}
                                    >
                                        <div className={`min-w-0 flex-1`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">{t.date ? format(parseISO(t.date), "EEE d MMM", { locale: es }) : 'S/F'}</span>
                                                {t.status === 'Hecha' && <CheckCircle2 size={12} className="text-green-500"/>}
                                            </div>
                                            <h4 className="text-sm font-black text-[#1A365D] uppercase truncate tracking-tight">{t.title}</h4>
                                        </div>
                                        <ChevronRight size={16} className={`text-slate-200 group-hover:text-[#FF8C9D] transition-colors`} />
                                    </div>
                                ))}
                            </div>

                            <div className="sticky top-24 h-fit">
                                {selectedTask ? (
                                    <div className="bg-[#1A365D] text-white p-8 rounded-[40px] shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                                        <div className="flex justify-between items-start">
                                            <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-[#FF8C9D]/20 text-[#FF8C9D] border border-[#FF8C9D]/30">
                                                {selectedTask.isVirtual ? 'Proyectada' : selectedTask.status}
                                            </div>
                                            <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">{selectedTask.title}</h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-200 mt-2">
                                                <CalendarIcon size={14} className="text-[#FF8C9D]" /> 
                                                {selectedTask.date ? format(parseISO(selectedTask.date), "EEEE d 'de' MMMM", { locale: es }).toUpperCase() : 'POR DEFINIR'}
                                            </div>
                                        </div>
                                        <div className="space-y-3 bg-white/5 p-6 rounded-[32px]">
                                            <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Instrucciones</label>
                                            <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{selectedTask.description || 'Sin detalles adicionales'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-4">
                                            <button 
                                                onClick={() => toggleStatus(selectedTask)} 
                                                className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${selectedTask.status === 'Hecha' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white text-[#1A365D]'}`}
                                            >
                                                <Check size={16}/> {selectedTask.status === 'Hecha' ? 'Revertir' : 'Completar'}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (selectedTask.isVirtual) {
                                                        alert("Esta es una tarea proyectada. Edita la tarea principal para cambiar toda la serie.");
                                                    } else {
                                                        onEdit(selectedTask);
                                                    }
                                                }}
                                                className="py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase border border-white/20 hover:bg-white/20"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center p-12 text-center text-slate-300">
                                        <Info size={40} className="mb-4 opacity-50" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Selecciona una tarea para ver detalles</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );"""

new_content = content[:start_idx] + new_return + content[real_end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced TasksView return statement.")
