import React from 'react';
import { ShieldAlert, Euro, Lock, UserPlus } from 'lucide-react';

const AccountStatusWidget = ({ partners }) => {
    const totalGrams = (partners || []).reduce((acc, p) => acc + Number(p.debt_grams || 0), 0);
    
    return (
        <div className="bg-[#1A365D] p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10 group transition-all hover:scale-[1.005]">
            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-4 rounded-[28px] text-white backdrop-blur-xl group-hover:scale-110 transition-transform">
                        <ShieldAlert size={32}/>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">Estado de Cuentas Joyeros</h3>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mt-1">Liquidación pendiente y saldos globales</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/10 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">Pasivo en Metales</span>
                    <p className="text-4xl font-black tracking-tighter text-white">{(totalGrams || 0).toFixed(2)}<span className="text-sm ml-1 opacity-50">gr</span></p>
                </div>
                
                <div className="bg-emerald-500 p-6 rounded-[32px] shadow-xl shadow-emerald-900/40 flex flex-col justify-center text-white">
                    <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest block mb-1">Garantía de Depósito</span>
                    <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-white/20 rounded-lg"><Lock size={12}/></div>
                         <p className="text-xl font-black tracking-tighter uppercase">Protegido</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-xl flex flex-col justify-center text-[#1A365D] hidden md:flex">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Acción Requerida</span>
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-black uppercase">Próximo Afinaje</p>
                        <div className="w-1.5 h-1.5 bg-[#FF8C9D] rounded-full animate-pulse" />
                    </div>
                </div>
            </div>

            <Euro className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 rotate-12" />
        </div>
    );
};

export default AccountStatusWidget;
