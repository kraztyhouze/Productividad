import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Smartphone, CheckCircle, Mic, Speaker, Battery, MapPin, Activity, ShieldAlert, Zap, Wifi, Grid, Maximize, X } from 'lucide-react';

const MobileDiagnostics = () => {
    const { sessionId } = useParams();
    const [step, setStep] = useState('intro');
    const [results, setResults] = useState([]);
    const [deviceInfo, setDeviceInfo] = useState({});

    // Init Session
    useEffect(() => {
        if (sessionId) {
            const getDeviceName = () => {
                const ua = navigator.userAgent;
                if (navigator.userAgentData) {
                    const mobileBrand = navigator.userAgentData.brands.find(b => b.brand !== "Not A;Brand" && b.brand !== "Chromium" && b.brand !== "Google Chrome");
                    if (mobileBrand) return `${mobileBrand.brand} ${navigator.userAgentData.mobile ? '(Mobile)' : ''}`;
                }
                const androidMatch = ua.match(/Android.*?; (.*?)(?:\)| Build)/);
                if (androidMatch && androidMatch[1]) {
                    const candidate = androidMatch[1].trim();
                    if (candidate.length > 2 && !candidate.includes('wv')) return candidate;
                }
                if (ua.match(/iPhone/i)) return "Apple iPhone";
                if (ua.match(/iPad/i)) return "Apple iPad";
                return "Dispositivo Móvil";
            };

            const info = {
                model: getDeviceName(),
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language
            };
            setDeviceInfo(info);
        }
    }, [sessionId]);

    const handleResult = async (testId, passed, details) => {
        const newResult = { name: testId, passed, details };
        setResults(prev => [...prev, newResult]);

        fetch(`/api/diagnostics/update/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: newResult })
        }).catch(e => console.warn("Sync failed", e));
    };

    const next = (nextStep) => setStep(nextStep);

    // Common Button Styles - New Theme
    const btnBase = "w-full max-w-xs py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 mb-4 flex items-center justify-center gap-3 shadow-md";
    const btnPrimary = `${btnBase} bg-[#FF8C9D] text-white hover:bg-[#ff7a8d] shadow-[#FF8C9D]/20`;
    const btnSecondary = `${btnBase} bg-white text-[#1A365D] border border-[#E2E8F0] hover:bg-[#F4F7FA]`;
    const btnDanger = `${btnBase} bg-red-50 text-red-500 border border-red-100 hover:bg-red-100`;

    // --- STEPS ---

    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-white">
                    <Smartphone size={48} className="text-[#FF8C9D] animate-pulse" />
                </div>
                <h1 className="text-4xl font-black mb-2 tracking-tight">Diagnóstico <span className="text-[#FF8C9D]">IA</span></h1>
                <p className="text-[#718096] mb-8 font-medium">Análisis de hardware para ID: <span className="font-mono text-[#FF8C9D]">{sessionId ? sessionId.slice(0, 8).toUpperCase() : '...'}</span></p>

                <div className="w-full max-w-xs bg-white p-6 rounded-3xl shadow-sm border border-[#E2E8F0] mb-8">
                    <p className="text-[10px] uppercase font-bold text-[#A0AEC0] mb-2">Dispositivo Detectado</p>
                    <p className="text-sm font-bold text-[#1A365D] mb-4">{deviceInfo.model || 'Detectando...'}</p>
                    <input
                        type="text"
                        placeholder="Tu Nombre o Alias"
                        className="w-full bg-[#F4F7FA] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1A365D] focus:border-[#FF8C9D] outline-none text-center font-bold placeholder:text-[#A0AEC0]"
                        onChange={(e) => setDeviceInfo(prev => ({ ...prev, employee: e.target.value }))}
                    />
                </div>

                <button
                    onClick={() => {
                        if (!deviceInfo.employee) return alert("Introduce tu nombre/alias");
                        fetch(`/api/diagnostics/update/${sessionId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'in_progress', deviceInfo })
                        }).catch(e => console.error(e));
                        next('imei');
                    }}
                    className={btnPrimary}
                >
                    COMENZAR ANÁLISIS
                </button>
            </div>
        );
    }

    if (step === 'imei') return <IMEITest btnPrimary={btnPrimary} onComplete={(res) => { handleResult('imei', true, res); next('network'); }} />;
    if (step === 'network') return <NetworkTest btnPrimary={btnPrimary} onComplete={(res) => { handleResult('network', true, res); next('cosmetic'); }} />;
    if (step === 'cosmetic') return <CosmeticTest onComplete={(res) => { handleResult('cosmetic', true, res); next('security'); }} />;
    if (step === 'security') return <SecurityTest onComplete={(res) => { handleResult('security', res.passed, res.details); next('pixels'); }} />;
    if (step === 'pixels') return <PixelTest onComplete={(res) => { handleResult('pixels', true, 'Verificado'); next('touch'); }} />;
    if (step === 'touch') return <TouchTest onComplete={(res) => { handleResult('touch', true, res); next('vibration'); }} />;
    if (step === 'vibration') return <VibrationTest btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('vibration', res.passed, res.details); next('sensors'); }} />;
    if (step === 'sensors') return <SensorTest onComplete={(res) => { handleResult('sensors', res.passed, res.details); next('mic'); }} />;
    if (step === 'mic') return <MicTest btnPrimary={btnPrimary} btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('mic', res.passed, res.details); next('audio'); }} />;
    if (step === 'audio') return <AudioTest btnPrimary={btnPrimary} btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('audio', res.passed, res.details); next('front-camera'); }} />;
    if (step === 'front-camera') return <CameraTest type="user" title="Cámara Frontal" onComplete={(res) => { handleResult('front-camera', res.passed, res.details); next('camera'); }} />;
    if (step === 'camera') return <CameraTest type="environment" title="Cámara Trasera" sessionId={sessionId} upload={true} onComplete={(res) => { handleResult('camera', res.passed, res.details); next('flashlight'); }} />;
    if (step === 'flashlight') return <FlashlightTest btnPrimary={btnPrimary} btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('flashlight', res.passed, res.details); next('gps'); }} />;
    if (step === 'gps') return <GPSTest onComplete={(res) => { handleResult('gps', res.passed, res.details); next('charging'); }} />;
    if (step === 'charging') return <ChargingTest onComplete={(res) => { handleResult('charging', res.passed, res.details); next('done'); }} />;
    if (step === 'done') return <FinalStep sessionId={sessionId} results={results} />;

    return null;
};

/* 0. DONE STEP */
const FinalStep = ({ sessionId, results }) => {
    useEffect(() => {
        if (sessionId) {
            fetch(`/api/diagnostics/update/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed', results })
            }).catch(e => console.error(e));
        }
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-green-500 text-white flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 border border-white/30 animate-bounce">
                <CheckCircle size={64} />
            </div>
            <h1 className="text-4xl font-black mb-4">¡ANÁLISIS COMPLETADO!</h1>
            <p className="text-xl font-medium opacity-90 mb-12">Los resultados ya están disponibles en el panel de control.</p>
            <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md">
                <p className="font-bold">Ya puedes cerrar esta pestaña</p>
            </div>
        </div>
    );
};

/* 1. IMEI */
const IMEITest = ({ btnPrimary, onComplete }) => {
    const [val, setVal] = useState('');
    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-[#E2E8F0] flex items-center justify-center mb-8">
                <Grid size={40} className="text-[#FF8C9D]" />
            </div>
            <h2 className="text-3xl font-black mb-4">Registro IMEI</h2>
            <p className="text-[#718096] mb-12">Marca <b className="text-[#1A365D]">*#06#</b> en el teclado y escribe los últimos 4 dígitos.</p>
            <input
                type="tel"
                maxLength={4}
                value={val}
                onChange={e => setVal(e.target.value)}
                className="bg-white border-2 border-[#E2E8F0] rounded-2xl px-6 py-4 text-5xl font-black text-center w-full max-w-[200px] mb-12 focus:border-[#FF8C9D] outline-none shadow-sm text-[#1A365D]"
                placeholder="0000"
            />
            <button onClick={() => val.length >= 4 ? onComplete(val) : alert('Introduce 4 dígitos')} className={btnPrimary}>GUARDAR IMEI</button>
        </div>
    );
};

/* 2. NETWORK */
const NetworkTest = ({ btnPrimary, onComplete }) => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const type = conn ? conn.effectiveType : '4g';
    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-center mb-8">
                <Wifi size={40} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-black mb-4">Conexión</h2>
            <p className="text-5xl font-black mb-4 text-green-600">{type.toUpperCase()}</p>
            <div className={`px-6 py-2 rounded-full font-bold text-sm mb-12 ${navigator.onLine ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {navigator.onLine ? 'ESTADO: ONLINE' : 'ESTADO: SIN CONEXIÓN'}
            </div>
            <button onClick={() => onComplete(`${type} (${navigator.onLine ? 'Online' : 'Offline'})`)} className={btnPrimary}>CONFIRMAR</button>
        </div>
    );
};

/* 3. COSMETIC */
const CosmeticTest = ({ onComplete }) => {
    const [damages, setDamages] = useState([]);
    const steps = [
        { id: 'screen', text: '¿Pantalla Rota u Orilla Astillada?' },
        { id: 'body', text: '¿Chasis golpeado o marcas de caída?' },
        { id: 'buttons', text: '¿Botones físicos dañados o sueltos?' }
    ];
    const [curr, setCurr] = useState(0);

    const handle = (hasDamage) => {
        let newDamages = damages;
        if (hasDamage) newDamages = [...damages, steps[curr].text];
        if (curr < steps.length - 1) {
            setDamages(newDamages);
            setCurr(curr + 1);
        } else {
            const finalList = hasDamage ? [...damages, steps[curr].text] : damages;
            onComplete(finalList.length > 0 ? "Daños: " + finalList.join(', ') : "Estado Impecable");
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center mb-8">
                <Maximize size={40} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-wide opacity-60">TEST FÍSICO ({curr + 1}/{steps.length})</h2>
            <p className="text-2xl font-bold mb-12 min-h-[80px] flex items-center justify-center px-4 leading-tight">{steps[curr].text}</p>
            <div className="flex gap-4 w-full max-w-md">
                <button onClick={() => handle(true)} className="flex-1 py-8 bg-red-50 text-red-600 border border-red-100 rounded-3xl font-black text-2xl shadow-sm transition-all active:scale-95">SÍ</button>
                <button onClick={() => handle(false)} className="flex-1 py-8 bg-white text-[#1A365D] border border-[#E2E8F0] rounded-3xl font-black text-2xl shadow-sm transition-all active:scale-95">NO</button>
            </div>
        </div>
    );
};

/* 4. SECURITY */
const SecurityTest = ({ onComplete }) => {
    const [flags, setFlags] = useState([]);
    const questions = [
        { id: 'MDM', text: '¿Perfil de Gestión (MDM) en Ajustes?' },
        { id: 'ICLOUD', text: '¿Sigue vinculado a alguna Cuenta?' },
        { id: 'PIN', text: '¿Tiene Código de Bloqueo activo?' }
    ];
    const [curr, setCurr] = useState(0);

    const handle = (isBad) => {
        let newFlags = flags;
        if (isBad) newFlags = [...flags, questions[curr].id];
        if (curr < questions.length - 1) {
            setFlags(newFlags);
            setCurr(curr + 1);
        } else {
            const finalFlags = isBad ? [...flags, questions[curr].id] : flags;
            const hasIssues = finalFlags.length > 0;
            onComplete({ passed: !hasIssues, details: hasIssues ? "Alertas: " + finalFlags.join(', ') : "Sin Cuentas" });
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center mb-8">
                <ShieldAlert size={40} className="text-purple-500" />
            </div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-wide opacity-60 text-purple-600">SEGURIDAD ({curr + 1}/{questions.length})</h2>
            <p className="text-2xl font-bold mb-12 min-h-[80px] flex items-center justify-center px-4 leading-tight">{questions[curr].text}</p>
            <div className="flex gap-4 w-full max-w-md">
                <button onClick={() => handle(true)} className="flex-1 py-8 bg-[#F5F3FF] text-purple-600 border border-purple-100 rounded-3xl font-black text-2xl shadow-sm transition-all active:scale-95">SÍ</button>
                <button onClick={() => handle(false)} className="flex-1 py-8 bg-white text-[#1A365D] border border-[#E2E8F0] rounded-3xl font-black text-2xl shadow-sm transition-all active:scale-95">NO</button>
            </div>
        </div>
    );
};

/* 5. PIXELS */
const PixelTest = ({ onComplete }) => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'];
    const [idx, setIdx] = useState(0);
    return (
        <div
            onClick={() => idx < colors.length - 1 ? setIdx(idx + 1) : onComplete()}
            className="fixed inset-0 z-50 flex flex-col items-center justify-end p-12 transition-colors duration-200"
            style={{ backgroundColor: colors[idx] }}
        >
            <div className="bg-white/90 backdrop-blur-md text-[#1A365D] px-8 py-4 rounded-3xl shadow-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 border border-white">
                Analizando Píxeles <span className="text-[#FF8C9D]">{idx + 1}/{colors.length}</span>
            </div>
        </div>
    );
};

/* 6. TOUCH */
const TouchTest = ({ onComplete }) => {
    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { innerWidth, innerHeight } = window;
        canvas.width = innerWidth;
        canvas.height = innerHeight;

        const cols = 8; const rows = 12;
        const cw = innerWidth / cols;
        const ch = innerHeight / rows;
        const grid = new Array(cols * rows).fill(false);

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, innerHeight); ctx.stroke(); }
        for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(0, i * ch); ctx.lineTo(innerWidth, i * ch); ctx.stroke(); }

        const fill = (x, y) => {
            const c = Math.floor(x / cw);
            const r = Math.floor(y / ch);
            const idx = r * cols + c;
            if (idx >= 0 && idx < grid.length && !grid[idx]) {
                grid[idx] = true;
                ctx.fillStyle = '#FF8C9D';
                ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
                const p = (grid.filter(Boolean).length / grid.length) * 100;
                setProgress(p);
                if (p > 90) setTimeout(() => onComplete(`Cobertura: ${p.toFixed(0)}%`), 200);
            }
        };

        const handle = (e) => {
            if (e.cancelable) e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            fill(touch.clientX, touch.clientY);
        };

        canvas.addEventListener('touchmove', handle, { passive: false });
        canvas.addEventListener('mousemove', handle);
        canvas.addEventListener('touchstart', handle, { passive: false });

        return () => {
            canvas.removeEventListener('touchmove', handle);
            canvas.removeEventListener('mousemove', handle);
            canvas.removeEventListener('touchstart', handle);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-[#F4F7FA] z-50 touch-none overscroll-none">
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div className="absolute top-12 left-0 w-full flex justify-center pointer-events-none">
                <div className="bg-white/80 border border-[#E2E8F0] text-[#1A365D] font-black px-8 py-4 rounded-3xl backdrop-blur-md shadow-2xl text-xl uppercase tracking-tighter">
                    Táctil: <span className="text-[#FF8C9D]">{progress.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
};

/* 7. VIBRATION */
const VibrationTest = ({ btnSecondary, btnDanger, onComplete }) => {
    const vibrate = () => { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); };
    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] flex items-center justify-center mb-8">
                <Activity size={40} className="text-[#FF8C9D]" />
            </div>
            <h2 className="text-3xl font-black mb-12">Test de Vibración</h2>
            <button onClick={vibrate} className="w-full max-w-xs py-6 rounded-2xl font-black text-xl bg-[#1A365D] text-white hover:bg-[#2D3748] mb-12 shadow-xl flex items-center justify-center gap-3">
                ACTIVAR VIBRACIÓN
            </button>
            <p className="mb-6 font-bold text-[#718096] uppercase tracking-wide">¿Has sentido la vibración?</p>
            <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => onComplete({ passed: true, details: 'OK' })} className={btnSecondary}>SÍ</button>
                <button onClick={() => onComplete({ passed: false, details: 'FALLA' })} className={btnDanger}>NO</button>
            </div>
        </div>
    );
};

/* 8. SENSOR */
const SensorTest = ({ onComplete }) => {
    const [status, setStatus] = useState('started');
    const start = () => {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(r => r === 'granted' ? startListening() : setStatus('error')).catch(e => setStatus('error'));
        } else { startListening(); }
    };
    const startListening = () => {
        setStatus('listening');
        const handler = (e) => {
            const acc = e.accelerationIncludingGravity;
            if (acc) {
                const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
                if (total > 25) {
                    window.removeEventListener('devicemotion', handler);
                    onComplete({ passed: true, details: 'OK' });
                }
            }
        };
        if ('DeviceMotionEvent' in window) {
            window.addEventListener('devicemotion', handler);
            setTimeout(() => { window.removeEventListener('devicemotion', handler); if (status === 'listening') setStatus('error'); }, 6000);
        } else { setStatus('error'); }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center mb-8">
                <Maximize size={40} className="text-blue-500 animate-spin-slow" />
            </div>
            <h2 className="text-3xl font-black mb-8">Sensor Movimiento</h2>
            {status === 'started' && <button onClick={start} className="w-full max-w-xs py-6 bg-blue-500 text-white rounded-2xl font-black text-xl shadow-xl">INICIAR TEST</button>}
            {status === 'listening' && <p className="text-2xl font-black animate-pulse text-blue-500">¡AGITA EL MÓVIL AHORA!</p>}
            {(status === 'error' || status === 'listening') && (
                <div className="mt-12 bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm w-full max-w-xs">
                    <p className="text-sm text-[#718096] mb-6 font-medium">Si no se detecta automáticamente:</p>
                    <div className="flex gap-4">
                        <button onClick={() => onComplete({ passed: true, details: 'OK (Manual)' })} className="flex-1 py-4 bg-white text-[#1A365D] border border-[#E2E8F0] rounded-xl font-bold">OK</button>
                        <button onClick={() => onComplete({ passed: false, details: 'FALLA' })} className="flex-1 py-4 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold">FALLA</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* 9. MIC */
const MicTest = ({ btnPrimary, btnSecondary, btnDanger, onComplete }) => {
    const [status, setStatus] = useState('idle');
    const [audioUrl, setAudioUrl] = useState(null);
    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            const chunks = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: mimeType || 'audio/webm' })));
                setStatus('playback');
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setStatus('recording');
            setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 3500);
        } catch (e) { onComplete({ passed: false, details: 'Error: ' + e.message }); }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center mb-8 transition-all ${status === 'recording' ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-[#E2E8F0] shadow-sm'}`}>
                <Mic size={56} className={`${status === 'recording' ? 'text-red-500' : 'text-[#A0AEC0]'}`} />
            </div>
            <h2 className="text-3xl font-black mb-8">Micrófono</h2>
            {status === 'idle' && <button onClick={start} className={btnPrimary}>GRABAR PRUEBA</button>}
            {status === 'recording' && <p className="text-2xl font-black text-red-500 tracking-widest">GRABANDO...</p>}
            {status === 'playback' && (
                <div className="w-full max-w-xs animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm mb-8">
                        <p className="text-xs font-bold text-[#A0AEC0] uppercase mb-4 tracking-widest">Escucha tu voz</p>
                        <audio src={audioUrl} controls className="w-full h-12" />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => onComplete({ passed: true, details: 'OK' })} className={btnSecondary}>SE OYE BIEN</button>
                        <button onClick={() => onComplete({ passed: false, details: 'FALLA' })} className={btnDanger}>FALLA</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* 10. AUDIO */
const AudioTest = ({ btnPrimary, btnSecondary, btnDanger, onComplete }) => {
    const play = () => {
        const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx(); const n = ctx.currentTime;
        [60, 150, 300].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.setValueAtTime(f, n + i * 0.5); o.connect(ctx.destination); o.start(n + i * 0.5); o.stop(n + i * 0.5 + 0.4); });
        [3000, 5000].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.setValueAtTime(f, n + 1.5 + i * 0.5); o.connect(ctx.destination); o.start(n + 1.5 + i * 0.5); o.stop(n + 1.5 + i * 0.5 + 0.4); });
    };

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center mb-8">
                <Speaker size={40} className="text-blue-500" />
            </div>
            <h2 className="text-3xl font-black mb-12">Altavoces</h2>
            <button onClick={play} className={`${btnPrimary} bg-blue-600`}>REPRODUCIR TEST</button>
            <p className="mb-6 font-bold text-[#718096] uppercase tracking-wide">¿Has oído los pitidos?</p>
            <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => onComplete({ passed: true, details: 'OK' })} className={btnSecondary}>SÍ</button>
                <button onClick={() => onComplete({ passed: false, details: 'FALLA' })} className={btnDanger}>NO</button>
            </div>
        </div>
    );
};

