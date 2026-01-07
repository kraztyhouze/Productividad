import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const NoDealModal = ({
    onClose,
    onSave,
    employeeId,
    reasonRaw
}) => {
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [priceAsked, setPriceAsked] = useState('');
    const [priceOffered, setPriceOffered] = useState('');
    const [priceSale, setPriceSale] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        onSave({
            brand,
            model,
            price_asked: priceAsked,
            price_offered: priceOffered,
            price_sale: priceSale,
            notes
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-red-400 mb-1">Detalles "No Trato"</h3>
                <p className="text-xs text-slate-400 mb-6">Motivo: {reasonRaw}</p>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Marca</label>
                            <input
                                type="text"
                                value={brand}
                                onChange={e => setBrand(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="Ej: Apple"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Modelo</label>
                            <input
                                type="text"
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="Ej: iPhone 13"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Pideo Cliente</label>
                            <input
                                type="text"
                                value={priceAsked}
                                onChange={e => setPriceAsked(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="€"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Oferta Empl.</label>
                            <input
                                type="text"
                                value={priceOffered}
                                onChange={e => setPriceOffered(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="€"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">PVP Futuro</label>
                            <input
                                type="text"
                                value={priceSale}
                                onChange={e => setPriceSale(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="€"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Notas Adicionales</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none h-20 resize-none"
                            placeholder="Detalles..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 hover:text-white font-bold text-sm">Omitir</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                        <Save size={18} /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoDealModal;
