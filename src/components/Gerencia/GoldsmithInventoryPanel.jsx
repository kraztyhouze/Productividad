import React from 'react';
import { Package, Search, ChevronRight } from 'lucide-react';
import { CATEGORY_COLORS } from '../../constants/gerenciaConstants';

const GoldsmithInventoryPanel = ({ inventory, onAdjust }) => {
    return (
        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-700">
            <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Inventario de Metales</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stock real en tienda por agrupación</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:bg-coral-50 group-hover:text-[#FF8C9D] transition-colors">
                    <Package size={20} />
                </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(inventory || []).map(item => (
                    <div key={item.id} className="p-6 bg-[#F8F9FB] rounded-[32px] border border-transparent hover:border-slate-200 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#CCC' }} />
                            <button onClick={() => onAdjust(item)} className="bg-white p-2 rounded-xl text-slate-300 hover:text-[#1A365D] hover:shadow-md transition-all">
                                <Search size={14}/>
                            </button>
                        </div>
                        <h4 className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter mb-1">{item.category}</h4>
                        <p className="text-2xl font-black text-[#1A365D] tracking-tighter">{Number(item.total_weight).toFixed(2)}<span className="text-[10px] ml-1 text-slate-400">gr</span></p>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-300 uppercase">Valor Est.</span>
                            <span className="text-[10px] font-black text-slate-400">{(Number(item.total_cost) || 0).toFixed(2)}€</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoldsmithInventoryPanel;
