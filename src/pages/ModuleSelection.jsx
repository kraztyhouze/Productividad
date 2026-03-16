import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Briefcase, ChevronRight, Store } from 'lucide-react';
import { motion } from 'framer-motion';

const ModuleSelection = () => {
    const { selectedStoreData, clearStore } = useStore();
    const navigate = useNavigate();

    const handleBack = () => {
        clearStore();
        navigate('/select-store');
    };

    const modules = [
        {
            id: 'compras',
            name: 'COMPRAS',
            icon: ShoppingBag,
            description: 'Gestión de tienda, productividad y empleados',
            accentBg: '#FFF0F2',
            accentBorder: '#FFD6DC',
            accentIcon: '#FF8C9D',
            accentText: '#FF8C9D',
            hoverBorder: '#FF8C9D',
            path: '/login',
            active: true
        },
        {
            id: 'gerencia',
            name: 'GERENCIA',
            icon: Briefcase,
            description: 'Panel de administración y estadísticas globales',
            accentBg: '#EBF8FF',
            accentBorder: '#BEE3F8',
            accentIcon: '#4299E1',
            accentText: '#4299E1',
            hoverBorder: '#4299E1',
            path: null,
            active: false
        }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#F4F7FA' }}>
            {/* Subtle background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,140,157,0.15) 0%, transparent 65%)' }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(66,153,225,0.12) 0%, transparent 65%)' }} />

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-14 relative w-full">
                    <button
                        onClick={handleBack}
                        className="absolute left-0 top-0 text-[#718096] hover:text-[#1A365D] flex items-center gap-2 transition-colors group text-sm font-medium"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center group-hover:border-[#FF8C9D] transition-colors" style={{ boxShadow: 'var(--shadow-card)' }}>
                            <Store size={14} />
                        </div>
                        <span>Cambiar Tienda</span>
                    </button>

                    <h1 className="text-4xl md:text-5xl font-black text-[#1A365D] tracking-tight text-center mb-2">
                        {selectedStoreData?.name || 'Tienda'}
                    </h1>
                    <div className="h-1 w-16 rounded-full mb-4" style={{ background: '#FF8C9D' }}></div>
                    <p className="text-[#718096] text-lg">Selecciona un módulo para acceder</p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
                    {modules.map((module, index) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => module.active && module.path && navigate(module.path)}
                            className={`group relative h-72 rounded-2xl w-full bg-white border border-[#E2E8F0] overflow-hidden transition-all duration-300 ${!module.active
                                    ? 'opacity-50 grayscale cursor-not-allowed'
                                    : 'cursor-pointer hover:-translate-y-1'
                                }`}
                            style={{ boxShadow: 'var(--shadow-card)' }}
                        >
                            {/* Accent corner blob */}
                            <div
                                className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-20 translate-x-1/3 -translate-y-1/3 group-hover:opacity-30 transition-opacity"
                                style={{ background: module.accentIcon }}
                            />

                            <div className="relative h-full p-10 flex flex-col items-center justify-center text-center">
                                {/* Icon */}
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-7 transition-transform group-hover:scale-110 duration-300"
                                    style={{ background: module.accentBg, border: `1px solid ${module.accentBorder}` }}
                                >
                                    <module.icon style={{ color: module.accentIcon }} className="w-9 h-9" strokeWidth={1.5} />
                                </div>

                                <h2 className="text-2xl font-black text-[#1A365D] mb-2 tracking-wide">
                                    {module.name}
                                </h2>
                                <p className="text-[#718096] text-sm font-medium leading-relaxed max-w-xs">
                                    {module.description}
                                </p>

                                {/* Action */}
                                {module.active ? (
                                    <div
                                        className="absolute bottom-7 flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-all group-hover:gap-3"
                                        style={{ color: module.accentText }}
                                    >
                                        <span>Entrar</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                ) : (
                                    <div className="absolute bottom-7 px-4 py-1 rounded-full text-[#A0AEC0] text-xs font-bold tracking-widest uppercase border border-[#E2E8F0] bg-[#F4F7FA]">
                                        Próximamente
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
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

export default ModuleSelection;
