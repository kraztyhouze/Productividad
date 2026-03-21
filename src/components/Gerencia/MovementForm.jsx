import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
    Trash2, 
    Plus, 
    CheckCircle2, 
    X 
} from 'lucide-react';
import { GOLDSMITH_CATEGORIES } from '../../constants/gerenciaConstants';
import { compressImage } from '../../utils/imageUtils';

const MovementForm = ({ type: movType, partners, onSave, onCancel }) => {
    const safePartners = Array.isArray(partners) ? partners : [];
    const [lines, setLines] = useState([{ karat: '18k', type: 'Oro', weight: '', cost_gr: '' }]);
    const [data, setData] = useState({ 
        partner_id: '', 
        date: format(new Date(), 'yyyy-MM-dd'), 
        debt_added: 0, 
        is_debt_adjustment: false, 
        total_cost: 0,
        debt_impact_override: '', 
        notes: '',
        image_url: '',
        inventory_category: ''
    });
    
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const compressed = await compressImage(file);
            setData({ ...data, image_url: compressed });
        } catch (error) {
            console.error("Error compressing image:", error);
        } finally {
            setUploading(false);
        }
    };
    
    const partner = safePartners.find(p => p.id.toString() === data.partner_id.toString());
    const totalW = lines.reduce((a, l) => a + Number(l.weight || 0), 0);
    
    const calculateImpact = (val) => {
        if (!partner || !partner.debt_formula || !val) return val;
        try {
            const f = partner.debt_formula.toLowerCase().replace(/x/g, val.toString());
            // eslint-disable-next-line no-eval
            return eval(f);
        } catch (e) { return val; }
    };

    const debtImpact = data.debt_impact_override ? Number(data.debt_impact_override) : calculateImpact(totalW);
    const totalC = movType === 'Fundición' ? Number(data.total_cost || 0) : lines.reduce((a, l) => a + (Number(l.weight || 0) * Number(l.cost_gr || 0)), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...data, 
            type: movType, 
            weight: totalW, 
            cost: totalC, 
            karats_data: lines, 
            status: movType === 'Fundición' ? 'Pendiente' : 'Completado', 
            debt_added: movType === 'Recepción' ? debtImpact : 0, 
            weight: movType === 'Envío' && data.is_debt_adjustment ? debtImpact : totalW 
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Joyero / Socio</label><select required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.partner_id} onChange={e => setData({...data, partner_id: e.target.value})}><option value="">Socio...</option>{safePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Fecha</label><input type="date" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.date} onChange={e => setData({...data, date: e.target.value})}/></div>
            </div>

            {(movType === 'Envío' || movType === 'Fundición' || movType === 'Recepción') && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">
                        {movType === 'Recepción' ? 'Clasificar Entrada en Inventario' : 'Seleccionar Origen del Oro (Inventario)'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {GOLDSMITH_CATEGORIES.map(cat => (
                            <button 
                                key={cat}
                                type="button"
                                onClick={() => setData({...data, inventory_category: cat})}
                                className={`p-3 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center justify-between border-2 ${data.inventory_category === cat ? 'bg-[#1A365D] text-white border-[#1A365D]' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                            >
                                <span>{cat}</span>
                                {data.inventory_category === cat && <CheckCircle2 size={12}/>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase">Detalle Pesos</h4><button type="button" onClick={() => setLines([...lines, { karat: '18k', type: 'Oro', weight: '', cost_gr: '' }])} className="text-[#FF8C9D] font-black text-[10px]">+ AÑADIR FILA</button></div>
                {lines.map((l, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <select className="bg-white rounded-lg p-2 text-[10px] font-black uppercase" value={l.type} onChange={e => { const nl = [...lines]; nl[i].type = e.target.value; setLines(nl); }}><option>Oro</option><option>Plata</option></select>
                        <select className="bg-white rounded-lg p-2 text-[10px] font-black" value={l.karat} onChange={e => { const nl = [...lines]; nl[i].karat = e.target.value; setLines(nl); }}>
                            {l.type === 'Oro' ? (<><option>24k</option><option>18k</option><option>14k</option><option>9k</option></>) : (<><option>999</option><option>925</option></>)}
                        </select>
                        <input type="number" step="0.01" required className="flex-1 bg-white rounded-lg p-2 text-xs font-bold" placeholder="Gramos" value={l.weight} onChange={e => { const nl = [...lines]; nl[i].weight = e.target.value; setLines(nl); }}/>
                        {lines.length > 1 && <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="text-red-300 px-2"><Trash2 size={14}/></button>}
                    </div>
                ))}
            </div>

            {movType === 'Fundición' && (
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-400 uppercase block mb-2">Coste de Adquisición / Envío (€) <span className="text-[8px] opacity-60">(Opcional si se introduce al refinar)</span></label>
                    <input type="number" step="0.01" className="w-full bg-white border-2 border-transparent focus:border-blue-300 rounded-xl p-4 font-black text-blue-900" placeholder="Ej: 4500.00" value={data.total_cost} onChange={e => setData({...data, total_cost: e.target.value})}/>
                </div>
            )}

            <div className="pt-2 flex justify-between font-black text-[10px] uppercase px-2 text-slate-400">
                <span>Total Peso Real: {totalW.toFixed(2)}g</span>
            </div>

            {movType === 'Recepción' && (
                <div className="bg-amber-50 p-6 rounded-3xl space-y-4 border border-amber-100">
                    <div className="flex justify-between items-center text-amber-600 font-black text-[10px] uppercase">
                        <span>Impacto en Deuda (Auto-calculado)</span>
                        <span>Fórmula: {partner?.debt_formula || 'Sin fórmula'}</span>
                    </div>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-[9px] font-black text-amber-400 uppercase block mb-1">Gramos a añadir al Ledger</label>
                            <input type="number" step="0.01" className="w-full bg-white border-none rounded-xl p-3 font-black text-amber-900" placeholder={debtImpact.toFixed(2)} value={data.debt_impact_override} onChange={e => setData({...data, debt_impact_override: e.target.value})}/>
                        </div>
                        <div className="bg-white px-4 py-3 rounded-xl border border-amber-200 text-xs font-black text-amber-600">
                             Result: {debtImpact.toFixed(2)} gr ({partner?.debt_type || '18k'})
                        </div>
                    </div>
                </div>
            )}

            {movType === 'Envío' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase px-2"><input type="checkbox" className="w-4 h-4" checked={data.is_debt_adjustment} onChange={e => setData({...data, is_debt_adjustment: e.target.checked})}/> Descontar del Ledger del Socio</div>
                    {data.is_debt_adjustment && (
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex gap-4 items-end animate-in slide-in-from-top-2 duration-300">
                             <div className="flex-1">
                                <label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Gramos a descontar</label>
                                <input type="number" step="0.01" className="w-full bg-white border-none rounded-xl p-3 font-black text-blue-900" placeholder={debtImpact.toFixed(2)} value={data.debt_impact_override} onChange={e => setData({...data, debt_impact_override: e.target.value})}/>
                             </div>
                             <div className="bg-white px-4 py-3 rounded-xl border border-blue-200 text-xs font-black text-blue-600">
                                Descuento: {debtImpact.toFixed(2)} gr
                             </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Notas del Envío / Recepción</label>
                    <textarea 
                        className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-xs resize-none" 
                        rows={3} 
                        placeholder="Observaciones adicionales, detalles específicos..."
                        value={data.notes}
                        onChange={e => setData({...data, notes: e.target.value})}
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Adjuntar Foto</label>
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 group hover:border-[#FF8C9D] transition-all">
                                <Plus size={16} className="text-slate-400 group-hover:text-[#FF8C9D]" />
                                <span className="text-[10px] font-black text-slate-400 group-hover:text-[#FF8C9D] uppercase">
                                    {uploading ? 'Comprimiendo...' : data.image_url ? 'Imagen Seleccionada' : 'Seleccionar Imagen'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {data.image_url && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative group">
                            <img src={data.image_url} alt="Envío" className="w-full h-full object-cover" />
                            <button 
                                type="button" 
                                onClick={() => setData({...data, image_url: ''})}
                                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-5 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" disabled={uploading} className="flex-1 py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all disabled:opacity-50">PROCESAR MOVIMIENTO</button>
            </div>
        </form>
    );
};

export default MovementForm;
