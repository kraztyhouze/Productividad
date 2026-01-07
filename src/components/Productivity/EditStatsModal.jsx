import React, { useState, useEffect } from 'react';
import { X, Layers, Save } from 'lucide-react';

const EditStatsModal = ({
    empId,
    date,
    currentStats,
    onClose,
    onSave
}) => {
    const [standard, setStandard] = useState(0);
    const [jewelry, setJewelry] = useState(0);
    const [recoverable, setRecoverable] = useState(0);
    const [noDeal, setNoDeal] = useState(0);

    useEffect(() => {
        if (currentStats) {
            setStandard(currentStats.standard || 0);
            setJewelry(currentStats.jewelry || 0);
            setRecoverable(currentStats.recoverable || 0);
            setNoDeal(currentStats.noDeal || 0);
        }
    }, [currentStats]);

    const handleSave = () => {
        onSave({
            standard: parseInt(standard) || 0,
            jewelry: parseInt(jewelry) || 0,
            recoverable: parseInt(recoverable) || 0,
            noDeal: parseInt(noDeal) || 0
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Layers className="text-blue-400" size={20} />
                    Modificar Grupos
                </h3>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <label className="text-sm font-bold text-slate-300">General</label>
                        <input
                            type="number"
                            min="0"
                            value={standard}
                            onChange={(e) => setStandard(e.target.value)}
                            className="w-20 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <label className="text-sm font-bold text-amber-300">Joyería</label>
                        <input
                            type="number"
                            min="0"
                            value={jewelry}
                            onChange={(e) => setJewelry(e.target.value)}
                            className="w-20 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-white focus:border-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <label className="text-sm font-bold text-blue-300">Recuperable</label>
                        <input
                            type="number"
                            min="0"
                            value={recoverable}
                            onChange={(e) => setRecoverable(e.target.value)}
                            className="w-20 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-red-500/10">
                        <label className="text-sm font-bold text-red-400">No Trato</label>
                        <input
                            type="number"
                            min="0"
                            value={noDeal}
                            onChange={(e) => setNoDeal(e.target.value)}
                            className="w-20 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-white focus:border-red-500 outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default EditStatsModal;
