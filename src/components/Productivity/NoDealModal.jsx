import React, { useState } from 'react';
import { X, Save, Gem, Package } from 'lucide-react';

const NoDealModal = ({
    onClose,
    onSave,
    employeeId,
    reasonRaw
}) => {
    // Type Selection
    const [type, setType] = useState('jewelry'); // 'jewelry' or 'other'

    // Common fields
    const [notes, setNotes] = useState('');

    // Jewelry-specific fields
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [priceAsked, setPriceAsked] = useState('');
    const [priceOffered, setPriceOffered] = useState('');
    const [grams, setGrams] = useState('');
    const [pricePerGram, setPricePerGram] = useState('');

    // Other-specific fields
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [priceAskedOther, setPriceAskedOther] = useState('');
    const [priceOfferedOther, setPriceOfferedOther] = useState('');
    const [priceSale, setPriceSale] = useState('');

    const handleSubmit = () => {
        // Validation for jewelry type
        if (type === 'jewelry') {
            if (!customerName.trim() || !customerPhone.trim()) {
                alert('Para joyería, el nombre y teléfono del cliente son obligatorios.');
                return;
            }
        }

        const baseData = {
            type,
            notes
        };

        if (type === 'jewelry') {
            onSave({
                ...baseData,
                customer_name: customerName,
                customer_phone: customerPhone,
                price_asked: priceAsked,
                price_offered: priceOffered,
                grams,
                price_per_gram: pricePerGram,
                brand: '',
                model: '',
                price_sale: ''
            });
        } else {
            onSave({
                ...baseData,
                brand,
                model,
                price_asked: priceAskedOther,
                price_offered: priceOfferedOther,
                price_sale: priceSale,
                customer_name: '',
                customer_phone: '',
                grams: '',
                price_per_gram: ''
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-red-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-red-400 mb-1">Detalles "No Trato"</h3>
                {reasonRaw && <p className="text-xs text-slate-400 mb-6">Motivo Original: {reasonRaw}</p>}
                {!reasonRaw && <p className="text-xs text-slate-400 mb-6 font-medium">Por favor, rellena los detalles de la no compra.</p>}

                {/* Type Selection */}
                <div className="mb-6">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Tipo de No Compra</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setType('jewelry')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${type === 'jewelry'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                : 'bg-slate-800 border-white/10 text-slate-400 hover:border-amber-500/50'
                                }`}
                        >
                            <Gem size={24} />
                            <span className="font-bold text-sm">Joyería</span>
                        </button>
                        <button
                            onClick={() => setType('other')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${type === 'other'
                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                : 'bg-slate-800 border-white/10 text-slate-400 hover:border-blue-500/50'
                                }`}
                        >
                            <Package size={24} />
                            <span className="font-bold text-sm">Otros</span>
                        </button>
                    </div>
                </div>

                {/* Conditional Fields Based on Type */}
                {type === 'jewelry' ? (
                    <div className="space-y-3">
                        {/* Required Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-amber-500 font-bold uppercase block mb-1">
                                    Nombre Cliente *
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    placeholder="Nombre completo"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-amber-500 font-bold uppercase block mb-1">
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    placeholder="600123456"
                                    required
                                />
                            </div>
                        </div>

                        {/* Optional Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Importe Solicitado</label>
                                <input
                                    type="text"
                                    value={priceAsked}
                                    onChange={e => setPriceAsked(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    placeholder="€"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Importe Ofrecido</label>
                                <input
                                    type="text"
                                    value={priceOffered}
                                    onChange={e => setPriceOffered(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    placeholder="€"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Gramos</label>
                                <input
                                    type="text"
                                    value={grams}
                                    onChange={e => setGrams(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    placeholder="gr"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Precio €/gr</label>
                                <input
                                    type="text"
                                    value={pricePerGram}
                                    onChange={e => setPricePerGram(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    placeholder="€/gr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Motivo / Notas</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none h-20 resize-none"
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* All Optional for "Other" */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Marca</label>
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={e => setBrand(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Ej: Apple"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Modelo</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Ej: iPhone 13"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Pide Cliente</label>
                                <input
                                    type="text"
                                    value={priceAskedOther}
                                    onChange={e => setPriceAskedOther(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="€"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Oferta Empl.</label>
                                <input
                                    type="text"
                                    value={priceOfferedOther}
                                    onChange={e => setPriceOfferedOther(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="€"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">PVP Futuro</label>
                                <input
                                    type="text"
                                    value={priceSale}
                                    onChange={e => setPriceSale(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="€"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Motivo / Notas</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none h-20 resize-none"
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 hover:text-white font-bold text-sm">Omitir</button>
                    <button
                        onClick={handleSubmit}
                        className={`flex-1 py-3 ${type === 'jewelry' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-blue-500 hover:bg-blue-400'} text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors`}
                    >
                        <Save size={18} /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoDealModal;
