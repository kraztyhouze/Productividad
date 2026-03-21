import React, { useState } from 'react';
import { format } from 'date-fns';

const OrderClosureModal = ({ order, onConfirm, onCancel }) => {
    const [weight, setWeight] = useState('');
    const [cost, setCost] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(order.id, { real_weight: weight, total_cost: cost, receive_date: date }); }} className="space-y-6">
            <div className="text-center p-6 bg-blue-50 rounded-3xl mb-4">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Pedido en curso</p>
                <h4 className="text-lg font-black text-[#1A365D] uppercase">{order.partner_name} | {order.category}</h4>
                <p className="text-xs font-bold text-blue-300 mt-1">Estimado: {order.est_weight}g</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Peso Real Recibido (gr)</label>
                    <input type="number" step="0.01" required autoFocus className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-xl text-center" value={weight} onChange={e => setWeight(e.target.value)}/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Importe Final (€)</label>
                    <input type="number" step="0.01" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-black text-xl text-center text-green-600" value={cost} onChange={e => setCost(e.target.value)}/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Fecha de Recepción</label>
                    <input type="date" required className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold" value={date} onChange={e => setDate(e.target.value)}/>
                </div>
            </div>

            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-5 bg-green-500 text-white rounded-3xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">CONFIRMAR RECEPCIÓN</button>
            </div>
        </form>
    );
};

export default OrderClosureModal;
