import React, { useState, useMemo } from 'react';
import { 
    Package, 
    Euro, 
    Lock,
    BarChart3
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CATEGORY_COLORS, GOLDSMITH_CATEGORIES } from '../../constants/gerenciaConstants';
import { downloadJewelryPDF } from '../../utils/reportUtils';
import { FileText } from 'lucide-react';

const JewelryReport = ({ movements, partners, inventory }) => {
    const [filterPartner, setFilterPartner] = useState('all');
    
    const safeMovements = Array.isArray(movements) ? movements : [];
    const safePartners = Array.isArray(partners) ? partners : [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];

    const filteredMovements = useMemo(() => {
        return safeMovements.filter(m => 
            filterPartner === 'all' || m.partner_id.toString() === filterPartner
        ).sort((a,b) => b.date.localeCompare(a.date));
    }, [safeMovements, filterPartner]);

    const groupedByMonth = useMemo(() => {
        const groups = {};
        filteredMovements.forEach(m => {
            const monthKey = format(parseISO(m.date), 'MMMM yyyy', { locale: es });
            if (!groups[monthKey]) groups[monthKey] = { movements: [], stats: { weight: 0, cost: 0, received: 0, benefit: 0 } };
            groups[monthKey].movements.push(m);
            
            if (m.type === 'Envío') {
                groups[monthKey].stats.weight += Number(m.weight || 0);
            } else if (m.type === 'Fundición' && m.status === 'Completado') {
                const cost = Number(m.acquisition_cost || 0);
                const received = Number(m.received_amount || 0);
                groups[monthKey].stats.cost += cost;
                groups[monthKey].stats.received += received;
                groups[monthKey].stats.benefit += (received - cost);
            }
        });
        return groups;
    }, [filteredMovements]);

    const totalStats = useMemo(() => {
        const res = { totalWeight: 0, totalCost: 0, receivedVal: 0, benefit: 0 };
        filteredMovements.forEach(m => {
            if (m.type === 'Envío' || m.type === 'Fundición') {
                res.totalWeight += Number(m.weight || 0);
            }
            if (m.type === 'Fundición' && m.status === 'Completado') {
                const cost = Number(m.acquisition_cost || 0);
                const received = Number(m.received_amount || 0);
                res.totalCost += cost;
                res.receivedVal += received;
                res.benefit += (received - cost);
            }
        });
        return res;
    }, [filteredMovements]);

    const stockSummary = useMemo(() => {
        const summary = {};
        GOLDSMITH_CATEGORIES.forEach(cat => {
            summary[cat] = { in: 0, out: 0, current: 0, value: 0 };
        });

        safeInventory.forEach(item => {
            if (summary[item.category]) {
                summary[item.category].current = Number(item.total_weight || 0);
                summary[item.category].value = Number(item.total_cost || 0);
            }
        });

        safeMovements.forEach(m => {
            if (!m.inventory_category || !summary[m.inventory_category]) return;
            const w = Number(m.weight || 0);
            if (m.type === 'Recepción' || m.type === 'Ajuste+') {
                summary[m.inventory_category].in += w;
            } else if (m.type === 'Envío' || m.type === 'Fundición' || m.type === 'Ajuste-') {
                summary[m.inventory_category].out += w;
            }
        });

        return summary;
    }, [safeInventory, safeMovements]);

    const partnerStats = useMemo(() => {
        if (filterPartner === 'all') return null;
        const p = safePartners.find(p => p.id.toString() === filterPartner);
        if (!p) return null;

        const pMoves = safeMovements.filter(m => m.partner_id.toString() === filterPartner);
        const sent = pMoves.filter(m => m.type === 'Envío').reduce((a, b) => a + Number(b.weight), 0);
        const received = pMoves.filter(m => m.type === 'Recepción').reduce((a, b) => a + Number(b.weight), 0);

        return { ...p, sent, received };
    }, [filterPartner, safePartners, safeMovements]);

    return (
        <div className="space-y-8 animate-in zoom-in duration-300">
            <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Informe Operativa Joyería</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análisis de rentabilidad y movimientos</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-300 uppercase mb-1">Joyero Seleccionado</span>
                        <div className="flex gap-2">
                            <select 
                                className="bg-[#F4F7FA] border-none rounded-2xl p-3 pr-10 font-black text-[10px] uppercase text-[#1A365D]"
                                value={filterPartner}
                                onChange={(e) => setFilterPartner(e.target.value)}
                            >
                                <option value="all">Todos los Socios</option>
                                {safePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button 
                                onClick={() => downloadJewelryPDF(filteredMovements)}
                                className="p-3 bg-[#1A365D] text-white rounded-2xl hover:bg-[#2D4B7A] transition-all shadow-lg shadow-blue-100"
                                title="Exportar PDF"
                            >
                                <FileText size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#1A365D] p-6 rounded-[32px] shadow-xl text-white">
                    <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest block mb-2">Peso Total Enviado</span>
                    <p className="text-3xl font-black tracking-tighter">{totalStats.totalWeight.toFixed(2)}<span className="text-xs ml-1 opacity-50">gr</span></p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-2">Coste Invertido</span>
                    <p className="text-3xl font-black text-[#1A365D] tracking-tighter">{totalStats.totalCost.toFixed(2)}€</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-2">Beneficio Neto</span>
                    <p className="text-3xl font-black text-green-500 tracking-tighter">+{totalStats.benefit.toFixed(2)}€</p>
                </div>
                <div className="bg-green-50 p-6 rounded-[32px] border border-green-100 shadow-sm">
                    <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest block mb-2">Rentabilidad (%)</span>
                    <p className="text-3xl font-black text-green-600 tracking-tighter">
                        {totalStats.totalCost > 0 ? ((totalStats.benefit / totalStats.totalCost) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#F4F7FA] bg-slate-50/50 flex justify-between items-center">
                    <h4 className="text-xs font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                        Estado de Inventario (Real vs Flujos) <Package size={16} className="text-[#FF8C9D]"/>
                    </h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left uppercase text-[9px] font-bold">
                        <thead className="bg-white text-slate-400 border-b">
                            <tr>
                                <th className="p-6">Categoría</th>
                                <th className="p-6 text-right">Peso Inicial*</th>
                                <th className="p-6 text-right text-green-500">Entradas (+)</th>
                                <th className="p-6 text-right text-[#FF8C9D]">Salidas (-)</th>
                                <th className="p-6 text-right text-[#1A365D]">Stock Actual</th>
                                <th className="p-6 text-right">Valorización (€)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {GOLDSMITH_CATEGORIES.map(cat => {
                                const s = stockSummary[cat];
                                const initial = s.current - s.in + s.out;
                                return ( initial > 0 || s.current > 0 || s.in > 0 || s.out > 0) && (
                                    <tr key={cat} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                                                <span className="font-black text-[#1A365D]">{cat}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right text-slate-300">{initial.toFixed(2)}g</td>
                                        <td className="p-6 text-right text-green-600 font-black">+{s.in.toFixed(2)}g</td>
                                        <td className="p-6 text-right text-coral-400 font-black">-{s.out.toFixed(2)}g</td>
                                        <td className="p-6 text-right font-black text-[#1A365D] bg-slate-50/50">{s.current.toFixed(2)}g</td>
                                        <td className="p-6 text-right font-black text-[#1A365D]">{Number(s.value).toFixed(2)}€</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {partnerStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-[#1A365D] text-white rounded-[32px] flex items-center justify-center font-black text-2xl uppercase shadow-xl shadow-blue-900/20">
                                {partnerStats.name.substring(0, 2)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#1A365D] tracking-tighter uppercase">{partnerStats.name}</h3>
                                <p className="text-[10px] font-black text-[#FF8C9D] uppercase tracking-widest mt-1">Ficha Individual de Socio</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-6 rounded-3xl">
                                <span className="text-[8px] font-black text-slate-300 uppercase block mb-1">Gramos Enviados</span>
                                <p className="text-xl font-black text-[#1A365D]">{partnerStats.sent.toFixed(2)}g</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl">
                                <span className="text-[8px] font-black text-slate-300 uppercase block mb-1">Gramos Recibidos</span>
                                <p className="text-xl font-black text-[#1A365D]">{partnerStats.received.toFixed(2)}g</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-[#FF8C9D] p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="relative z-10">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] block mb-2">Estado de Deuda Actual</span>
                            <h4 className="text-5xl font-black tracking-tighter">{Number(partnerStats.debt_grams).toFixed(2)}<span className="text-lg ml-1 opacity-70">gr</span></h4>
                            <p className="text-xs font-bold mt-4 uppercase tracking-widest opacity-80 flex items-center gap-2">
                                <Lock size={14}/> Referencia Base: Oro {partnerStats.debt_type}
                            </p>
                        </div>
                        <BarChart3 className="absolute -bottom-8 -right-8 text-white/10 w-48 h-48 rotate-12" />
                    </div>
                </div>
            )}

            {Object.keys(groupedByMonth).map(month => (
                <div key={month} className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-[#F4F7FA] bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h4 className="text-sm font-black text-[#1A365D] uppercase tracking-widest">{month}</h4>
                            <div className="flex gap-2">
                                <span className="text-[8px] font-black bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-400 uppercase">Beneficio mes: {groupedByMonth[month].stats.benefit.toFixed(2)}€</span>
                                <span className="text-[8px] font-black bg-green-500 text-white px-2 py-1 rounded-lg uppercase">
                                    {groupedByMonth[month].stats.cost > 0 ? ((groupedByMonth[month].stats.benefit / groupedByMonth[month].stats.cost) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left uppercase text-[9px] font-bold min-w-[600px]">
                            <thead className="text-[#A0AEC0] border-b">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Socio</th>
                                    <th className="p-4">Peso</th>
                                    <th className="p-4">Costo Adq.</th>
                                    <th className="p-4">Valor Final</th>
                                    <th className="p-4">Beneficio</th>
                                    <th className="p-4 text-right">Margen %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {groupedByMonth[month].movements.map(m => {
                                    const cost = Number(m.acquisition_cost || 0);
                                    const received = Number(m.received_amount || 0);
                                    const benefit = received - cost;
                                    const marginPercent = cost > 0 ? (benefit / cost) * 100 : 0;
                                    
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-black">{format(parseISO(m.date), 'dd/MM/yy')}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black ${m.type === 'Envío' ? 'bg-blue-50 text-blue-500' : m.type === 'Recepción' ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}>
                                                    {m.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600">{m.partner_name}</td>
                                            <td className="p-4 font-mono font-black">{m.weight}g</td>
                                            <td className="p-4 font-mono text-slate-400">{cost > 0 ? `${cost.toFixed(2)}€` : '-'}</td>
                                            <td className="p-4 font-mono font-black text-[#1A365D]">{received > 0 ? `${received.toFixed(2)}€` : '-'}</td>
                                            <td className={`p-4 font-mono font-black ${benefit > 0 ? 'text-green-500' : 'text-slate-300'}`}>
                                                {m.type === 'Fundición' && m.status === 'Completado' ? `+${benefit.toFixed(2)}€` : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {m.type === 'Fundición' && m.status === 'Completado' ? (
                                                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black ${marginPercent > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {marginPercent.toFixed(1)}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default JewelryReport;
