import React, { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { Trash2 } from 'lucide-react';

const BatteryForm = ({ initialData, zones, onSave, onCancel }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [startDate, setStartDate] = useState(initialData?.start_date || format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(initialData?.end_date || format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [zoneId, setZoneId] = useState(initialData?.zone_id || '');
    
    // Support for editing items in existing batteries
    const [items, setItems] = useState(initialData?.items?.map(i => i.description) || ['', '', '']);

    const handleItemChange = (idx, val) => {
        const ni = [...items];
        ni[idx] = val;
        setItems(ni);
    };

    const addItem = () => setItems([...items, '']);
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

    const safeZones = Array.isArray(zones) ? zones : [];

    return (
        <form onSubmit={async (e) => { 
            e.preventDefault(); 
            if (!zoneId) return alert('Debes seleccionar una zona para esta batería.');
            const filteredItems = items.filter(i => i.trim() !== '');
            if (filteredItems.length === 0) return alert('Debes añadir al menos una tarea.');
            
            onSave({ 
                id: initialData?.id,
                title, 
                start_date: startDate, 
                end_date: endDate, 
                zone_id: zoneId,
                items: filteredItems 
            });
        }} className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">Nombre de la Batería</label>
                    <input type="text" required placeholder="Ej: Mantenimiento Mensual Mar-Abr" className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-[#1A365D] shadow-inner" value={title} onChange={e => setTitle(e.target.value)}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">Fecha Inicio</label>
                        <input type="date" required className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-[#1A365D] shadow-inner" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">Fecha Fin</label>
                        <input type="date" required className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-[#1A365D] shadow-inner" value={endDate} onChange={e => setEndDate(e.target.value)}/>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-1 tracking-widest">
                        Zona Responsable (Categoría) <span className="text-red-500">* Requerido</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {safeZones.map(z => (
                            <button 
                                key={z.id}
                                type="button"
                                onClick={() => setZoneId(z.id)}
                                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border
                                    ${zoneId == z.id ? 'bg-[#1A365D] text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}
                                `}
                            >
                                {z.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Lista de Tareas ({items.filter(i => i.trim()).length})</label>
                        <button type="button" onClick={addItem} className="text-[9px] font-black text-[#FF8C9D] bg-coral-50 hover:bg-coral-100 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">+ AÑADIR TAREA</button>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 group">
                                <div className="bg-slate-50 flex-1 flex items-center rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1A365D]/10 transition-all">
                                    <span className="pl-5 text-[10px] font-black text-slate-300">{idx + 1}.</span>
                                    <input 
                                        type="text" 
                                        placeholder={`Tarea a realizar...`}
                                        className="w-full bg-transparent border-none p-5 font-bold text-xs outline-none" 
                                        value={item} 
                                        onChange={e => handleItemChange(idx, e.target.value)}
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-400 p-2 transition-colors"><Trash2 size={18}/></button>
                                )}
                            </div>
                        ))}
                    </div>
                    {initialData && (
                        <p className="text-[8px] text-slate-400 italic text-center uppercase">Aviso: Al editar una batería existente, las tareas marcadas como hechas se mantendrán si su descripción coincide exactamente.</p>
                    )}
                </div>
            </div>
            <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={onCancel} className="flex-1 py-5 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-5 bg-[#1A365D] text-white rounded-[32px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all">
                    {initialData ? 'ACTUALIZAR BATERÍA Y TAREAS' : 'CREAR BATERÍA'}
                </button>
            </div>
        </form>
    );
};

export default BatteryForm;
