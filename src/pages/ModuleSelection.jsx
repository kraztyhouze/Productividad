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
            color: 'from-pink-500 to-rose-600',
            glow: 'group-hover:shadow-[0_0_40px_-5px_rgba(244,63,94,0.4)]',
            path: '/login', // Goes to login -> App
            active: true
        },
        {
            id: 'gerencia',
            name: 'GERENCIA',
            icon: Briefcase,
            description: 'Panel de administración y estadísticas globales',
            color: 'from-indigo-500 to-purple-600',
            glow: 'group-hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.4)]',
            path: null, // Placeholder
            active: false
        }
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen"></div>

            <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">

                {/* Header with Store Info */}
                <div className="flex flex-col items-center justify-center mb-16 relative">
                    <button
                        onClick={handleBack}
                        className="absolute -top-16 left-0 text-slate-400 hover:text-white flex items-center gap-2 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <Store size={14} />
                        </div>
                        <span className="text-sm font-medium">Cambiar Tienda</span>
                    </button>

                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight text-center mb-2" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                        {selectedStoreData?.name || 'Tienda'}
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full mb-4"></div>
                    <p className="text-slate-400 text-lg">Selecciona un módulo para acceder</p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-8">
                    {modules.map((module, index) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => module.active && module.path && navigate(module.path)}
                            className={`group relative h-80 rounded-[2.5rem] w-full cursor-pointer transition-all duration-300 ${!module.active ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-2'}`}
                        >
                            {/* Card Background & Border */}
                            <div className={`absolute -inset-0.5 bg-gradient-to-b ${module.color} rounded-[2.5rem] blur opacity-30 group-hover:opacity-100 transition duration-500`}></div>

                            <div className="relative h-full bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 flex flex-col items-center justify-center text-center overflow-hidden z-10">

                                {/* Icon Halo */}
                                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                                    <module.icon className="text-white w-10 h-10" strokeWidth={1.5} />
                                </div>

                                <h2 className="text-3xl font-bold text-white mb-3 tracking-wide" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                                    {module.name}
                                </h2>
                                <p className="text-slate-400 font-medium leading-relaxed max-w-xs">
                                    {module.description}
                                </p>

                                {/* Action Indicator */}
                                {module.active ? (
                                    <div className="absolute bottom-8 flex items-center gap-2 text-white/50 text-sm font-bold tracking-widest uppercase group-hover:text-white transition-colors">
                                        <span>Entrar</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                ) : (
                                    <div className="absolute bottom-8 px-4 py-1 rounded-full bg-white/5 text-white/30 text-xs font-bold tracking-widest uppercase border border-white/5">
                                        Próximamente
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModuleSelection;
