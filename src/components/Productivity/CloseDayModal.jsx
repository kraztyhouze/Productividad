import React, { useState, useEffect } from 'react';

const CloseDayModal = ({
    onClose,
    onConfirm,
    date,
    initialIncidentText = ''
}) => {
    const [text, setText] = useState(initialIncidentText);

    // Update text if initialIncidentText changes (e.g. if prop updates while open, unlikely but good practice)
    useEffect(() => {
        setText(initialIncidentText);
    }, [initialIncidentText]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Cerrar Día {date}</h3>
                <p className="text-slate-400 text-sm mb-4">
                    Añade observaciones o incidencias antes de archivar. Una vez cerrado, no se podrán modificar los datos.
                </p>
                <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm min-h-[100px] focus:border-blue-500 outline-none mb-4"
                    placeholder="Ej: Fulanito olvidó fichar salida..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(text)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                    >
                        Confirmar y Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloseDayModal;
