import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const OrderReminder = ({ order, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-start gap-4"
        >
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShoppingCart size={20}/>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Pedido Pendiente</p>
                <h5 className="font-black text-[#1A365D] uppercase truncate tracking-tight">{order.partner_name}</h5>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Esperado: {order.order_date ? format(parseISO(order.order_date), 'dd/MM') : '??'} | {order.est_weight}g</p>
            </div>
        </div>
    );
};

export default OrderReminder;
