import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Store, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const StoreSelection = () => {
    const { selectStore, stores } = useStore();
    const navigate = useNavigate();

    // Explicitly logout when entering Store Selection to prevent cross-store session pollution
    useEffect(() => {
        localStorage.removeItem('is_user');
    }, []);

    const handleSelect = (storeId) => {
        selectStore(storeId);
        navigate('/select-module');
    };

    return (

        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Ambient Background - Enhanced Glare (Same as Login) */}
            <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-pink-600/30 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen"></div>

            {/* Geometric Accents */}
            <div className="absolute top-1/2 left-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent -rotate-45 blur-sm opacity-50"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rotate-45 blur-sm opacity-50"></div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

                {/* Header Section with Logo */}
                <div className="flex flex-col items-center justify-center mb-12">
                    <div className="mb-6 group">
                        <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img src="/logo_tiktak.jpg" alt="TikTak" className="relative h-28 w-auto object-contain drop-shadow-[0_0_25px_rgba(236,72,153,0.6)] rounded-3xl transform group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight text-center mb-3 drop-shadow-md" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                        Bienvenido a TikTak
                    </h1>
                    <p className="text-slate-400 text-lg font-medium tracking-wide">
                        Selecciona tu ubicación para continuar
                    </p>
                </div>

                {/* Store Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full px-4">
                    {stores.map((store, index) => (
                        <motion.button
                            key={store.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleSelect(store.id)}
                            className="group relative h-64 rounded-[2rem] w-full text-left"
                        >
                            {/* Card Glowing Border */}
                            <div className={`absolute -inset-0.5 bg-gradient-to-b ${store.id === 'store_2' ? 'from-emerald-500/50 to-teal-600/50' : 'from-pink-500/50 to-purple-600/50'} rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-500`}></div>

                            {/* Main Card Body */}
                            <div className="relative h-full bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-8 flex flex-col justify-between overflow-hidden group-hover:bg-slate-900/60 transition-colors">

                                {/* Background Gradient Splash inside card */}
                                <div className={`absolute top-0 right-0 w-64 h-64 ${store.color} opacity-10 blur-[60px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:opacity-20 transition-opacity`}></div>

                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-slate-800 transition-all duration-300 shadow-lg">
                                        <Store className={`w-7 h-7 ${store.id === 'store_2' ? 'text-emerald-400' : 'text-pink-400'}`} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-2 tracking-tight group-hover:translate-x-1 transition-transform" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                                        {store.name}
                                    </h3>
                                    <div className="flex items-center text-slate-400 text-sm font-medium">
                                        <MapPin className="w-4 h-4 mr-2 opacity-70" />
                                        <span>Acceder al panel de gestión</span>
                                    </div>
                                </div>

                                <div className={`flex items-center font-bold text-sm uppercase tracking-wider mt-4 transform translate-y-2 opacity-80 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ${store.id === 'store_2' ? 'text-emerald-400' : 'text-pink-400'}`}>
                                    <span>Entrar ahora</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-slate-600 text-xs font-mono">
                        Sistema de Gestión Centralizado v2.1 • TikTak
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StoreSelection;
