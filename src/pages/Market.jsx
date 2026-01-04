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

    return (
        <div className="h-full flex flex-col items-center justify-start pt-10 fade-in relative min-h-[500px]">

            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 mb-2 font-['Varela_Round']">
                    Escáner de Mercado
                </h1>
                <p className="text-slate-400 font-medium">Compara precios en tiempo real entre competidores.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl mb-12 relative group z-10 transition-all">
                <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="bg-[#1e293b]/80 backdrop-blur-xl p-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10 relative">
                    <div className="p-3 bg-slate-800/50 rounded-xl text-slate-400">
                        <Search size={24} />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent w-full outline-none text-lg placeholder-slate-600 text-white font-bold px-2"
                        placeholder="Buscar producto (ej. iPhone 13)..."
                    />
                    <button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-600/20 transition-all flex items-center gap-2">
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
            </form>

            {/* Loading Indicator */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-10 fade-in">
                    <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(236,72,153,0.5)]"></div>
                    <p className="text-pink-400 font-bold animate-pulse text-lg">Escaneando precios en tiempo real...</p>
                    <p className="text-slate-500 text-sm mt-2">Consultando Cash Converters, BackMarket, CeX...</p>
                </div>
            )}

            {/* Results Grid */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl px-4 animate-in slide-in-from-bottom-5 duration-700">
                    {results.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-[#1e293b]/60 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 border border-white/5 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all group relative overflow-hidden ${item.isBestPrice ? 'border-green-500/30' : ''}`}
                        >
                            {item.isBestPrice && (
                                <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg z-10">
                                    MEJOR PRECIO
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border text-sm shrink-0
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
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-200 truncate">{item.store}</p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">{item.condition}</p>
                                </div>
                            </div>

                            <div className="mt-2 flex items-baseline gap-1">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-2xl font-mono font-black tracking-tighter hover:underline decoration-2 underline-offset-4 transition-all
                                        ${item.isBestPrice ? 'text-white decoration-green-500' : 'text-slate-300 decoration-pink-500/50'}
                                    `}
                                    title="Ver oferta en página original"
                                >
                                    {item.price}
                                </a>
                            </div>

                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all border border-white/5 flex items-center justify-center gap-2 group-hover:border-white/10 mt-auto"
                            >
                                Ver oferta <ExternalLink size={12} />
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <p>No se encontraron resultados o hubo un error al conectar.</p>
                </div>
            )}
        </div>
    );
};

export default Market;
