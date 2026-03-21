import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const BatteryCheckForm = ({ item, onConfirm, onCancel }) => {
    const [name, setName] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(item.id, !item.is_done, name); }} className="space-y-8">
            <div className="bg-slate-50 p-8 rounded-[40px] text-center border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-3">Estás marcando como realizada:</p>
                <h4 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter leading-tight bg-white p-6 rounded-3xl shadow-sm border border-[#E2E8F0]">{item.description}</h4>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase block text-center tracking-[0.3em]">¿Quién firma esta tarea?</label>
                <input 
                    type="text" 
                    required 
                    autoFocus
                    placeholder="Escribe tu nombre..."
                    className="w-full bg-white border-2 border-slate-100 focus:border-green-500 rounded-3xl p-6 text-center font-black text-[#1A365D] text-2xl outline-none transition-all shadow-xl shadow-slate-100" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-4 pt-4">
                <button type="submit" className="w-full py-6 bg-green-500 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-green-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 size={18}/> CONFIRMAR FINALIZACIÓN
                </button>
                <button type="button" onClick={onCancel} className="w-full py-2 text-slate-300 font-black text-[9px] uppercase tracking-[0.2em] hover:text-slate-400 transition-colors">
                    ME HE EQUIVOCADO, CANCELAR
                </button>
            </div>
        </form>
    );
};

export default BatteryCheckForm;
