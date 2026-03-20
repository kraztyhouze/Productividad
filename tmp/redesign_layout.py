import os
import re

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Gerencia Page Layout (Global Background and Sidebar Navigation)
# Replace the top tab switcher with a lateral sidebar style return
# I'll need to find the return in Gerencia()
gerencia_return_pattern = re.compile(r'return \(\n\s+<div className="p-6 md:p-10 space-y-10 .*?">', re.DOTALL)
new_gerencia_return_start = """return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-['Inter',_sans-serif] selection:bg-blue-50">
        {/* SIDEBAR IZQUIERDO: Minimalist Navigation */}
        <aside className="w-20 lg:w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 transition-all duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A365D] rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-blue-900/20">T</div>
                <span className="font-black text-xl tracking-tighter text-[#1A365D] hidden lg:inline">TIKTAK <span className="text-slate-300">2.1</span></span>
            </div>
            
            <nav className="flex-1 px-4 mt-6 space-y-1">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${activeTab === tab.id ? 'bg-blue-50 text-[#1A365D] shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                    >
                        <tab.icon size={20} className={activeTab === tab.id ? 'text-[#1A365D]' : 'text-slate-300 group-hover:text-slate-400'} />
                        <span className="text-[11px] font-black uppercase tracking-widest hidden lg:inline">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-6 mt-auto border-t border-slate-50">
                 <button onClick={() => setModal({ type: 'xp_bonus', data: null })} className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-blue-500 transition-colors">
                    <Award size={20} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Bono XP</span>
                 </button>
            </div>
        </aside>

        {/* MAIN CONTAINER */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <header className="sticky top-0 z-30 bg-[#F9FAFB]/80 backdrop-blur-md border-b border-[#E5E7EB] px-10 py-6 flex justify-between items-center">
                <div>
                     <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{tabs.find(t => t.id === activeTab)?.label}</h1>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.alias}`} alt="" />
                        </div>
                     </div>
                </div>
            </header>

            <div className="p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">"""

content = re.sub(gerencia_return_pattern, new_gerencia_return_start, content)

# Update Gerencia return closure
content = content.replace(
    '        </div>\n    );\n};\n\n// --- SUB-COMPONENTS/VIEWS ---',
    '            </div>\n        </main>\n    </div>\n    );\n};\n\n// --- SUB-COMPONENTS/VIEWS ---'
)