/* 11. CAMERA */
const CameraTest = ({ type, title, onComplete }) => {
    const videoRef = useRef(null);
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: type } })
            .then(s => { if (videoRef.current) videoRef.current.srcObject = s; })
            .catch(e => { onComplete({ passed: false, details: 'Error acceso' }); });
        return () => { if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); };
    }, [type]);

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
            <div className="absolute top-0 w-full p-8 bg-gradient-to-b from-black/60 to-transparent z-10 text-center">
                <h2 className="text-white text-xl font-black tracking-widest uppercase">{title}</h2>
            </div>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-12 w-full flex items-center justify-center gap-12 px-8">
                <button onClick={() => onComplete({ passed: false, details: 'FALLA' })} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-xs">FALLA</button>
                <button onClick={() => onComplete({ passed: true, details: 'OK' })} className="w-20 h-20 bg-white rounded-full border-8 border-white/30 shadow-2xl active:scale-90 transition-all"></button>
                <div className="w-[88px]"></div>
            </div>
        </div>
    );
};

/* 12. FLASHLIGHT */
const FlashlightTest = ({ btnPrimary, btnSecondary, btnDanger, onComplete }) => {
    const toggle = async (on) => {
        try {
            if (window.flashlightTrack) { window.flashlightTrack.stop(); window.flashlightTrack = null; }
            if (!on) return;
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', advanced: [{ torch: true }] } });
            const t = s.getVideoTracks()[0]; window.flashlightTrack = t;
            if (t.getCapabilities().torch) await t.applyConstraints({ advanced: [{ torch: true }] });
        } catch (e) { console.warn(e); }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center justify-center mb-8">
                <Zap size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black mb-12">Linterna / Flash</h2>
            <button
                onMouseDown={() => toggle(true)} onMouseUp={() => toggle(false)}
                onTouchStart={() => toggle(true)} onTouchEnd={() => toggle(false)}
                className="w-full max-w-xs py-8 bg-yellow-500 text-white rounded-3xl font-black text-2xl shadow-xl active:bg-yellow-600 active:scale-95 transition-all mb-12"
            >
                MANTENER FLASHLIGHT
            </button>
            <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => onComplete({ passed: true, details: 'OK' })} className={btnSecondary}>OK</button>
                <button onClick={() => onComplete({ passed: false, details: 'FALLA' })} className={btnDanger}>FALLA</button>
            </div>
        </div>
    );
};

