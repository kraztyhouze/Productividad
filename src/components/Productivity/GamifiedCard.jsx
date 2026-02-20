import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clock, UserPlus, Zap, Skull, Crown, Star, Flame, X, Gift, Music, Binary, Sparkles, Trash2 } from 'lucide-react';

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
    user
}) => {
    // 1. Calculate Level & Progress
    const xp = emp.gamification?.xp || 0;
    const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelThreshold = Math.pow(level, 2) * 100;
    const progressPercent = Math.min(100, Math.max(0, ((xp - currentLevelBaseXP) / (nextLevelThreshold - currentLevelBaseXP)) * 100));

    // 2. Rank Style
    const getRankStyle = () => {
        if (level >= 20) return { border: 'border-fuchsia-500', shadow: 'shadow-[0_0_15px_rgba(217,70,239,0.5)]', bg: 'bg-fuchsia-900/10', icon: <Crown size={14} className="text-fuchsia-400" /> };
        if (level >= 10) return { border: 'border-amber-400', shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.4)]', bg: 'bg-amber-900/10', icon: <Star size={14} className="text-amber-400" /> };
        if (level >= 5) return { border: 'border-blue-400', shadow: 'shadow-[0_0_8px_rgba(96,165,250,0.3)]', bg: 'bg-blue-900/10', icon: <Zap size={14} className="text-blue-400" /> };
        return { border: 'border-slate-600', shadow: '', bg: 'bg-slate-800/40', icon: null };
    };

    const rank = getRankStyle();

    // 3. Stats & Fire
    const groups = stats?.groups || 0;
    const hours = (stats?.clientSeconds || 0) / 3600;
    const gph = hours > 0 ? (groups / hours) : 0;
    const isOnFire = gph > 8 || groups > 15;

    const isSessionActive = !!session || isClientActive;
    const pendingRewards = emp.gamification?.pendingRewards || 0;

    // 4. Effects Logic
    const [activeEffect, setActiveEffect] = useState(null); // 'fx_...'
    const prevSessionState = useRef(isSessionActive);

    useEffect(() => {
        // Entry: False -> True
        if (!prevSessionState.current && isSessionActive) {
            if (emp.gamification?.currentEntryEffect) setActiveEffect(emp.gamification.currentEntryEffect);
        }
        // Exit: True -> False
        if (prevSessionState.current && !isSessionActive) {
            if (emp.gamification?.currentExitEffect) setActiveEffect(emp.gamification.currentExitEffect);
        }
        prevSessionState.current = isSessionActive;
    }, [isSessionActive, emp.gamification]);


    const variants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };
    // Custom border from gamification
    const BORDER_DATA = {
        border_pink: { color: '#ec4899' }, border_cyan: { color: '#06b6d4' }, border_lime: { color: '#84cc16' },
        border_amber: { color: '#f59e0b' }, border_red: { color: '#ef4444' }, border_violet: { color: '#8b5cf6' },
        border_glow_gold: { color: '#fbbf24', glow: true }, border_glow_neon: { color: '#22d3ee', glow: true },
        border_glow_fire: { color: '#f97316', glow: true }, border_rainbow: { color: 'rainbow', glow: true }
    };
    const customBorder = emp.gamification?.currentBorder ? BORDER_DATA[emp.gamification.currentBorder] : null;
    const customStyle = customBorder ? {
        borderColor: customBorder.color === 'rainbow' ? undefined : customBorder.color,
        borderWidth: '2px',
        ...(customBorder.color === 'rainbow' ? { borderImage: 'linear-gradient(135deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7) 1' } : {}),
        ...(customBorder.glow ? { boxShadow: `0 0 20px ${customBorder.color === 'rainbow' ? 'rgba(168,85,247,0.4)' : customBorder.color + '55'}` } : {})
    } : {};

    return (
        <motion.div
            layout
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={!isClientActive ? customStyle : {}}
            className={`relative rounded-2xl p-2 flex flex-col gap-1 transition-all duration-300 border h-32 overflow-hidden group select-none cursor-pointer 
                ${isClientActive ? 'bg-amber-500 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)] z-20' :
                    isSessionActive ? `bg-slate-800 ${customBorder ? '' : rank.border} ${customBorder?.glow ? '' : rank.shadow}` :
                        `${rank.bg} ${customBorder ? '' : rank.border} opacity-80 hover:opacity-100 hover:bg-slate-800`
                }
            `}
        >
            {/* RESET PROFILE BUTTON (Manager Only) */}
            {isManagerial && onResetGamification && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onResetGamification(emp.id); }}
                    className="absolute top-2 left-2 p-1.5 text-slate-500 hover:text-red-500 bg-black/10 hover:bg-black/30 rounded-full z-30 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                    title="RESETEAR PERFIL COMPLETAMENTE"
                >
                    <Trash2 size={12} />
                </motion.button>
            )}

            {/* Visual Effect Overlay */}
            <AnimatePresence>
                {activeEffect && (
                    <EffectRenderer effectId={activeEffect} onComplete={() => setActiveEffect(null)} />
                )}
            </AnimatePresence>

            {/* FIRE EFFECT (Persistent) */}
            {isOnFire && isSessionActive && !isClientActive && (
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-orange-500 to-transparent animate-pulse" />
                </div>
            )}

            {/* REWARD / SHOP BUTTON (Bottom Left) */}
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); if (onOpenRewards) onOpenRewards(emp.id); }}
                className={`absolute bottom-2 left-2 z-40 p-1.5 rounded-full cursor-pointer shadow-lg border-2 border-white transition-colors flex items-center justify-center
                    ${pendingRewards > 0 ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}
                `}
                title={pendingRewards > 0 ? "¡Premios Pendientes!" : "Kiosko & Perfil"}
            >
                {pendingRewards > 0 ? (
                    <Gift size={16} className="animate-bounce" />
                ) : (
                    <ShoppingBag size={14} />
                )}
            </motion.div>

            {/* HEADER */}
            <div className="flex items-center gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-colors relative shrink-0
                    ${isClientActive ? 'bg-black text-amber-500 border-black' :
                        isSessionActive ? 'bg-slate-700 text-white ' + rank.border :
                            'bg-slate-800 text-slate-400 border-slate-600 group-hover:border-white'
                    }
                `}>
                    {emp.gamification?.avatarUrl ? (
                        <img src={emp.gamification.avatarUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        emp.alias?.[0] || emp.firstName?.[0]
                    )}

                    {/* Level Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-0.5 shadow-md">
                        {rank.icon} <span>{level}</span>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-lg font-black truncate leading-none uppercase tracking-tight 
                        ${isClientActive ? 'text-black' :
                            isSessionActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                    `}>
                        {emp.alias || emp.firstName}
                    </p>

                    {/* XP BAR */}
                    <div className="w-full h-1.5 bg-black/20 rounded-full mt-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className={`h-full ${isClientActive ? 'bg-black' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
                        />
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 flex items-center justify-center relative z-10">
                {isSessionActive ? (
                    isClientActive ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <Clock size={28} className="text-black mb-0.5" />
                            <span className="font-black text-black text-xs uppercase tracking-widest">En Curso</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity">
                            <UserPlus size={28} className={`text-pink-500 mb-0.5 ${isOnFire ? 'animate-bounce' : ''}`} />
                            <span className="font-bold text-slate-300 text-[10px] uppercase tracking-widest group-hover:text-white">Atender</span>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-300">
                        <span className="font-extrabold text-slate-400 text-xs uppercase border-2 border-slate-500 px-2 py-1 rounded-lg group-hover:border-white group-hover:text-white">
                            Iniciar Turno
                        </span>
                    </div>
                )}
            </div>

            {/* END SESSION BUTTON */}
            {isSessionActive && !isClientActive && (isManagerial || emp.id === user?.id || user?.role === 'KIOSK') && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onEndSession(emp.id); }}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-black/20 hover:bg-red-500 rounded-full z-20 transition-all backdrop-blur-sm"
                >
                    <motion.div animate={{ rotate: 0 }} whileHover={{ rotate: 90 }}>
                        <X size={14} />
                    </motion.div>
                </motion.button>
            )}

            {/* ON FIRE ICON */}
            {isOnFire && (
                <div className="absolute top-2 right-8 z-20" title={`On Fire! ${gph.toFixed(1)}/h`}>
                    <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
                </div>
            )}

            {/* MEDALS ROW */}
            {emp.gamification?.medals && emp.gamification.medals.length > 0 && (
                <div className="absolute bottom-1.5 right-2 z-20 flex items-center gap-0.5">
                    {emp.gamification.medals.slice(0, 4).map((medal, i) => (
                        <div key={medal.id || i} className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 overflow-hidden flex items-center justify-center" title={medal.title}>
                            <img src={medal.icon} alt="" className="w-4 h-4" />
                        </div>
                    ))}
                    {emp.gamification.medals.length > 4 && (
                        <span className="text-[8px] text-amber-400 font-bold ml-0.5">+{emp.gamification.medals.length - 4}</span>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default GamifiedCard;
