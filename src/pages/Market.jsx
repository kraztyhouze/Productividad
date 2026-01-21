import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ExternalLink, Smartphone, Monitor, Watch, Hammer, Gamepad2, CheckCircle, XCircle, Grid, QrCode, Download } from 'lucide-react';
import { generateDiagnosticCertificate } from '../utils/pdfGenerator';

const CATEGORIES = {
    phones: { name: 'Móviles/Tablets', margin: 0.40, icon: <Smartphone size={18} />, color: 'pink', checklist: ['IMEI/Red', 'Cosmético', 'Seguridad', 'Pantalla/Touch', 'Vibración/Sensores', 'Micrófono/Audio', 'Cámaras/Flash', 'GPS', 'Carga'] },
    laptops: { name: 'Portátiles', margin: 0.40, icon: <Monitor size={18} />, color: 'cyan', checklist: ['Enciende', 'Cargador Original', 'Teclado Completo', 'Pantalla sin manchas', 'Webcam/Audio', 'Hardware OK'] },
    consoles: { name: 'Consolas', margin: 0.35, icon: <Gamepad2 size={18} />, color: 'purple', checklist: ['Lee discos/cartuchos', 'Mando conecta', 'No baneada (Online)', 'Garantía precintos'] },
    jewelry: { name: 'Joyería', margin: 0.30, icon: <Watch size={18} />, color: 'amber', checklist: ['Sello de contraste', 'Peso verificado', 'Piedras revisadas', 'Cierre funciona', 'Prueba Ácido/Imán'] },
    tools: { name: 'Herramientas', margin: 0.50, icon: <Hammer size={18} />, color: 'orange', checklist: ['Enciende/Funciona', 'Cableado seguro', 'Accesorios incluidos', 'Sin óxido excesivo'] },
    others: { name: 'Otros', margin: 0.50, icon: <Grid size={18} />, color: 'slate', checklist: ['Estado general bueno', 'Completo', 'Funciona correctamente'] }
};

const GOLD_PRICES_BASE = {
    24: 65.50, // € per gram
    18: 49.10,
    14: 38.20,
    9: 24.50
};

