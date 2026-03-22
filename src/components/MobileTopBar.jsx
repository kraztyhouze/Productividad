import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useModule, MODULES } from '../context/ModuleContext';
import { useStore } from '../context/StoreContext';
import { ArrowLeftRight, User } from 'lucide-react';

const MobileTopBar = () => {
    const { user } = useAuth();
    const { activeModule, switchModule } = useModule();
    const { currentStore } = useStore();

    const isGerencia = activeModule === MODULES.GERENCIA;

    const handleSwitch = () => {
        const next = isGerencia ? MODULES.COMPRAS : MODULES.GERENCIA;
        switchModule(next);
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black italic shadow-sm ${isGerencia ? 'bg-[#1A365D]' : 'bg-[#FF8C9D]'}`}>
                    T
                </div>
                <div>
                    <h1 className="text-xs font-black uppercase tracking-tight text-[#1A365D]">TikTak <span className="text-[10px] text-slate-300">2.1</span></h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currentStore}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={handleSwitch}
                    className={`p-2 rounded-xl transition-all ${isGerencia ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-600'}`}
                >
                    <ArrowLeftRight size={16} />
                </button>
                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100 max-w-[100px]">
                    <User size={12} className="text-slate-400" />
                    <span className="text-[8px] font-black uppercase text-slate-500 truncate">{user?.nombre || user?.username || 'USER'}</span>
                </div>
            </div>
        </header>
    );
};

export default MobileTopBar;
