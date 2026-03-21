import React, { useState } from 'react';
import { 
    Plus, 
    Trash2, 
    FileText 
} from 'lucide-react';

const CriterionManager = ({ criteria, onSave, onDelete }) => {
    const [editMode, setEditMode] = useState(null); // id of item being edited
    const [formData, setFormData] = useState({ category: 'Actitud', title: '', description: '', order_index: 0 });

    const handleEdit = (c) => {
        setEditMode(c.id);
        setFormData({ ...c });
    };

    const reset = () => {
        setEditMode(null);
        setFormData({ category: 'Actitud', title: '', description: '', order_index: 0 });
    };

    const safeCriteria = Array.isArray(criteria) ? criteria : [];

    return (
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            <div className={`p-6 rounded-3xl border transition-all ${editMode ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    {editMode ? 'Editar Apartado' : 'Añadir Nueva Sección'}
                </h4>
                <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="relative">
                            <input 
                                list="categories-list"
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})} 
                                placeholder="Sección..."
                                className="w-full bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none" 
                            />
                            <datalist id="categories-list">
                                {Array.from(new Set([...safeCriteria.map(c => c.category), 'Actitud', 'Productividad', 'Compromiso', 'Formación'])).map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Título del criterio" className="col-span-2 bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none" />
                        <div className="flex gap-2">
                             <input type="number" value={formData.order_index} onChange={e => setFormData({...formData, order_index: parseInt(e.target.value) || 0})} className="w-16 bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none" title="Índice de orden" />
                             <button onClick={() => { if(formData.title) { onSave(formData); reset(); } }} className={`${editMode ? 'bg-amber-500' : 'bg-indigo-500'} text-white font-black text-[10px] rounded-xl hover:opacity-80 transition-all uppercase flex-1 shadow-md`}>
                                {editMode ? 'Guardar' : 'Añadir'}
                            </button>
                        </div>
                    </div>
                    {editMode && (
                        <button onClick={reset} className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-500">Cancelar edición</button>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {Array.from(new Set([...safeCriteria.map(c => c.category), 'Actitud', 'Productividad', 'Compromiso', 'Formación'])).sort().map(cat => {
                    const filtered = safeCriteria.filter(c => c.category === cat);
                    if (filtered.length === 0 && !['Actitud', 'Productividad', 'Compromiso', 'Formación'].includes(cat)) return null;
                    return (
                        <div key={cat} className="space-y-3">
                            <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter ml-2">{cat}</h5>
                            {filtered.sort((a,b) => (a.order_index || 0) - (b.order_index || 0)).map(c => (
                                <div key={c.id} className={`p-4 rounded-2xl border flex justify-between items-center group transition-all ${editMode === c.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] shadow-sm">
                                            {c.order_index || 0}
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-[#1A365D] tracking-tight uppercase">{c.title}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(c)} className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                                            <FileText size={14}/>
                                        </button>
                                        <button onClick={() => onDelete(c.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <p className="ml-2 text-[9px] text-slate-300 font-bold uppercase italic">Sin criterios en esta sección</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CriterionManager;
