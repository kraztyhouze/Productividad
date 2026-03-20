import os
import re

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Imports
content = content.replace('    RefreshCcw\n} from \'lucide-react\';', '    RefreshCcw,\n    List,\n    Layout,\n    Clock\n} from \'lucide-react\';')

# 2. Define the new Gerencia Internal Layout (Sidebar based)
# We'll replace the return block in Gerencia component
def get_gerencia_return(tabs, activeTab, user, tasks, batteries, partners, movements, cashHistory, inventory, orders, cumulativeCashDiff, employees, auditAlerts, activeZoneId, setActiveZoneId, setModal, handleSaveTask, handleDeleteTask, handleSaveZone, handleDeleteZone, handleSavePartner, handleSaveMovement, handleDeleteMovement, handleUpdateSmelt, handleSaveBattery, handleSaveBatteryItem, handleDeleteBatteryItem, handleToggleBatteryItem, handleSaveOrder, handleReceiveOrder, handleAdjustInventory, handleGrantXP, loadData, currentStore, handleDeleteBattery, handlePostponeBattery, handleSaveCash, setActiveTab):
    # This is just a conceptual function to generate the string
    pass

new_gerencia_return = """    return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-['Inter',_sans-serif]">
        {/* SIDEBAR IZQUIERDO: Minimalist Global Nav */}
        <aside className="w-20 lg:w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 transition-all">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A365D] rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-blue-900/10">T</div>
                <span className="font-black text-xl tracking-tighter text-[#1A365D] hidden lg:inline">TIKTAK <span className="text-slate-300">2.1</span></span>
            </div>
            <nav className="flex-1 px-4 mt-6 space-y-1">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${activeTab === tab.id ? 'bg-blue-50 text-[#1A365D]' : 'text-slate-400 hover:bg-slate-50'}`}
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

        {/* MAIN AREA */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F9FAFB]">
            <header className="sticky top-0 z-40 bg-[#F9FAFB]/80 backdrop-blur-md border-b border-[#E5E7EB] px-6 lg:px-10 py-6 flex justify-between items-center transition-all">
                <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{tabs.find(t => t.id === activeTab)?.label}</h1>
                <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                        <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.alias}`} alt="" />
                     </div>
                </div>
            </header>

            <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                {activeTab === 'summary' && <GerenciaDashboard tasks={tasks} batteries={batteries} partners={partners} movements={movements} cashHistory={cashHistory} inventory={inventory} orders={orders} cumulativeCashDiff={cumulativeCashDiff} employees={employees} auditAlerts={auditAlerts} onXPBonus={() => setModal({ type: 'xp_bonus', data: null })} activeZoneId={activeZoneId} onTabSwitch={setActiveTab} />}
                {activeTab === 'reports' && <ReportsView batteries={batteries} tasks={tasks} cashHistory={cashHistory} movements={movements} partners={partners} activeZoneId={activeZoneId} />}
                {activeTab === 'tasks' && <TasksView tasks={tasks} batteries={batteries} employees={employees} partners={partners} zones={zones} activeZoneId={activeZoneId} onSelectZone={setActiveZoneId} onManageZones={() => setModal({ type: 'zone_manager', data: null })} onEdit={(t) => setModal({ type: 'task', data: t })} onAdd={() => setModal({ type: 'task', data: null })} onAddBattery={() => setModal({ type: 'battery', data: null })} onEditBattery={(b) => setModal({ type: 'battery', data: b })} onAddBatteryItem={(bId) => setModal({ type: 'battery_item', data: { battery_id: bId } })} onDeleteBatteryItem={handleDeleteBatteryItem} onCheckBattery={(item) => setModal({ type: 'battery_item_check', data: item })} onDeleteBattery={handleDeleteBattery} onPostponeBattery={handlePostponeBattery} loadData={loadData} currentStore={currentStore} />}
                {activeTab === 'jewelry' && <JewelryView inventory={inventory} orders={orders} partners={partners} movements={movements} onAddPartner={() => setModal({ type: 'partner', data: null })} onEditPartner={(p) => setModal({ type: 'partner', data: p })} onDeletePartner={handleDeletePartner} onAddMovement={(type) => setModal({ type: 'movement', data: type })} onDeleteMovement={handleDeleteMovement} onRefine={(m) => setModal({ type: 'refine', data: m })} onAddOrder={() => setModal({ type: 'order', data: null })} onReceiveOrder={(o) => setModal({ type: 'order_receive', data: o })} onAdjustInventory={(cat) => setModal({ type: 'inventory_adjust', data: cat })} />}
                {activeTab === 'cash' && <CashView history={Array.isArray(cashHistory) ? cashHistory : []} employees={employees} onSave={handleSaveCash} user={user} cumulativeCashDiff={cumulativeCashDiff} />}
            </div>
        </main>

        {/* MODALS PERSISTENTES */}
        <AnimatePresence>
            <GlobalModal isOpen={modal.type === 'task'} onClose={() => setModal({ type: null, data: null })} title={modal.data ? 'Editar Tarea' : 'Nueva Tarea'}>
                <TaskForm initialData={modal.data} employees={employees} zones={zones} onSave={handleSaveTask} onCancel={() => setModal({ type: null, data: null })} onDelete={handleDeleteTask} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'zone_manager'} onClose={() => setModal({ type: null, data: null })} title="Gestión de Zonas">
                <ZoneManagerForm zones={zones} employees={employees} onSave={handleSaveZone} onDelete={handleDeleteZone} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'partner'} onClose={() => setModal({ type: null, data: null })} title={modal.data ? 'Editar Joyero' : 'Nuevo Joyero'}>
                <PartnerForm initialData={modal.data} onSave={handleSavePartner} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'movement'} onClose={() => setModal({ type: null, data: null })} title="Operación de Joyería" maxWidth="max-w-4xl">
                <MovementForm type={modal.data} partners={partners} onSave={handleSaveMovement} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'refine'} onClose={() => setModal({ type: null, data: null })} title="Cierre de Lote">
                <RefineForm movement={modal.data} onSave={handleUpdateSmelt} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'battery'} onClose={() => setModal({ type: null, data: null })} title={modal.data ? "Editar Batería" : "Nueva Batería"}>
                <BatteryForm initialData={modal.data} zones={zones} onSave={handleSaveBattery} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'battery_item'} onClose={() => setModal({ type: null, data: null })} title="Añadir Tarea">
                <BatteryItemForm batteryId={modal.data?.battery_id} onSave={handleSaveBatteryItem} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'battery_item_check'} onClose={() => setModal({ type: null, data: null })} title="Checkbox Tarea">
                <BatteryItemCheckForm item={modal.data} onConfirm={handleToggleBatteryItem} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'order'} onClose={() => setModal({ type: null, data: null })} title="Lanzar Pedido">
                <OrderForm partners={partners} onSave={handleSaveOrder} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'order_receive'} onClose={() => setModal({ type: null, data: null })} title="Recibir Mercancía">
                <OrderClosureModal order={modal.data} onConfirm={handleReceiveOrder} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'inventory_adjust'} onClose={() => setModal({ type: null, data: null })} title="Stock / Inventario">
                <InventoryAdjustmentModal initialCategory={modal.data} onSave={handleAdjustInventory} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
            <GlobalModal isOpen={modal.type === 'xp_bonus'} onClose={() => setModal({ type: null, data: null })} title="Bonificación XP">
                <XPBonusForm employees={employees} onSave={handleGrantXP} onCancel={() => setModal({ type: null, data: null })} />
            </GlobalModal>
        </AnimatePresence>
    </div>
    );"""