/* 13. GPS */
const GPSTest = ({ onComplete }) => {
    const [status, setStatus] = useState('idle');
    const start = () => {
        setStatus('locating');
        if (!("geolocation" in navigator)) return onComplete({ passed: false, details: 'NP' });
        navigator.geolocation.getCurrentPosition(
            p => onComplete({ passed: true, details: 'Localizado OK' }),
            e => setStatus('error'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-center mb-8">
                <MapPin size={40} className={`text-red-500 ${status === 'locating' ? 'animate-bounce' : ''}`} />
            </div>
            <h2 className="text-3xl font-black mb-12">Prueba GPS</h2>
            {status === 'idle' && (
                <button onClick={start} className="w-full max-w-xs py-5 bg-[#1A365D] text-white rounded-2xl font-black text-lg shadow-xl uppercase">
                    OBTENER POSICIÓN
                </button>
            )}
            {status === 'locating' && <p className="text-xl font-bold text-red-500 animate-pulse tracking-widest">BUSCANDO SATÉLITES...</p>}
            {status === 'error' && (
                <div className="w-full max-w-xs animate-in zoom-in">
                    <p className="bg-red-50 p-4 border border-red-100 text-red-600 rounded-2xl text-xs font-bold mb-6">Error de Permisos o Tiempo de respuesta.</p>
                    <div className="flex flex-col gap-4">
                        <button onClick={start} className="w-full py-4 bg-white border border-[#E2E8F0] rounded-xl font-bold">REINTENTAR</button>
                        <button onClick={() => onComplete({ passed: true, details: 'Ignorado' })} className="w-full py-4 bg-[#F4F7FA] text-[#A0AEC0] rounded-xl font-bold text-sm">SALTAR TEST</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* 14. CHARGING */
const ChargingTest = ({ onComplete }) => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (navigator.getBattery) {
            navigator.getBattery().then(b => {
                const check = () => { if (b.charging) setTimeout(() => onComplete({ passed: true, details: 'OK' }), 1000); };
                check(); b.addEventListener('chargingchange', check);
            }).catch(() => setLoading(false));
        } else { setLoading(false); }
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F7FA] text-[#1A365D] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-green-50 rounded-full border-4 border-green-100 flex items-center justify-center mb-8">
                <Battery size={56} className="text-green-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase text-green-600">🔋 TEST DE CARGA</h2>
            <p className="text-[#718096] font-bold mb-12">CONECTA EL CARGADOR AHORA...</p>
            {!loading && (
                <div className="w-full max-w-xs flex flex-col gap-4 animate-in slide-in-from-bottom duration-500">
                    <p className="text-xs font-bold text-[#A0AEC0]">Verifica visualmente:</p>
                    <button onClick={() => onComplete({ passed: true, details: 'OK (Manual)' })} className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-xl shadow-xl">CARGA CORRECTA</button>
                    <button onClick={() => onComplete({ passed: false, details: 'FALLA' })} className="w-full py-5 bg-white border border-[#E2E8F0] text-red-500 rounded-2xl font-bold">NO CARGA</button>
                </div>
            )}
        </div>
    );
};

export default MobileDiagnostics;
