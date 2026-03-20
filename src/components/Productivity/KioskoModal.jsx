import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, User, Gift, Star, Disc, Zap, Sparkles, Flame, Binary, PartyPopper, Music, Trash2, Award, Plus, RefreshCw, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap = { sparkles: Sparkles, flame: Flame, code: Binary, party: PartyPopper, music: Music, zap: Zap };
const PREMIUM_THEMES = ['Dragon Ball', 'Marvel', 'Disney', 'Música', 'Fútbol'];

const KioskoModal = ({ isOpen, onClose, employee, updateEmployee, isManagerial, user }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [shopItems, setShopItems] = useState([]);
    const [rewardEffects, setRewardEffects] = useState([]);
    const [openingChest, setOpeningChest] = useState(false);
    const [selectingTheme, setSelectingTheme] = useState(false);
    const [rewardReveal, setRewardReveal] = useState(null);
    const [grantData, setGrantData] = useState({ coins: 0, chests: 0, xp: 0, reason: '' });
    const [showMedalPanel, setShowMedalPanel] = useState(false);
    const [medalPreviews, setMedalPreviews] = useState([]);
    const [selectedMedalIcon, setSelectedMedalIcon] = useState(null);
    const [medalTitle, setMedalTitle] = useState('');
    const [medalComment, setMedalComment] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveTab('profile');
            Promise.all([
                fetch('/api/gamification/shop').then(r => r.json()),
                fetch('/api/gamification/effects').then(r => r.json())
            ]).then(([items, effects]) => { setShopItems(items); setRewardEffects(effects); }).catch(console.error);
        }
    }, [isOpen]);

    const syncGamification = (g) => updateEmployee(employee.id, { gamification: g });

    const handleBuy = async (item) => {
        try {
            const res = await fetch('/api/gamification/buy-item', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, itemId: item.id }) });
            const data = await res.json();
            if (data.success) { syncGamification(data.gamification); } else alert(data.error);
        } catch (err) { console.error(err); }
    };

    const handleEquip = async (avatarUrl) => {
        try {
            const res = await fetch('/api/gamification/equip-item', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, avatarUrl }) });
            const data = await res.json();
            if (data.success) syncGamification({ ...employee.gamification, currentAvatar: data.currentAvatar, avatarUrl: data.currentAvatar });
        } catch (err) { console.error(err); }
    };

    const handleEquipEffect = async (effectId, type) => {
        try {
            const res = await fetch('/api/gamification/equip-effect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, effectId, type }) });
            const data = await res.json();
            if (data.success) syncGamification({ ...employee.gamification, currentEntryEffect: data.entry, currentExitEffect: data.exit });
        } catch (err) { console.error(err); }
    };

    const handleEquipBorder = async (borderId) => {
        try {
            const res = await fetch('/api/gamification/equip-border', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, borderId }) });
            const data = await res.json();
            if (data.success) syncGamification(data.gamification);
        } catch (err) { console.error(err); }
    };

    const processChestOpening = async (theme) => {
        setSelectingTheme(false); setOpeningChest(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            const res = await fetch('/api/gamification/claim-reward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, theme }) });
            const data = await res.json();
            if (data.success) {
                syncGamification(data.gamification);
                setRewardReveal(data.type === 'effect' ? { type: 'effect', name: data.effectName } : { type: 'avatar', src: data.src, name: data.avatarName, theme: data.theme });
            } else { alert(data.error); setOpeningChest(false); }
        } catch (err) { console.error(err); setOpeningChest(false); }
    };

    const handleDeleteAvatar = async (url) => {
        if (!confirm('¿Eliminar este avatar?')) return;
        try { const res = await fetch('/api/gamification/delete-avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, avatarUrl: url }) }); const d = await res.json(); if (d.success) syncGamification(d.gamification); } catch (e) { console.error(e); }
    };

    const handleGrantReward = async () => {
        if (!grantData.coins && !grantData.chests && !grantData.xp) return alert('Especifica al menos un premio.');
        try { const res = await fetch('/api/gamification/grant-reward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, ...grantData }) }); const d = await res.json(); if (d.success) { syncGamification(d.gamification); setGrantData({ coins: 0, chests: 0, xp: 0, reason: '' }); } } catch (e) { console.error(e); }
    };

    const loadMedalPreviews = async () => { try { const r = await fetch('/api/gamification/medal-previews?count=9'); setMedalPreviews(await r.json()); setSelectedMedalIcon(null); } catch (e) { console.error(e); } };

    const handleAssignMedal = async () => {
        if (!medalTitle.trim()) return alert('Escribe un título.'); if (!selectedMedalIcon) return alert('Selecciona un icono.');
        try { const res = await fetch('/api/gamification/assign-medal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, title: medalTitle, comment: medalComment, iconSeed: selectedMedalIcon.seed }) }); const d = await res.json(); if (d.success) { syncGamification(d.gamification); setShowMedalPanel(false); setMedalTitle(''); setMedalComment(''); } } catch (e) { console.error(e); }
    };

    const handleDeleteMedal = async (medalId) => {
        if (!confirm('¿Eliminar esta medalla?')) return;
        try { const res = await fetch('/api/gamification/delete-medal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, medalId }) }); const d = await res.json(); if (d.success) syncGamification(d.gamification); } catch (e) { console.error(e); }
    };

    if (!isOpen || !employee) return null;
    const g = employee.gamification || {};
    const coins = parseInt(g.coins || 0);
    const pendingRewards = parseInt(g.pendingRewards || 0);
    const unlockedAvatars = g.unlockedAvatars || [];
    const currentAvatar = g.currentAvatar;
    const medals = g.medals || [];
    const unlockedBorders = g.unlockedBorders || [];
    const currentBorder = g.currentBorder;

    // Calc XP & Level
    const xp = parseInt(g.xp || 0);
    const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelThreshold = Math.pow(level, 2) * 100;
    const progressPercent = Math.min(100, Math.max(0, ((xp - currentLevelBaseXP) / (nextLevelThreshold - currentLevelBaseXP)) * 100));

    const getRankColor = () => {
        if (level >= 30) return '#B76E79';
        if (level >= 20) return '#D4AF37';
        if (level >= 10) return '#A0AEC0';
        if (level >= 5)  return '#CD7F32';
        return '#4299E1';
    };
    const ringColor = getRankColor();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A365D]/40 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white/95 w-full max-w-4xl h-[85vh] rounded-[40px] border border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="px-8 py-6 border-b border-[#F4F7FA] flex justify-between items-center bg-white/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] flex items-center justify-center border border-[#FF8C9D]/20 shadow-sm">
                            <ShoppingBag className="text-[#FF8C9D]" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1A365D] tracking-tighter">Colección <span className="text-[#FF8C9D]">TikTak</span></h2>
                            <p className="text-[#A0AEC0] text-[10px] font-black uppercase tracking-widest">{employee.alias || employee.firstName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#FFFBEB] px-4 py-2 rounded-2xl border border-amber-100 flex items-center gap-2 shadow-sm">
                            <span className="text-xl">🪙</span>
                            <span className="text-lg font-black text-amber-600 font-mono">{coins.toLocaleString()}</span>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#F4F7FA] hover:bg-[#E2E8F0] rounded-xl text-[#A0AEC0] hover:text-[#1A365D] transition-colors"><X size={20} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 pt-4 border-b border-[#F4F7FA] bg-[#F4F7FA]/30">
                    {[
                        { id: 'profile', label: 'Mi Perfil', icon: User, color: '#48BB78' },
                        { id: 'shop', label: 'Tienda', icon: ShoppingBag, color: '#FF8C9D' },
                        { id: 'inventory', label: 'Mis Skins', icon: User, color: '#4299E1', badge: pendingRewards },
                        { id: 'effects', label: 'Efectos', icon: Zap, color: '#9F7AEA' },
                        { id: 'borders', label: 'Bordes', icon: Square, color: '#38B2AC' },
                        { id: 'medals', label: 'Medallas', icon: Award, color: '#ED8936', badge: medals.length },
                        ...(isManagerial ? [{ id: 'manager', label: 'Gestión', icon: Star, color: '#F56565' }] : [])
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex-1 py-4 font-black uppercase tracking-tighter text-[11px] flex items-center justify-center gap-2 transition-all relative rounded-t-2xl px-2
                                ${activeTab === t.id ? 'text-[#1A365D] bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
                        >
                            <t.icon size={14} style={{ color: activeTab === t.id ? t.color : 'inherit' }} />
                            {t.label}
                            {t.badge > 0 && <span className="absolute top-2 right-2 bg-[#FF8C9D] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black shadow-sm">{t.badge}</span>}
                            {activeTab === t.id && <motion.div layoutId="kiosk-active-tab" className="absolute bottom-0 left-4 right-4 h-1 bg-[#FF8C9D] rounded-full" />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-white/30 custom-scrollbar relative">
                    {/* Theme Overlay */}
                    <AnimatePresence>{selectingTheme && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-[#F4F7FA]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                        <h3 className="text-4xl font-black text-[#1A365D] tracking-tighter uppercase mb-2">Abre tu Cofre</h3>
                        <p className="text-[#718096] mb-12 font-medium">Elige la temática de tus premios de hoy</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-2xl">
                            {PREMIUM_THEMES.map(t => (
                                <button key={t} onClick={() => processChestOpening(t)} className="bg-white hover:bg-[#FF8C9D] group border border-[#E2E8F0] hover:border-[#FF8C9D] p-8 rounded-[32px] shadow-sm hover:shadow-2xl transition-all transform hover:-translate-y-2 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-[#F4F7FA] group-hover:bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                                        <Sparkles size={32} className="text-[#FF8C9D] group-hover:text-white" />
                                    </div>
                                    <span className="text-[#1A365D] group-hover:text-white font-black uppercase text-sm tracking-widest">{t}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setSelectingTheme(false)} className="mt-12 text-[#A0AEC0] hover:text-[#FF8C9D] font-black uppercase tracking-widest text-xs border-b border-transparent hover:border-[#FF8C9D] transition-all">Cancelar Apertura</button>
                    </motion.div>)}</AnimatePresence>

                    {/* Chest Opening Overlay */}
                    <AnimatePresence>{(openingChest || rewardReveal) && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/98 backdrop-blur-xl flex flex-col items-center justify-center">
                        {!rewardReveal ? (<div className="text-center">
                            <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="mb-8">
                                <Gift size={120} className="text-[#FF8C9D] drop-shadow-[0_20px_40px_rgba(255,140,157,0.4)]" strokeWidth={1} />
                            </motion.div>
                            <h3 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter animate-pulse italic">Abriendo Destino...</h3>
                        </div>) : (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center flex flex-col items-center px-6">
                                <div className="relative mb-8 p-1 bg-gradient-to-br from-[#FF8C9D] to-[#9F7AEA] rounded-[48px] shadow-[0_40px_80px_rgba(255,140,157,0.5)]">
                                    <div className="bg-white rounded-[44px] overflow-hidden p-2">
                                        {rewardReveal.type === 'effect' ? (
                                            <div className="w-48 h-48 flex items-center justify-center bg-[#F4F7FA]"><Sparkles size={80} className="text-[#FF8C9D] animate-pulse" /></div>
                                        ) : (
                                            <img src={rewardReveal.src} alt="" className="w-48 h-48 object-cover" />
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-5xl font-black mb-2 uppercase tracking-tighter text-[#1A365D]">¡BRUTAL!</h3>
                                <div className="bg-[#FFF0F3] px-6 py-3 rounded-2xl border border-[#FF8C9D]/20 mb-12">
                                    <p className="text-[#1A365D] font-black text-xl leading-none uppercase">
                                        {rewardReveal.type === 'effect' ? rewardReveal.name : rewardReveal.name}
                                    </p>
                                    <p className="text-[#FF8C9D] text-xs font-bold uppercase tracking-widest mt-2">{rewardReveal.type === 'effect' ? 'Nuevo Efecto Especial' : `Avatar de ${rewardReveal.theme}`}</p>
                                </div>
                                <button onClick={() => { setOpeningChest(false); setRewardReveal(null) }} className="px-12 py-5 bg-[#1A365D] text-white font-black rounded-3xl hover:bg-[#2D3748] shadow-2xl uppercase tracking-widest text-sm transition-all active:scale-95">Continuar</button>
                            </motion.div>)}
                    </motion.div>)}</AnimatePresence>
                    {/* PROFILE VIEWER / DASHBOARD */}
                    {activeTab === 'profile' && (
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Left Side: Avatar & Core Stats */}
                            <div className="w-full md:w-1/3 flex flex-col items-center">
                                <div className="relative w-48 h-48 mb-8 flex justify-center items-center">
                                    <svg className="absolute inset-x-0 inset-y-0 w-full h-full -rotate-90 scale-110" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                                        <circle
                                            cx="50" cy="50" r="46" fill="none" stroke={ringColor} strokeWidth="6"
                                            strokeDasharray={2 * Math.PI * 46} strokeDashoffset={(2 * Math.PI * 46) - ((2 * Math.PI * 46) * progressPercent) / 100} strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="w-44 h-44 rounded-full overflow-hidden bg-[#F4F7FA] border-4 border-white shadow-xl relative z-10 flex items-center justify-center">
                                        {currentAvatar ? (
                                            <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-6xl font-black text-[#A0AEC0] uppercase">{employee.alias?.[0] || employee.firstName?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-4 bg-white border-2 border-[#E2E8F0] shadow-lg rounded-full px-6 py-2 z-20">
                                        <span className="text-[#1A365D] font-black tracking-widest uppercase">Nivel {level}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-[#F4F7FA] rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-[#4299E1] to-[#FF8C9D] rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                                <div className="w-full flex justify-between text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-6 px-1">
                                    <span>{xp} Puntos</span>
                                    <span>META: {nextLevelThreshold} Pts</span>
                                </div>
                                {pendingRewards > 0 && (
                                    <button onClick={() => setSelectingTheme(true)} className="w-full py-4 bg-gradient-to-r from-[#FF8C9D] to-[#9F7AEA] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#FF8C9D]/30 flex items-center justify-center gap-3 hover:scale-105 transition-transform active:scale-95">
                                        <Gift className="animate-bounce" size={20} /> ¡{pendingRewards} Cofres Disponibles!
                                    </button>
                                )}
                            </div>

                            {/* Right Side: Showcase */}
                            <div className="w-full md:w-2/3 flex flex-col gap-6">
                                {/* Coins & Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#FFFBEB] p-6 rounded-3xl border border-amber-100 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-4xl mb-2">🪙</span>
                                        <span className="text-2xl font-black text-amber-600 font-mono leading-none">{coins.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mt-1">Saldo Actual</span>
                                    </div>
                                    <div className="bg-[#F4F7FA] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-4xl mb-2">👕</span>
                                        <span className="text-2xl font-black text-[#1A365D] leading-none">{unlockedAvatars.length}</span>
                                        <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-widest mt-1">Skins Desbloqueadas</span>
                                    </div>
                                </div>

                                {/* Active Showcase */}
                                <div className="bg-white border text-center border-[#E2E8F0] rounded-3xl p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Sparkles className="text-[#48BB78]" size={20} />
                                        <h3 className="text-lg font-black text-[#1A365D] uppercase tracking-tighter">Equipamiento Activo</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#F0FFF4] border border-[#48BB78]/20 p-4 rounded-2xl flex flex-col items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-[#48BB78] tracking-widest">Entrada Estelar</span>
                                            <span className="text-sm font-bold text-[#2F855A]">{g.currentEntryEffect ? rewardEffects.find(e => e.id === g.currentEntryEffect)?.name || 'Efecto' : 'Sin Efecto'}</span>
                                        </div>
                                        <div className="bg-[#FAF5FF] border border-[#9F7AEA]/20 p-4 rounded-2xl flex flex-col items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-[#9F7AEA] tracking-widest">Salida Épica</span>
                                            <span className="text-sm font-bold text-[#6B46C1]">{g.currentExitEffect ? rewardEffects.find(e => e.id === g.currentExitEffect)?.name || 'Efecto' : 'Sin Efecto'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Last Medals */}
                                <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm flex-1">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <Award className="text-[#ED8936]" size={20} />
                                            <h3 className="text-lg font-black text-[#1A365D] uppercase tracking-tighter">Últimas Medallas</h3>
                                        </div>
                                        <button onClick={() => setActiveTab('medals')} className="text-[10px] font-bold uppercase tracking-widest text-[#4299E1] hover:underline">Ver Todas ({medals.length})</button>
                                    </div>
                                    {medals.length > 0 ? (
                                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                            {medals.slice(-3).reverse().map(m => (
                                                <div key={m.id} className="min-w-[120px] bg-gradient-to-b from-white to-[#F4F7FA] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                                                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${m.iconSeed}&backgroundColor=transparent`} className="w-12 h-12 mb-3 drop-shadow-md" alt="Medal" />
                                                    <span className="text-[10px] font-black text-[#1A365D] uppercase leading-tight truncate w-full">{m.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full py-8 flex flex-col items-center justify-center opacity-40">
                                            <Award size={32} className="text-[#A0AEC0] mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#718096]">Sin medallas aún</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHOP */}
                    {activeTab === 'shop' && (<div className="space-y-12">
                        <div className="flex items-center gap-4 mb-8">
                            <Disc className="text-[#FF8C9D]" size={24} />
                            <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Skins Destacadas</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{shopItems.filter(i => i.type === 'skin').map(item => {
                            const owned = unlockedAvatars.includes(item.src); const ok = coins >= item.price; return (
                                <div key={item.id} className={`group bg-white border border-[#E2E8F0] rounded-[32px] p-5 flex flex-col items-center text-center gap-4 transition-all hover:shadow-2xl hover:border-[#FF8C9D]/20 ${owned ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                    <div className="w-24 h-24 rounded-[28px] bg-[#F4F7FA] overflow-hidden shadow-inner group-hover:scale-105 transition-transform"><img src={item.src} alt={item.name} className="w-full h-full object-cover" /></div>
                                    <div>
                                        <h4 className="font-black text-[#1A365D] uppercase text-xs tracking-tight mb-1">{item.name}</h4>
                                        <div className="text-amber-500 font-mono font-black text-sm">🪙 {item.price.toLocaleString()}</div>
                                    </div>
                                    <button disabled={owned || !ok} onClick={() => handleBuy(item)} className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-sm ${owned ? 'bg-[#F4F7FA] text-[#A0AEC0]' : ok ? 'bg-[#1A365D] text-white hover:bg-[#FF8C9D] shadow-[#FF8C9D]/20' : 'bg-[#F4F7FA] text-[#A0AEC0]'}`}>{owned ? 'En Propiedad' : ok ? 'Comprar' : 'Ahorrar Más'}</button>
                                </div>);
                        })}</div>

                        <div className="flex items-center gap-4 mb-8 pt-6">
                            <Zap className="text-[#9F7AEA]" size={24} />
                            <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Efectos Especiales</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{shopItems.filter(i => i.type === 'effect').map(item => {
                            const owned = (g.unlockedEffects || []).includes(item.id); const ok = coins >= item.price; const Icon = iconMap[item.icon] || Star; return (
                                <div key={item.id} className={`bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-4 hover:shadow-xl transition-all ${owned ? 'opacity-40' : ''}`}>
                                    <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] flex items-center justify-center shrink-0 border border-purple-50 shadow-inner"><Icon size={24} className="text-[#9F7AEA]" /></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-[#1A365D] uppercase text-[11px] truncate">{item.name}</h4>
                                        <div className="text-amber-500 font-mono font-black text-xs">🪙 {item.price.toLocaleString()}</div>
                                    </div>
                                    <button disabled={owned || !ok} onClick={() => handleBuy(item)} className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase shrink-0 transition-all ${owned ? 'text-[#9F7AEA]' : ok ? 'bg-[#1A365D] text-white hover:bg-[#9F7AEA]' : 'text-[#A0AEC0]'}`}>{owned ? '✓' : ok ? 'Gastar' : '...'}</button>
                                </div>);
                        })}</div>
                    </div>)}

                    {/* INVENTORY */}
                    {activeTab === 'inventory' && (<div className="space-y-12">
                        {pendingRewards > 0 ? (
                            <div className="bg-gradient-to-br from-[#FF8C9D] to-[#9F7AEA] rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl shadow-[#FF8C9D]/30 border-4 border-white">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                                <div className="relative z-10 text-center md:text-left">
                                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{pendingRewards} Recompensas Listas</h3>
                                    <p className="text-white/80 text-xs font-black uppercase tracking-widest mt-4 opacity-70">Desbloquea contenido premium ahora mismo</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectingTheme(true)} className="relative z-10 px-10 py-5 bg-white text-[#FF8C9D] font-black rounded-[24px] shadow-2xl flex items-center gap-4 uppercase text-sm tracking-widest hover:text-[#9F7AEA] transition-all"><Gift size={24} className="animate-bounce" /> Abrir Cofre</motion.button>
                            </div>
                        ) : (
                            <div className="bg-[#F4F7FA] rounded-[32px] p-8 border-2 border-dashed border-[#E2E8F0] text-center">
                                <p className="text-[#718096] font-bold text-sm">No tienes cofres pendientes. ¡Sigue rindiendo para subir de nivel!</p>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <User className="text-[#4299E1]" size={24} />
                            <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Mi Armario ({unlockedAvatars.length})</h3>
                        </div>

                        {unlockedAvatars.length === 0 ? (
                            <div className="py-20 flex flex-col items-center opacity-30">
                                <Disc size={64} className="text-[#A0AEC0] mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest text-[#718096]">Aún no hay skins en tu colección</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {unlockedAvatars.map((url, idx) => {
                                    const eq = currentAvatar === url; return (
                                        <div key={idx} className={`relative group bg-white rounded-[32px] p-3 border-2 transition-all flex flex-col items-center gap-3 cursor-pointer ${eq ? 'border-[#4299E1] shadow-2xl shadow-blue-100' : 'border-transparent hover:border-[#E2E8F0] shadow-sm hover:shadow-xl'}`} onClick={() => handleEquip(url)}>
                                            <div className="w-24 h-24 rounded-[24px] bg-[#F4F7FA] overflow-hidden shadow-inner transform group-hover:scale-110 transition-transform duration-500"><img src={url} alt="" className="w-full h-full object-cover" /></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${eq ? 'text-[#4299E1]' : 'text-[#A0AEC0] group-hover:text-[#4299E1]'}`}>{eq ? 'Activo' : 'Equipar'}</span>
                                            {isManagerial && <button onClick={e => { e.stopPropagation(); handleDeleteAvatar(url) }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100 shadow-xl"><Trash2 size={14} /></button>}
                                        </div>);
                                })}
                            </div>
                        )}
                    </div>)}

                    {/* EFFECTS */}
                    {activeTab === 'effects' && (<div className="space-y-16">
                        {['entry', 'exit'].map(type => {
                            const isE = type === 'entry'; const cur = isE ? g.currentEntryEffect : g.currentExitEffect; const fx = g.unlockedEffects || []; return (
                                <div key={type} className="animate-in slide-in-from-bottom duration-500">
                                    <div className="flex items-center gap-4 mb-8">
                                        {isE ? <Zap className="text-[#F6AD55]" size={24} /> : <Disc className="text-[#9F7AEA]" size={24} />}
                                        <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">{isE ? 'Efecto al Entrar' : 'Efecto al Salir'}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {rewardEffects.map(f => {
                                            const Icon = iconMap[f.icon] || Star; const own = fx.includes(f.id); const eq = cur === f.id; return (
                                                <div key={f.id} onClick={() => own && handleEquipEffect(f.id, type)} className={`group relative rounded-3xl p-6 border-2 transition-all overflow-hidden ${!own ? 'bg-[#F4F7FA]/50 border-transparent opacity-50 grayscale cursor-not-allowed' : eq ? 'bg-[#F0FFF4] border-[#48BB78] shadow-2xl shadow-[#48BB78]/10' : 'bg-white border-[#E2E8F0] hover:border-[#9F7AEA] cursor-pointer shadow-sm hover:shadow-xl'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${eq ? 'bg-[#48BB78] text-white' : 'bg-[#F4F7FA] text-[#A0AEC0] group-hover:text-[#9F7AEA]'}`}><Icon size={24} /></div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`font-black uppercase text-xs tracking-tighter truncate ${eq ? 'text-[#2F855A]' : 'text-[#1A365D]'}`}>{f.name}</h4>
                                                            <span className="text-[10px] font-black tracking-widest uppercase">{!own ? <span className="text-[#A0AEC0]">Cofre</span> : eq ? <span className="text-[#48BB78] animate-pulse">Equipado</span> : <span className="text-[#A0AEC0] group-hover:text-[#9F7AEA]">Usar</span>}</span>
                                                        </div>
                                                    </div>
                                                </div>);
                                        })}
                                        <div onClick={() => handleEquipEffect(null, type)} className={`rounded-3xl p-6 border-2 flex items-center gap-4 cursor-pointer transition-all ${!cur ? 'bg-[#F4F7FA] border-[#A0AEC0]' : 'bg-white border-[#E2E8F0] hover:border-[#A0AEC0] opacity-60'}`}>
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] text-[#A0AEC0] flex items-center justify-center shadow-sm"><X size={24} /></div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-[#A0AEC0] uppercase text-xs tracking-tighter">Desactivado</h4>
                                                {!cur && <span className="text-[9px] font-black text-[#718096] uppercase tracking-widest">Estado Actual</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>);
                        })}
                    </div>)}

                    {/* BORDERS */}
                    {activeTab === 'borders' && (<div className="space-y-12">
                        <div className="flex items-center gap-4 mb-8">
                            <Square className="text-[#38B2AC]" size={24} />
                            <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Marcos de Perfil</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            {shopItems.filter(i => i.type === 'border').map(item => {
                                const owned = unlockedBorders.includes(item.id); const eq = currentBorder === item.id; const ok = coins >= item.price;
                                const borderStyle = item.color === 'rainbow' ? { borderImage: 'linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7) 1' } : { borderColor: item.color };
                                const glowStyle = item.glow && owned ? { boxShadow: `0 12px 40px ${item.color === 'rainbow' ? 'rgba(168,85,247,0.2)' : item.color + '33'}` } : {};
                                return (
                                    <div key={item.id} className={`bg-white rounded-[32px] p-6 border-2 transition-all flex flex-col items-center gap-5 relative group ${eq ? 'scale-105 z-10' : 'border-[#E2E8F0]'}`} style={owned ? { ...borderStyle, ...glowStyle, borderWidth: eq ? 4 : 2 } : {}}>
                                        <div className="w-20 h-14 rounded-2xl border-[3px] flex items-center justify-center bg-[#F4F7FA] group-hover:scale-110 transition-transform duration-500" style={{ ...(item.color === 'rainbow' ? { borderImage: 'linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7) 1' } : { borderColor: item.color }), ...(item.glow ? { boxShadow: `0 0 15px ${item.color === 'rainbow' ? '#C026D3' : item.color}44` } : {}) }}>
                                            <span className="text-[10px] text-[#A0AEC0] font-black tracking-widest uppercase">Skin</span>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="font-black text-[#1A365D] uppercase text-xs mb-1">{item.name}</h4>
                                            {!owned && <div className="text-amber-500 font-mono font-black text-xs italic tracking-tighter">🪙 {item.price.toLocaleString()}</div>}
                                        </div>
                                        {!owned ? (
                                            <button disabled={!ok} onClick={() => handleBuy(item)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase shadow-sm transition-all ${ok ? 'bg-[#1A365D] text-white hover:bg-[#38B2AC]' : 'bg-[#F4F7FA] text-[#A0AEC0]'}`}>{ok ? 'Comprar Marco' : 'No Tienes Plata'}</button>
                                        ) : (
                                            <button onClick={() => handleEquipBorder(eq ? null : item.id)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all shadow-sm ${eq ? 'bg-[#38B2AC] text-white' : 'bg-[#F4F7FA] text-[#1A365D] hover:bg-[#E2E8F0]'}`}>{eq ? 'Activo' : 'Equipar'}</button>
                                        )}
                                    </div>);
                            })}
                        </div>
                    </div>)}

                    {/* MEDALS */}
                    {activeTab === 'medals' && (<div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Award className="text-[#ED8936]" size={24} />
                                <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Medallas Honoríficas</h3>
                            </div>
                            {isManagerial && <button onClick={() => { setShowMedalPanel(true); loadMedalPreviews() }} className="px-6 py-3 bg-[#EBF8FF] text-[#2B6CB0] font-black rounded-2xl text-[10px] uppercase flex items-center gap-3 border border-[#BEE3F8] shadow-sm hover:bg-[#BEE3F8] transition-all"><Plus size={14} /> Otorgar Nueva</button>}
                        </div>
                        {medals.length === 0 ? (
                            <div className="py-24 flex flex-col items-center bg-[#F4F7FA] rounded-[48px] border-2 border-dashed border-[#E2E8F0]">
                                <Award size={80} className="text-[#E2E8F0] mb-6" />
                                <p className="text-sm font-black uppercase tracking-widest text-[#A0AEC0]">Aún no has recibido medallas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {medals.map(m => (
                                    <div key={m.id} className="bg-white border border-[#E2E8F0] rounded-[32px] p-6 flex items-start gap-6 group hover:shadow-2xl transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
                                        <div className="w-20 h-20 rounded-[28px] bg-[#FFFBEB] border border-amber-100 overflow-hidden shrink-0 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 p-2"><img src={m.icon} alt="" className="w-full h-full object-contain" /></div>
                                        <div className="flex-1 pt-1 min-w-0">
                                            <h4 className="font-black text-[#1A365D] uppercase text-lg tracking-tighter leading-none mb-2">{m.title}</h4>
                                            {m.comment && <p className="text-[#A0AEC0] text-xs font-medium leading-relaxed italic mb-4">"{m.comment}"</p>}
                                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-[#ED8936] bg-[#FFFBEB] px-3 py-1 rounded-full border border-amber-100">{new Date(m.date).toLocaleDateString('es-ES')}</span>
                                                <span className="text-[#A0AEC0]">Mérito Directivo</span>
                                            </div>
                                        </div>
                                        {isManagerial && <button onClick={() => handleDeleteMedal(m.id)} className="absolute top-4 right-4 p-2 text-[#A0AEC0] hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-[#F4F7FA]"><Trash2 size={14} /></button>}
                                    </div>))}
                            </div>
                        )}

                        <AnimatePresence>{showMedalPanel && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-[#1A365D]/40 backdrop-blur-xl flex items-center justify-center p-6">
                            <div className="bg-white rounded-[40px] border border-white p-10 w-full max-w-xl space-y-8 shadow-[0_40px_80px_rgba(0,0,0,0.2)]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase grayscale brightness-50">Crear Reconocimiento</h3>
                                    <button onClick={() => setShowMedalPanel(false)} className="w-10 h-10 bg-[#F4F7FA] rounded-full flex items-center justify-center text-[#A0AEC0] hover:text-[#1A365D]"><X size={20} /></button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Elige Icono</label>
                                        <button onClick={loadMedalPreviews} className="text-[10px] text-[#FF8C9D] font-black hover:bg-[#FFF0F3] px-3 py-1 rounded-full flex items-center gap-2 transition-all"><RefreshCw size={12} /> Regenerar</button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 bg-[#F4F7FA] p-6 rounded-[32px] border border-[#E2E8F0] shadow-inner">
                                        {medalPreviews.map((p, i) => (
                                            <button key={i} onClick={() => setSelectedMedalIcon(p)} className={`aspect-square p-2 bg-white rounded-2xl flex items-center justify-center transition-all shadow-xl ${selectedMedalIcon?.seed === p.seed ? 'scale-110 shadow-[#FF8C9D]/20 ring-4 ring-[#FF8C9D]/10' : 'opacity-40 hover:opacity-100 ring-2 ring-transparent'}`}>
                                                <img src={p.url} alt="" className="w-full h-full object-contain" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <input type="text" placeholder="Título Épico..." value={medalTitle} onChange={e => setMedalTitle(e.target.value)} className="w-full px-6 py-4 bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white rounded-2xl text-[#1A365D] font-black text-lg outline-none transition-all" />
                                    <textarea placeholder="Motivo del premio..." value={medalComment} onChange={e => setMedalComment(e.target.value)} rows={3} className="w-full px-6 py-4 bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white rounded-2xl text-[#1A365D] font-medium text-sm outline-none transition-all resize-none" />
                                </div>
                                <button onClick={handleAssignMedal} className="w-full py-6 bg-[#1A365D] text-white font-black rounded-3xl uppercase tracking-[0.2em] shadow-2xl hover:bg-[#FF8C9D] transition-all active:scale-95">Publicar Medalla</button>
                            </div>
                        </motion.div>)}</AnimatePresence>
                    </div>)}

                    {/* MANAGER */}
                    {activeTab === 'manager' && isManagerial && (<div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                        <div className="flex items-center gap-4 mb-8">
                            <Star className="text-[#F56565]" size={24} />
                            <h3 className="text-xl font-black text-[#1A365D] tracking-tighter uppercase">Panel de Gestión: {employee.alias || employee.firstName}</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[40px] border border-[#E2E8F0] p-8 shadow-sm space-y-6">
                                <h4 className="font-black text-[#1A365D] text-lg uppercase tracking-widest flex items-center gap-3"><Gift className="text-amber-500" size={20} /> Inyectar Premios</h4>
                                <div className="grid grid-cols-3 gap-6">
                                    {[{ k: 'coins', l: 'Oro', c: '#ECC94B' }, { k: 'chests', l: 'Cofres', c: '#ED8936' }, { k: 'xp', l: 'Puntos', c: '#4299E1' }].map(f => (
                                        <div key={f.k} className="space-y-2">
                                            <label className="text-[10px] text-[#A0AEC0] font-black uppercase tracking-widest ml-1">{f.l}</label>
                                            <input type="number" min="0" value={grantData[f.k]} onChange={e => setGrantData({ ...grantData, [f.k]: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] rounded-2xl text-[#1A365D] font-black text-center outline-none" style={{ color: f.c }} />
                                        </div>
                                    ))}
                                </div>
                                <input type="text" placeholder="¿Por qué este premio? (Ejem: Bonus diario)" value={grantData.reason} onChange={e => setGrantData({ ...grantData, reason: e.target.value })} className="w-full p-4 bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] rounded-2xl text-sm font-medium outline-none" />
                                <button onClick={handleGrantReward} className="w-full py-5 bg-[#1A365D] text-white font-black rounded-3xl uppercase tracking-widest shadow-xl hover:bg-[#F56565] transition-all">Ejecutar Envío</button>
                            </div>

                            <div className="bg-[#F4F7FA] rounded-[40px] p-8 space-y-6">
                                <h4 className="font-black text-[#1A365D] text-xs uppercase tracking-widest flex items-center gap-3 opacity-50"><Disc size={16} /> Actividad Reciente</h4>
                                <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                    {g.rewardHistory && [...g.rewardHistory].reverse().slice(0, 15).map((e, i) => (
                                        <div key={i} className="bg-white/80 p-4 rounded-2xl flex items-center justify-between border border-white shadow-sm hover:shadow-md transition-all">
                                            <div className="min-w-0 pr-4"><p className="text-[#1A365D] font-black text-xs truncate uppercase tracking-tighter">{e.reason}</p><p className="text-[#A0AEC0] text-[9px] font-bold mt-1 uppercase">{new Date(e.date).toLocaleDateString()}</p></div>
                                            <div className="flex gap-2 shrink-0">
                                                {e.coins > 0 && <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-[10px] font-black">🪙{e.coins}</span>}
                                                {e.chests > 0 && <span className="text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg text-[10px] font-black">📦{e.chests}</span>}
                                                {e.xp > 0 && <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-[10px] font-black">⚡{e.xp} Pts</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>)}
                </div>
            </motion.div>
        </div>
    );
};
export default KioskoModal;
