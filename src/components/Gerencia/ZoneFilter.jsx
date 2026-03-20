import React from 'react';
import { Layers, X } from 'lucide-react';

const ZoneFilter = ({ zones, activeZoneId, onSelect, onManage }) => {
    return (
        <div className="flex flex-wrap items-center gap-3 animate-in slide-in-from-left duration-500">
            <button 
                onClick={() => onSelect(null)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${!activeZoneId ? 'bg-[#1A365D] text-white shadow-xl shadow-blue-500/20 scale-105' : 'bg-white/50 text-[#A0AEC0] border border-white hover:bg-white hover:text-[#1A365D]'}`}
            >
                <Layers size={14} /> TODAS LAS ZONAS
            </button>

            {zones.map(zone => (
                <button 
                    key={zone.id}
                    onClick={() => onSelect(zone.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeZoneId === zone.id ? 'bg-[#FF8C9D] text-white shadow-xl shadow-coral-100 scale-105' : 'bg-white/50 text-[#A0AEC0] border border-white hover:bg-white hover:text-coral-500'}`}
                >
                    {zone.name}
                </button>
            ))}

            <button 
                onClick={onManage}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-dashed border-slate-200 hover:border-blue-300 hover:text-blue-500 transition-all font-black text-[10px] uppercase"
                title="Configurar Zonas"
            >
                + GESTIONAR
            </button>
        </div>
    );
};

export default ZoneFilter;
