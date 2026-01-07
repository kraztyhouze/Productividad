import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

const EditTimeModal = ({
    record,
    onClose,
    onSave,
}) => {
    // Break down seconds into H:M:S for inputs
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (record) {
            const h = Math.floor(record.durationSeconds / 3600);
            const m = Math.floor((record.durationSeconds % 3600) / 60);
            const s = Math.floor(record.durationSeconds % 60);
            setHours(h);
            setMinutes(m);
            setSeconds(s);
        }
    }, [record]);

    const handleSave = () => {
        const totalSeconds = (parseInt(hours || 0) * 3600) + (parseInt(minutes || 0) * 60) + parseInt(seconds || 0);
        onSave(totalSeconds);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Clock className="text-pink-500" size={20} />
                    Editar Tiempo
                </h3>

                <div className="flex gap-4 mb-8 justify-center">
                    <div className="flex flex-col gap-1 items-center">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Horas</label>
                        <input
                            type="number"
                            min="0"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="w-16 h-14 bg-slate-900 border border-white/10 rounded-xl text-center text-2xl font-mono text-white focus:border-pink-500 outline-none"
                        />
                    </div>
                    <span className="text-2xl font-mono text-slate-600 mt-6">:</span>
                    <div className="flex flex-col gap-1 items-center">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Minutos</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            className="w-16 h-14 bg-slate-900 border border-white/10 rounded-xl text-center text-2xl font-mono text-white focus:border-pink-500 outline-none"
                        />
                    </div>
                    <span className="text-2xl font-mono text-slate-600 mt-6">:</span>
                    <div className="flex flex-col gap-1 items-center">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Segundos</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={seconds}
                            onChange={(e) => setSeconds(e.target.value)}
                            className="w-16 h-14 bg-slate-900 border border-white/10 rounded-xl text-center text-2xl font-mono text-white focus:border-pink-500 outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition-all"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default EditTimeModal;
