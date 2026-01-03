import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const ManualEntryModal = ({
    onClose,
    onSave,
    employees,
    selectedDate,
    isDayClosed
}) => {
    // Local state for form inputs
    const [entry, setEntry] = useState({
        empId: '',
        hours: '',
        minutes: '',
        standardGroups: '',
        jewelryGroups: '',
        recoverableGroups: ''
    });

    const handleSave = () => {
        // Basic validation
        if (!entry.empId) return alert('Selecciona un empleado');

        const totalSeconds = (parseInt(entry.hours || 0) * 3600) + (parseInt(entry.minutes || 0) * 60);
        const hasGroups = entry.standardGroups || entry.jewelryGroups || entry.recoverableGroups;

        if (totalSeconds === 0 && !hasGroups) return alert('Introduce tiempo o grupos');

        // Pass data to parent
        onSave(entry);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Plus size={20} className="text-emerald-500" />
                    Añadir Registro
                </h3>
                <p className="text-slate-400 text-xs mb-6">
                    Para el día <span className="text-white font-mono font-bold">{selectedDate}</span>
                    {isDayClosed && <span className="text-amber-500 block mt-1 font-bold">¡DÍA CERRADO! Se modificará el archivo.</span>}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Empleado</label>
                        <select
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                            value={entry.empId}
                            onChange={e => setEntry({ ...entry, empId: e.target.value })}
                        >
                            <option value="">Selecciona...</option>
                            {employees.filter(e => e.isBuyer).map(e => (
                                <option key={e.id} value={e.id}>{e.alias || e.firstName} {e.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Horas</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                placeholder="0"
                                value={entry.hours}
                                onChange={e => setEntry({ ...entry, hours: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Minutos</label>
                            <input
                                type="number"
                                min="0" max="59"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                placeholder="0"
                                value={entry.minutes}
                                onChange={e => setEntry({ ...entry, minutes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 mt-2">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-3">Grupos (Añadir a exist.)</label>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-blue-300">G. General</span>
                                <input
                                    type="number" min="0" placeholder="0"
                                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-right outline-none focus:border-blue-500"
                                    value={entry.standardGroups}
                                    onChange={e => setEntry({ ...entry, standardGroups: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-purple-300">Joyería</span>
                                <input
                                    type="number" min="0" placeholder="0"
                                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-right outline-none focus:border-purple-500"
                                    value={entry.jewelryGroups}
                                    onChange={e => setEntry({ ...entry, jewelryGroups: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-amber-300">V. Recuperable</span>
                                <input
                                    type="number" min="0" placeholder="0"
                                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-right outline-none focus:border-amber-500"
                                    value={entry.recoverableGroups}
                                    onChange={e => setEntry({ ...entry, recoverableGroups: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Guardar Registro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualEntryModal;
