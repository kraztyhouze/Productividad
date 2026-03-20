import React from 'react';
import { Pocket, ShieldAlert, ArrowRight } from 'lucide-react';
import { getElapsedDays } from '../../utils/dateUtils';

const OrderReminder = ({ order, onClick }) => {
    const days = getElapsedDays(order.order_date);
    const isCritical = days > 5;

    return (
        <div 
            onClick={() => onClick(order)}
            className={`cursor-pointer group relative overflow-hidden p-6 rounded-[32px] border-2 transition-all hover:scale-[1.02] active:scale-95 ${isCritical ? 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-900/10' : 'bg-white border-slate-100 border-dashed'}`}
        >
            <div className="flex items-center gap-6 relative z-10 text-xs">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-rose-100 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                    <Pocket size={28} />
                </div>
                <div className="flex-1 space-y-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isCritical ? 'text-rose-500' : 'text-amber-600'}`}>
                        {isCritical ? 'CRITICAL: Pedido Demorado' : 'Recordatorio Pedido'}
                    </p>
                    <h5 className="text-sm font-black text-[#1A365D] uppercase tracking-tighter">
                        Enviado a {order.partner_name} hace <span className="text-[#FF8C9D]">{days} días</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                        Clic para marcar llegada <ArrowRight size={14} />
                    </p>
                </div>
            </div>
            {isCritical && <div className="absolute top-0 right-0 p-4"><ShieldAlert size={20} className="text-rose-500 animate-pulse" /></div>}
        </div>
    );
};

export default OrderReminder;
