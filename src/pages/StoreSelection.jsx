import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Store, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const StoreSelection = () => {
    const { selectStore, stores } = useStore();
    const navigate = useNavigate();

    const handleSelect = (storeId) => {
        selectStore(storeId);
        navigate('/select-module');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#F4F7FA' }}>
            {/* Subtle background decorations */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,140,157,0.2) 0%, transparent 65%)' }} />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(66,153,225,0.15) 0%, transparent 65%)' }} />

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-12">
                    <img
                        src="/logo_tiktak.jpg"
                        alt="TikTak"
                        className="h-24 w-auto object-contain rounded-2xl mb-6"
                        style={{ boxShadow: '0 8px 32px rgba(255,140,157,0.25)' }}
                    />
                    <h1 className="text-4xl md:text-5xl font-black text-[#1A365D] tracking-tight text-center mb-3">
                        Bienvenido a TikTak
                    </h1>
                    <p className="text-[#718096] text-lg font-medium">
                        Selecciona tu ubicación para continuar
                    </p>
                </div>

                {/* Store Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
                    {stores.map((store, index) => {
                        const isSecond = store.id === 'store_2';
                        return (
                            <motion.button
                                key={store.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleSelect(store.id)}
                                className="group relative h-56 rounded-2xl w-full text-left bg-white border border-[#E2E8F0] overflow-hidden transition-all duration-300 hover:-translate-y-1"
                                style={{ boxShadow: 'var(--shadow-card)' }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-hover)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
                            >
                                {/* BG accent */}
                                <div
                                    className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 translate-x-1/3 -translate-y-1/3 group-hover:opacity-20 transition-opacity"
                                    style={{ background: isSecond ? '#48BB78' : '#FF8C9D' }}
                                />

                                <div className="relative h-full p-8 flex flex-col justify-between">
                                    <div>
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                                            style={{ background: isSecond ? '#F0FFF4' : '#FFF0F2', border: `1px solid ${isSecond ? '#C6F6D5' : '#FFD6DC'}` }}
                                        >
                                            <Store className="w-6 h-6" style={{ color: isSecond ? '#48BB78' : '#FF8C9D' }} />
                                        </div>
                                        <h3 className="text-2xl font-black text-[#1A365D] mb-1 tracking-tight">
                                            {store.name}
                                        </h3>
                                        <div className="flex items-center text-[#718096] text-sm font-medium">
                                            <MapPin className="w-4 h-4 mr-2 opacity-70" />
                                            <span>Acceder al panel de gestión</span>
                                        </div>
                                    </div>

                                    <div
                                        className="flex items-center font-bold text-sm uppercase tracking-wider transition-all duration-300 group-hover:gap-3 gap-2"
                                        style={{ color: isSecond ? '#48BB78' : '#FF8C9D' }}
                                    >
                                        <span>Entrar ahora</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[#CBD5E0] text-xs font-mono">
                        Sistema de Gestión Centralizado v2.1 · TikTak
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StoreSelection;
