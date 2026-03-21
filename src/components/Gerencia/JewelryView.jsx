import React, { useState, useMemo } from 'react';
import { 
    Users, 
    PlusCircle, 
    Edit3, 
    Trash2, 
    TrendingUp, 
    BarChart3, 
    ShieldAlert, 
    Euro, 
    Package,
    Lock,
    ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORY_COLORS, GOLDSMITH_CATEGORIES } from '../../constants/gerenciaConstants';
import GoldsmithInventoryPanel from './GoldsmithInventoryPanel';
import GoldsmithOrdersPanel from './GoldsmithOrdersPanel';
import AccountStatusWidget from './AccountStatusWidget';
import OrderReminder from './OrderReminder';

const JewelryView = ({ 
    partners, 
    inventory, 
    orders, 
    movements, 
    onAdjustInventory, 
    onAddMovement, 
    onDeleteMovement, 
    onRefine, 
    onAddOrder, 
    onReceiveOrder, 
    onAddPartner, 
    onEditPartner, 
    onDeletePartner,
    activeZoneId 
}) => {
    const [viewMode, setViewMode] = useState('ops'); // or 'report'
    
    const safePartners = Array.isArray(partners) ? partners : [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeMovements = Array.isArray(movements) ? movements : [];

    const transitWeight = safeOrders.filter(o => o.status === 'Pedido Lanzado').reduce((acc, o) => acc + Number(o.est_weight || 0), 0);
    const inOpsWeight = safeMovements.filter(m => m.status === 'Pendiente').reduce((acc, m) => acc + Number(m.weight || 0), 0);
    
    const lastSmelting = safeMovements.find(m => m.type === 'Fundición' && m.status === 'Completado');
    const smeltingHistory = safeMovements.filter(m => m.type === 'Fundición' && m.status === 'Completado').slice(0, 5);

    const donutData = safeInventory.map(item => ({
        name: item.category,
        value: Number(item.total_weight)
    })).filter(d => d.value > 0);

    const formatPrice = (v) => Number(v || 0).toFixed(2);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Dashboard Header Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1A365D] p-8 rounded-[40px] text-white flex gap-6 items-center shadow-2xl">
                    <div className="flex-1">
                        <h4 className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Stock por Agrupación</h4>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%" cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#FFF'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', color: '#1A365D', fontWeight: 900, fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="w-1/3 space-y-2">
                        {donutData.slice(0, 4).map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name] }} />
                                <span className="text-[8px] font-black uppercase text-blue-100 truncate">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Oro en Tránsito <TrendingUp size={14} className="text-blue-500" />
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-300 uppercase">Pedidos Lanzados</span>
                            <span className="text-xl font-black text-[#1A365D]">{transitWeight.toFixed(2)} gr</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-300 uppercase">En Fundiciones</span>
                            <span className="text-xl font-black text-blue-500">{inOpsWeight.toFixed(2)} gr</span>
                        </div>
                        <div className="pt-4 border-t border-dashed border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-[#1A365D] uppercase">Total Flotante</span>
                            <span className="text-sm font-black text-[#FF8C9D]">{(transitWeight + inOpsWeight).toFixed(2)} gr</span>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 p-8 rounded-[40px] border border-green-100 shadow-sm flex flex-col justify-center">
                    <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Margen Real (Últ. Fundición) <BarChart3 size={14} className="text-green-500" />
                    </h4>
                    {lastSmelting ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black text-green-600/50 uppercase">Coste Adquisición</span>
                                <span className="text-xs font-black text-green-900">{formatPrice(lastSmelting.acquisition_cost)}€</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black text-green-600/50 uppercase">Importe Recibido</span>
                                <span className="text-xs font-black text-green-900">{formatPrice(lastSmelting.received_amount)}€</span>
                            </div>
                            <div className="pt-4 border-t border-dashed border-green-200 flex justify-between items-center">
                                <span className="text-[10px] font-black text-green-700 uppercase">Beneficio Neto</span>
                                <span className="text-xl font-black text-green-600">+{formatPrice(lastSmelting.received_amount - lastSmelting.acquisition_cost)}€</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs font-bold text-green-400 italic">No hay fundiciones cerradas aún.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-2 rounded-[32px] border border-[#E2E8F0] w-fit mx-auto lg:mx-0">
                <button onClick={() => setViewMode('ops')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${viewMode === 'ops' ? 'bg-[#1A365D] text-white shadow-lg' : 'text-[#A0AEC0] hover:text-[#1A365D]'}`}>Operativa</button>
                <button onClick={() => setViewMode('report')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${viewMode === 'report' ? 'bg-[#1A365D] text-white shadow-lg' : 'text-[#A0AEC0] hover:text-[#1A365D]'}`}>Reporte Detallado</button>
            </div>

            {viewMode === 'ops' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <GoldsmithInventoryPanel inventory={safeInventory} onAdjust={onAdjustInventory} />
                        
                        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden">
                            <div className="p-8 pb-4 flex justify-between items-center">
                                <h2 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Registro de Movimientos</h2>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => onAddMovement('Recepción')} className="bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-amber-100 transition-all">Recibir Oro</button>
                                    <button onClick={() => onAddMovement('Envío')} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-100 transition-all">Enviar Joyero</button>
                                    <button onClick={() => onAddMovement('Fundición')} className="bg-[#FF8C9D] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-coral-100 hover:scale-[1.02] active:scale-95 transition-all">Fundición</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left uppercase text-[10px] font-bold min-w-[700px]">
                                    <thead className="bg-[#F4F7FA] font-black text-[#A0AEC0] tracking-widest border-b">
                                        <tr>
                                            <th className="p-5 pl-10">Fecha</th>
                                            <th className="p-5">Tipo</th>
                                            <th className="p-5">Agrupación</th>
                                            <th className="p-5">Socio</th>
                                            <th className="p-5">Peso</th>
                                            <th className="p-5">Estado</th>
                                            <th className="p-5 text-right pr-10">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {safeMovements.slice(0, 15).map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-5 pl-10 font-bold text-[#1A365D]">{format(parseISO(m.date), 'dd/MM/yyyy')}</td>
                                                <td className="p-5">
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${m.type === 'Envío' ? 'bg-blue-100 text-blue-600' : m.type === 'Recepción' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                        {m.type}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[m.inventory_category] || '#CCC' }} />
                                                        <span className="text-[10px] font-black text-slate-500">{m.inventory_category || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 font-black text-slate-600">{m.partner_name}</td>
                                                <td className="p-5 font-mono text-[#1A365D] font-black">{m.weight} gr</td>
                                                <td className="p-5">
                                                    <span className={`text-[9px] font-black ${m.status?.includes('Pendiente') ? 'text-coral-400 animate-pulse' : 'text-green-500'}`}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right pr-10">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {m.status?.includes('Pendiente') && (
                                                            <button onClick={() => onRefine(m)} className="bg-[#1A365D] text-white text-[9px] font-black px-4 py-2 rounded-xl hover:scale-105 transition-all">REFINAR</button>
                                                        )}
                                                        <button 
                                                            onClick={() => onDeleteMovement(m.id)}
                                                            className="text-slate-300 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex flex-col gap-4">
                            <button onClick={() => onAddOrder()} className="w-full bg-[#1A365D] text-white py-5 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                                <PlusCircle size={20}/> LANZAR NUEVO PEDIDO
                            </button>
                            <GoldsmithOrdersPanel orders={safeOrders} onReceive={onReceiveOrder} />
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-widest flex items-center gap-2">
                                    Mis Joyeros <Users size={16} className="text-[#FF8C9D]"/>
                                </h3>
                                <button onClick={onAddPartner} className="text-[9px] font-black text-[#FF8C9D] bg-coral-50 px-3 py-1.5 rounded-lg hover:bg-coral-100 transition-all uppercase">Añadir</button>
                            </div>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {safePartners.map(p => (
                                    <div key={p.id} className="p-5 bg-[#F8F9FB] rounded-[32px] border border-slate-100 group transition-all hover:bg-white hover:shadow-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[10px] font-black text-[#1A365D] uppercase tracking-tighter">{p.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 mt-0.5">{p.phone || 'Sin tlf'}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => onEditPartner(p)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit3 size={12}/></button>
                                                <button onClick={() => onDeletePartner(p.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-slate-200">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Deuda en {p.debt_type}</span>
                                            <span className={`text-[12px] font-black ${Number(p.debt_grams) > 0 ? 'text-[#FF8C9D]' : 'text-green-500'}`}>{Number(p.debt_grams).toFixed(2)}g</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#F8F9FB] p-8 rounded-[40px] border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest mb-4">Historial de Afinaje</h4>
                            <div className="space-y-3">
                                {smeltingHistory.length === 0 ? (
                                    <p className="text-[9px] text-slate-400 italic">No hay historial de fundiciones.</p>
                                ) : (
                                    smeltingHistory.map(m => (
                                        <div key={m.id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-50">
                                            <div>
                                                <p className="text-[9px] font-black text-[#1A365D]">{format(parseISO(m.date), 'dd/MM/yy')}</p>
                                                <p className="text-[8px] font-bold text-slate-400">{m.weight}g Enviados</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-green-500">{(m.refining_percentage || 0)}%</p>
                                                <p className="text-[8px] font-bold text-slate-400">Afinado</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <JewelryReport movements={safeMovements} partners={safePartners} inventory={safeInventory} />
            )}

            <div className="pt-10 border-t border-slate-100 mt-20">
                <AccountStatusWidget partners={safePartners} />
                
                {safeOrders.filter(o => o.status !== 'Recibido').length > 0 && (
                    <div className="space-y-6 mt-10">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                            <ShieldAlert className="text-rose-500" size={16}/> Recordatorios de Pedidos Críticos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {safeOrders.filter(o => o.status !== 'Recibido').map(order => (
                                <OrderReminder 
                                    key={order.id} 
                                    order={order} 
                                    onClick={() => onReceiveOrder(order)} 
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const JewelryReport = ({ movements, partners, inventory }) => {
    const [filterPartner, setFilterPartner] = useState('all');
    
    const filteredMovements = useMemo(() => {
        return movements.filter(m => 
            filterPartner === 'all' || m.partner_id.toString() === filterPartner
        ).sort((a,b) => b.date.localeCompare(a.date));
    }, [movements, filterPartner]);

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

        (inventory || []).forEach(item => {
            if (summary[item.category]) {
                summary[item.category].current = Number(item.total_weight || 0);
                summary[item.category].value = Number(item.total_cost || 0);
            }
        });

        movements.forEach(m => {
            if (!m.inventory_category || !summary[m.inventory_category]) return;
            const w = Number(m.weight || 0);
            if (m.type === 'Recepción' || m.type === 'Ajuste+') {
                summary[m.inventory_category].in += w;
            } else if (m.type === 'Envío' || m.type === 'Fundición' || m.type === 'Ajuste-') {
                summary[m.inventory_category].out += w;
            }
        });

        return summary;
    }, [inventory, movements]);

    const partnerStats = useMemo(() => {
        if (filterPartner === 'all') return null;
        const p = partners.find(p => p.id.toString() === filterPartner);
        if (!p) return null;

        const pMoves = movements.filter(m => m.partner_id.toString() === filterPartner);
        const sent = pMoves.filter(m => m.type === 'Envío').reduce((a, b) => a + Number(b.weight), 0);
        const received = pMoves.filter(m => m.type === 'Recepción').reduce((a, b) => a + Number(b.weight), 0);

        return { ...p, sent, received };
    }, [filterPartner, partners, movements]);

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
                        <select 
                            className="bg-[#F4F7FA] border-none rounded-2xl p-3 pr-10 font-black text-[10px] uppercase text-[#1A365D]"
                            value={filterPartner}
                            onChange={(e) => setFilterPartner(e.target.value)}
                        >
                            <option value="all">Todos los Socios</option>
                            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
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
                        <Euro className="absolute -bottom-8 -right-8 text-white/10 w-48 h-48 rotate-12" />
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

export default JewelryView;