const Market = () => {
    const [mode, setMode] = useState('product'); // 'product' | 'gold'
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Appraisal State
    const [category, setCategory] = useState('phones');
    const [checklist, setChecklist] = useState({});

    // Unified Survey State
    const [survey, setSurvey] = useState({
        askedPrice: '',
        newPrice: '',
        secondHandPrice: '',
        saleType: 'venta', // 'venta' or 'recuperable'
        clientType: 'nuevo', // 'nuevo' or 'habitual'
        hasStock: 'no', // 'si' or 'no'
        hasInvoice: 'no', // 'si' or 'no'
        isHighTurnover: 'no' // 'si' or 'no'
    });

    const [appraisalResult, setAppraisalResult] = useState(null);

    // IMEI State
    const [imeiInput, setImeiInput] = useState('');
    const [imeiCheckResult, setImeiCheckResult] = useState(null);
    const [imeiLoading, setImeiLoading] = useState(false);

    // Gold State
    const [goldForm, setGoldForm] = useState({ weight: '', karats: '18' });
    const [goldQuote, setGoldQuote] = useState(null);

    // Diagnostics State
    const [diagnosticSession, setDiagnosticSession] = useState(null); // { sessionId, url, status, results }

    // Reset checklist when category changes
    useEffect(() => {
        const defaultChecklist = {};
        CATEGORIES[category].checklist.forEach(item => defaultChecklist[item] = null); // null = unchecks, true = yes, false = no
        setChecklist(defaultChecklist);
        setImeiCheckResult(null);
        setImeiInput('');
        setDiagnosticSession(null);
        setAppraisalResult(null); // Reset result
    }, [category]);

    // Poll for Diagnostics Status
    useEffect(() => {
        if (!diagnosticSession || diagnosticSession.status === 'completed') return;

        const poll = setInterval(async () => {
            try {
                const res = await fetch(`/api/diagnostics/session/${diagnosticSession.sessionId}`);
                if (!res.ok) return; // Session might be gone or error
                const data = await res.json();

                // Update Status
                if (data.status && data.status !== diagnosticSession.status) {
                    setDiagnosticSession(prev => ({ ...prev, status: data.status, results: data.results || [], deviceInfo: data.deviceInfo || {} }));
                }

                // Sync Results live
                if (data.results) {
                    setDiagnosticSession(prev => ({ ...prev, results: data.results, deviceInfo: data.deviceInfo || prev.deviceInfo }));
                }

                if (data.status === 'completed') {
                    clearInterval(poll);

                    // Normalize results to map
                    const rs = data.results || [];
                    const testsMap = {};
                    rs.forEach(r => testsMap[r.name] = r.passed);

                    // --- MOBILE CHECKS (Same Logic) ---
                    if (category === 'phones') {
                        if (testsMap['imei'] && testsMap['network']) handleChecklistChange('IMEI/Red', true);
                        if (testsMap['cosmetic']) handleChecklistChange('Cosmético', true);
                        if (testsMap['security']) handleChecklistChange('Seguridad', true);
                        if (testsMap['pixels'] && testsMap['touch']) handleChecklistChange('Pantalla/Touch', true);
                        if (testsMap['vibration'] && testsMap['sensors']) handleChecklistChange('Vibración/Sensores', true);
                        if (testsMap['mic'] && testsMap['audio']) handleChecklistChange('Micrófono/Audio', true);
                        if (testsMap['front-camera'] && testsMap['camera'] && testsMap['flashlight']) handleChecklistChange('Cámaras/Flash', true);
                        if (testsMap['gps']) handleChecklistChange('GPS', true);
                        if (testsMap['charging']) handleChecklistChange('Carga', true);
                    }

                    // --- LAPTOP CHECKS ---
                    if (category === 'laptops') {
                        if (testsMap['keyboard']) {
                            const item = CATEGORIES['laptops'].checklist.find(c => c.includes('Teclado'));
                            if (item) handleChecklistChange(item, true);
                        }
                        if (testsMap['screen']) {
                            const item = CATEGORIES['laptops'].checklist.find(c => c.includes('Pantalla'));
                            if (item) handleChecklistChange(item, true);
                        }
                        if (testsMap['webcam'] && testsMap['audio']) {
                            const item = CATEGORIES['laptops'].checklist.find(c => c.includes('Webcam'));
                            if (item) handleChecklistChange(item, true);
                        }
                        if (testsMap['specs']) {
                            const item = CATEGORIES['laptops'].checklist.find(c => c.includes('Hardware'));
                            if (item) handleChecklistChange(item, true);
                        }
                    }
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        }, 2000); // Poll every 2s

        return () => clearInterval(poll);
    }, [diagnosticSession]);

    const downloadReport = () => generateDiagnosticCertificate(diagnosticSession);

    const startDiagnostic = async (type = 'mobile') => {
        try {
            const res = await fetch('/api/diagnostics/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            if (!res.ok) throw new Error('Init failed');
            const data = await res.json(); // { sessionId, url }

            setDiagnosticSession({
                sessionId: data.sessionId,
                url: `${window.location.origin}${data.url}`, // Prepend origin
                status: 'waiting',
                results: []
            });
        } catch (e) {
            console.error("Error creating session", e);
            alert("Error iniciando diagnóstico. Verifica servidor.");
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setResults([]);
        try {
            const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchTerm)}`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSurveyChange = (e) => {
        const { name, value } = e.target;
        setSurvey(prev => ({ ...prev, [name]: value }));
        if (appraisalResult) setAppraisalResult(null);
    };

    const handleCheckImie = async () => {
        if (!imeiInput || imeiInput.length < 15) {
            alert("Introduce un IMEI válido (15 dígitos)");
            return;
        }
        setImeiLoading(true);
        setImeiCheckResult(null);
        try {
            const res = await fetch('/api/security/check-imei', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imei: imeiInput })
            });
            const data = await res.json();
            setImeiCheckResult(data);

            if (data.status === 'CLEAN') {
                const imeiKey = Object.keys(checklist).find(k => k.includes('IMEI') || k.includes('imei'));
                if (imeiKey) setChecklist(prev => ({ ...prev, [imeiKey]: true }));
            } else {
                const imeiKey = Object.keys(checklist).find(k => k.includes('IMEI') || k.includes('imei'));
                if (imeiKey) setChecklist(prev => ({ ...prev, [imeiKey]: false }));
            }
        } catch (error) {
            console.error(error);
            alert("Error conectando con servicio de seguridad");
        } finally {
            setImeiLoading(false);
        }
    };

    const handleChecklistChange = (item, value) => {
        setChecklist(prev => ({ ...prev, [item]: value }));
        if (appraisalResult) setAppraisalResult(null);
    };

    const calculateAppraisal = (e) => {
        e.preventDefault();

        // 1. Inputs Parsing & Validation
        const asked = parseFloat(survey.askedPrice) || 0;
        const pNew = parseFloat(survey.newPrice) || 0;
        const p2nd = parseFloat(survey.secondHandPrice) || 0;

        if (pNew === 0 && p2nd === 0) {
            alert("Por favor introduce al menos un precio de referencia (Nuevo o 2ª Mano).");
            return;
        }

        // 2. Base Calculation
        // Prefer 2nd hand price as true market value; otherwise derive from new.
        let marketValue = p2nd > 0 ? p2nd : (pNew * 0.65);

        // 3. Condition / Checklist Penalties
        let conditionPenalty = 0;
        let criticalFailure = false;

        // Auto-fail if IMEI blocked
        if (imeiCheckResult && (imeiCheckResult.status === 'BLOCKED' || imeiCheckResult.status === 'INVALID')) {
            criticalFailure = true;
        }

        Object.entries(checklist).forEach(([key, val]) => {
            if (val === false) { // Explicitly failed
                conditionPenalty += 0.15; // 15% value reduction per failed item
            }
        });

        // Apply penalty to market value BEFORE margin
        marketValue = marketValue * (1 - conditionPenalty);

        let targetMargin = 0.30; // Base margin 30%
        let warnings = [];
        let status = 'neutral';
        let statusColor = 'text-slate-200';
        let recommendation = '';

        // --- BUSINESS RULES ---

        // RULE 1: CRITICAL RISK
        const isCriticalRisk = survey.saleType === 'recuperable' && survey.clientType === 'nuevo' && survey.hasInvoice === 'no';

        if (isCriticalRisk || criticalFailure) {
            status = 'PELIGRO';
            statusColor = 'text-red-600';
            recommendation = criticalFailure ? 'PROBLEMA DE SEGURIDAD. NO COMPRAR.' : 'MUCHO CUIDADO. Origen ilícito posible.';
            targetMargin = 0.99; // Effectively reject
        } else {
            // RULE 2: Recup + Stock
            if (survey.saleType === 'recuperable' && survey.hasStock === 'si') {
                warnings.push("Stock alto: Valoración a la baja.");
                targetMargin += 0.05;
            }
            // RULE 3: Venta + Stock
            if (survey.saleType === 'venta' && survey.hasStock === 'si') {
                targetMargin += 0.15;
                warnings.push("Stock alto: Margen aumentado.");
            }
            // RULE 4: High Turnover
            if (survey.saleType === 'venta' && survey.hasStock === 'no' && survey.hasInvoice === 'si' && survey.isHighTurnover === 'si') {
                targetMargin -= 0.10;
                warnings.push("Alta Rotación: Margen reducido.");
            }

            // Standard Adjustments
            if (survey.clientType === 'habitual') targetMargin -= 0.05;
            if (survey.hasInvoice === 'no') targetMargin += 0.05;

            // Cap Margin
            targetMargin = Math.max(0.10, Math.min(0.60, targetMargin));

            // Calculate Optimal Price
            const optimalBuyPrice = marketValue * (1 - targetMargin);
            const actualMargin = marketValue > 0 ? (marketValue - asked) / marketValue : 0;

            // Status Rules
            if (asked > 250) {
                status = 'AUTORIZAR';
                statusColor = 'text-purple-400';
                recommendation = 'Importe > 250€. Revisión requerida.';
            } else if (actualMargin < 0.25) {
                if (asked <= optimalBuyPrice && actualMargin >= 0.20) {
                    status = 'REVISAR';
                    statusColor = 'text-amber-500';
                    recommendation = 'Margen técnico bajo.';
                } else {
                    status = 'REVISAR';
                    statusColor = 'text-red-500';
                    recommendation = 'Margen insuficiente.';
                }
            } else {
                if (asked <= optimalBuyPrice) {
                    status = 'COMPRAR';
                    statusColor = 'text-green-500';
                    recommendation = 'Precio correcto. Proceder.';
                } else {
                    status = 'NEGOCIAR';
                    statusColor = 'text-amber-500';
                    recommendation = `Objetivo: ${optimalBuyPrice.toFixed(0)}€`;
                }
            }
        }

        if (conditionPenalty > 0) warnings.push(`Penalización estado: -${(conditionPenalty * 100).toFixed(0)}%`);
        if (warnings.length > 0) recommendation += ' | ' + warnings.join(' ');

        if (asked > marketValue) {
            status = 'RECHAZAR';
            statusColor = 'text-red-600';
            recommendation = 'Pide más que valor de venta.';
        }

        setAppraisalResult({
            maxBuyPrice: marketValue * (1 - targetMargin),
            marketValue,
            currentMargin: (marketValue > 0 ? (marketValue - asked) / marketValue * 100 : 0).toFixed(1),
            targetMarginPercent: (targetMargin * 100).toFixed(0),
            status,
            statusColor,
            recommendation
        });
    };

    const calculateGold = () => {
        const w = parseFloat(goldForm.weight) || 0;
        const k = parseInt(goldForm.karats) || 18;
        if (w <= 0) return;
        const fluctuation = (Math.random() * 0.8) - 0.4;
        const pricePerGram = GOLD_PRICES_BASE[k] + fluctuation;
        const total = w * pricePerGram;
        setGoldQuote({
            pricePerGram,
            total,
            timestamp: new Date().toLocaleTimeString()
        });
    };

    return (
        <div className="h-full flex flex-col pt-4 px-4 pb-20 relative overflow-y-auto no-scrollbar">

            {/* Top Bar Switcher */}
            <div className="flex justify-center mb-6 shrink-0">
                <div className="bg-slate-900/50 p-1 rounded-xl flex border border-white/10 backdrop-blur-md relative">
                    <button onClick={() => setMode('product')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${mode === 'product' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-400 hover:text-white'}`}>
                        <Search size={16} /> Escáner & Producto
                    </button>
                    <button onClick={() => setMode('gold')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${mode === 'gold' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}>
                        <Watch size={16} /> Cotizador Oro
                    </button>
                </div>
            </div>

            {/* CONTENT: PRODUCT MODE */}
            {mode === 'product' && (
                <div className="flex flex-col xl:flex-row gap-6 mx-auto w-full max-w-[1920px]">

                    {/* LEFT: SCANNER */}
                    <div className="flex-1 flex flex-col gap-4 min-w-[350px]">
                        <div className="bg-[#1e293b]/80 backdrop-blur rounded-2xl p-5 border border-white/10 shadow-xl">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Search className="text-pink-500" /> Competencia</h2>
                            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="EAN o Nombre..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-pink-500 outline-none font-medium" />
                                <button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-500 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50">{loading ? '...' : 'Buscar'}</button>
                            </form>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {results.map((item) => (
                                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className={`p-3 rounded-xl border border-white/5 bg-slate-800/50 hover:bg-slate-700 transition-all group flex flex-col gap-1 items-start relative overflow-hidden`}>
                                        <div className={`absolute top-0 right-0 w-16 h-16 bg-${item.color}-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150`}></div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider text-${item.color}-400`}>{item.store}</span>
                                        <span className="text-white font-bold text-sm leading-tight">{item.context || 'Ver Precios'}</span>
                                        <ExternalLink size={12} className="text-slate-500 mt-1" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: APPRAISER */}
                    <div className="flex-1 flex flex-col gap-4 min-w-[350px]">
                        <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6 relative z-10">
                                <span className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30">
                                    <Monitor size={20} />
                                </span>
                                Calculadora Inteligente
                            </h2>

                            {/* 1. Category */}
                            <div className="mb-6 relative z-10">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">1. Categoría del Producto</label>
                                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar snap-x">
                                    {Object.entries(CATEGORIES).map(([key, data]) => {
                                        const isSelected = category === key;
                                        return (
                                            <motion.button
                                                key={key}
                                                onClick={() => setCategory(key)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`snap-start relative px-4 py-3 rounded-2xl border transition-all flex flex-col items-center gap-2 min-w-[100px] ${isSelected
                                                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-900/20'
                                                    : 'bg-slate-900/50 border-white/5 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                                            >
                                                <div className={`p-2 rounded-full ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-current'}`}>
                                                    {data.icon}
                                                </div>
                                                <span className="font-medium text-xs whitespace-nowrap">{data.name}</span>
                                                {isSelected && (
                                                    <motion.div layoutId="activeCat" className="absolute inset-0 border-2 border-amber-500 rounded-2xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Checklists & Diagnostics */}
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-3"><CheckCircle size={14} /> Protocolo de Prueba</label>

                                {/* Diagnostics Module */}
                                {(category === 'phones' || category === 'laptops') && (
                                    <div className="mb-4 bg-slate-800 p-3 rounded-xl border border-dashed border-slate-600 flex flex-col gap-3">
                                        {!diagnosticSession ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full ${category === 'phones' ? 'bg-pink-600' : 'bg-cyan-600'}`}>
                                                        {category === 'phones' ? <QrCode size={16} className="text-white" /> : <Monitor size={16} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">Diagnóstico Automático</h4>
                                                        <p className="text-[10px] text-slate-400">Hardware y Sensores</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => startDiagnostic(category === 'phones' ? 'mobile' : 'laptop')} className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded hover:bg-slate-200">INICIAR</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3 items-center bg-slate-900 p-2 rounded-lg">
                                                {category === 'phones' && diagnosticSession.status !== 'completed' && (
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(diagnosticSession.url)}`} className="w-32 h-32 rounded bg-white p-1" alt="QR" />
                                                )}
                                                {category === 'laptops' && diagnosticSession.status !== 'completed' && (
                                                    <div className="flex flex-col gap-2 justify-center">
                                                        <a href={diagnosticSession.url} target="_blank" rel="noreferrer" className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded text-xs font-bold text-center transition-colors">
                                                            ABRIR TEST AQUÍ
                                                        </a>
                                                        <p className="text-[9px] text-slate-500 text-center leading-tight">Ejecutar en este equipo</p>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {diagnosticSession.status === 'completed' ? (
                                                        <p className="text-green-400 font-bold text-sm flex items-center gap-2"><CheckCircle size={14} /> Completado</p>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <p className="text-amber-500 font-bold text-xs animate-pulse">Esperando conexión...</p>
                                                            <p className="text-[10px] text-slate-500 truncate">{diagnosticSession.url}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {diagnosticSession.status === 'completed' && (
                                                    <button onClick={() => setDiagnosticSession(null)} className="text-[10px] underline text-slate-400">Reiniciar</button>
                                                )}
                                                {diagnosticSession.status === 'completed' && (
                                                    <button onClick={downloadReport} className="ml-2 bg-pink-600 hover:bg-pink-500 text-white p-2 rounded-lg transition-all" title="Descargar PDF">
                                                        <Download size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* IMEI Checker */}
                                {category === 'phones' && (
                                    <div className="mb-4 bg-slate-950/80 p-3 rounded-lg border border-white/10">
                                        <div className="flex gap-2 mb-2">
                                            <input value={imeiInput} onChange={(e) => setImeiInput(e.target.value)} placeholder="IMEI..." className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white mono" />
                                            <button onClick={handleCheckImie} disabled={imeiLoading} className="bg-blue-600 px-3 py-1 rounded text-white text-xs font-bold">{imeiLoading ? '...' : 'Check'}</button>
                                        </div>
                                        {imeiCheckResult && (
                                            <div className={`p-2 rounded border text-[10px] font-bold ${imeiCheckResult.status === 'CLEAN' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                                                {imeiCheckResult.message}
                                            </div>
                                        )}
                                    </div>
                                )}


                                {/* Manual Checklist */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {CATEGORIES[category].checklist.map((item, idx) => (
                                        <motion.div
                                            key={item}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            <span className="text-xs text-slate-300 font-medium truncate pr-2">{item}</span>
                                            <div className="flex gap-1 shrink-0 p-0.5 bg-slate-950 rounded-lg">
                                                <button onClick={() => handleChecklistChange(item, true)} className={`p-1.5 rounded-md transition-all ${checklist[item] === true ? 'bg-green-500 text-white shadow-lg shadow-green-900/50' : 'text-slate-600 hover:text-slate-400'}`}><CheckCircle size={14} /></button>
                                                <button onClick={() => handleChecklistChange(item, false)} className={`p-1.5 rounded-md transition-all ${checklist[item] === false ? 'bg-red-500 text-white shadow-lg shadow-red-900/50' : 'text-slate-600 hover:text-slate-400'}`}><XCircle size={14} /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Inputs & Logic */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 relative z-10">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Precio Nuevo</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">€</span>
                                        <input type="number" name="newPrice" value={survey.newPrice} onChange={handleSurveyChange} className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-white text-sm font-medium focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Precio 2ª Mano</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">€</span>
                                        <input type="number" name="secondHandPrice" value={survey.secondHandPrice} onChange={handleSurveyChange} className="w-full bg-slate-900/80 border border-amber-500/30 rounded-xl py-2 pl-8 pr-3 text-white text-sm font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all outline-none" placeholder="Wallapop" />
                                    </div>
                                </div>
                                <div className="space-y-1 md:col-span-1 col-span-2">
                                    <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider pl-1">Pide Cliente</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-2.5 text-pink-500/70 text-sm">€</span>
                                        <input type="number" name="askedPrice" value={survey.askedPrice} onChange={handleSurveyChange} className="w-full bg-slate-900/80 border border-pink-500/50 rounded-xl py-2 pl-8 pr-3 text-white text-lg font-bold focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all outline-none bg-pink-500/5" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Controls */}
                            <div className="flex flex-wrap gap-2 text-[10px] mb-6 relative z-10">
                                {/* Use custom styled radio/checks */}
                                {['venta', 'recuperable'].map((type) => (
                                    <label key={type} className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${survey.saleType === type ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800'}`}>
                                        <input type="radio" name="saleType" value={type} checked={survey.saleType === type} onChange={handleSurveyChange} className="hidden" />
                                        <div className={`w-2 h-2 rounded-full ${survey.saleType === type ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                                        <span className="capitalize">{type}</span>
                                    </label>
                                ))}
                                <div className="w-px h-8 bg-white/10 mx-1"></div>
                                {[
                                    { k: 'hasStock', label: 'Stock Alto' },
                                    { k: 'hasInvoice', label: 'Sin Fra.', inv: true }, // Logic inverted in original rendering
                                    { k: 'isHighTurnover', label: 'Alta Rotación' },
                                ].map((opt) => {
                                    const isChecked = opt.inv ? survey[opt.k] === 'no' : survey[opt.k] === 'si';
                                    const toggle = () => {
                                        const newVal = isChecked ? (opt.inv ? 'si' : 'no') : (opt.inv ? 'no' : 'si');
                                        setSurvey({ ...survey, [opt.k]: newVal });
                                    };
                                    return (
                                        <label key={opt.k} className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all select-none ${isChecked ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800'}`}>
                                            <input type="checkbox" checked={isChecked} onChange={toggle} className="hidden" />
                                            <span>{opt.label}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={calculateAppraisal}
                                className="relative z-10 w-full py-4 bg-gradient-to-r from-amber-600 to-pink-600 rounded-2xl font-bold text-white shadow-xl shadow-amber-900/20 hover:shadow-pink-900/30 transition-all flex justify-center items-center gap-2 uppercase tracking-wide text-sm"
                            >
                                <Monitor size={16} /> Calcular Oferta
                            </motion.button>

                            {/* RESULT - Animated Presence */}
                            <AnimatePresence>
                                {appraisalResult && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                        exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                        className="mt-6 relative z-10"
                                    >
                                        <div className={`relative overflow-hidden rounded-2xl border p-6 ${appraisalResult.status === 'COMPRAR' ? 'bg-emerald-950/40 border-emerald-500/30' :
                                                appraisalResult.status === 'RECHAZAR' || appraisalResult.status === 'PELIGRO' ? 'bg-red-950/40 border-red-500/30' :
                                                    'bg-amber-950/40 border-amber-500/30'
                                            }`}>

                                            {/* Status Badge */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-white">Decisión del Sistema</span>
                                                    <h3 className={`text-3xl font-black tracking-tight ${appraisalResult.statusColor} drop-shadow-sm`}>
                                                        {appraisalResult.status}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Oferta Máxima</span>
                                                    <span className="text-4xl font-mono text-white font-bold tracking-tighter">
                                                        {appraisalResult.maxBuyPrice.toFixed(0)}<span className="text-lg align-top opacity-50">€</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Recommendation Details */}
                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 p-1 rounded-full ${appraisalResult.status === 'COMPRAR' ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-300'
                                                        }`}>
                                                        {appraisalResult.status === 'COMPRAR' ? <CheckCircle size={14} /> : <Monitor size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white leading-relaxed">
                                                            {appraisalResult.recommendation}
                                                        </p>
                                                        <div className="text-[10px] text-slate-400 mt-2 flex gap-4 font-mono">
                                                            <span className="px-2 py-0.5 rounded bg-white/5">Ref: {appraisalResult.marketValue.toFixed(0)}€</span>
                                                            <span className="px-2 py-0.5 rounded bg-white/5">Mg: {appraisalResult.currentMargin}% (Obj: {appraisalResult.targetMarginPercent}%)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Decorative Status Bar */}
                                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${appraisalResult.status === 'COMPRAR' ? 'bg-emerald-500' :
                                                    appraisalResult.status === 'RECHAZAR' ? 'bg-red-500' :
                                                        'bg-amber-500'
                                                }`}></div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT: GOLD MODE */}
            {mode === 'gold' && (
                <div className="max-w-md mx-auto w-full bg-[#0f172a] rounded-2xl p-6 border border-amber-500/20 shadow-2xl shadow-amber-900/20">
                    <h2 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-2"><Watch /> Cotizador de Oro</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Peso (gramos)</label>
                            <input type="number" value={goldForm.weight} onChange={e => setGoldForm({ ...goldForm, weight: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-lg outline-none focus:border-amber-500" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Kilates</label>
                            <div className="grid grid-cols-4 gap-2 mt-1">
                                {[24, 18, 14, 9].map(k => (
                                    <button key={k} onClick={() => setGoldForm({ ...goldForm, karats: k })} className={`py-2 rounded-lg font-bold border transition-all ${goldForm.karats == k ? 'bg-amber-500 text-black border-amber-500' : 'bg-slate-800 text-slate-400 border-white/5'}`}>{k}K</button>
                                ))}
                            </div>
                        </div>
                        <button onClick={calculateGold} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all">CALCULAR VALOR</button>
                        {goldQuote && (
                            <div className="mt-4 bg-slate-900/50 p-4 rounded-xl border border-amber-500/30 text-center animate-in zoom-in">
                                <p className="text-slate-400 text-xs mb-1">Valor Estimado ({goldForm.karats}K)</p>
                                <p className="text-4xl font-black text-white">{goldQuote.total.toFixed(2)}€</p>
                                <p className="text-amber-500 text-xs mt-2 font-mono">{goldQuote.pricePerGram.toFixed(2)} €/gr</p>
                                <p className="text-[10px] text-slate-600 mt-4">Actualizado: {goldQuote.timestamp}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Market;
