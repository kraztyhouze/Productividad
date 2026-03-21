import React, { useState } from 'react';
import { GOLDSMITH_CATEGORIES, CATEGORY_COLORS } from '../../constants/gerenciaConstants';

const InventoryAdjustmentModal = ({ initialCategory, onSave, onCancel }) => {
    const [mode, setMode] = useState('direct'); // 'direct' or 'transfer'
    const [data, setData] = useState({
        category: initialCategory || GOLDSMITH_CATEGORIES[0],
        targetCategory: GOLDSMITH_CATEGORIES[1],
        weight: '',
        cost: ''
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ mode, ...data }); }} className="space-y-6">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6">
                <button type="button" onClick={() => setMode('direct')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'direct' ? 'bg-white text-[#1A365D] shadow-sm' : 'text-slate-400'}`}>Ajuste Directo</button>
                <button type="button" onClick={() => setMode('transfer')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'transfer' ? 'bg-white text-[#1A365D] shadow-sm' : 'text-slate-400'}`}>Transferencia</button>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{mode === 'transfer' ? 'Desde Agrupación' : 'Seleccionar Agrupación'}</label>
                    <select className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.category} onChange={e => setData({...data, category: e.target.value})}>
                        {GOLDSMITH_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                {mode === 'transfer' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Hacia Agrupación</label>
                        <select className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.targetCategory} onChange={e => setData({...data, targetCategory: e.target.value})}>
                            {GOLDSMITH_CATEGORIES.filter(c => c !== data.category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{mode === 'transfer' ? 'Peso a Mover (g)' : 'Peso Total (g)'}</label>
                        <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-center" value={data.weight} onChange={e => setData({...data, weight: e.target.value})}/>
                        {mode === 'direct' && <p className="text-[8px] text-slate-400 mt-1 italic">Sobreescribe el peso actual.</p>}
                    </div>
                    {mode === 'direct' && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Coste Total (€)</label>
                            <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-center text-green-600" value={data.cost} onChange={e => setData({...data, cost: e.target.value})}/>
                            <p className="text-[8px] text-slate-400 mt-1 italic">Sobreescribe el costo actual.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">
                    {mode === 'transfer' ? 'EJECUTAR TRANSFERENCIA' : 'ACTUALIZAR VALORES'}
                </button>
            </div>
        </form>
    );
};

export default InventoryAdjustmentModal;