# Replace the Return in Gerencia()
start_marker = "return ("
end_marker = "};"
# Find the specific return block in Gerencia
gerencia_pos = content.find("const Gerencia = () => {")
# Look for the last return before SUB-COMPONENTS
last_return_pos = content.rfind("return (", 0, content.find("// --- SUB-COMPONENTS/VIEWS ---"))
end_return_pos = content.find("};", last_return_pos) + 2

content = content[:last_return_pos] + new_gerencia_return + content[end_return_pos:]

# 3. Define the new TasksView return (75/25 split)
new_tasksview_return = """    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* PANEL CENTRAL (75%) */}
            <div className="flex-1 w-full lg:max-w-[calc(100%-360px)] space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-[900] text-[#1A365D] tracking-tighter uppercase tabular-nums flex items-center gap-3">
                             Centro de <span className="text-[#3182CE]">Control</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nivel operacional y ejecución por zonas</p>
                    </div>

                    <div className="bg-white p-1 rounded-xl border border-[#E5E7EB] shadow-sm flex gap-1">
                        {[
                            { id: 'batteries', label: 'Baterías', icon: Layers },
                            { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
                            { id: 'list', label: 'Lista', icon: List }
                        ].map(v => (
                            <button 
                                key={v.id} onClick={() => setView(v.id)}
                                className={`px-5 py-2.5 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${view === v.id ? 'bg-[#1A365D] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <v.icon size={14} />
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {view === 'batteries' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {(zones.length > 0 ? zones : [{id: 'general', name: 'Operativo General'}]).map(zone => {
                            const zoneBatteries = (batteries || []).filter(b => b.zone_id == zone.id);
                            const zoneTasks = (tasks || []).filter(t => t.zone_id == zone.id && t.status !== 'Hecha');
                            
                            let total = 0, done = 0;
                            zoneBatteries.forEach(b => { (b.items || []).forEach(i => { total++; if(i.is_done) done++; }); });
                            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                            return (
                                <div key={zone.id} className="bg-white rounded-[40px] border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden hover:shadow-xl hover:translate-y-[-4px] transition-all duration-500">
                                    <header className="p-8 border-b border-[#F8F9FA] flex justify-between items-center bg-slate-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-14 h-14 flex items-center justify-center">
                                                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                     <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#3182CE] transition-all duration-1000" strokeDasharray={151} strokeDashoffset={151 - (151 * progress) / 100} />
                                                 </svg>
                                                 <span className="text-[11px] font-black text-[#1A365D] tabular-nums">{progress}%</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-[#1A365D] uppercase tracking-tighter leading-tight">{zone.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{zoneBatteries.length} Planes de ejecución</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={onAdd} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all">
                                            <Plus size={18} />
                                        </button>
                                    </header>
                                    
                                    <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar bg-[#FDFDFD]">
                                        <BatteriesView 
                                            batteries={zoneBatteries} onEdit={onEditBattery} onAddExtra={onAddBatteryItem} onDeleteExtra={onDeleteBatteryItem} onCheck={onCheckBattery} onDelete={onDeleteBattery} onPostpone={onPostponeBattery}
                                            hideHeader={true} isCompact={true} activeZoneId={zone.id}
                                        />
                                        
                                        {zoneTasks.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-slate-100">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ejecución Puntual</h4>
                                                <div className="space-y-1">
                                                    {zoneTasks.slice(0, 10).map(t => (
                                                        <div key={t.id} onClick={() => setSelectedTask(t)} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                                                            <div className={`w-0.5 h-6 rounded-full transition-all ${t.priority_level === 'Urgente' ? 'bg-rose-500' : t.priority_level === 'Alta' ? 'bg-amber-400' : 'bg-slate-200'}`} />
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-blue-400 bg-white transition-all shadow-sm" />
                                                            <span className="text-[11px] font-bold text-slate-600 uppercase truncate flex-1 tracking-tight">{t.title}</span>
                                                            <span className="text-[9px] font-black text-slate-300 group-hover:text-blue-500 tabular-nums">{t.time || ''}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <footer className="p-4 bg-slate-50/30 border-t border-[#F1F3F5] flex justify-between items-center">
                                         <button onClick={() => setView('list')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1A365D] px-4 py-2">Ver Log Completo</button>
                                         <button onClick={onAddBattery} className="px-5 py-2.5 bg-white border border-slate-200 text-[#1A365D] rounded-xl text-[10px] font-black uppercase shadow-sm hover:shadow-md transition-all">Lanzar Batería</button>
                                    </footer>
                                </div>
                            );
                        })}
                    </div>
                )}

                {view === 'calendar' && (
                     <div className="bg-white rounded-[48px] border border-[#E5E7EB] shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-[#E5E7EB]">
                            {['Lunes', 'Martes', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                                <div key={d} className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
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
                                        className={`min-h-[160px] p-5 border-r border-b border-[#E5E7EB] transition-all relative ${!isCurrentMonth ? 'opacity-10 grayscale' : 'hover:bg-slate-50/30'} ${isTodayDay ? 'bg-blue-50/10' : ''}`}
                                    >
                                        <div className={`text-xs font-black mb-4 flex items-center justify-center w-8 h-8 rounded-xl transition-all ${isTodayDay ? 'bg-[#1A365D] text-white shadow-xl' : 'text-slate-300'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                                             {dayTasks.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => setSelectedTask(t)} 
                                                    className={`px-3 py-2 rounded-xl text-[8px] font-black truncate uppercase border ${t.status === 'Hecha' ? 'bg-green-50 text-green-500 border-green-100 line-through' : 'bg-white text-[#1A365D] border-slate-100 shadow-sm cursor-pointer hover:border-blue-400 transition-all'}`}
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

                {view === 'list' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in duration-500">
                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-3 custom-scrollbar">
                            {allTasks.sort((a,b) => a.date.localeCompare(b.date)).map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => setSelectedTask(t)}
                                    className={`bg-white p-6 rounded-[32px] border border-[#E5E7EB] shadow-sm hover:shadow-xl transition-all cursor-pointer flex items-center gap-6 group ${selectedTask?.id === t.id ? 'ring-2 ring-blue-500/20 bg-blue-50/10 border-blue-100' : ''}`}
                                >
                                    <div className={`min-w-0 flex-1`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.date ? format(parseISO(t.date), "EEE d MMM", { locale: es }) : 'S/F'}</span>
                                            {t.status === 'Hecha' && <CheckCircle2 size={12} className="text-green-500"/>}
                                        </div>
                                        <h4 className="text-sm font-black text-[#1A365D] uppercase truncate tracking-tight">{t.title}</h4>
                                    </div>
                                    <ChevronRight size={16} className={`text-slate-200 group-hover:text-blue-500 translate-x-0 group-hover:translate-x-1 transition-all`} />
                                </div>
                            ))}
                        </div>

                        <div className="sticky top-24 h-fit">
                            {selectedTask ? (
                                <div className="bg-[#1A365D] text-white p-10 rounded-[64px] shadow-2xl space-y-10 animate-in zoom-in-95 duration-300">
                                    <div className="flex justify-between items-start">
                                        <div className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/20">
                                            {selectedTask.status}
                                        </div>
                                        <button onClick={() => setSelectedTask(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-[900] uppercase tracking-tighter leading-[1.05]">{selectedTask.title}</h3>
                                        <div className="flex items-center gap-3 text-[11px] font-bold text-blue-300 mt-6 bg-white/5 w-fit px-4 py-2 rounded-full">
                                            <CalendarIcon size={16} className="text-blue-400" /> 
                                            {selectedTask.date ? format(parseISO(selectedTask.date), "EEEE d 'de' MMMM", { locale: es }).toUpperCase() : 'PARA PROGRAMAR'}
                                        </div>
                                    </div>
                                    <div className="space-y-4 bg-white/5 p-10 rounded-[48px] border border-white/5">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Instrucciones Operativas</label>
                                        <p className="text-base font-medium leading-relaxed opacity-80 whitespace-pre-wrap">{selectedTask.description || 'Sin especificaciones técnicas.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-6">
                                        <button onClick={() => toggleStatus(selectedTask)} className={`py-6 rounded-[32px] font-black text-[11px] uppercase tracking-widest transition-all ${selectedTask.status === 'Hecha' ? 'bg-green-500 text-white shadow-xl shadow-green-500/20' : 'bg-white text-[#1A365D] shadow-xl'}`}>{selectedTask.status === 'Hecha' ? 'Finalizada' : 'Confirmar'}</button>
                                        <button onClick={() => selectedTask.isVirtual ? alert('Serie Proyectada') : onEdit(selectedTask)} className="py-6 bg-white/10 text-white rounded-[32px] font-black text-[11px] uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all">Modificar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[500px] border-2 border-dashed border-slate-200 rounded-[64px] flex flex-col items-center justify-center p-12 text-center text-slate-300 bg-white/50">
                                    <Info size={56} className="mb-8 opacity-20" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">Selecciona un ítem de la agenda</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* SIDEBAR DERECHO (25%) */}
            <aside className="w-full lg:w-[320px] shrink-0 sticky top-24 space-y-10">
                <div className="bg-white rounded-[40px] border border-[#E5E7EB] shadow-sm p-8 space-y-12 animate-in fade-in slide-in-from-right-4 duration-700">
                    <MiniCalendar currentMonth={month} onMonthChange={setMonth} tasks={allTasks} />
                    
                    <div className="pt-10 border-t border-slate-100">
                        <h4 className="text-[11px] font-black text-[#1A365D] uppercase tracking-[0.3em] mb-10 flex items-center justify-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                            Próximos Hitos
                        </h4>
                        <UpcomingTimeline tasks={allTasks} onSelectTask={(t) => { setSelectedTask(t); setView('list'); }} />
                    </div>
                </div>
                
                <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-4">
                     <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Recursos Rápidos</h5>
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={onAdd} className="bg-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-500 transition-all">
                            <Plus size={18} />
                            <span className="text-[8px] font-black uppercase">Tarea</span>
                        </button>
                        <button onClick={onAddBattery} className="bg-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-green-500 transition-all">
                            <Layers size={18} />
                            <span className="text-[8px] font-black uppercase">Batería</span>
                        </button>
                     </div>
                </div>
            </aside>
        </div>
    );"""

