import React, { useState, useEffect } from 'react';

const CloseDayModal = ({
    onClose,
    onConfirm,
    date,
    initialIncidentText = '',
    maxConcurrent = 0,
    isClosed = false,
    onReopen
}) => {
    const [text, setText] = useState(initialIncidentText);

    // Update text if initialIncidentText changes
    useEffect(() => {
        setText(initialIncidentText);
    }, [initialIncidentText]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-all">
            <div className="bg-[#1e293b]/90 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-2">
                    {isClosed ? `Detalles del Cierre (${date})` : `Cerrar Día ${date}`}
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                    {isClosed
                        ? "Este día ya está cerrado. Puedes ver los detalles o reabrirlo si es necesario corregir algo."
                        : "Añade observaciones o incidencias antes de archivar. Una vez cerrado, se guardará el registro."}
                </p>

                {/* Stat Display */}
                <div className="bg-slate-900/50 rounded-xl p-4 mb-4 border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Máx. Empleados Simultáneos</span>
                    <span className="text-2xl font-mono font-bold text-pink-500">{maxConcurrent}</span>
                </div>

                <div className="mb-2 text-xs font-bold text-slate-500 uppercase">Observaciones:</div>
                <textarea
                    className="w-full bg-[#0f172a]/50 border border-white/10 rounded-xl p-3 text-slate-200 text-sm min-h-[100px] focus:border-pink-500 outline-none mb-4 transition-colors"
                    placeholder="Ej: Fulanito olvidó fichar salida..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    disabled={isClosed}
                />

                <div className="flex gap-3 justify-end items-center">
                    {isClosed && (
                        <button
                            onClick={onReopen}
                            className="mr-auto px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all text-xs"
                        >
                            ⚠ REABRIR DÍA
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                    >
                        {isClosed ? 'Cerrar Ventana' : 'Cancelar'}
                    </button>

                    {!isClosed && (
                        <button
                            onClick={() => onConfirm(text)}
                            className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 transition-all"
                        >
                            Confirmar y Cerrar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CloseDayModal;
