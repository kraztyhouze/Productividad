import React, { useState, useEffect } from 'react';
import { 
    Calculator, 
    Calendar as CalendarIcon, 
    Save, 
    Lock, 
    ShieldCheck, 
    AlertCircle, 
    Info 
} from 'lucide-react';
import { format } from 'date-fns';
import { BILLS, COINS } from '../../constants/gerenciaConstants';

const CashView = ({ history, onSave, employees, user, cumulativeCashDiff }) => {
    const safeHistory = Array.isArray(history) ? history : [];
    const safeEmployees = Array.isArray(employees) ? employees : [];
    const [localDate, setLocalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    // Auth roles for counting - Filtered by canCountCash permission
    const countingStaff = safeEmployees.filter(e => e.canCountCash);

    const [data, setData] = useState({
        expected_total: 0,
        real_total: 0,
        observations: '',
        responsible_1: '',
        responsible_2: '',
        is_closed: false,
        details: { bills: {}, coins: {}, others: 0 }
    });

    const [counts, setCounts] = useState({
        bills: BILLS.reduce((acc, b) => ({ ...acc, [b]: '' }), {}),
        coins: COINS.reduce((acc, c) => ({ ...acc, [c]: '' }), {}),
        others: ''
    });

    useEffect(() => {
        const total = Object.entries(counts.bills).reduce((acc, [val, qty]) => acc + (Number(val) * Number(qty || 0)), 0) +
                      Object.entries(counts.coins).reduce((acc, [val, qty]) => acc + (Number(val) * Number(qty || 0)), 0) +
                      Number(counts.others || 0);
        setData(prev => ({ ...prev, real_total: total, details: counts }));
    }, [counts]);

    useEffect(() => {
        const log = safeHistory.find(l => l.date === localDate);
        if (log) {
            setData({
                expected_total: log.expected_total || 0,
                real_total: log.total || 0,
                observations: log.observations || '',
                responsible_1: log.responsible_1 || '',
                responsible_2: log.responsible_2 || '',
                is_closed: !!log.is_closed,
                details: log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : { bills: {}, coins: {}, others: 0 }
            });
            if (log.metadata) {
                const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                setCounts({
                    bills: meta.bills || BILLS.reduce((acc, b) => ({ ...acc, [b]: '' }), {}),
                    coins: meta.coins || COINS.reduce((acc, c) => ({ ...acc, [c]: '' }), {}),
                    others: meta.others || ''
                });
            }
        } else {
            setData({
                expected_total: 0,
                real_total: 0,
                observations: '',
                responsible_1: user.username || '',
                responsible_2: '',
                is_closed: false,
                details: { bills: {}, coins: {}, others: 0 }
            });
            setCounts({
                bills: BILLS.reduce((acc, b) => ({ ...acc, [b]: '' }), {}),
                coins: COINS.reduce((acc, c) => ({ ...acc, [c]: '' }), {}),
                others: ''
            });
        }
    }, [localDate, safeHistory, user]);

    const diff = Number(data.real_total || 0) - Number(data.expected_total || 0);

    const handleSave = (isClosing) => {
        if (!data.responsible_1) return alert('Debes seleccionar al menos un responsable.');
        onSave({
            ...data,
            date: localDate,
            total: data.real_total,
            is_closed: isClosing,
            closed_at: isClosing ? format(new Date(), "yyyy-MM-dd'T'HH:mm:ss") : null,
            closed_by: user.username,
            metadata: JSON.stringify(data.details)
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="bg-white p-10 rounded-[40px] border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4 w-full md:w-auto">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase">Conteo de Caja</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registro diario de arqueos y cierre</p>
                    </div>
                    <input 
                        type="date" 
                        className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-black text-[#1A365D]" 
                        value={localDate} 
                        onChange={e => setLocalDate(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
                    <div className="bg-[#1A365D] p-8 rounded-[40px] shadow-2xl text-white flex flex-col justify-center min-w-[280px]">
                        <span className="text-[10px] font-black text-blue-300 uppercase block mb-2 tracking-widest flex items-center gap-2">
                             BALANCE ACUMULADO <Info size={12}/>
                        </span>
                        <div className="flex items-end gap-3">
                            <h4 className={`text-4xl font-black tracking-tighter ${cumulativeCashDiff > 0 ? 'text-green-400' : cumulativeCashDiff < 0 ? 'text-red-400' : 'text-white'}`}>
                                {cumulativeCashDiff > 0 ? '+' : ''}{cumulativeCashDiff.toFixed(2)}
                                <span className="text-xl ml-1 opacity-50">€</span>
                            </h4>
                        </div>
                        <p className="text-[9px] font-bold text-blue-400/60 uppercase mt-4 tracking-tighter leading-none italic">Suma de todos los descuadres registrados en el histórico del sistema</p>
                    </div>

                    <div className={`p-8 rounded-[40px] shadow-xl flex flex-col justify-center min-w-[240px] border-2 ${diff === 0 ? 'bg-green-50 border-green-200 text-green-600' : 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse'}`}>
                        <span className="text-[10px] font-black uppercase block mb-1 tracking-widest">DESCUADRE HOY</span>
                        <h4 className="text-4xl font-black tracking-tighter">
                            {diff > 0 ? '+' : ''}{diff.toFixed(2)}€
                        </h4>
                        <p className="text-[9px] font-black uppercase mt-1 opacity-60">{diff === 0 ? 'Caja Cuadrada' : 'Error de Conteo'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* 1. Conteo Desglosado (8 Cols) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Billetes Section */}
                    <div className="bg-white p-10 rounded-[48px] border border-[#E2E8F0] shadow-sm">
                        <h4 className="text-xs font-black text-[#1A365D] uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                            <span className="w-10 h-1 rounded-full bg-blue-500"/>
                             Billetes en Efectivo
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {BILLS.map(b => (
                                <div key={b} className="group">
                                    <label className="text-[10px] font-black text-slate-300 uppercase text-center block mb-2">{b}€</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-blue-400 rounded-2xl p-5 text-center font-black text-[#1A365D] transition-all group-hover:scale-105"
                                        placeholder="0"
                                        value={counts.bills[b]}
                                        onChange={e => setCounts({ ...counts, bills: { ...counts.bills, [b]: e.target.value } })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monedas Section */}
                    <div className="bg-white p-10 rounded-[48px] border border-[#E2E8F0] shadow-sm">
                        <h4 className="text-xs font-black text-[#1A365D] uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                            <span className="w-10 h-1 rounded-full bg-amber-400"/>
                             Fraccionado y Monedas
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {COINS.map(c => (
                                <div key={c} className="group">
                                    <label className="text-[10px] font-black text-slate-300 uppercase text-center block mb-2">{c}€</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-amber-400 rounded-xl p-4 text-center font-black text-[#1A365D] text-xs transition-all group-hover:scale-105"
                                        placeholder="0"
                                        value={counts.coins[c]}
                                        onChange={e => setCounts({ ...counts, coins: { ...counts.coins, [c]: e.target.value } })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Others Section */}
                    <div className="bg-[#1A365D] p-10 rounded-[48px] shadow-xl text-white flex flex-col md:flex-row items-center gap-10">
                        <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center shrink-0">
                            <Calculator size={32} className="text-blue-300"/>
                        </div>
                        <div className="flex-1 space-y-4">
                            <h4 className="text-[11px] font-[900] text-blue-300 uppercase tracking-[0.3em]">Otros Importes y Varios</h4>
                            <p className="text-[12px] opacity-60 leading-relaxed font-black uppercase tracking-tight">Introduce el total acumulado en otros soportes o tickets pendientes de cuadrar.</p>
                        </div>
                        <div className="w-full md:w-60">
                             <input 
                                type="number" step="0.01" 
                                className="w-full bg-white/10 border-2 border-white/20 focus:border-white rounded-3xl p-6 text-center font-black text-3xl text-white transition-all outline-none"
                                placeholder="0.00"
                                value={counts.others}
                                onChange={e => setCounts({ ...counts, others: e.target.value })}
                             />
                        </div>
                    </div>
                </div>

                {/* 2. Resumen y Firma (4 Cols) */}
                <div className="lg:col-span-4 space-y-8 sticky top-24">
                     <div className="bg-white p-10 rounded-[48px] border border-[#E2E8F0] shadow-sm space-y-10">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b-2 border-slate-50 pb-6">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Teórico</span>
                                <input 
                                    type="number" step="0.01"
                                    className="text-2xl font-black text-[#1A365D] bg-slate-50 rounded-xl px-4 py-2 border-none w-40 text-right focus:bg-blue-50 transition-colors"
                                    value={data.expected_total}
                                    onChange={e => setData({ ...data, expected_total: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Real</span>
                                <span className="text-4xl font-black text-[#1A365D] tracking-tighter tabular-nums">{data.real_total.toFixed(2)}€</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Responsable del Arqueo</label>
                                <select 
                                    className="w-full bg-[#F4F7FA] border-none rounded-2xl p-4 font-black text-[#1A365D]"
                                    value={data.responsible_1}
                                    onChange={e => setData({ ...data, responsible_1: e.target.value })}
                                >
                                    <option value="">Seleccionar Persona...</option>
                                    {countingStaff.map(e => (
                                        <option key={e.id} value={e.nombre || `${e.firstName} ${e.lastName}`}>
                                            {e.nombre || `${e.firstName} ${e.lastName}`}
                                        </option>
                                    ))}
                                </select>
                             </div>

                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Observaciones Auditoría</label>
                                <textarea 
                                    className="w-full bg-[#F4F7FA] border-none rounded-2xl p-5 font-bold text-slate-600 resize-none h-32"
                                    placeholder="Detalles sobre billetes rotos, diferencias de cambio, etc..."
                                    value={data.observations}
                                    onChange={e => setData({ ...data, observations: e.target.value })}
                                />
                             </div>
                        </div>

                        <div className="pt-6 space-y-4">
                            <button 
                                onClick={() => handleSave(false)}
                                className="w-full bg-white border-2 border-slate-100 text-[#1A365D] py-5 rounded-[28px] font-black text-[12px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                            >
                                <Save size={18}/> Guardar Borrador
                            </button>
                            <button 
                                onClick={() => handleSave(true)}
                                className="w-full bg-green-500 text-white py-6 rounded-[28px] font-black text-[12px] uppercase tracking-widest shadow-xl shadow-green-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <ShieldCheck size={20}/> Ejecutar Cierre Diario
                            </button>
                        </div>
                     </div>

                     <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex items-start gap-4">
                        <AlertCircle className="text-amber-500 shrink-0" size={24}/>
                        <div>
                            <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Aviso de Seguridad</h5>
                            <p className="text-[10px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-tighter">
                                Los cierres generados son inalterables tras 24h. Asegúrese de que el conteo físico coincide con el reportado antes de firmar.
                            </p>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default CashView;
