import React, { useState } from 'react';
import { Layers, Plus, Trash2, Send } from 'lucide-react';

const ZoneManagerForm = ({ zones, employees, onSave, onDelete, onCancel }) => {
    const [data, setData] = useState({
        id: null,
        name: '',
        color: '#1A365D',
        description: '',
        responsible_id: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.name || !data.responsible_id) return alert('Por favor, rellena todos los campos.');
        onSave(data);
        handleReset();
    };

    const handleReset = () => {
        setData({ id: null, name: '', color: '#1A365D', description: '', responsible_id: '' });
        setIsEditing(false);
    };

    const handleEdit = (z) => {
        setData(z);
        setIsEditing(true);
    };

    const safeZones = Array.isArray(zones) ? zones : [];
    const safeEmployees = Array.isArray(employees) ? employees : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Zones List */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Zonas Existentes</h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {safeZones.map(z => (
                            <div key={z.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: z.color || '#1A365D' }} />
                                    <div>
                                        <h5 className="font-black text-[#1A365D] uppercase text-xs tracking-tighter">{z.name}</h5>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{z.responsible_name || 'Desconocido'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleEdit(z)} className="bg-slate-50 text-slate-400 p-2.5 rounded-xl hover:text-blue-500 hover:bg-blue-50 transition-all">
                                        <Plus size={16} />
                                    </button>
                                    <button onClick={() => onDelete(z.id)} className="bg-slate-50 text-slate-400 p-2.5 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {safeZones.length === 0 && <p className="text-center text-slate-300 text-xs italic py-20">No hay zonas definidas.</p>}
                    </div>
                </div>

                {/* Form Section */}
                <div className="bg-slate-50/50 p-8 rounded-[48px] border border-slate-100/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-8">{isEditing ? 'Configurar Zona' : 'Añadir Nueva Zona'}</h4>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Nombre de la Zona</label>
                            <input 
                                type="text"
                                className="w-full bg-white border-none rounded-2xl p-4 font-black text-[#1A365D]"
                                placeholder="Ej: MOSTRADOR, TALLER 1..."
                                value={data.name}
                                onChange={e => setData({ ...data, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Color Identificativo</label>
                                <input 
                                    type="color"
                                    className="w-full h-[52px] bg-white border-none rounded-2xl p-2 cursor-pointer"
                                    value={data.color}
                                    onChange={e => setData({ ...data, color: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Responsable Principal</label>
                                <select 
                                    className="w-full bg-white border-none rounded-2xl p-4 font-black text-[#1A365D]"
                                    value={data.responsible_id}
                                    onChange={e => setData({ ...data, responsible_id: e.target.value })}
                                >
                                    <option value="">Asignar...</option>
                                    {safeEmployees.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Descripción Breve</label>
                            <textarea 
                                className="w-full bg-white border-none rounded-2xl p-5 font-bold text-slate-600 resize-none h-32"
                                placeholder="..."
                                value={data.description}
                                onChange={e => setData({ ...data, description: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            {isEditing && (
                                <button 
                                    type="button"
                                    onClick={handleReset}
                                    className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-sm"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button 
                                type="submit"
                                className="flex-[2] py-5 bg-[#1A365D] text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Layers size={16} /> {isEditing ? 'ACTUALIZAR ZONA' : 'REGISTRAR ZONA'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ZoneManagerForm;
