import React, { useState } from 'react';
import { X, Save, Gem, Package } from 'lucide-react';

const NoDealModal = ({
    onClose,
    onSave,
    employeeId,
    reasonRaw
}) =& gt; {
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

    const handleSubmit = () =& gt; {
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
        & lt;div className = "fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" & gt;
            & lt;div className = "bg-[#1e293b] border border-red-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar" & gt;
                & lt;button onClick = { onClose } className = "absolute top-4 right-4 text-slate-500 hover:text-white z-10" & gt;
                    & lt;X size = { 20} /& gt;
                & lt;/button&gt;

                & lt;h3 className = "text-xl font-bold text-red-400 mb-1" & gt;Detalles "No Trato" & lt;/h3&gt;
                & lt;p className = "text-xs text-slate-400 mb-6" & gt; Motivo: { reasonRaw }& lt;/p&gt;

    {/* Type Selection */ }
                & lt;div className = "mb-6" & gt;
                    & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-2" & gt;Tipo de No Compra & lt;/label&gt;
                    & lt;div className = "grid grid-cols-2 gap-3" & gt;
                        & lt; button
    onClick = {() =& gt; setType('jewelry')
}
className = {`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${type === 'jewelry'
        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
        : 'bg-slate-800 border-white/10 text-slate-400 hover:border-amber-500/50'
    }`}
                        & gt;
                            & lt;Gem size = { 24} /& gt;
                            & lt;span className = "font-bold text-sm" & gt; Joyería & lt;/span&gt;
                        & lt;/button&gt;
                        & lt; button
onClick = {() =& gt; setType('other')}
className = {`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${type === 'other'
        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
        : 'bg-slate-800 border-white/10 text-slate-400 hover:border-blue-500/50'
    }`}
                        & gt;
                            & lt;Package size = { 24} /& gt;
                            & lt;span className = "font-bold text-sm" & gt; Otros & lt;/span&gt;
                        & lt;/button&gt;
                    & lt;/div&gt;
                & lt;/div&gt;

{/* Conditional Fields Based on Type */ }
{
    type === 'jewelry' ? (
                    & lt;div className = "space-y-3" & gt;
    {/* Required Fields */ }
                        & lt;div className = "grid grid-cols-2 gap-3" & gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-amber-500 font-bold uppercase block mb-1" & gt;
                                    Nombre Cliente *
                                & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { customerName }
    onChange = { e =& gt; setCustomerName(e.target.value) }
    className = "w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
    placeholder = "Nombre completo"
    required
        /& gt;
                            & lt;/div&gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-amber-500 font-bold uppercase block mb-1" & gt;
    Teléfono *
                                & lt;/label&gt;
                                & lt; input
    type = "tel"
    value = { customerPhone }
    onChange = { e =& gt; setCustomerPhone(e.target.value) }
    className = "w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
    placeholder = "600123456"
    required
        /& gt;
                            & lt;/div&gt;
                        & lt;/div&gt;

    {/* Optional Fields */ }
                        & lt;div className = "grid grid-cols-2 gap-3" & gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt;Importe Solicitado & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { priceAsked }
    onChange = { e =& gt; setPriceAsked(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
    placeholder = "€"
        /& gt;
                            & lt;/div&gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt;Importe Ofrecido & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { priceOffered }
    onChange = { e =& gt; setPriceOffered(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
    placeholder = "€"
        /& gt;
                            & lt;/div&gt;
                        & lt;/div&gt;

                        & lt;div className = "grid grid-cols-2 gap-3" & gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt; Gramos & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { grams }
    onChange = { e =& gt; setGrams(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
    placeholder = "gr"
        /& gt;
                            & lt;/div&gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt; Precio €/gr&lt;/label & gt;
                                & lt; input
    type = "text"
    value = { pricePerGram }
    onChange = { e =& gt; setPricePerGram(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
    placeholder = "€/gr"
        /& gt;
                            & lt;/div&gt;
                        & lt;/div&gt;

                        & lt; div & gt;
                            & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt; Motivo / Notas & lt;/label&gt;
                            & lt; textarea
    value = { notes }
    onChange = { e =& gt; setNotes(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none h-20 resize-none"
    placeholder = "Detalles adicionales..."
        /& gt;
                        & lt;/div&gt;
                    & lt;/div&gt;
                ) : (
                    & lt;div className = "space-y-3" & gt;
    {/* All Optional for "Other" */ }
                        & lt;div className = "grid grid-cols-2 gap-3" & gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt; Marca & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { brand }
    onChange = { e =& gt; setBrand(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
    placeholder = "Ej: Apple"
        /& gt;
                            & lt;/div&gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt; Modelo & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { model }
    onChange = { e =& gt; setModel(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
    placeholder = "Ej: iPhone 13"
        /& gt;
                            & lt;/div&gt;
                        & lt;/div&gt;

                        & lt;div className = "grid grid-cols-3 gap-3" & gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt;Pide Cliente & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { priceAskedOther }
    onChange = { e =& gt; setPriceAskedOther(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
    placeholder = "€"
        /& gt;
                            & lt;/div&gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt;Oferta Empl.& lt;/label&gt;
                                & lt; input
    type = "text"
    value = { priceOfferedOther }
    onChange = { e =& gt; setPriceOfferedOther(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
    placeholder = "€"
        /& gt;
                            & lt;/div&gt;
                            & lt; div & gt;
                                & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt;PVP Futuro & lt;/label&gt;
                                & lt; input
    type = "text"
    value = { priceSale }
    onChange = { e =& gt; setPriceSale(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
    placeholder = "€"
        /& gt;
                            & lt;/div&gt;
                        & lt;/div&gt;

                        & lt; div & gt;
                            & lt;label className = "text-[10px] text-slate-500 font-bold uppercase block mb-1" & gt; Motivo / Notas & lt;/label&gt;
                            & lt; textarea
    value = { notes }
    onChange = { e =& gt; setNotes(e.target.value) }
    className = "w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none h-20 resize-none"
    placeholder = "Detalles adicionales..."
        /& gt;
                        & lt;/div&gt;
                    & lt;/div&gt;
                )
}

                & lt;div className = "mt-6 flex gap-3" & gt;
                    & lt;button onClick = { onClose } className = "flex-1 py-3 text-slate-500 hover:text-white font-bold text-sm" & gt; Omitir & lt;/button&gt;
                    & lt; button
onClick = { handleSubmit }
className = {`flex-1 py-3 ${type === 'jewelry' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-blue-500 hover:bg-blue-400'} text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors`}
                    & gt;
                        & lt;Save size = { 18} /& gt; Guardar
    & lt;/button&gt;
                & lt;/div&gt;
            & lt;/div&gt;
        & lt;/div&gt;
    );
};

export default NoDealModal;
