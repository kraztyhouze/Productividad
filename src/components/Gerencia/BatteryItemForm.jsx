import React, { useState } from 'react';

const BatteryItemForm = ({ batteryId, onSave, onCancel }) => {
    const [description, setDescription] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ battery_id: batteryId, description }); }} className="space-y-6">
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Descripción de la Tarea Extra</label>
                <input 
                    type="text" required autoFocus
                    placeholder="Ej: Pintar estantería entrada..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-[#1A365D]" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                />
            </div>
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-900/10">AÑADIR A LA LISTA</button>
            </div>
        </form>
    );
};

export default BatteryItemForm;
