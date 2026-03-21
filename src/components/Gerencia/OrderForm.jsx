import React, { useState } from 'react';
import { format } from 'date-fns';
import { GOLDSMITH_CATEGORIES } from '../../constants/gerenciaConstants';

const OrderForm = ({ partners, onSave, onCancel }) => {
    const [data, setData] = useState({
        partner_id: '',
        category: '18k',
        est_weight: '',
        description: '',
        reference: '',
        order_date: format(new Date(), 'yyyy-MM-dd')
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Joyero / Proveedor</label>
                    <select required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.partner_id} onChange={e => setData({...data, partner_id: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Descripción del Pedido</label>
                    <input type="text" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.description} onChange={e => setData({...data, description: e.target.value})} placeholder="Ej: Pedido Sortijas 18k"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Categoría del Producto</label>
                        <select className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.category} onChange={e => setData({...data, category: e.target.value})}>
                            {GOLDSMITH_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Referencia de Pedido</label>
                        <input type="text" className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.reference} onChange={e => setData({...data, reference: e.target.value})} placeholder="Opcional"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Gramos Estimados</label>
                        <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black" value={data.est_weight} onChange={e => setData({...data, est_weight: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Fecha Estimada</label>
                        <input type="date" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={data.order_date} onChange={e => setData({...data, order_date: e.target.value})}/>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-5 bg-[#1A365D] text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">LANZAR PEDIDO</button>
            </div>
        </form>
    );
};

export default OrderForm;
