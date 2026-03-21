import React from 'react';
import { 
    LayoutDashboard, 
    Calendar, 
    Activity, 
    Navigation, 
    Users, 
    FileBarChart, 
    Calculator, 
    Menu, 
    X,
    Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GerenciaHeader = ({ 
    activeTab, 
    setActiveTab, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    isTasksFilterOpen,
    setIsTasksFilterOpen,
    alerts 
}) => {
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
        { id: 'tasks', label: 'Agenda & Planes', icon: Calendar, color: 'text-[#FF8C9D]' },
        { id: 'jewelry', label: 'Operativa Joyería', icon: Activity, color: 'text-amber-500' },
        { id: 'team', label: 'Equipo & Zonas', icon: Users, color: 'text-indigo-500' },
        { id: 'meetings', label: 'Organizador 1:1', icon: Navigation, color: 'text-indigo-600' },
        { id: 'cash', label: 'Control de Caja', icon: Calculator, color: 'text-emerald-500' },
        { id: 'reports', label: 'Reportes & Export', icon: FileBarChart, color: 'text-slate-500' },
    ];

    const activeAlertsCount = (alerts || []).length;

    return (
        <header className="sticky top-0 z-40 w-full mb-8">
            <div className="bg-white/70 backdrop-blur-xl border-b border-white border-opacity-30 p-4 md:p-6 rounded-b-[40px] shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-[#1A365D] transition-all"
                        >
                            {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
                        </button>
                        
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-3xl font-black text-[#1A365D] tracking-tighter uppercase leading-none">
                                TikTak <span className="text-[#FF8C9D]">Suite</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panel Gerencia 2.1</span>
                            </div>
                        </div>
                    </div>



                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            className={`p-3 rounded-2xl border border-slate-100 transition-all relative ${activeAlertsCount > 0 ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white text-slate-400 hover:text-indigo-500'}`}
                        >
                            <Bell size={20} />
                            {activeAlertsCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white">
                                    {activeAlertsCount}
                                </span>
                            )}
                        </button>
                        
                        <div className="h-10 w-[1px] bg-slate-100 hidden md:block"></div>
                        
                        <div className="hidden md:flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="w-9 h-9 bg-[#1A365D] text-white rounded-xl flex items-center justify-center font-black text-sm uppercase">
                                G
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter">Gerente</span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Admin Global</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="xl:hidden mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`
                                                flex items-center gap-3 p-4 rounded-3xl font-black text-[9px] uppercase tracking-wider transition-all
                                                ${isActive 
                                                    ? 'bg-[#1A365D] text-white shadow-xl shadow-blue-900/10' 
                                                    : 'bg-white text-slate-400 border border-slate-100'
                                                }
                                            `}
                                        >
                                            <Icon size={16} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default GerenciaHeader;
