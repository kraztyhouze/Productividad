import React from 'react';
import { Package, Search, ChevronRight, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const GoldsmithOrdersPanel = ({ orders, onReceive }) => {
    return (
        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden h-full flex flex-col animate-in fade-in duration-700">
            <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Pedidos en Tránsito</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Órdenes de joyería lanzadas por tienda</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl text-amber-500 shadow-amber-100 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                    <TrendingUp size={20} />
                </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col gap-4 max-h-[440px] overflow-y-auto custom-scrollbar">
                {(orders || []).filter(o => o.status !== 'Recibido').map(order => (
                    <div key={order.id} className="p-6 bg-[#F8F9FB] rounded-[32px] border border-transparent hover:border-amber-100 transition-all group relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Ref: {order.reference}</span>
                                <h4 className="text-lg font-black text-[#1A365D] uppercase tracking-tighter truncate w-32">{order.description}</h4>
                            </div>
                            <div className="flex gap-2">
                                <span className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase">Pendiente</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase block mb-1">Peso Estimado</p>
                                <p className="text-xl font-black text-[#1A365D]">{Number(order.est_weight || 0).toFixed(2)}<span className="text-xs ml-1 opacity-50">gr</span></p>
                            </div>
                            <button 
                                onClick={() => onReceive(order)}
                                className="bg-[#1A365D] text-white px-5 py-3 rounded-2xl font-black text-[9px] uppercase hover:bg-amber-500 transition-all flex items-center gap-2"
                            >
                                RECIBIR <ChevronRight size={14}/>
                            </button>
                        </div>
                    </div>
                ))}
                {(orders || []).filter(o => o.status !== 'Recibido').length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-10 opacity-30 text-center grayscale filter invert-[.5]">
                        <Package size={48} className="mb-4 text-[#1A365D]"/>
                        <p className="text-xs font-black uppercase tracking-widest">Sin pedidos pendientes</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoldsmithOrdersPanel;
