import React, { useState, useEffect } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ExternalLink, Smartphone, Monitor, Watch, Hammer, Gamepad2, CheckCircle, XCircle, Grid, QrCode, Download, Info, BookOpen, ChevronRight, CornerDownRight, FileText, ShieldCheck, UserMinus, AlertTriangle, Scale, ShoppingCart } from 'lucide-react';
import { generateDiagnosticCertificate, generateWatchCertificate } from '../utils/pdfGenerator';
import { ACCOUNT_REMOVAL_GUIDES, AUTHENTICITY_GUIDES } from '../data/guides';
import PriceList from '../components/Market/PriceList'; // Import PriceList

const CATEGORIES = {
    phones: { name: 'Móviles/Tablets', margin: 0.40, icon: <Smartphone size={18} />, color: 'pink', checklist: ['IMEI/Red', 'Cosmético', 'Seguridad', 'Pantalla/Touch', 'Vibración/Sensores', 'Micrófono/Audio', 'Cámaras/Flash', 'GPS', 'Carga'] },
    laptops: { name: 'Portátiles', margin: 0.40, icon: <Monitor size={18} />, color: 'cyan', checklist: ['Enciende', 'Cargador Original', 'Teclado Completo', 'Pantalla sin manchas', 'Webcam/Audio', 'Hardware OK'] },
    watches: { name: 'Relojes', margin: 0.35, icon: <Watch size={18} />, color: 'amber', checklist: [] }
};

const WATCH_INSPECTION_GUIDE = [
    {
        title: "1. Inspección Visual Externa (La \"Estética\")",
        points: [
            { label: "El Cristal (Zafiro vs Mineral)", desc: "Pasa la uña (rugoso = mordidas). Gota de agua (bola compacta = zafiro)." },
            { label: "La Esfera (Dial)", desc: "Lupa: Sin polvo/pelusas. Tipografía nítida, sin sangrado." },
            { label: "Las Agujas", desc: "Sin corrosión u oxidación (humedad)." },
            { label: "La Caja y Asas", desc: "Bordes afilados = original. Bordes 'jabón' = pulido excesivo." },
            { label: "El Brazalete (Armis)", desc: "Holgura: No debe caer 'triste'. Cierre: Clic sólido." }
        ]
    },
    {
        title: "2. Inspección Funcional (La \"Mecánica\")",
        points: [
            { label: "La Corona (Tacto)", desc: "Desenroscar suave. Cuerda resistencia 'mantequilla fría'." },
            { label: "Cambio de Fecha", desc: "'Snap' nítido y centrado a las 12." },
            { label: "El Bisel (Diver)", desc: "Sin juego atrás. Clics metálicos (120 en Rolex/Omega)." },
            { label: "Cronógrafo", desc: "Start/Stop suaves. Reseteo EXACTO a 0 (vital)." },
            { label: "Luminiscencia", desc: "Brillo fuerte y uniforme tras 10s de luz." },
            { label: "Cronocomparador (CRÍTICO)", desc: "Valores elevados sospechosos. ¡Comprobar amplitud y beat error!", isCritical: true, hasInfo: true }
        ]
    },
    {
        title: "3. Inspección de Autenticidad",
        points: [
            { label: "Números de Serie", desc: "Coincide grabado (asas/rehaut) con tarjeta." },
            { label: "Grabados Láser", desc: "Profundos y limpios. No al ácido (superficiales)." },
            { label: "Peso (Oro/Platino)", desc: "Debe pesar. Copias chapadas son ligeras." },
            { label: "Movimiento", desc: "Acabados espejo, sin plásticos en marcas top." },
            { label: "MAQUINARIA (¡ABRIR!)", desc: "Abrir para verificar calibre. AVISAR RESPONSABLE.", isCritical: true, action: "open_notify" }
        ]
    },
    {
        title: "4. Detalles por Marca (Chivatos)",
        points: [
            { label: "ROLEX: Rehaut", desc: "ROLEXROLEX. X coincide con 1-4, R con 8-11." },
            { label: "ROLEX: Corona Cristal", desc: "Micro-grabado a las 6. Casi invisible." },
            { label: "OMEGA: Punto 90", desc: "Speedmaster antiguos: Punto SOBRE el 90." },
            { label: "CARTIER: Firma Secreta", desc: "En el VII o X (micro texto en pata)." }
        ]
    }
];



