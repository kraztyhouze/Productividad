import React from 'react';
import { Package, Search } from 'lucide-react';
import { CATEGORY_COLORS } from '../../constants/gerenciaConstants';

const GoldsmithInventoryPanel = ({ inventory, onAdjust }) => {
    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 pb-2 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-xl text-slate-400 border border-slate-100">
                        <Package size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-[#1A365D] uppercase tracking-tight">Estado de Inventario (Tienda)</h2>
                    </div>
                </div>
            </div>
            
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {(inventory || []).map(item => (
                    <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group relative">
                        <button 
                            onClick={() => onAdjust(item)} 
                            className="absolute top-3 right-3 text-slate-300 hover:text-[#1A365D] transition-colors"
                        >
                            <Search size={12}/>
                        </button>
                        <div className="w-6 h-1 rounded-full mb-3" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#CCC' }} />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 truncate pr-4">{item.category}</h4>
                        <p className="text-xl font-black text-[#1A365D] tracking-tighter">{Number(item.total_weight).toFixed(2)}<span className="text-[10px] ml-0.5 opacity-50">gr</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoldsmithInventoryPanel;
