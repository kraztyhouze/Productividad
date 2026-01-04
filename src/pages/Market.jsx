import React, { useState } from 'react';
import { Search, ExternalLink, ShoppingCart, Smartphone, Monitor } from 'lucide-react';

const Market = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setHasSearched(true);
        setResults([]); // Clear previous

        try {
            const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchTerm)}`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
            // Fallback empty result
            setResults([]);
        } finally {
            setLoading(false);
        }
    };
    // Survey State
    const [survey, setSurvey] = useState({
        askedPrice: '',
        newPrice: '',
        secondHandPrice: '',
        saleType: 'venta', // 'venta' or 'recuperable'
        clientType: 'nuevo', // 'nuevo' or 'habitual'
        hasStock: 'no', // 'si' or 'no'
        hasInvoice: 'no' // 'si' or 'no'
    });

    const handleSurveyChange = (e) => {
        const { name, value } = e.target;
        setSurvey(prev => ({ ...prev, [name]: value }));
    };

    const handleSurveySubmit = (e) => {
        e.preventDefault();
        // Placeholder for future logic
        alert(`Consulta Registrada:\n
        Precio Pide: ${survey.askedPrice}€
        Precio Nuevo: ${survey.newPrice}€
        Precio 2ª Mano: ${survey.secondHandPrice}€
        Tipo Venta: ${survey.saleType}
        Cliente: ${survey.clientType}
        Stock > 2: ${survey.hasStock}
        Factura: ${survey.hasInvoice}
        `);
    };

    return (
        <div className="h-full flex flex-col items-center justify-start pt-6 fade-in relative w-full overflow-hidden">

            {/* Header Compact */}
            <div className="text-center mb-6 shrink-0">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 font-['Varela_Round']">
                    Escáner de Mercado
                </h1>
            </div>

            {/* Search Bar & Results Container */}
            <div className="w-full max-w-[95%] flex flex-col gap-6">

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto relative group z-10 transition-all shrink-0">
                    <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="bg-[#1e293b]/80 backdrop-blur-xl p-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10 relative">
                        <div className="p-2 bg-slate-800/50 rounded-xl text-slate-400">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent w-full outline-none text-base placeholder-slate-600 text-white font-bold px-2"
                            placeholder="Buscar producto..."
                        />
                        <button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-pink-600/20 transition-all flex items-center gap-2 text-sm">
                            {loading ? '...' : 'Buscar'}
                        </button>
                    </div>
                </form>

                {/* Loading */}
                {loading && (
                    <div className="w-full flex justify-center py-4">
                        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Results Grid - Single Row on Wide Screens */}
                {!loading && results.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 animate-in slide-in-from-bottom-5 duration-700">
                        {results.map((item) => (
                            <div
                                key={item.id}
                                className={`bg-[#1e293b]/60 backdrop-blur-md rounded-xl p-3 flex flex-col gap-2 border border-white/5 hover:-translate-y-1 hover:shadow-lg transition-all group relative overflow-hidden`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border text-[10px] shrink-0
                                        ${item.color === 'green' ? 'bg-green-900/20 text-green-500 border-green-500/20' : ''}
                                        ${item.color === 'red' ? 'bg-red-900/20 text-red-500 border-red-500/20' : ''}
                                        ${item.color === 'teal' ? 'bg-teal-900/20 text-teal-500 border-teal-500/20' : ''}
                                        ${item.color === 'blue' ? 'bg-blue-900/20 text-blue-500 border-blue-500/20' : ''}
                                        ${item.color === 'purple' ? 'bg-purple-900/20 text-purple-500 border-purple-500/20' : ''}
                                        ${item.color === 'amber' ? 'bg-amber-900/20 text-amber-500 border-amber-500/20' : ''}
                                        ${item.color === 'slate' ? 'bg-slate-800 text-slate-300 border-slate-700' : ''}
                                    `}>
                                        {item.storeCode}
                                    </div>
                                    <div className="min-w-0 overflow-hidden">
                                        <p className="font-bold text-slate-200 truncate text-xs">{item.store}</p>
                                        <p className="text-[9px] text-slate-500 font-medium truncate">{item.condition}</p>
                                    </div>
                                </div>

                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-1.5 rounded-lg bg-slate-800/50 hover:bg-pink-600 hover:text-white text-slate-300 text-xs font-bold transition-all border border-white/5 flex items-center justify-center gap-1 group-hover:border-pink-500/50 mt-auto"
                                >
                                    Ver Web <ExternalLink size={10} />
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {/* Survey Section - Wide Layout */}
                <div className="animate-in slide-in-from-bottom-10 duration-1000 delay-200 mt-2">
                    <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 relative overflow-hidden">

                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart size={18} className="text-amber-500" />
                            <h2 className="text-lg font-bold text-white">Asistente de Tasación</h2>
                        </div>

                        <form onSubmit={handleSurveySubmit} className="flex flex-col xl:flex-row gap-4 xl:items-end">

                            {/* 1. Prices (Horizontal) */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/30 p-3 rounded-xl border border-white/5">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Pide Cliente</label>
                                    <div className="relative mt-1">
                                        <input type="number" name="askedPrice" value={survey.askedPrice} onChange={handleSurveyChange} className="w-full bg-slate-800 border border-white/10 rounded-lg py-1.5 px-2 text-white text-sm font-mono focus:border-pink-500 outline-none" placeholder="0.00" />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">PVP Nuevo</label>
                                    <div className="relative mt-1">
                                        <input type="number" name="newPrice" value={survey.newPrice} onChange={handleSurveyChange} className="w-full bg-slate-800 border border-white/10 rounded-lg py-1.5 px-2 text-white text-sm font-mono focus:border-pink-500 outline-none" placeholder="0.00" />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">2ª Mano</label>
                                    <div className="relative mt-1">
                                        <input type="number" name="secondHandPrice" value={survey.secondHandPrice} onChange={handleSurveyChange} className="w-full bg-slate-800 border border-white/10 rounded-lg py-1.5 px-2 text-white text-sm font-mono focus:border-pink-500 outline-none" placeholder="0.00" />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Context & Checks (Horizontal) */}
                            <div className="flex-[1.5] grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/30 p-3 rounded-xl border border-white/5 items-end">

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Operación</label>
                                    <select name="saleType" value={survey.saleType} onChange={handleSurveyChange} className="w-full mt-1 bg-slate-800 border border-white/10 rounded-lg py-1.5 px-2 text-slate-200 text-xs outline-none">
                                        <option value="venta">Venta</option>
                                        <option value="recuperable">Recuperable</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente</label>
                                    <select name="clientType" value={survey.clientType} onChange={handleSurveyChange} className="w-full mt-1 bg-slate-800 border border-white/10 rounded-lg py-1.5 px-2 text-slate-200 text-xs outline-none">
                                        <option value="nuevo">Nuevo</option>
                                        <option value="habitual">Habitual</option>
                                    </select>
                                </div>

                                {/* Toggle Checks */}
                                <div className="flex flex-col justify-end gap-1">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Stock {'>'} 2?</span>
                                    <div className="flex bg-slate-950 rounded-lg p-0.5 border border-white/10 w-full">
                                        <button type="button" onClick={() => setSurvey(p => ({ ...p, hasStock: 'no' }))} className={`flex-1 py-1 rounded text-[10px] font-bold ${survey.hasStock === 'no' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>NO</button>
                                        <button type="button" onClick={() => setSurvey(p => ({ ...p, hasStock: 'si' }))} className={`flex-1 py-1 rounded text-[10px] font-bold ${survey.hasStock === 'si' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>SÍ</button>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-end gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Factura?</span>
                                    <div className="flex bg-slate-950 rounded-lg p-0.5 border border-white/10 w-full">
                                        <button type="button" onClick={() => setSurvey(p => ({ ...p, hasInvoice: 'no' }))} className={`flex-1 py-1 rounded text-[10px] font-bold ${survey.hasInvoice === 'no' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>NO</button>
                                        <button type="button" onClick={() => setSurvey(p => ({ ...p, hasInvoice: 'si' }))} className={`flex-1 py-1 rounded text-[10px] font-bold ${survey.hasInvoice === 'si' ? 'bg-green-500 text-white' : 'text-slate-500'}`}>SÍ</button>
                                    </div>
                                </div>

                            </div>

                            {/* Action Button */}
                            <button
                                type="submit"
                                className="h-full min-h-[50px] px-6 bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-pink-600/20 transition-all flex flex-col justify-center items-center gap-1 hover:scale-[1.02]"
                            >
                                <Monitor size={16} />
                                <span className="text-xs">Consultar</span>
                            </button>

                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Market;