# 2. Update TasksView to Command Center Layout (75% Zones Grid, 25% Fixed Sidebar)
# I'll need to replace the entire TasksView component or just its inner return
tasksview_return_pattern = re.compile(r'return \(\n\s+<div className="flex flex-col lg:flex-row gap-8 min-h-\[80vh\].*?\n\s+<\/div>\n\s+\);\n\};', re.DOTALL)
new_tasksview_return = """return (
        <div className="flex flex-col lg:flex-row gap-10">
            {/* PANEL CENTRAL: GRID DE BATERÍAS POR ZONAS (75%) */}
            <div className="flex-1 space-y-10">
                <div className="flex justify-between items-center">
                    <div className="flex bg-white p-1 rounded-xl border border-[#E5E7EB] shadow-sm">
                        {[
                            { id: 'batteries', label: 'Baterías', icon: Layers },
                            { id: 'calendar', label: 'Mes', icon: CalendarIcon },
                            { id: 'list', label: 'Lista', icon: List }
                        ].map(v => (
                            <button 
                                key={v.id} onClick={() => setView(v.id)}
                                className={`px-5 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${view === v.id ? 'bg-[#1A365D] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <v.icon size={14} />
                                {v.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={onManageZones} className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Configurar Zonas</button>
                    </div>
                </div>

                {view === 'batteries' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {(zones.length > 0 ? zones : [{id: 'general', name: 'General'}]).map(zone => {
                            const zoneBatteries = batteries.filter(b => b.zone_id == zone.id);
                            const zoneTasks = tasks.filter(t => t.zone_id == zone.id && t.status !== 'Hecha');
                            
                            // Aggregated progress for the zone
                            let total = 0, done = 0;
                            zoneBatteries.forEach(b => {(b.items || []).forEach(i => { total++; if(i.is_done) done++; }); });
                            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                            return (
                                <div key={zone.id} className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                                    <header className="p-6 border-b border-[#F1F3F5] flex justify-between items-center bg-slate-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-12 h-12 flex items-center justify-center">
                                                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                     <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
                                                     <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-[#1A365D] transition-all duration-1000" strokeDasharray={126} strokeDashoffset={126 - (126 * progress) / 100} />
                                                 </svg>
                                                 <span className="text-[10px] font-black text-[#1A365D]">{progress}%</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-[#1A365D] uppercase tracking-tighter">{zone.name}</h3>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{zoneBatteries.length} Baterías activas</p>
                                            </div>
                                        </div>
                                        <button onClick={onAdd} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-[#FF8C9D] hover:border-[#FF8C9D] transition-all">
                                            <Plus size={16} />
                                        </button>
                                    </header>
                                    
                                    <div className="flex-1 p-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                                        <BatteriesView 
                                            batteries={zoneBatteries} 
                                            activeZoneId={zone.id}
                                            onEdit={onEditBattery}
                                            onAddExtra={onAddBatteryItem}
                                            onDeleteExtra={onDeleteBatteryItem}
                                            onCheck={onCheckBattery}
                                            onDelete={onDeleteBattery}
                                            onPostpone={onPostponeBattery}
                                            hideHeader={true}
                                            isCompact={true}
                                        />
                                        
                                        {/* Standard Tasks for this zone */}
                                        {zoneTasks.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-50 px-4">
                                                <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Tareas Puntuales</h4>
                                                <div className="space-y-1">
                                                    {zoneTasks.slice(0,5).map(t => (
                                                        <div key={t.id} onClick={() => setSelectedTask(t)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                                                            <div className={`w-0.5 h-6 rounded-full transition-all ${t.priority_level === 'Urgente' ? 'bg-red-500' : t.priority_level === 'Alta' ? 'bg-amber-500' : 'bg-slate-200'}`} />
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-blue-400 transition-colors" />
                                                            <span className="text-[11px] font-bold text-slate-600 uppercase truncate flex-1">{t.title}</span>
                                                            <span className="text-[8px] font-black text-slate-300 group-hover:text-[#FF8C9D] transition-colors">{t.time || ''}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-4 bg-slate-50/50 border-t border-[#F1F3F5] flex justify-between items-center mr-0.5">
                                         <button onClick={() => setView('list')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1A365D]">Detalle Completo</button>
                                         <button onClick={onAddBattery} className="px-3 py-1.5 bg-white border border-slate-200 text-[#1A365D] rounded-lg text-[9px] font-black uppercase shadow-sm">Nueva Batería</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {view === 'calendar' && (
                     <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-7 bg-[#F8F9FB] border-b border-[#E2E8F0]">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                                <div key={d} className="p-4 text-center text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((day, i) => {
                                const dayTasks = allTasks.filter(t => isSameDay(parseISO(t.date), day));
                                const isCurrentMonth = isSameMonth(day, month);
                                const isTodayDay = isToday(day);

                                return (
                                    <div 
                                        key={i} 
                                        className={`min-h-[140px] p-3 border-r border-b border-[#E2E8F0] transition-all relative ${!isCurrentMonth ? 'opacity-10 grayscale' : 'hover:bg-slate-50/50'} ${isTodayDay ? 'bg-blue-50/10' : ''}`}
                                    >
                                        <div className={`text-[10px] font-black mb-3 flex items-center justify-center w-7 h-7 rounded-full transition-all ${isTodayDay ? 'bg-[#1A365D] text-white shadow-lg' : 'text-slate-300'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1">
                                             {dayTasks.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => setSelectedTask(t)} 
                                                    className={`px-2 py-1 rounded-md text-[8px] font-black truncate uppercase border ${t.status === 'Hecha' ? 'bg-green-50 text-green-500 border-green-100 line-through' : 'bg-white text-[#1A365D] border-slate-100 shadow-sm cursor-pointer hover:border-blue-300 transition-all'}`}
                                                >
                                                    {t.title}
                                                </div>
                                             ))}
                                         </div>
                                     </div>
                                 );
                            })}
                        </div>
                    </div>
                )}

                {view === 'list' && ( ... )}
            </div>

            {/* BARRA LATERAL DERECHA (25% - FIJA) */}
            <aside className="w-full lg:w-[320px] shrink-0 space-y-8">
                <div className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm p-8 space-y-8 sticky top-24">
                    <MiniCalendar 
                        currentMonth={month} 
                        onMonthChange={setMonth} 
                        tasks={allTasks} 
                    />
                    
                    <div className="pt-8 border-t border-[#F1F3F5]">
                        <h4 className="text-[10px] font-black text-[#1A365D] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Clock size={16} className="text-[#FF8C9D]" />
                            Cronograma
                        </h4>
                        <UpcomingTimeline 
                            tasks={allTasks} 
                            onSelectTask={(t) => {
                                setSelectedTask(t);
                                setView('list');
                            }} 
                        />
                    </div>
                </div>
            </aside>
        </div>
    );"""
# I'll use a placeholder for 'list' view in tasksview_return replacement to avoid massive string
# AND I MUST INCLUDE THE CLOSURE
content = content.replace(
    'return (\n        <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh] animate-in fade-in duration-700">',
    'return (\n        <div className="flex flex-col lg:flex-row gap-10">',
    1
)

# 3. Redesign BatteriesView components (Compact Mode)
# I need to update the mapping of batteries in BatteriesView to match the new high-density style
# Line 3414 approx: (b.items || []).map(item => ( ... ))
# I'll replace the inner item renderer in BatteriesView
batteries_item_pattern = re.compile(r'<div key=\{item\.id\} className="flex items-center justify-between p-4 bg-white rounded-2xl group/item shadow-sm border border-transparent hover:border-blue-100 transition-all">.*?<\/div>', re.DOTALL)
new_batteries_item = """<div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group/item">
                                                        <button 
                                                            onClick={() => onCheck(item)}
                                                            className={`w-5 h-5 rounded-full border-2 transition-all shrink-0 flex items-center justify-center ${item.is_done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-transparent hover:border-blue-400'}`}
                                                        >
                                                            <Check size={12} strokeWidth={4}/>
                                                        </button>
                                                        <p className={`text-[11px] font-bold uppercase truncate transition-all flex-1 ${item.is_done ? 'text-slate-300 line-through' : 'text-[#1A365D]'}`}>{item.description}</p>
                                                        <button 
                                                            onClick={() => onDeleteExtra(item.id)}
                                                            className="p-1 text-slate-200 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={12}/>
                                                        </button>
                                                    </div>"""

# 4. Global CSS Styles for "Linear" feel
# I'll check main.css or index.css
# But actually I can just add a <style> tag in main.jsx if needed, or just use Tailwind.
# I'll stick to Tailwind classes and inline styles where needed.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Gerencia and TasksView layout.")
