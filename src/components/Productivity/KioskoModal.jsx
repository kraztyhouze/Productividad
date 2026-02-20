import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, User, Gift, Star, Disc, Zap, Sparkles, Flame, Binary, PartyPopper, Music, Trash2, Award, Plus, RefreshCw, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap = { sparkles: Sparkles, flame: Flame, code: Binary, party: PartyPopper, music: Music, zap: Zap };
const PREMIUM_THEMES = ['Dragon Ball', 'Marvel', 'Disney', 'Música', 'Fútbol'];

const KioskoModal = ({ isOpen, onClose, employee, updateEmployee, isManagerial, user }) => {
    const [activeTab, setActiveTab] = useState('shop');
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
            setActiveTab('shop');
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
            if (data.success) { syncGamification(data.gamification); alert('¡Compra realizada!'); } else alert(data.error);
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
        try { const res = await fetch('/api/gamification/grant-reward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, ...grantData }) }); const d = await res.json(); if (d.success) { syncGamification(d.gamification); setGrantData({ coins: 0, chests: 0, xp: 0, reason: '' }); alert('¡Premio entregado!'); } } catch (e) { console.error(e); }
    };

    const loadMedalPreviews = async () => { try { const r = await fetch('/api/gamification/medal-previews?count=9'); setMedalPreviews(await r.json()); setSelectedMedalIcon(null); } catch (e) { console.error(e); } };

    const handleAssignMedal = async () => {
        if (!medalTitle.trim()) return alert('Escribe un título.'); if (!selectedMedalIcon) return alert('Selecciona un icono.');
        try { const res = await fetch('/api/gamification/assign-medal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: employee.id, title: medalTitle, comment: medalComment, iconSeed: selectedMedalIcon.seed }) }); const d = await res.json(); if (d.success) { syncGamification(d.gamification); setShowMedalPanel(false); setMedalTitle(''); setMedalComment(''); alert('¡Medalla asignada!'); } } catch (e) { console.error(e); }
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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[#0f172a] w-full max-w-4xl h-[85vh] rounded-3xl border border-pink-500/30 shadow-[0_0_50px_-10px_rgba(236,72,153,0.3)] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1e293b]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/50"><ShoppingBag className="text-pink-400" size={18} /></div>
                        <div>
                            <h2 className="text-lg font-black text-white italic tracking-tight">KIOSKO <span className="text-pink-500">TIKTAK</span></h2>
                            <p className="text-slate-400 text-xs font-bold uppercase">{employee.alias || employee.firstName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/30 flex items-center gap-2">
                            <span className="text-lg">🪙</span><span className="text-lg font-bold text-yellow-400 font-mono">{coins.toLocaleString()}</span>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 text-[10px]">
                    {[{ id: 'shop', label: 'Tienda', icon: ShoppingBag, c: 'pink' }, { id: 'inventory', label: 'Inventario', icon: User, c: 'blue', badge: pendingRewards }, { id: 'effects', label: 'Efectos', icon: Zap, c: 'purple' }, { id: 'borders', label: 'Bordes', icon: Square, c: 'cyan' }, { id: 'medals', label: 'Medallas', icon: Award, c: 'amber', badge: medals.length }, ...(isManagerial ? [{ id: 'manager', label: 'Gestión', icon: Star, c: 'red' }] : [])].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-2.5 font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors relative ${activeTab === t.id ? 'text-white bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                            <t.icon size={12} />{t.label}{t.badge > 0 && <span className="ml-1 bg-yellow-500 text-black text-[8px] px-1 rounded-full font-bold">{t.badge}</span>}
                            {activeTab === t.id && <motion.div layoutId="kiosk-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 bg-[#0f172a] custom-scrollbar relative">
                    {/* Theme Overlay */}
                    <AnimatePresence>{selectingTheme && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 text-center">
                        <h3 className="text-2xl font-black text-white italic uppercase mb-6">Elige tu Temática</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-xl">{PREMIUM_THEMES.map(t => (<button key={t} onClick={() => processChestOpening(t)} className="bg-[#1e293b] hover:bg-pink-600 border border-white/10 hover:border-pink-400 p-5 rounded-2xl transition-all flex flex-col items-center gap-2"><span className="text-xl">✨</span><span className="text-white font-bold uppercase text-sm">{t}</span></button>))}</div>
                        <button onClick={() => setSelectingTheme(false)} className="mt-6 text-slate-500 hover:text-white underline text-xs uppercase">Cancelar</button>
                    </motion.div>)}</AnimatePresence>

                    {/* Chest Opening Overlay */}
                    <AnimatePresence>{(openingChest || rewardReveal) && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
                        {!rewardReveal ? (<div className="text-center"><motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="mb-6"><Gift size={100} className="text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,0.6)]" strokeWidth={1} /></motion.div><h3 className="text-2xl font-black text-white uppercase italic animate-pulse">Abriendo Cofre...</h3></div>) : (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center flex flex-col items-center">
                                <div className="relative mb-6"><div className="absolute inset-0 bg-pink-500/30 blur-3xl rounded-full" />
                                    {rewardReveal.type === 'effect' ? (<div className="w-40 h-40 rounded-3xl border-4 border-yellow-400 flex items-center justify-center bg-[#1e293b] shadow-[0_0_50px_rgba(250,204,21,0.5)] z-10 relative"><Sparkles size={60} className="text-yellow-400 animate-pulse" /></div>) : (<motion.img src={rewardReveal.src} alt="" className="w-40 h-40 rounded-3xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] relative z-10 bg-[#1e293b]" initial={{ y: 40 }} animate={{ y: 0 }} />)}
                                </div>
                                <h3 className="text-3xl font-black mb-1 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600">¡Obtenido!</h3>
                                <p className="text-slate-400 font-medium mb-1">{rewardReveal.type === 'effect' ? <span>Efecto: <span className="text-purple-400 font-bold">{rewardReveal.name}</span></span> : <span>Avatar: <span className="text-pink-400 font-bold">{rewardReveal.name}</span></span>}</p>
                                {rewardReveal.theme && <p className="text-xs text-slate-500 mb-6">Set: {rewardReveal.theme}</p>}
                                <button onClick={() => { setOpeningChest(false); setRewardReveal(null) }} className="px-6 py-2.5 bg-white text-black font-black rounded-xl hover:bg-slate-200 uppercase tracking-wider text-sm">Continuar</button>
                            </motion.div>)}
                    </motion.div>)}</AnimatePresence>

                    {/* SHOP */}
                    {activeTab === 'shop' && (<div className="space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Disc className="text-pink-500" size={18} /> Skins</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{shopItems.filter(i => i.type === 'skin').map(item => {
                            const owned = unlockedAvatars.includes(item.src); const ok = coins >= item.price; return (
                                <div key={item.id} className={`bg-[#1e293b]/50 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-pink-500/50 transition-all ${owned ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="w-16 h-16 rounded-full bg-[#0f172a] overflow-hidden"><img src={item.src} alt={item.name} className="w-full h-full" /></div>
                                    <h4 className="font-bold text-white text-xs">{item.name}</h4>
                                    <div className="text-yellow-400 font-mono font-bold text-xs">🪙 {item.price}</div>
                                    <button disabled={owned || !ok} onClick={() => handleBuy(item)} className={`w-full py-1.5 rounded-lg font-bold text-[10px] uppercase ${owned ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : ok ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>{owned ? 'Comprado' : ok ? 'Comprar' : 'Insuficiente'}</button>
                                </div>);
                        })}</div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 pt-4"><Zap className="text-purple-500" size={18} /> Efectos (Comprar)</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{shopItems.filter(i => i.type === 'effect').map(item => {
                            const owned = (g.unlockedEffects || []).includes(item.id); const ok = coins >= item.price; const Icon = iconMap[item.icon] || Star; return (
                                <div key={item.id} className={`bg-[#1e293b]/50 border border-white/5 rounded-xl p-3 flex items-center gap-3 ${owned ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0"><Icon size={18} className="text-purple-400" /></div>
                                    <div className="flex-1 min-w-0"><h4 className="font-bold text-white text-xs truncate">{item.name}</h4><div className="text-yellow-400 font-mono text-[10px]">🪙 {item.price.toLocaleString()}</div></div>
                                    <button disabled={owned || !ok} onClick={() => handleBuy(item)} className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase shrink-0 ${owned ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : ok ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>{owned ? '✓' : ok ? 'Comprar' : '—'}</button>
                                </div>);
                        })}</div>
                    </div>)}

                    {/* INVENTORY */}
                    {activeTab === 'inventory' && (<div className="space-y-6">
                        {pendingRewards > 0 ? (<div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                            <div className="relative z-10"><h3 className="text-xl font-black text-white italic uppercase">¡{pendingRewards} Cofre{pendingRewards > 1 ? 's' : ''} Disponible{pendingRewards > 1 ? 's' : ''}!</h3><p className="text-xs text-yellow-500/80 uppercase font-bold mt-1">Contienen Avatares Premium y Efectos</p></div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectingTheme(true)} className="relative z-10 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-2 uppercase text-sm"><Gift className="animate-bounce" size={18} /> Abrir</motion.button>
                        </div>) : (<div className="bg-[#1e293b]/30 rounded-xl p-4 border border-white/5 text-center"><p className="text-slate-500 text-xs">No tienes cofres. ¡Sube de nivel para ganar más!</p></div>)}
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><User className="text-blue-500" size={18} /> Mi Colección ({unlockedAvatars.length})</h3>
                        {unlockedAvatars.length === 0 ? (<p className="text-slate-500 italic text-xs">Aún no tienes avatares.</p>) : (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{unlockedAvatars.map((url, idx) => {
                                const eq = currentAvatar === url; return (
                                    <div key={idx} className={`relative group bg-[#1e293b] rounded-xl p-2 border-2 transition-all flex flex-col items-center gap-1 ${eq ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-transparent hover:border-slate-600'}`}>
                                        <div className="w-14 h-14 rounded-full bg-[#0f172a] overflow-hidden cursor-pointer" onClick={() => handleEquip(url)}><img src={url} alt="" className="w-full h-full object-cover" /></div>
                                        <span className={`text-[9px] font-bold uppercase cursor-pointer ${eq ? 'text-green-400' : 'text-slate-500 group-hover:text-white'}`} onClick={() => handleEquip(url)}>{eq ? 'Equipado' : 'Equipar'}</span>
                                        {isManagerial && <button onClick={e => { e.stopPropagation(); handleDeleteAvatar(url) }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={8} className="text-white" /></button>}
                                    </div>);
                            })}</div>)}
                    </div>)}

                    {/* EFFECTS */}
                    {activeTab === 'effects' && (<div className="space-y-8">{['entry', 'exit'].map(type => {
                        const isE = type === 'entry'; const cur = isE ? g.currentEntryEffect : g.currentExitEffect; const fx = g.unlockedEffects || []; return (<div key={type}>
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">{isE ? <Zap className="text-yellow-400" size={18} /> : <Disc className="text-purple-400" size={18} />}{isE ? 'Efectos de Entrada' : 'Efectos de Salida'}</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {rewardEffects.map(f => {
                                    const Icon = iconMap[f.icon] || Star; const own = fx.includes(f.id); const eq = cur === f.id; return (
                                        <div key={f.id} onClick={() => own && handleEquipEffect(f.id, type)} className={`border rounded-xl p-3 flex items-center gap-3 transition-all ${!own ? 'border-white/5 opacity-40 grayscale cursor-not-allowed' : eq ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-white/30 cursor-pointer hover:bg-white/5 bg-[#1e293b]'}`}>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${eq ? 'bg-green-500 text-black' : 'bg-slate-800 text-slate-400'}`}><Icon size={20} /></div>
                                            <div><h4 className="font-bold text-white text-xs">{f.name}</h4><span className="text-[9px] uppercase font-bold">{!own ? <span className="text-red-500">Bloqueado</span> : eq ? <span className="text-green-400 animate-pulse">Activo</span> : <span className="text-slate-500">Activar</span>}</span></div>
                                        </div>);
                                })}
                                <div onClick={() => handleEquipEffect(null, type)} className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 bg-[#1e293b] ${!cur ? 'border-green-500 bg-green-500/10' : 'border-white/10'}`}>
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center"><X size={20} /></div>
                                    <div><h4 className="font-bold text-white text-xs">Sin Efecto</h4>{!cur && <span className="text-[9px] text-green-400 uppercase font-bold">Activo</span>}</div>
                                </div>
                            </div></div>);
                    })}</div>)}

                    {/* BORDERS */}
                    {activeTab === 'borders' && (<div className="space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Square className="text-cyan-500" size={18} /> Bordes de Tarjeta</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{shopItems.filter(i => i.type === 'border').map(item => {
                            const owned = unlockedBorders.includes(item.id); const eq = currentBorder === item.id; const ok = coins >= item.price;
                            const borderStyle = item.color === 'rainbow' ? { borderImage: 'linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7) 1' } : { borderColor: item.color };
                            const glowStyle = item.glow && owned ? { boxShadow: `0 0 15px ${item.color === 'rainbow' ? 'rgba(168,85,247,0.4)' : item.color + '66'}` } : {};
                            return (<div key={item.id} className={`bg-[#1e293b] rounded-xl p-4 border-2 transition-all flex flex-col items-center gap-3 ${eq ? '' : 'border-white/10'}`} style={owned ? { ...borderStyle, ...glowStyle } : {}}>
                                <div className="w-16 h-10 rounded-lg border-3 flex items-center justify-center" style={{ borderWidth: 3, ...(item.color === 'rainbow' ? { borderImage: 'linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7) 1' } : { borderColor: item.color }), ...(item.glow ? { boxShadow: `0 0 10px ${item.color === 'rainbow' ? '#a855f7' : item.color}55` } : {}) }}>
                                    <span className="text-[10px] text-slate-400 font-bold">CARD</span>
                                </div>
                                <h4 className="font-bold text-white text-xs">{item.name}</h4>
                                {!owned ? (<><div className="text-yellow-400 font-mono text-[10px]">🪙 {item.price.toLocaleString()}</div><button disabled={!ok} onClick={() => handleBuy(item)} className={`w-full py-1.5 rounded-lg font-bold text-[10px] uppercase ${ok ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>{ok ? 'Comprar' : 'Insuficiente'}</button></>) : (
                                    <button onClick={() => handleEquipBorder(eq ? null : item.id)} className={`w-full py-1.5 rounded-lg font-bold text-[10px] uppercase ${eq ? 'bg-green-500 text-black' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>{eq ? 'Equipado' : 'Equipar'}</button>
                                )}
                            </div>);
                        })}</div>
                    </div>)}

                    {/* MEDALS */}
                    {activeTab === 'medals' && (<div className="space-y-4">
                        <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Award className="text-amber-500" size={18} /> Medallas</h3>
                            {isManagerial && <button onClick={() => { setShowMedalPanel(true); loadMedalPreviews() }} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-[10px] uppercase flex items-center gap-1"><Plus size={12} />Crear</button>}
                        </div>
                        {medals.length === 0 ? (<div className="bg-[#1e293b]/30 rounded-xl p-8 border border-white/5 text-center"><Award size={36} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-500 text-xs">Sin medallas aún.</p></div>) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{medals.map(m => (<div key={m.id} className="bg-[#1e293b] border border-amber-500/20 rounded-xl p-3 flex items-start gap-3 group hover:border-amber-500/40 relative">
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 overflow-hidden shrink-0 flex items-center justify-center"><img src={m.icon} alt="" className="w-10 h-10" /></div>
                                <div className="flex-1 min-w-0"><h4 className="font-bold text-white text-xs truncate">{m.title}</h4>{m.comment && <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-2">{m.comment}</p>}<p className="text-[9px] text-slate-600 mt-1 font-mono">{new Date(m.date).toLocaleDateString('es-ES')}</p></div>
                                {isManagerial && <button onClick={() => handleDeleteMedal(m.id)} className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>}
                            </div>))}</div>)}
                        <AnimatePresence>{showMedalPanel && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
                            <div className="bg-[#1e293b] rounded-2xl border border-amber-500/30 p-6 w-full max-w-md space-y-4">
                                <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Award className="text-amber-500" size={18} />Crear Medalla</h3><button onClick={() => setShowMedalPanel(false)} className="text-slate-400 hover:text-white"><X size={18} /></button></div>
                                <div><div className="flex items-center justify-between mb-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Icono</label><button onClick={loadMedalPreviews} className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1"><RefreshCw size={10} />Regenerar</button></div>
                                    <div className="grid grid-cols-3 gap-2">{medalPreviews.map((p, i) => (<button key={i} onClick={() => setSelectedMedalIcon(p)} className={`p-2 rounded-lg border-2 bg-[#0f172a] flex items-center justify-center ${selectedMedalIcon?.seed === p.seed ? 'border-amber-500 scale-105' : 'border-white/10 hover:border-white/30'}`}><img src={p.url} alt="" className="w-10 h-10" /></button>))}</div></div>
                                <input type="text" placeholder="Título..." value={medalTitle} onChange={e => setMedalTitle(e.target.value)} className="w-full p-2 bg-[#0f172a] border border-white/10 rounded-lg text-white text-sm focus:border-amber-500 outline-none" />
                                <textarea placeholder="Comentario..." value={medalComment} onChange={e => setMedalComment(e.target.value)} rows={2} className="w-full p-2 bg-[#0f172a] border border-white/10 rounded-lg text-white text-sm focus:border-amber-500 outline-none resize-none" />
                                <button onClick={handleAssignMedal} className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg uppercase text-xs">Asignar</button>
                            </div>
                        </motion.div>)}</AnimatePresence>
                    </div>)}

                    {/* MANAGER */}
                    {activeTab === 'manager' && isManagerial && (<div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Star className="text-red-500" size={18} />Gestión de {employee.alias || employee.firstName}</h3>
                        <div className="bg-[#1e293b] rounded-xl border border-white/10 p-4 space-y-3">
                            <h4 className="font-bold text-white text-sm flex items-center gap-2"><Gift className="text-yellow-400" size={16} />Dar Premios</h4>
                            <div className="grid grid-cols-3 gap-3">{[{ k: 'coins', l: 'Monedas', c: 'yellow' }, { k: 'chests', l: 'Cofres', c: 'orange' }, { k: 'xp', l: 'XP', c: 'blue' }].map(f => (<div key={f.k}><label className="text-[9px] text-slate-400 uppercase font-bold">{f.l}</label><input type="number" min="0" value={grantData[f.k]} onChange={e => setGrantData({ ...grantData, [f.k]: parseInt(e.target.value) || 0 })} className={`w-full p-1.5 bg-[#0f172a] border border-white/10 rounded-lg text-${f.c}-400 font-mono text-sm outline-none`} /></div>))}</div>
                            <input type="text" placeholder="Motivo..." value={grantData.reason} onChange={e => setGrantData({ ...grantData, reason: e.target.value })} className="w-full p-1.5 bg-[#0f172a] border border-white/10 rounded-lg text-white text-sm outline-none" />
                            <button onClick={handleGrantReward} className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg uppercase text-xs">Entregar</button>
                        </div>
                        {g.rewardHistory && g.rewardHistory.length > 0 && (<div className="bg-[#1e293b] rounded-xl border border-white/10 p-4"><h4 className="font-bold text-white mb-2 text-xs">Historial</h4><div className="space-y-1 max-h-32 overflow-y-auto">{[...g.rewardHistory].reverse().slice(0, 10).map((e, i) => (<div key={i} className="flex items-center justify-between p-1.5 bg-[#0f172a]/50 rounded text-[10px]"><span className="text-slate-300 truncate mr-2">{e.reason}</span><div className="flex gap-2 text-slate-400 font-mono shrink-0">{e.coins > 0 && <span className="text-yellow-400">🪙{e.coins}</span>}{e.chests > 0 && <span className="text-orange-400">📦{e.chests}</span>}{e.xp > 0 && <span className="text-blue-400">⚡{e.xp}</span>}</div></div>))}</div></div>)}
                        {g.collectionLog && g.collectionLog.length > 0 && (<div className="bg-[#1e293b] rounded-xl border border-white/10 p-4"><h4 className="font-bold text-white mb-2 text-xs">Log de Colección</h4><div className="space-y-1 max-h-32 overflow-y-auto">{[...g.collectionLog].reverse().slice(0, 15).map((e, i) => (<div key={i} className="flex items-center gap-2 p-1.5 bg-[#0f172a]/50 rounded text-[10px]">{e.type === 'avatar' && e.src && <img src={e.src} className="w-5 h-5 rounded" alt="" />}<span className="text-slate-300">{e.type === 'effect' ? `Efecto: ${e.effectName}` : `Avatar: ${e.avatarName} (${e.theme})`}</span><span className="text-slate-600 ml-auto font-mono">{new Date(e.date).toLocaleDateString('es-ES')}</span></div>))}</div></div>)}
                    </div>)}
                </div>
            </motion.div>
        </div>
    );
};
export default KioskoModal;
