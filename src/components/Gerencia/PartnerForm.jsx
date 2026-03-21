import React, { useState } from 'react';
import { 
    UserPlus, 
    Weight, 
    Calculator 
} from 'lucide-react';

const PartnerForm = ({ partner, onSave, onCancel }) => {
    const [name, setName] = useState(partner?.name || '');
    const [phone, setPhone] = useState(partner?.phone || '');
    const [email, setEmail] = useState(partner?.email || '');
    const [debtType, setDebtType] = useState(partner?.debt_type || '18k');
    const [debtFormula, setDebtFormula] = useState(partner?.debt_formula || 'x');
    const [debtGrams, setDebtGrams] = useState(partner?.debt_grams || '');
    const [info, setInfo] = useState(partner?.info || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            id: partner?.id, 
            name, 
            phone, 
            email, 
            debt_type: debtType, 
            debt_formula: debtFormula, 
            debt_grams: Number(debtGrams), 
            info 
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex bg-[#1A365D] p-6 rounded-[32px] text-white items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center"><UserPlus size={32}/></div>
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Ficha de Socio / Joyero</h3>
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mt-1">Configuración comercial y de liquidación</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nombre Comercial / Profesional</label><input type="text" required className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-xl text-[#1A365D]" value={name} onChange={e => setName(e.target.value)}/></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Teléfono de Contacto</label><input type="text" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold" value={phone} onChange={e => setPhone(e.target.value)}/></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Email Corporativo</label><input type="email" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold" value={email} onChange={e => setEmail(e.target.value)}/></div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 space-y-6">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-4"><Calculator size={14}/> Algoritmo de Liquidación y Ledger</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-amber-600 uppercase block mb-2">Referencia de Metal</label><select className="w-full bg-white border-none rounded-xl p-4 font-bold text-amber-900" value={debtType} onChange={e => setDebtType(e.target.value)}><option>24k</option><option>18k</option><option>14k</option><option>9k</option></select></div>
                    <div><label className="text-[10px] font-black text-amber-600 uppercase block mb-2">Fórmula de Conversión</label><input type="text" className="w-full bg-white border-none rounded-xl p-4 font-mono font-black text-amber-900" value={debtFormula} onChange={e => setDebtFormula(e.target.value)} placeholder="x * 0.75"/><p className="text-[7px] text-amber-400 mt-1 uppercase">* use 'x' para representar los gramos reales enviados.</p></div>
                </div>
                <div className="pt-4 border-t border-amber-200">
                    <label className="text-[10px] font-black text-amber-600 uppercase block tracking-widest pl-1">Deuda Actual Ledger (Gramos)</label>
                    <div className="relative">
                        <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-300" size={18} />
                        <input 
                            type="number" step="0.01"
                            className="w-full bg-white border-2 border-transparent focus:border-amber-400 rounded-2xl p-4 pl-12 font-black text-xl text-amber-700 shadow-sm transition-all" 
                            placeholder="0.00" 
                            value={debtGrams} 
                            onChange={e => setDebtGrams(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Notas / Información Adicional</label>
                <textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold resize-none" rows={3} value={info} onChange={e => setInfo(e.target.value)}/>
            </div>

            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A365D] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-101 transition-all">GUARDAR SOCIO</button>
            </div>
        </form>
    );
};

export default PartnerForm;
