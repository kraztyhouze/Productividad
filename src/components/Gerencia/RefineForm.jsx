import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

const RefineForm = ({ movement, onSave, onCancel }) => {
    const [ref, setRef] = useState(movement.refining_percentage || '');
    const [rec, setRec] = useState(movement.received_amount || '');
    const [cost, setCost] = useState(movement.acquisition_cost || '');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(movement.id, ref, rec, cost); }} className="space-y-6">
            <div className="text-center mb-6">
                <div className="p-4 bg-coral-50 text-[#FF8C9D] rounded-full w-fit mx-auto mb-2"><TrendingUp/></div>
                <p className="text-xs font-black text-slate-400">{movement.partner_name} | {movement.weight}g</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Afinaje Resultante (%)</label>
                    <input type="number" step="0.1" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black" value={ref} onChange={e => setRef(e.target.value)}/>
                </div>
                
                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Coste de Adquisición Total (€)</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black text-blue-600" value={cost} onChange={e => setCost(e.target.value)}/>
                    <p className="text-[8px] text-slate-300 mt-1 italic uppercase text-center">Puedes modificarlo si varió desde el envío</p>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Importe Final Recibido (€)</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 rounded-2xl p-4 text-center font-black text-green-600" value={rec} onChange={e => setRec(e.target.value)}/>
                </div>
            </div>

            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-[#FF8C9D] text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-102 transition-all">
                    FINALIZAR Y ARCHIVAR
                </button>
            </div>
        </form>
    );
};

export default RefineForm;