# Replace TasksView return
start_tasks_return = content.find("return (", tasksview_start)
end_tasks_return = content.find("};", start_tasks_return) + 2
content = content[:start_tasks_return] + new_tasksview_return + content[end_tasks_return:]

# 4. Redesign BatteriesView Item
# Use a very specific target to avoid multiple matches or mangling
old_item_code = '<div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl group/item shadow-sm border border-transparent hover:border-blue-100 transition-all">'
new_item_code = '<div key={item.id} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50/50 transition-all group/item shadow-sm border border-transparent hover:border-blue-100 bg-white">'

# I'll replace the inner loop content of BatteriesView
def replace_batteries_loop(content):
    # Find the BatteriesView mapping
    m = re.search(r'\{\(b\.items \|\| \[\]\)\.map\(item => \(.*?\)\)\}', content, re.DOTALL)
    if not m: return content
    
    new_loop = """{(b.items || []).map(item => (
                                                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all group/item border border-transparent hover:border-blue-50">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onCheck(item); }}
                                                            className={`w-7 h-7 rounded-full border-2 transition-all shrink-0 flex items-center justify-center ${item.is_done ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20 scale-110' : 'bg-white border-slate-200 text-transparent hover:border-blue-400'}`}
                                                        >
                                                            <Check size={14} strokeWidth={4}/>
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[12px] font-[700] uppercase truncate transition-all tracking-tight ${item.is_done ? 'text-slate-300 line-through' : 'text-[#1A365D]'}`}>{item.description}</p>
                                                            {item.is_done && <span className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1 mt-0.5"><Check size={8}/> {item.completed_by}</span>}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onDeleteExtra(item.id); }}
                                                            className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                ))}"""
    return content[:m.start()] + new_loop + content[m.end():]

content = replace_batteries_loop(content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("COMPLETED SUCCESSFUL REDESIGN")
