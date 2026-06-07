import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clock, UserPlus, Zap, Skull, Crown, Star, Flame, X, Gift, Music, Binary, Sparkles, Trash2, ExternalLink } from 'lucide-react';

const EffectRenderer = ({ effectId, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!effectId) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-2xl"
        >
            {effectId === 'fx_confetti' && (
                <>
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-sm"
                            style={{
                                backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][i % 5],
                                left: `${Math.random() * 100}%`,
                                top: -10
                            }}
                            animate={{ y: 150, rotate: 360, x: (Math.random() - 0.5) * 50 }}
                            transition={{ duration: 1 + Math.random(), delay: Math.random() * 0.5 }}
                        />
                    ))}
                </>
            )}
            {effectId === 'fx_sparkle' && (
                <>
                    <div className="absolute inset-0 bg-yellow-500/10 mix-blend-screen" />
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-yellow-300"
                            style={{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%` }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], rotate: 180 }}
                            transition={{ duration: 1, delay: Math.random() * 0.5, repeat: 1 }}
                        >
                            <Sparkles size={10 + Math.random() * 10} />
                        </motion.div>
                    ))}
                </>
            )}
            {effectId === 'fx_lightning' && (
                <motion.div
                    className="absolute inset-0 bg-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0, 0.5, 0] }}
                    transition={{ duration: 0.5 }}
                />
            )}
            {effectId === 'fx_matrix' && (
                <div className="absolute inset-0 bg-black/50 font-mono text-[10px] leading-3 text-green-500 flex flex-col items-center opacity-50">
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: -50 }}
                            animate={{ y: 200 }}
                            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                        >
                            {Math.random().toString(2).substring(2, 10)}
                        </motion.div>
                    ))}
                </div>
            )}
            {effectId === 'fx_notes' && (
                <>
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-pink-400"
                            style={{ left: `${20 + Math.random() * 60}%`, bottom: 0 }}
                            animate={{ y: -150, x: (Math.random() - 0.5) * 40, opacity: [0, 1, 0] }}
                            transition={{ duration: 2, delay: i * 0.2 }}
                        >
                            <Music size={16} />
                        </motion.div>
                    ))}
                </>
            )}
            {effectId === 'fx_fire' && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-t from-red-600/40 via-orange-500/20 to-transparent" />
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bottom-0 text-orange-500 mix-blend-screen"
                            style={{ left: `${Math.random() * 100}%` }}
                            animate={{ y: -80, opacity: [0, 1, 0], scale: [0.5, 1.5, 0] }}
                            transition={{ duration: 1, delay: Math.random(), repeat: 1 }}
                        >
                            <Flame size={20} />
                        </motion.div>
                    ))}
                </>
            )}
        </motion.div>
    );
};

const GamifiedCard = ({
    emp,
    session,
    isClientActive,
    stats,
    onClick,
    onEndSession,
    onOpenRewards,
    onResetGamification,
    isManagerial,
    user,
    onOpenWidget
}) => {
    // 1. Calculate Level & Progress
    const xp = emp.gamification?.xp || 0;
    const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelThreshold = Math.pow(level, 2) * 100;
    const progressPercent = Math.min(100, Math.max(0, ((xp - currentLevelBaseXP) / (nextLevelThreshold - currentLevelBaseXP)) * 100));

    // 2. Rank Colors (Ring)
    const getRankColor = () => {
        if (level >= 30) return '#B76E79'; // Oro Rosa
        if (level >= 20) return '#D4AF37'; // Oro
        if (level >= 10) return '#A0AEC0'; // Plata
        if (level >= 5)  return '#CD7F32'; // Cobre
        return '#E2E8F0'; // Base
    };
    const ringColor = getRankColor();

    const isSessionActive = !!session || isClientActive;
    const hasGift = (emp.gamification?.pendingRewards || 0) > 0;

    // SVG Progress Ring Constants
    const radius = 38;
    const dashArray = 2 * Math.PI * radius;
    const dashOffset = dashArray - (dashArray * progressPercent) / 100;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className={`relative bg-white rounded-[12px] p-5 flex flex-col items-center transition-all duration-300 border shadow-[0_4px_12px_rgba(0,0,0,0.05)] group select-none cursor-pointer h-auto touch-manipulation
                ${isClientActive 
                    ? 'border-[#48BB78] ring-2 ring-[#48BB78]/20 shadow-lg' 
                    : isSessionActive 
                        ? 'border-[#48BB78]/50 shadow-md' 
                        : 'border-[#E2E8F0] hover:border-[#FF8C9D]/50 hover:shadow-md'
                }
            `}
        >
            {/* 2.1 & 2.2: Avatar & SVG Ring */}
            <div className="relative w-24 h-24 mb-6 shrink-0 flex items-center justify-center">
                {/* SVG Ring Background */}
                <svg className="absolute inset-x-0 inset-y-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="2" />
                    <circle
                        cx="40" cy="40" r={radius} fill="none" stroke={ringColor} strokeWidth="3"
                        strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                    />
                </svg>

                <div className="w-[78px] h-[78px] rounded-full overflow-hidden bg-[#F4F7FA] flex items-center justify-center relative z-10">
                    {emp.gamification?.avatarUrl ? (
                        <img src={emp.gamification.avatarUrl} alt="" className="w-full h-full object-contain aspect-square" />
                    ) : (
                        <span className="text-2xl font-black text-[#A0AEC0] uppercase tracking-tighter">
                            {emp.alias?.[0] || emp.firstName?.[0]}
                        </span>
                    )}
                </div>

                <div className="absolute top-0 -right-2 bg-white border border-[#E2E8F0] text-[#1A365D] text-[10px] font-black px-2 py-1 rounded-full shadow-sm z-20">
                    NIV.{level}
                </div>
            </div>

            {/* 2.3: Identity & Regalos */}
            <div className="flex flex-col items-center mb-6 w-full">
                <div className="flex items-center gap-2 justify-center w-full">
                    <h3 className="text-base font-black text-[#1A365D] uppercase tracking-tight truncate">
                        {emp.alias || emp.firstName}
                    </h3>
                    <div 
                        className="shrink-0 p-2 -mr-2 cursor-pointer hover:bg-slate-50 rounded-full transition-colors"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onOpenRewards) onOpenRewards(emp.id); 
                        }}
                    >
                        <Gift size={20} className={hasGift ? 'text-[#FF8C9D] animate-bounce' : 'text-[#E2E8F0]'} />
                    </div>
                </div>
            </div>

            {/* 2.4: Tactile Action Button */}
            <div className="w-full relative mt-auto space-y-3">
                {isSessionActive && (
                    <div className="text-center flex flex-col items-center">
                        {!isClientActive ? (
                            <>
                                <UserPlus size={20} className="text-[#FF8C9D] animate-bounce mb-1" />
                                <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-widest">Toca para Atender</span>
                            </>
                        ) : (
                            <>
                                <Clock size={20} className="text-[#48BB78] animate-pulse mb-1" />
                                <span className="text-[10px] font-bold text-[#48BB78] uppercase tracking-widest">Atendiendo...</span>
                            </>
                        )}
                    </div>
                )}
                
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        if (!isSessionActive) {
                            onClick(); // Start Session
                        } else if (isClientActive) {
                            onClick(); // Open Modal
                        } else {
                            onEndSession(emp.id); // End Session
                        }
                    }}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all transform active:scale-95 touch-manipulation cursor-pointer
                        ${!isSessionActive 
                            ? 'bg-[#EDF2F7] text-[#1A365D] hover:bg-[#E2E8F0] shadow-none active:bg-[#CBD5E0]' 
                            : 'bg-[#FF8C9D] text-white hover:bg-[#ff7a8d] shadow-[#FF8C9D]/30 active:bg-[#E57385]'
                        }
                    `}
                >
                    {!isSessionActive ? 'Iniciar Turno' : isClientActive ? 'Finalizar Compra' : 'Finalizar Turno'}
                </button>

                {isSessionActive && onOpenWidget && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onOpenWidget(emp);
                        }}
                        className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-slate-750 shadow-sm"
                    >
                        <ExternalLink size={12} />
                        Widget Flotante
                    </button>
                )}
            </div>
            
            {isManagerial && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                         onClick={(e) => { e.stopPropagation(); onResetGamification(emp.id); }}
                         className="p-2 text-[#E2E8F0] hover:text-red-400"
                    >
                         <Trash2 size={14} />
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default GamifiedCard;