const Market = () => {
    // Context access for Gold Price
    const { goldPrice: contextGoldPrice } = useProductivity(); // Expecting string or number from context

    const [mode, setMode] = useState('product'); // 'product' | 'gold' | 'guides'
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
    const [showTimegrapherHelp, setShowTimegrapherHelp] = useState(false);

    // Watch Inspection Form
    const [watchForm, setWatchForm] = useState({
        brand: '',
        model: '',
        rate: '',
        amplitude: '',
        beatError: ''
    });

    const [activeGuide, setActiveGuide] = useState(null);
    const [guideCategory, setGuideCategory] = useState('accounts'); // 'accounts' | 'authenticity'

    // Reset checklist when category changes
    useEffect(() => {
        const defaultChecklist = {};
        CATEGORIES[category].checklist.forEach(item => defaultChecklist[item] = null); // null = unchecks, true = yes, false = no
        setChecklist(defaultChecklist);

        // Reset Watch Form if not watches
        if (category !== 'watches') {
            setWatchForm({ brand: '', model: '', rate: '', amplitude: '', beatError: '' });
        }

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

        if (category === 'watches') {
            WATCH_INSPECTION_GUIDE.forEach(section => {
                section.points.forEach(pt => {
                    const key = `${section.title}:${pt.label}`;
                    if (checklist[key] === false) {
                        if (pt.isCritical) {
                            criticalFailure = true;
                            warnings.push(`FALLO CRÍTICO: ${pt.label}`);
                        } else {
                            conditionPenalty += 0.15;
                        }
                    }
                });
            });
        } else {
            Object.entries(checklist).forEach(([key, val]) => {
                if (val === false) { // Explicitly failed
                    conditionPenalty += 0.15; // 15% value reduction per failed item
                }
            });
        }

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

        // Base price comes from Productivity context (18k price)
        const base18k = parseFloat(contextGoldPrice) || 0;

        // Derive other karats based on 18k ratio if needed, or simple math
        // 24k is pure (1.0), 18k is 0.75. So 24k ~ 18k / 0.75
        // 14k is 0.5833 (14/24). 
        // 9k is 0.375 (9/24).
        // Let's use simple ratios relative to 18k (18/24 = 0.75)

        let pricePerGram = 0;
        if (base18k > 0) {
            const price24k = base18k / 0.75;
            if (k === 18) pricePerGram = base18k;
            else if (k === 24) pricePerGram = price24k;
            else pricePerGram = price24k * (k / 24);
        }

        const total = w * pricePerGram;
        setGoldQuote({
            pricePerGram,
            total,
            timestamp: new Date().toLocaleTimeString()
        });
    };

    return (
        <div className="h-full flex flex-col pt-8 px-8 pb-24 relative overflow-y-auto no-scrollbar bg-[#F4F7FA]/30">

            {/* Top Bar Switcher */}
            <div className="flex justify-center mb-10 shrink-0">
                <div className="bg-white/80 p-2 rounded-[24px] flex border border-white shadow-xl backdrop-blur-xl relative">
                    {[
                        { id: 'product', label: 'Escáner & Producto', icon: Search, gradient: 'from-[#FF8C9D] to-[#FFB7C5]' },
                        { id: 'gold', label: 'Cotizador Oro', icon: Watch, gradient: 'from-[#F6AD55] to-[#FBD38D]' },
                        { id: 'guides', label: 'Manuales', icon: BookOpen, gradient: 'from-[#4299E1] to-[#63B3ED]' },
                        { id: 'prices', label: 'Precios', icon: ShoppingCart, gradient: 'from-[#48BB78] to-[#68D391]' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setMode(t.id)}
                            className={`px-8 py-3 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 relative
                                ${mode === t.id ? `bg-gradient-to-r ${t.gradient} text-white shadow-lg` : 'text-[#A0AEC0] hover:text-[#718096]'}`}
                        >
                            <t.icon size={16} /> {t.label}
                            {mode === t.id && <motion.div layoutId="market-mode-glow" className="absolute inset-0 blur-xl opacity-40 bg-current rounded-[18px]" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT: PRICES MODE */}
            {mode === 'prices' && <PriceList />}

            {/* CONTENT: PRODUCT MODE */}
            {mode === 'product' && (
                <div className="flex flex-col xl:flex-row gap-6 mx-auto w-full max-w-[1920px]">

                    {/* LEFT: SCANNER */}
                    <div className="flex-1 flex flex-col gap-6 min-w-[380px]">
                        <div className="bg-white border border-[#E2E8F0] rounded-[40px] p-8 shadow-sm flex flex-col h-fit">
                            <h2 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter mb-6 flex items-center gap-4">
                                <div className="p-2.5 bg-[#FFF0F3] rounded-2xl border border-[#FF8C9D]/20">
                                    <Search className="text-[#FF8C9D]" size={24} />
                                </div>
                                Competencia Directa
                            </h2>
                            <form onSubmit={handleSearch} className="flex gap-3 mb-8">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="EAN, Referencia o Nombre..."
                                    className="flex-1 bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white rounded-2xl px-6 py-4 text-[#1A365D] font-bold text-sm outline-none transition-all shadow-inner"
                                />
                                <button type="submit" disabled={loading} className="bg-[#1A365D] hover:bg-[#FF8C9D] text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg active:scale-95">{loading ? '...' : 'Escanear'}</button>
                            </form>
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                {results.map((item) => (
                                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className={`p-5 rounded-[32px] border border-[#E2E8F0] bg-[#F4F7FA]/50 hover:bg-white hover:shadow-2xl transition-all group flex flex-col gap-2 items-start relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF8C9D]/10 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8C9D]">{item.store}</span>
                                        <span className="text-[#1A365D] font-black text-sm leading-tight tracking-tighter">{item.context || 'Ver Precios'}</span>
                                        <div className="flex items-center gap-2 mt-4 text-[#A0AEC0] group-hover:text-[#1A365D] transition-colors">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Ver Oferta</span>
                                            <ExternalLink size={14} className="animate-pulse" />
                                        </div>
                                    </a>
                                ))}
                                {results.length === 0 && !loading && (
                                    <div className="col-span-2 py-12 flex flex-col items-center opacity-30">
                                        <Search size={48} className="text-[#A0AEC0] mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Realiza una búsqueda</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: APPRAISER */}
                    <div className="flex-1 flex flex-col gap-6 min-w-[380px]">
                        <div className="bg-white border border-[#E2E8F0] rounded-[40px] p-8 shadow-sm relative overflow-hidden group">
                            <h2 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter mb-8 flex items-center gap-4 relative z-10">
                                <div className="p-2.5 bg-[#FFF0F3] rounded-2xl border border-[#FF8C9D]/20">
                                    <Monitor className="text-[#FF8C9D]" size={24} />
                                </div>
                                Tasación Inteligente
                            </h2>

                            {/* 1. Category */}
                            <div className="mb-8 relative z-10">
                                <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] mb-4 block pl-1">1. Tipo de Dispositivo</label>
                                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
                                    {Object.entries(CATEGORIES).map(([key, data]) => {
                                        const isSelected = category === key;
                                        return (
                                            <motion.button
                                                key={key}
                                                onClick={() => setCategory(key)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`snap-start relative px-6 py-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 min-w-[120px] ${isSelected
                                                    ? 'bg-[#1A365D] border-[#1A365D] text-white shadow-xl'
                                                    : 'bg-white border-[#F4F7FA] text-[#A0AEC0] hover:border-[#E2E8F0] hover:text-[#1A365D]'}`}
                                            >
                                                <div className={`p-3 rounded-2xl ${isSelected ? 'bg-white/10 text-white' : 'bg-[#F4F7FA] text-[#A0AEC0]'}`}>
                                                    {data.icon}
                                                </div>
                                                <span className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">{data.name}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Checklists & Diagnostics */}
                            <div className="bg-[#F4F7FA] p-6 rounded-[32px] border border-[#E2E8F0]">
                                <label className="text-[10px] font-black text-[#718096] uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><CheckCircle size={14} className="text-[#FF8C9D]" /> Protocolo de Inspección</label>

                                {/* WATCH IDENTITY INPUTS */}
                                {category === 'watches' && (
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-[24px] border border-[#E2E8F0] shadow-sm">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest pl-2">Marca</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Rolex"
                                                value={watchForm.brand}
                                                onChange={e => setWatchForm({ ...watchForm, brand: e.target.value })}
                                                className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white rounded-xl px-4 py-3 text-[#1A365D] text-xs font-bold outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest pl-2">Modelo</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Submariner"
                                                value={watchForm.model}
                                                onChange={e => setWatchForm({ ...watchForm, model: e.target.value })}
                                                className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#FF8C9D] focus:bg-white rounded-xl px-4 py-3 text-[#1A365D] text-xs font-bold outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Diagnostics Module */}
                                {(category === 'phones' || category === 'laptops') && (
                                    <div className="mb-6 bg-white p-5 rounded-[24px] border border-[#E2E8F0] shadow-sm flex flex-col gap-4">
                                        {!diagnosticSession ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl ${category === 'phones' ? 'bg-[#FFF0F3] text-[#FF8C9D]' : 'bg-[#EBF8FF] text-[#4299E1]'}`}>
                                                        {category === 'phones' ? <QrCode size={20} /> : <Monitor size={20} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[#1A365D] font-black text-[13px] tracking-tight">Test de Hardware</h4>
                                                        <p className="text-[10px] text-[#A0AEC0] font-bold uppercase tracking-widest">Diagnóstico Automático</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => startDiagnostic(category === 'phones' ? 'mobile' : 'laptop')} className="px-6 py-2.5 bg-[#1A365D] hover:bg-[#FF8C9D] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">Iniciar</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4 items-center bg-[#F4F7FA] p-3 rounded-[20px]">
                                                {category === 'phones' && diagnosticSession.status !== 'completed' && (
                                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(diagnosticSession.url)}`} className="w-24 h-24" alt="QR" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {diagnosticSession.status === 'completed' ? (
                                                        <p className="text-[#48BB78] font-black text-xs flex items-center gap-2 uppercase tracking-widest"><CheckCircle size={14} /> Completado</p>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[#FF8C9D] font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Esperando conexión...</p>
                                                            <p className="text-[10px] font-mono text-[#A0AEC0] truncate opacity-50">{diagnosticSession.url}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {diagnosticSession.status === 'completed' && (
                                                        <>
                                                            <button onClick={() => setDiagnosticSession(null)} className="text-[9px] font-black uppercase text-[#A0AEC0] hover:text-[#FF8C9D] transition-colors">Reset</button>
                                                            <button onClick={downloadReport} className="bg-[#1A365D] hover:bg-[#FF8C9D] text-white p-2.5 rounded-xl transition-all shadow-md" title="Descargar PDF">
                                                                <Download size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* IMEI Checker */}
                                {category === 'phones' && (
                                    <div className="mb-6 bg-white p-5 rounded-[24px] border border-[#E2E8F0] shadow-sm">
                                        <div className="flex gap-3 mb-3">
                                            <input
                                                value={imeiInput}
                                                onChange={(e) => setImeiInput(e.target.value)}
                                                placeholder="IMEI (15 dígitos)..."
                                                className="flex-1 bg-[#F4F7FA] border-2 border-transparent focus:border-[#4299E1] focus:bg-white rounded-xl px-4 py-3 text-[#1A365D] font-mono text-xs outline-none transition-all shadow-inner"
                                            />
                                            <button onClick={handleCheckImie} disabled={imeiLoading} className="bg-[#4299E1] hover:bg-[#3182CE] px-6 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">{imeiLoading ? '...' : 'Check'}</button>
                                        </div>
                                        {imeiCheckResult && (
                                            <div className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${imeiCheckResult.status === 'CLEAN' ? 'bg-[#F0FFF4] border-[#C6F6D5] text-[#2F855A]' : 'bg-[#FFF5F5] border-[#FED7D7] text-[#C53030]'}`}>
                                                {imeiCheckResult.message}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Manual Checklist */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {category === 'watches' ? (
                                        <div className="col-span-2 space-y-4">
                                            {WATCH_INSPECTION_GUIDE.map((section, sIdx) => (
                                                <div key={sIdx} className="bg-white rounded-[24px] p-5 border border-[#E2E8F0] shadow-sm">
                                                    <h4 className="text-[#FF8C9D] font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <CornerDownRight size={12} /> {section.title}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {section.points.map((pt, pIdx) => {
                                                            const key = `${section.title}:${pt.label}`;
                                                            const status = checklist[key];
                                                            const isCritical = pt.isCritical;
                                                            return (
                                                                <div key={pIdx} className="flex flex-col gap-3">
                                                                    <div className={`flex justify-between items-center bg-[#F4F7FA] p-3 rounded-2xl transition-all border-2 ${status === true ? 'border-[#48BB78]/20 bg-[#F0FFF4]' : status === false ? 'border-[#F56565]/20 bg-[#FFF5F5]' : 'border-transparent'}`}>
                                                                        <div className="flex-1 pr-4">
                                                                            <p className="text-[11px] font-black text-[#1A365D] uppercase tracking-tight">{pt.label}</p>
                                                                            <p className="text-[9px] text-[#A0AEC0] font-bold uppercase tracking-widest mt-1 opacity-70">{pt.desc}</p>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleChecklistChange(key, true)} className={`p-2 rounded-xl transition-all shadow-sm ${status === true ? 'bg-[#48BB78] text-white scale-110' : 'bg-white text-[#A0AEC0] hover:text-[#48BB78]'}`}><CheckCircle size={16} /></button>
                                                                            <button onClick={() => handleChecklistChange(key, false)} className={`p-2 rounded-xl transition-all shadow-sm ${status === false ? 'bg-[#F56565] text-white scale-110' : 'bg-white text-[#A0AEC0] hover:text-[#F56565]'}`}><XCircle size={16} /></button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        CATEGORIES[category].checklist.map((item, idx) => (
                                            <motion.div
                                                key={item}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${checklist[item] === true ? 'bg-[#F0FFF4] border-[#48BB78]/20 shadow-sm' : checklist[item] === false ? 'bg-[#FFF5F5] border-[#F56565]/20 shadow-sm' : 'bg-white border-transparent shadow-sm hover:border-[#E2E8F0]'}`}
                                            >
                                                <span className="text-[11px] text-[#1A365D] font-black uppercase tracking-tight truncate pr-2">{item}</span>
                                                <div className="flex gap-1 shrink-0 p-1 bg-[#F4F7FA] rounded-xl">
                                                    <button onClick={() => handleChecklistChange(item, true)} className={`p-2 rounded-lg transition-all ${checklist[item] === true ? 'bg-[#48BB78] text-white shadow-md scale-110' : 'text-[#A0AEC0] hover:text-[#48BB78]'}`}><CheckCircle size={14} /></button>
                                                    <button onClick={() => handleChecklistChange(item, false)} className={`p-2 rounded-lg transition-all ${checklist[item] === false ? 'bg-[#F56565] text-white shadow-md scale-110' : 'text-[#A0AEC0] hover:text-[#F56565]'}`}><XCircle size={14} /></button>
                                                </div>
                                            </motion.div>
                                        )))}
                                </div>
                            </div>

                            {/* 3. Inputs & Logic */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] pl-2">Precio Nuevo</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-[17px] text-[#A0AEC0] font-black text-sm">€</span>
                                        <input type="number" name="newPrice" value={survey.newPrice} onChange={handleSurveyChange} className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#4299E1] focus:bg-white rounded-2xl py-4 pl-10 pr-4 text-[#1A365D] font-black text-sm outline-none transition-all shadow-inner" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] pl-2">Venta 2ª Mano</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-[17px] text-[#A0AEC0] font-black text-sm">€</span>
                                        <input type="number" name="secondHandPrice" value={survey.secondHandPrice} onChange={handleSurveyChange} className="w-full bg-[#F4F7FA] border-2 border-transparent focus:border-[#F6AD55] focus:bg-white rounded-2xl py-4 pl-10 pr-4 text-[#1A365D] font-black text-sm outline-none transition-all shadow-inner" placeholder="PVP Ocasión" />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-1 col-span-2">
                                    <label className="text-[10px] font-black text-[#FF8C9D] uppercase tracking-[0.2em] pl-2">Exigencia Cliente</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-[17px] text-[#FF8C9D] font-black text-lg">€</span>
                                        <input type="number" name="askedPrice" value={survey.askedPrice} onChange={handleSurveyChange} className="w-full bg-[#FFF0F3] border-2 border-[#FF8C9D]/30 focus:border-[#FF8C9D] focus:bg-white rounded-2xl py-4 pl-10 pr-4 text-[#1A365D] font-black text-xl outline-none transition-all shadow-md placeholder:text-[#FF8C9D]/30" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Controls */}
                            <div className="flex flex-wrap gap-3 mt-8 relative z-10">
                                {['venta', 'recuperable'].map((type) => (
                                    <label key={type} className={`cursor-pointer px-6 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest ${survey.saleType === type ? 'bg-[#1A365D] border-[#1A365D] text-white shadow-lg' : 'bg-white border-[#F4F7FA] text-[#A0AEC0] hover:border-[#E2E8F0]'}`}>
                                        <input type="radio" name="saleType" value={type} checked={survey.saleType === type} onChange={handleSurveyChange} className="hidden" />
                                        <div className={`w-3 h-3 rounded-full ${survey.saleType === type ? 'bg-[#FF8C9D]' : 'bg-[#F4F7FA]'}`} />
                                        <span>{type}</span>
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

                            {/* APPRAISAL RESULT DISPLAY */}
                            <AnimatePresence>
                                {appraisalResult && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                        exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                        className="mt-8 pt-8 border-t-4 border-[#F4F7FA] relative z-10"
                                    >
                                        <div className={`p-8 rounded-[36px] border-2 shadow-2xl overflow-hidden relative ${appraisalResult.status === 'COMPRAR' ? 'bg-[#F0FFF4] border-[#48BB78]/30' : appraisalResult.status === 'PELIGRO' || appraisalResult.status === 'RECHAZAR' ? 'bg-[#FFF5F5] border-[#F56565]/30' : 'bg-[#FFFBEB] border-[#F6E05E]/30'}`}>

                                            {/* Status Badge */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-sm ${appraisalResult.status === 'COMPRAR' ? 'bg-[#48BB78] text-white' : appraisalResult.status === 'PELIGRO' || appraisalResult.status === 'RECHAZAR' ? 'bg-[#F56565] text-white' : 'bg-[#F6AD55] text-white'}`}>
                                                    ESTADO: {appraisalResult.status}
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[10px] text-[#A0AEC0] font-black uppercase tracking-widest mb-1">Oferta Límite</span>
                                                    <span className={`text-5xl font-black font-mono tracking-tighter ${appraisalResult.status === 'COMPRAR' ? 'text-[#2F855A]' : appraisalResult.status === 'PELIGRO' || appraisalResult.status === 'RECHAZAR' ? 'text-[#C53030]' : 'text-[#B7791F]'}`}>
                                                        {appraisalResult.maxBuyPrice.toFixed(0)}<span className="text-2xl align-top opacity-50 ml-1">€</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Recommendation Details */}
                                            <div className="bg-white/60 backdrop-blur-md rounded-[24px] p-6 border border-white shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-1 p-2 rounded-xl shadow-sm ${appraisalResult.status === 'COMPRAR' ? 'bg-[#48BB78] text-white' : appraisalResult.status === 'PELIGRO' || appraisalResult.status === 'RECHAZAR' ? 'bg-[#F56565] text-white' : 'bg-[#F6AD55] text-white'}`}>
                                                        {appraisalResult.status === 'COMPRAR' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-black text-[#1A365D] leading-tight mb-4 tracking-tight">
                                                            {appraisalResult.recommendation}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#E2E8F0] text-[9px] font-black text-[#718096] uppercase tracking-widest shadow-sm">
                                                                MERCADO: {appraisalResult.marketValue.toFixed(0)}€
                                                            </div>
                                                            <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#E2E8F0] text-[9px] font-black text-[#718096] uppercase tracking-widest shadow-sm">
                                                                MARGEN: {appraisalResult.currentMargin}%
                                                            </div>
                                                            <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#E2E8F0] text-[9px] font-black text-[#FF8C9D] uppercase tracking-widest shadow-sm">
                                                                OBJETIVO: {appraisalResult.targetMarginPercent}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Status Glow */}
                                            <div className={`absolute -bottom-8 -right-8 w-32 h-32 blur-3xl opacity-20 rounded-full ${appraisalResult.status === 'COMPRAR' ? 'bg-[#48BB78]' : 'bg-[#F56565]'}`}></div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}


            {/* CONTENT: GUIDES MODE */}
            {mode === 'guides' && (
                <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white border border-[#E2E8F0] rounded-[48px] p-10 shadow-2xl relative overflow-hidden min-h-[700px]">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF8C9D]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4299E1]/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                            <div>
                                <h2 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-[#FFF0F3] rounded-[24px] border border-[#FF8C9D]/20 shadow-sm">
                                        <BookOpen className="text-[#FF8C9D]" size={32} />
                                    </div>
                                    Manuales de Operación
                                </h2>
                                <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.3em] pl-1">Protocolos de Seguridad y Verificación</p>
                            </div>

                            <div className="flex bg-[#F4F7FA] p-2 rounded-[28px] border border-[#E2E8F0] shadow-inner">
                                <button
                                    onClick={() => { setGuideCategory('accounts'); setActiveGuide(null); }}
                                    className={`px-8 py-3.5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${guideCategory === 'accounts' ? 'bg-[#1A365D] text-white shadow-xl translate-y-[-1px]' : 'text-[#A0AEC0] hover:text-[#1A365D]'}`}
                                >
                                    <UserMinus size={16} /> Desbloqueos
                                </button>
                                <button
                                    onClick={() => { setGuideCategory('authenticity'); setActiveGuide(null); }}
                                    className={`px-8 py-3.5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${guideCategory === 'authenticity' ? 'bg-[#FF8C9D] text-white shadow-xl translate-y-[-1px]' : 'text-[#A0AEC0] hover:text-[#FF8C9D]'}`}
                                >
                                    <ShieldCheck size={16} /> Autenticidad
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            {/* Guide List */}
                            <div className="md:col-span-1 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                                {(guideCategory === 'accounts' ? ACCOUNT_REMOVAL_GUIDES : AUTHENTICITY_GUIDES).map(guide => (
                                    <button
                                        key={guide.id}
                                        onClick={() => setActiveGuide(guide)}
                                        className={`w-full text-left p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group ${activeGuide?.id === guide.id
                                            ? guideCategory === 'accounts' ? 'bg-[#1A365D] border-[#1A365D] text-white shadow-2xl scale-[1.02]' : 'bg-[#FF8C9D] border-[#FF8C9D] text-white shadow-2xl scale-[1.02]'
                                            : 'bg-white border-[#F4F7FA] text-[#A0AEC0] hover:border-[#E2E8F0] hover:text-[#1A365D] hover:bg-[#F4F7FA]/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-10 rounded-full transition-all ${activeGuide?.id === guide.id ? 'bg-white/40' : 'bg-[#F4F7FA] group-hover:bg-[#FF8C9D]/20'}`}></div>
                                            <span className="font-black text-sm uppercase tracking-tight leading-none">{guide.title}</span>
                                        </div>
                                        <ChevronRight size={20} className={`transition-transform duration-300 ${activeGuide?.id === guide.id ? 'rotate-90 text-white' : 'opacity-20 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                                    </button>
                                ))}
                            </div>

                            {/* Active Guide Content */}
                            <div className="md:col-span-2 bg-[#F4F7FA]/50 rounded-[40px] border border-[#E2E8F0] p-10 min-h-[500px] flex flex-col relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {activeGuide ? (
                                        <motion.div
                                            key={activeGuide.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="h-full flex flex-col"
                                        >
                                            <div className="flex items-center gap-5 mb-10">
                                                <div className={`p-5 rounded-[24px] shadow-sm transform rotate-[-3deg] ${guideCategory === 'accounts' ? 'bg-[#1A365D] text-white' : 'bg-[#FF8C9D] text-white'}`}>
                                                    {guideCategory === 'accounts' ? <BookOpen size={28} /> :
                                                        activeGuide.id === 'airpods_weights' ? <Scale size={28} /> :
                                                            <AlertTriangle size={28} />}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-[#1A365D] uppercase tracking-tighter leading-none mb-1">{activeGuide.title}</h3>
                                                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">{guideCategory === 'accounts' ? 'Procedimiento de Limpieza' : 'Protocolo de Verificación'}</p>
                                                </div>
                                            </div>

                                            {/* Warning Box */}
                                            {activeGuide.warning && (
                                                <div className="bg-[#FFF5F5] border-l-8 border-[#F56565] p-6 rounded-[24px] mb-10 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F56565]/5 rounded-full -mr-12 -mt-12"></div>
                                                    <div className="flex gap-4 items-center">
                                                        <div className="p-2 bg-[#F56565] text-white rounded-xl shadow-lg">
                                                            <Info size={20} />
                                                        </div>
                                                        <p className="text-[#C53030] text-[13px] font-black leading-tight tracking-tight uppercase">{activeGuide.warning}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* CONTENT AREA */}
                                            <div className="flex-1 space-y-6">
                                                {/* STEPS (Account Removal) */}
                                                {activeGuide.steps && (
                                                    <div className="space-y-4">
                                                        {activeGuide.steps.map((step, idx) => (
                                                            <div key={idx} className="flex gap-6 group">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <div className="w-10 h-10 rounded-2xl bg-white border-2 border-[#E2E8F0] flex items-center justify-center text-xs font-black text-[#1A365D] group-hover:border-[#FF8C9D] group-hover:bg-[#FF8C9D] group-hover:text-white transition-all shadow-sm">
                                                                        {idx + 1}
                                                                    </div>
                                                                    {idx !== activeGuide.steps.length - 1 && <div className="w-1 flex-1 bg-[#E2E8F0] rounded-full opacity-50 group-hover:bg-[#FF8C9D]/30 transition-all"></div>}
                                                                </div>
                                                                <div className="pb-8 pt-2">
                                                                    <p className="text-[#4A5568] text-[15px] font-bold leading-relaxed group-hover:text-[#1A365D] transition-colors">
                                                                        {step}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* CHECKS (Authenticity) */}
                                                {activeGuide.checks && (
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {activeGuide.checks.map((check, idx) => (
                                                            <div key={idx} className="bg-white p-6 rounded-[32px] border-2 border-transparent hover:border-[#FF8C9D]/30 shadow-sm hover:shadow-xl transition-all group">
                                                                <h5 className="text-[13px] font-black text-[#FF8C9D] mb-3 flex items-center gap-3 uppercase tracking-widest">
                                                                    <div className="p-1.5 bg-[#FFF5F5] rounded-lg group-hover:bg-[#FF8C9D] group-hover:text-white transition-colors">
                                                                        <AlertTriangle size={14} />
                                                                    </div>
                                                                    {check.label}
                                                                </h5>
                                                                <p className="text-[#718096] text-sm font-bold leading-relaxed pl-8 border-l-2 border-[#F4F7FA]">{check.desc}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-[#A0AEC0] animate-pulse">
                                            <div className="w-32 h-32 bg-white rounded-[48px] border-4 border-dashed border-[#E2E8F0] flex items-center justify-center mb-8 shadow-inner">
                                                {guideCategory === 'accounts' ? <UserMinus size={64} className="opacity-20" /> : <ShieldCheck size={64} className="opacity-20" />}
                                            </div>
                                            <p className="text-[12px] font-black uppercase tracking-[0.4em]">Selecciona un protocolo</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {mode === 'gold' && (
                <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                    {/* LEFT: CALCULATOR */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[48px] p-10 shadow-2xl relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F6AD55]/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="mb-10 text-center">
                            <div className="inline-flex p-4 bg-[#FFFBEB] rounded-[28px] border border-[#F6AD55]/20 shadow-sm mb-6">
                                <Watch className="text-[#D69E2E]" size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter mb-2">Cotizador de Oro</h2>
                            <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.3em]">Cálculo oficial según cotización real</p>
                        </div>

                        <div className="bg-[#F4F7FA] p-8 rounded-[40px] border border-[#E2E8F0] mb-8 shadow-inner">
                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#E2E8F0]">
                                <span className="text-[11px] font-black text-[#718096] uppercase tracking-widest">SPOT 24K</span>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-[#1A365D] tracking-tighter font-mono">{parseFloat(contextGoldPrice).toFixed(2)}<span className="text-lg ml-1 opacity-40 text-[#A0AEC0]">€/g</span></p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest ml-4">Peso en gramos</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={goldForm.weight}
                                            onChange={e => setGoldForm({ ...goldForm, weight: e.target.value })}
                                            className="w-full bg-white border-2 border-transparent focus:border-[#F6AD55] rounded-3xl py-5 px-8 text-[#1A365D] text-2xl font-black outline-none transition-all shadow-md group-hover:shadow-lg placeholder:opacity-20"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-black text-[#A0AEC0] uppercase tracking-widest">GRAMOS</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest ml-4">Pureza (Quilates)</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[24, 18, 14, 9].map(k => (
                                            <button
                                                key={k}
                                                onClick={() => setGoldForm({ ...goldForm, karats: k })}
                                                className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${goldForm.karats == k ? 'bg-[#1A365D] text-white shadow-xl scale-[1.05]' : 'bg-white text-[#A0AEC0] hover:text-[#1A365D] border-2 border-[#E2E8F0] hover:border-[#F6AD55]'}`}
                                            >
                                                {k}K
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={calculateGold}
                                    className="w-full py-6 bg-gradient-to-r from-[#D69E2E] to-[#F6AD55] text-white font-black rounded-3xl shadow-xl shadow-[#F6AD55]/20 hover:shadow-[#F6AD55]/40 transition-all uppercase tracking-[0.2em] text-xs mt-4"
                                >
                                    Calcular Oferta
                                </motion.button>
                            </div>
                        </div>

                        {goldQuote && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#FFFBEB] p-8 rounded-[40px] border-2 border-[#D69E2E]/30 text-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#D69E2E] rounded-full opacity-30"></div>
                                <p className="text-[#A0AEC0] text-[10px] font-black uppercase tracking-[0.3em] mb-3">Valor de Compra Ofrecido</p>
                                <p className="text-6xl font-black text-[#D69E2E] tracking-tighter mb-4 font-mono">{goldQuote.total.toFixed(2)}<span className="text-2xl ml-1 opacity-50">€</span></p>
                                <div className="inline-flex px-4 py-2 bg-white rounded-2xl border border-[#FBD38D] text-[10px] font-black text-[#B7791F] uppercase tracking-widest shadow-sm">
                                    PVP Gramo: {goldQuote.pricePerGram.toFixed(2)}€
                                </div>
                                <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-[24px] border border-[#FBD38D]">
                                    <p className="text-[10px] font-black text-[#744210] uppercase leading-tight tracking-tight">
                                        ⚠️ Precio sujeto a inspección visual y prueba de ácido.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* RIGHT: TEST PROTOCOL */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[48px] p-10 shadow-2xl relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#48BB78]/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="mb-10">
                            <h3 className="text-2xl font-black text-[#1A365D] uppercase tracking-tighter flex items-center gap-4 mb-2">
                                <div className="p-3 bg-[#F0FFF4] rounded-[24px] border border-[#48BB78]/20 shadow-sm">
                                    <CheckCircle size={28} className="text-[#48BB78]" />
                                </div>
                                Protocolo de Comprobación
                            </h3>
                            <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.3em] pl-1">Verificaciones Obligatorias de Calidad</p>
                        </div>

                        <div className="flex-1 bg-[#F4F7FA] rounded-[40px] overflow-hidden border border-[#E2E8F0] p-6 shadow-inner">
                            <table className="w-full text-left">
                                <thead className="border-b border-[#E2E8F0]">
                                    <tr>
                                        <th className="pb-6 pl-4 text-[10px] font-black text-[#718096] uppercase tracking-widest">Labor de Prueba</th>
                                        <th className="pb-6 pr-4 text-[10px] font-black text-[#718096] uppercase tracking-widest text-right">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]/50">
                                    {[
                                        "Revisión visual (Color/Brillo)",
                                        "Búsqueda de contrastes",
                                        "Prueba del Imán (Hierro)",
                                        "Prueba de la Piedra (Toque)",
                                        "Reacción al Ácido (18k)",
                                        "Revisión de cierres/muelles",
                                        "Pesaje (Báscula calibrada)"
                                    ].map((test, idx) => (
                                        <tr key={idx} className="group hover:bg-white/40 transition-colors">
                                            <td className="py-4 pl-4 text-sm font-bold text-[#4A5568] group-hover:text-[#1A365D] transition-colors">{test}</td>
                                            <td className="py-4 pr-4 text-right">
                                                <div className="w-8 h-8 rounded-xl border-2 border-[#E2E8F0] bg-white inline-flex items-center justify-center text-[#A0AEC0] font-black text-[10px]">--</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-8 p-6 bg-[#EBF8FF] rounded-[32px] border border-[#BEE3F8] shadow-sm flex items-start gap-4">
                                <div className="p-2 bg-[#4299E1] text-white rounded-xl shadow-md">
                                    <Info size={16} />
                                </div>
                                <p className="text-[11px] font-black text-[#2B6CB0] leading-relaxed uppercase tracking-tight">
                                    Si la pieza tiene piedras, restar el peso estimado antes de cotizar. Ante la duda, consultar con encargado.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* TIMEGRAPHER HELP MODAL */}
            <AnimatePresence>
                {showTimegrapherHelp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A365D]/20 backdrop-blur-md" onClick={() => setShowTimegrapherHelp(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white border border-[#E2E8F0] rounded-[56px] shadow-[0_32px_128px_-16px_rgba(26,54,93,0.3)] max-w-5xl w-full max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col relative"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#4299E1]/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>

                            {/* Header */}
                            <div className="p-10 border-b border-[#F4F7FA] flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-[#EBF8FF] rounded-[24px] border border-[#BEE3F8] shadow-sm">
                                        <Watch className="text-[#4299E1]" size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter leading-none mb-1">
                                            Guía del Cronocomparador
                                        </h2>
                                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.3em] pl-1">Protocolo de Medición de Manufactura</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTimegrapherHelp(false)}
                                    className="bg-[#F4F7FA] hover:bg-[#FFF5F5] text-[#A0AEC0] hover:text-[#F56565] p-3 rounded-[20px] transition-all border border-transparent hover:border-[#F56565]/20 shadow-sm"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                                {/* COLUMN 1: USAGE */}
                                <div className="space-y-8">
                                    <div className="bg-[#F4F7FA] p-8 rounded-[40px] border border-[#E2E8F0] shadow-inner">
                                        <h3 className="text-[#1A365D] font-black text-xl uppercase tracking-tighter mb-8 flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm"><Wrench size={20} /></div>
                                            1. El Ritual de Uso
                                        </h3>
                                        <ul className="space-y-6">
                                            {[
                                                { id: 'A', title: 'Carga Máxima', desc: 'Dar toda la cuerda al reloj. Sin carga = mala amplitud (Falso Negativo).' },
                                                { id: 'B', title: 'Entorno Silencioso', desc: 'Evitar ruidos cercanos. El sensor piezoeléctrico detecta todo pulso externo.' },
                                                { id: 'C', title: 'Lift Angle (Ángulo)', desc: 'Estándar: 52°. Rolex Modernos (3135/3235): 53°/55°. Omega (2500): 30°.' },
                                                { id: 'D', title: 'Posiciones Crave', desc: 'Medir siempre en Esfera Arriba (Dial Up) y Corona Abajo (Crown Down).' }
                                            ].map((item, idx) => (
                                                <li key={idx} className="flex gap-5 group">
                                                    <span className="bg-white border-2 border-[#E2E8F0] group-hover:bg-[#4299E1] group-hover:text-white group-hover:border-[#4299E1] text-[#A0AEC0] font-black w-8 h-8 rounded-xl flex items-center justify-center text-[10px] transition-all shadow-sm shrink-0">
                                                        {item.id}
                                                    </span>
                                                    <div>
                                                        <strong className="text-[#1A365D] text-sm font-black uppercase tracking-tight block mb-1">{item.title}</strong>
                                                        <p className="text-[#718096] text-[13px] font-bold leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* COLUMN 2: INTERPRETATION */}
                                <div className="space-y-10">
                                    <h3 className="text-[#48BB78] font-black text-xl uppercase tracking-tighter flex items-center gap-4">
                                        <div className="p-2 bg-[#F0FFF4] rounded-xl shadow-sm border border-[#48BB78]/20"><Scale size={20} /></div>
                                        2. Análisis de Resultados
                                    </h3>

                                    {/* RATE */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center ml-2">
                                            <h4 className="font-black text-[#1A365D] text-xs uppercase tracking-widest">A. RATE (Desviación)</h4>
                                            <span className="text-[10px] font-black bg-[#F4F7FA] px-3 py-1 rounded-full text-[#A0AEC0] border border-[#E2E8F0]">S/D</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-[#F0FFF4] border-2 border-[#48BB78]/20 p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#2F855A] uppercase block mb-1">Excelente</span>
                                                <p className="text-sm font-black text-[#1A365D]">-2 a +5</p>
                                            </div>
                                            <div className="bg-white border-2 border-[#F4F7FA] p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#718096] uppercase block mb-1">Normal</span>
                                                <p className="text-sm font-black text-[#1A365D]">+15/-10</p>
                                            </div>
                                            <div className="bg-[#FFF5F5] border-2 border-[#F56565]/20 p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#C53030] uppercase block mb-1">Alerta</span>
                                                <p className="text-sm font-black text-[#1A365D]">&gt; +/- 20</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AMPLITUDE */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center ml-2">
                                            <h4 className="font-black text-[#1A365D] text-xs uppercase tracking-widest">B. AMPLITUDE (Salud)</h4>
                                            <span className="text-[10px] font-black bg-[#F4F7FA] px-3 py-1 rounded-full text-[#A0AEC0] border border-[#E2E8F0]">GRADOS (°)</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-[#F0FFF4] border-2 border-[#48BB78]/20 p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#2F855A] uppercase block mb-1">Fuerte</span>
                                                <p className="text-sm font-black text-[#1A365D]">270° - 310°</p>
                                            </div>
                                            <div className="bg-[#FFFBEB] border-2 border-[#F6E05E]/20 p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#B7791F] uppercase block mb-1">Baja</span>
                                                <p className="text-sm font-black text-[#1A365D]">&lt; 230°</p>
                                            </div>
                                            <div className="bg-[#FFF5F5] border-2 border-[#F56565]/20 p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#C53030] uppercase block mb-1">Rebote</span>
                                                <p className="text-sm font-black text-[#1A365D]">&gt; 330°</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BEAT ERROR */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center ml-2">
                                            <h4 className="font-black text-[#1A365D] text-xs uppercase tracking-widest">C. BEAT ERROR (Ritmo)</h4>
                                            <span className="text-[10px] font-black bg-[#F4F7FA] px-3 py-1 rounded-full text-[#A0AEC0] border border-[#E2E8F0]">MILISEG. (ms)</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-[#F0FFF4] border-2 border-[#48BB78]/20 p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#2F855A] uppercase block mb-1">Perfecto</span>
                                                <p className="text-sm font-black text-[#1A365D]">0.0 - 0.2</p>
                                            </div>
                                            <div className="bg-white border-2 border-[#F4F7FA] p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#718096] uppercase block mb-1">Aceptable</span>
                                                <p className="text-sm font-black text-[#1A365D]">0.8</p>
                                            </div>
                                            <div className="bg-[#FFF5F5] border-2 border-[#F56565]/20 p-4 rounded-[28px] text-center shadow-sm">
                                                <span className="text-[9px] font-black text-[#C53030] uppercase block mb-1">Cojo</span>
                                                <p className="text-sm font-black text-[#1A365D]">&gt; 1.0</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 mt-auto bg-[#F4F7FA] border-t border-[#E2E8F0] flex items-center justify-center gap-4">
                                <div className="p-2 bg-[#1A365D] text-white rounded-lg"><Info size={16} /></div>
                                <p className="text-[10px] font-black text-[#718096] uppercase tracking-[0.2em]">Cualquier anomalía técnica debe ser consultada con Servicio Técnico Oficial.</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Market;
