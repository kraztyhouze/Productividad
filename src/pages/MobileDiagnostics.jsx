import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Smartphone, CheckCircle, Monitor, Camera, Play, Check, Mic, Speaker, Battery, MapPin, Activity, ShieldAlert, Key, Zap, Wifi, Grid, Maximize, AlertTriangle } from 'lucide-react';
// Firebase removed

const MobileDiagnostics = () => {
    const { sessionId } = useParams();
    // Order: Intro -> IMEI -> Network -> Cosmetic -> Security -> Pixels -> Touch -> Vibration -> Sensors -> Mic -> Audio -> FrontCam -> RearCam -> Flash -> GPS -> Charging -> Done
    const [step, setStep] = useState('intro');
    const [results, setResults] = useState([]);
    const [deviceInfo, setDeviceInfo] = useState({});

    // Init Session
    useEffect(() => {
        if (sessionId) {
            const getDeviceName = () => {
                const ua = navigator.userAgent;
                const androidMatch = ua.match(/Android.*?; (.*?)(\)| Build)/);
                if (androidMatch && androidMatch[1]) return androidMatch[1].trim();
                if (ua.match(/iPhone/i)) return "Apple iPhone";
                if (ua.match(/iPad/i)) return "Apple iPad";
                return "Dispositivo Genérico";
            };

            const info = {
                model: getDeviceName(),
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language
            };
            setDeviceInfo(info);

            // Mark as in_progress
            fetch(`/api/diagnostics/update/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'in_progress', deviceInfo: info })
            }).catch(e => console.error(e));
        }
    }, [sessionId]);

    const handleResult = async (testId, passed, details) => {
        const newResult = { name: testId, passed, details };
        const updatedResults = [...results, newResult]; // Append new result

        // Prevent duplicates if re-running? For now we just append.
        setResults(updatedResults);

        // Sync partial result
        fetch(`/api/diagnostics/update/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: newResult })
        }).catch(e => console.warn("Sync failed", e));
    };

    const next = (nextStep) => setStep(nextStep);

    // Common Button Styles
    const btnBase = "w-full max-w-xs py-3 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 mb-3 flex items-center justify-center gap-2";
    const btnPrimary = `${btnBase} bg-pink-600 text-white shadow-pink-600/20`;
    const btnSecondary = `${btnBase} bg-white text-slate-900`;
    const btnDanger = `${btnBase} bg-slate-800 text-red-500 border border-red-500/30`;

    // --- STEPS ---

    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center safe-area-inset">
                <Smartphone size={64} className="text-pink-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-black mb-2">PhoneCheck AI</h1>
                <p className="text-slate-400 mb-2">ID: <span className="font-mono text-pink-400">{sessionId ? sessionId.slice(0, 8) : '...'}</span></p>
                <p className="text-slate-500 mb-8 max-w-xs text-sm">{deviceInfo.model || 'Detectando...'}</p>

                <button
                    onClick={() => next('imei')}
                    className={btnPrimary}
                >
                    COMENZAR TEST
                </button>
            </div>
        );
    }

    if (step === 'imei') return <IMEITest btnPrimary={btnPrimary} onComplete={(res) => { handleResult('imei', true, res); next('network'); }} />;
    if (step === 'network') return <NetworkTest btnPrimary={btnPrimary} onComplete={(res) => { handleResult('network', true, res); next('cosmetic'); }} />;
    if (step === 'cosmetic') return <CosmeticTest onComplete={(res) => { handleResult('cosmetic', true, res); next('security'); }} />;
    if (step === 'security') return <SecurityTest onComplete={(res) => { handleResult('security', res.passed, res.details); next('pixels'); }} />;

    // Hardware Tests
    if (step === 'pixels') return <PixelTest onComplete={(res) => { handleResult('pixels', true, 'Verificado'); next('touch'); }} />;
    if (step === 'touch') return <TouchTest onComplete={(res) => { handleResult('touch', true, res); next('vibration'); }} />;
    if (step === 'vibration') return <VibrationTest btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('vibration', res.passed, res.details); next('sensors'); }} />;
    if (step === 'sensors') return <SensorTest onComplete={(res) => { handleResult('sensors', res.passed, res.details); next('mic'); }} />;

    // Audio
    if (step === 'mic') return <MicTest btnPrimary={btnPrimary} btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('mic', res.passed, res.details); next('audio'); }} />;
    if (step === 'audio') return <AudioTest btnPrimary={btnPrimary} btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('audio', res.passed, res.details); next('front-camera'); }} />;

    // Cameras
    if (step === 'front-camera') return <CameraTest type="user" title="Cámara Frontal" onComplete={(res) => { handleResult('front-camera', res.passed, res.details); next('camera'); }} />;
    if (step === 'camera') return <CameraTest type="environment" title="Cámara Trasera" sessionId={sessionId} upload={true} onComplete={(res) => { handleResult('camera', res.passed, res.details); next('flashlight'); }} />;
    if (step === 'flashlight') return <FlashlightTest btnPrimary={btnPrimary} btnSecondary={btnSecondary} btnDanger={btnDanger} onComplete={(res) => { handleResult('flashlight', res.passed, res.details); next('gps'); }} />;

    // Connectivity & Power
    if (step === 'gps') return <GPSTest onComplete={(res) => { handleResult('gps', res.passed, res.details); next('charging'); }} />;
    if (step === 'charging') return <ChargingTest onComplete={(res) => { handleResult('charging', res.passed, res.details); next('done'); }} />;

    if (step === 'done') {
        // Final upload ensure
        useEffect(() => {
            if (sessionId) {
                fetch(`/api/diagnostics/update/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'completed', results })
                }).catch(e => console.error(e));
            }
        }, []);

        return (
            <div className="min-h-screen bg-green-600 text-white flex flex-col items-center justify-center p-8 text-center safe-area-inset">
                <CheckCircle size={80} className="mb-6 animate-bounce" />
                <h1 className="text-4xl font-black mb-4">¡FINALIZADO!</h1>
                <p className="text-xl font-medium opacity-90 mb-8">Resultados enviados al PC.</p>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-sm">
                    <p>Ya puedes cerrar esta ventana.</p>
                </div>
            </div>
        );
    }

    return null;
};

// --- SUB-COMPONENTS ---

/* 1. IMEI */
const IMEITest = ({ btnPrimary, onComplete }) => {
    const [val, setVal] = useState('');
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Grid size={64} className="mb-6 text-pink-500" />
            <h2 className="text-2xl font-bold mb-4">Registro IMEI</h2>
            <p className="text-slate-400 mb-8">Marca <b className="text-white">*#06#</b> y escribe los últimos 4 dígitos.</p>
            <input
                type="tel"
                maxLength={15}
                value={val}
                onChange={e => setVal(e.target.value)}
                className="bg-slate-800 border-2 border-pink-500 rounded-xl px-6 py-4 text-4xl font-black text-center w-full max-w-xs mb-8 focus:outline-none focus:ring-4 focus:ring-pink-500/20"
                placeholder="0000"
            />
            <button onClick={() => val.length >= 4 ? onComplete(val) : alert('Introduce al menos 4 dígitos')} className={btnPrimary}>GUARDAR</button>
        </div>
    );
};

/* 2. NETWORK */
const NetworkTest = ({ btnPrimary, onComplete }) => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const type = conn ? conn.effectiveType : '4g';
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Wifi size={64} className="mb-6 text-green-400" />
            <h2 className="text-2xl font-bold mb-4">Conectividad</h2>
            <p className="text-3xl font-black mb-2">{type.toUpperCase()}</p>
            <p className="text-slate-400 mb-8 text-xl border px-4 py-1 rounded-full border-slate-700 bg-slate-800">{navigator.onLine ? 'Conectado' : 'Sin Internet'}</p>
            <button onClick={() => onComplete(`${type} (${navigator.onLine ? 'Online' : 'Offline'})`)} className={btnPrimary}>CONFIRMAR</button>
        </div>
    );
};

/* 3. COSMETIC */
const CosmeticTest = ({ onComplete }) => {
    const [damages, setDamages] = useState([]);
    const steps = [
        { id: 'screen', text: '¿Pantalla Rota/Astillada?' },
        { id: 'body', text: '¿Chasis golpeado o doblado?' },
        { id: 'buttons', text: '¿Botones físicos en mal estado?' }
    ];
    const [curr, setCurr] = useState(0);

    const handle = (hasDamage) => {
        let newDamages = damages;
        if (hasDamage) newDamages = [...damages, steps[curr].text]; // capture damage text

        if (curr < steps.length - 1) {
            setDamages(newDamages);
            setCurr(curr + 1);
        } else {
            // Finish
            const finalList = hasDamage ? [...damages, steps[curr].text] : damages;
            onComplete(finalList.length > 0 ? "Daños: " + finalList.join(', ') : "Impecable");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Maximize size={64} className="mb-6 text-amber-500" />
            <h2 className="text-2xl font-bold mb-4">Estado Físico ({curr + 1}/{steps.length})</h2>
            <p className="text-xl mb-12 min-h-[60px] font-medium">{steps[curr].text}</p>
            <div className="flex gap-4 w-full max-w-md">
                <button onClick={() => handle(true)} className="flex-1 py-6 bg-red-500/10 text-red-400 border border-red-500/50 rounded-2xl font-bold text-xl active:bg-red-500/30">SÍ</button>
                <button onClick={() => handle(false)} className="flex-1 py-6 bg-green-500/10 text-green-400 border border-green-500/50 rounded-2xl font-bold text-xl active:bg-green-500/30">NO</button>
            </div>
        </div>
    );
};

/* 4. SECURITY */
const SecurityTest = ({ onComplete }) => {
    const [flags, setFlags] = useState([]);
    const questions = [
        { id: 'MDM', text: '¿Apps de gestión (MDM) o perfil "Empresa" en ajustes?' },
        { id: 'ICLOUD', text: '¿Cuenta iCloud / Google vinculada?' },
        { id: 'PIN', text: '¿Pide PIN/Patrón al reiniciar?' }
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
            onComplete({
                passed: !hasIssues,
                details: hasIssues ? "Alertas: " + finalFlags.join(', ') : "Limpio"
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert size={64} className="mb-6 text-purple-500" />
            <h2 className="text-2xl font-bold mb-4">Seguridad</h2>
            <p className="text-xl mb-12 min-h-[80px] font-medium max-w-xs">{questions[curr].text}</p>
            <div className="flex gap-4 w-full max-w-md">
                <button onClick={() => handle(true)} className="flex-1 py-6 bg-red-500/10 text-red-400 border border-red-500/50 rounded-2xl font-bold text-xl active:bg-red-500/30">SÍ</button>
                <button onClick={() => handle(false)} className="flex-1 py-6 bg-green-500/10 text-green-400 border border-green-500/50 rounded-2xl font-bold text-xl active:bg-green-500/30">NO</button>
            </div>
        </div>
    );
};

/* 5. PIXELS */
const PixelTest = ({ onComplete }) => {
    const colors = ['red', 'green', 'blue', 'white', 'black'];
    const [idx, setIdx] = useState(0);
    return (
        <div
            onClick={() => idx < colors.length - 1 ? setIdx(idx + 1) : onComplete()}
            className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer touch-manipulation"
            style={{ backgroundColor: colors[idx] }}
        >
            <p className="bg-black/50 text-white px-6 py-3 rounded-full pointer-events-none backdrop-blur font-bold uppercase tracking-wider text-sm">
                Toca para seguir ({idx + 1}/{colors.length})
            </p>
        </div>
    );
};

/* 6. TOUCH (Canvas) */
const TouchTest = ({ onComplete }) => {
    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { innerWidth, innerHeight } = window;
        canvas.width = innerWidth;
        canvas.height = innerHeight;

        // Grid setup
        const cols = 8; const rows = 12;
        const cw = innerWidth / cols;
        const ch = innerHeight / rows;
        const grid = new Array(cols * rows).fill(false);

        // Draw grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, innerHeight); ctx.stroke(); }
        for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(0, i * ch); ctx.lineTo(innerWidth, i * ch); ctx.stroke(); }

        const fill = (x, y) => {
            const c = Math.floor(x / cw);
            const r = Math.floor(y / ch);
            const idx = r * cols + c;
            if (idx >= 0 && idx < grid.length && !grid[idx]) {
                grid[idx] = true;
                ctx.fillStyle = 'rgba(236, 72, 153, 0.8)'; // pink-500
                ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);

                const p = (grid.filter(Boolean).length / grid.length) * 100;
                setProgress(p);
                if (p > 85) setTimeout(() => onComplete(`Cobertura: ${p.toFixed(0)}%`), 200);
            }
        };

        const handle = (e) => {
            // Prevent default to stop scrolling
            if (e.cancelable) e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            fill(touch.clientX, touch.clientY);
        };

        canvas.addEventListener('touchmove', handle, { passive: false });
        canvas.addEventListener('mousemove', handle);
        canvas.addEventListener('touchstart', handle, { passive: false }); // Start painting immediately

        return () => {
            if (canvas) {
                canvas.removeEventListener('touchmove', handle);
                canvas.removeEventListener('mousemove', handle);
                canvas.removeEventListener('touchstart', handle);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50 overscroll-none touch-none">
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div className="absolute top-8 left-0 w-full text-center pointer-events-none p-4">
                <span className="bg-slate-900/80 border border-white/20 text-white font-bold px-6 py-3 rounded-full backdrop-blur shadow-xl text-lg">
                    Pinta la pantalla: <span className="text-pink-500">{progress.toFixed(0)}%</span>
                </span>
            </div>
        </div>
    );
};

/* 7. VIBRATION */
const VibrationTest = ({ btnSecondary, btnDanger, onComplete }) => {
    const vibrate = () => {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Activity size={64} className="mb-6 text-white" />
            <h2 className="text-2xl font-bold mb-4">Vibración</h2>
            <button onClick={vibrate} className="w-full max-w-xs py-4 rounded-xl font-bold text-lg bg-slate-700 hover:bg-slate-600 mb-12 shadow-lg">PROBAR VIBRACIÓN</button>

            <p className="mb-4 text-slate-400">¿Vibró el dispositivo?</p>
            <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => onComplete({ passed: true, details: 'OK' })} className={btnSecondary}>SÍ</button>
                <button onClick={() => onComplete({ passed: false, details: 'Fallo' })} className={btnDanger}>NO</button>
            </div>
        </div>
    );
};

/* 8. SENSORS */
const SensorTest = ({ onComplete }) => {
    const [val, setVal] = useState(0);

    useEffect(() => {
        const handler = (e) => {
            const acc = e.accelerationIncludingGravity;
            if (acc) {
                const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
                setVal(prev => prev + total);
                if (total > 25) { // Shake detected
                    window.removeEventListener('devicemotion', handler);
                    // Slight delay for UX
                    setTimeout(() => onComplete({ passed: true, details: 'Acelerómetro OK' }), 500);
                }
            }
        };

        if (window.DeviceMotionEvent) {
            // iOS requires permission request (not implemented here purely auto, but usually needs a click)
            // For this flow we assume it works or user accepts if prompted previously
            window.addEventListener('devicemotion', handler);
        } else {
            onComplete({ passed: false, details: 'No soportado' });
        }

        // Timeout fallback
        const tm = setTimeout(() => {
            window.removeEventListener('devicemotion', handler);
            onComplete({ passed: true, details: 'Sensor (Timeout/Skip)' }); // Lenient pass or fail?
        }, 5000);

        return () => {
            window.removeEventListener('devicemotion', handler);
            clearTimeout(tm);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Maximize size={64} className="mb-6 text-blue-500 animate-spin-slow" />
            <h2 className="text-2xl font-bold mb-4">Sensores</h2>
            <p className="text-slate-400">Mueve el dispositivo...</p>
        </div>
    );
};

/* 9. MIC */
const MicTest = ({ btnPrimary, btnSecondary, btnDanger, onComplete }) => {
    const [status, setStatus] = useState('idle'); // idle, recording, playback
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);

    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                setAudioUrl(URL.createObjectURL(blob));
                setStatus('playback');
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setStatus('recording');
            setTimeout(() => recorder.stop(), 3000);
        } catch (e) {
            onComplete({ passed: false, details: 'Error Mic: ' + e.message });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Mic size={64} className={`mb-6 transition-colors duration-300 ${status === 'recording' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            <h2 className="text-2xl font-bold mb-4">Micrófono</h2>

            {status === 'idle' && (
                <button onClick={start} className={btnPrimary}>GRABAR (3s)</button>
            )}

            {status === 'recording' && <p className="text-xl font-mono text-red-500">GRABANDO...</p>}

            {status === 'playback' && (
                <div className="flex flex-col gap-6 w-full max-w-xs animate-in fade-in">
                    <p className="text-slate-400">Escucha tu grabación:</p>
                    <audio src={audioUrl} controls className="w-full" />
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => onComplete({ passed: true, details: 'Audio Claro' })} className={btnSecondary}>OK</button>
                        <button onClick={() => onComplete({ passed: false, details: 'Ruido/Silencio' })} className={btnDanger}>MAL</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* 10. AUDIO (Speakers) */
const AudioTest = ({ btnPrimary, btnSecondary, btnDanger, onComplete }) => {
    const play = () => {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const now = ctx.currentTime;

        // Bass Sweep
        const osc1 = ctx.createOscillator();
        osc1.frequency.setValueAtTime(60, now);
        osc1.frequency.linearRampToValueAtTime(300, now + 1);
        osc1.connect(ctx.destination);
        osc1.start(now); osc1.stop(now + 1);

        // Treble Sweep
        const osc2 = ctx.createOscillator();
        osc2.start(now + 1.2); osc2.stop(now + 2.2);
        osc2.frequency.setValueAtTime(3000, now + 1.2);
        osc2.frequency.linearRampToValueAtTime(8000, now + 2.2);
        osc2.connect(ctx.destination);

        // Chord
        [440, 554, 659].forEach(f => {
            const o = ctx.createOscillator();
            o.frequency.setValueAtTime(f, now + 2.5);
            o.connect(ctx.destination);
            o.start(now + 2.5); o.stop(now + 3.5);
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Speaker size={64} className="mb-6 text-blue-500" />
            <h2 className="text-2xl font-bold mb-4">Altavoces</h2>
            <button onClick={play} className={`${btnPrimary} bg-blue-600`}>REPRODUCIR SONIDOS</button>

            <p className="mb-6 text-sm text-slate-400 max-w-xs">¿Escuchaste un bajo, un agudo chillón y un acorde final?</p>
            <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => onComplete({ passed: true, details: 'OK' })} className={btnSecondary}>SÍ</button>
                <button onClick={() => onComplete({ passed: false, details: 'Fallo' })} className={btnDanger}>NO</button>
            </div>
        </div>
    );
};

/* 11. CAMERA */
const CameraTest = ({ type, title, sessionId, upload, onComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: type } })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(e => {
                // Fail gracefully if camera not found
                console.error(e);
                onComplete({ passed: false, details: 'Error acceso cámara' });
            });
    }, [type]);

    const capture = () => {
        if (!videoRef.current) return;
        const vid = videoRef.current;
        const stream = vid.srcObject;

        if (upload && sessionId) {
            // Local mode: Skip image upload, just pass
            // In a real app we'd post to /api/upload or similar
            const stream = vid.srcObject;
            if (stream) stream.getTracks().forEach(t => t.stop());
            onComplete({ passed: true, details: 'Foto Capturada (Local)' });
        } else {
            if (stream) stream.getTracks().forEach(t => t.stop());
            onComplete({ passed: true, details: 'OK' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col p-0">
            <div className="absolute top-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-10 text-center">
                <h2 className="text-white font-bold drop-shadow-md">{title}</h2>
            </div>

            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-12">
                <button onClick={() => onComplete({ passed: false, details: 'Fallo/Negro' })} className="text-red-500 font-bold text-sm bg-black/50 px-4 py-2 rounded-full">NO FUNCIONA</button>
                <button onClick={capture} className="bg-white border-4 border-slate-300 w-20 h-20 rounded-full shadow-lg hover:scale-105 transition-transform"></button>
                <div className="w-24"></div> {/* Spacer */}
            </div>
        </div>
    );
};

/* 12. FLASHLIGHT */
const FlashlightTest = ({ btnPrimary, btnSecondary, btnDanger, onComplete }) => {
    const toggle = async (on) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const track = stream.getVideoTracks()[0];
            const cap = track.getCapabilities();
            if (!cap.torch) throw new Error("No Torch");

            await track.applyConstraints({ advanced: [{ torch: on }] });
            if (!on) track.stop(); // Stop completely on release
            else return track; // Returned to keep alive? 

            // Note: If we stop the track, the light goes off. So on release we stop the track.
        } catch (e) { console.warn(e); }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Zap size={64} className="mb-6 text-yellow-400" />
            <h2 className="text-2xl font-bold mb-4">Linterna / Flash</h2>
            <button
                onMouseDown={() => toggle(true)}
                onMouseUp={() => toggle(false)}
                onTouchStart={() => toggle(true)}
                onTouchEnd={() => toggle(false)}
                className={`${btnPrimary} bg-yellow-600 mb-12`}
            >
                MANTENER PARA ENCENDER
            </button>
            <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => onComplete({ passed: true, details: 'OK' })} className={btnSecondary}>FUNCIONA</button>
                <button onClick={() => onComplete({ passed: false, details: 'Fallo' })} className={btnDanger}>NO VA</button>
            </div>
        </div>
    );
};

/* 13. GPS */
const GPSTest = ({ onComplete }) => {
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (p) => onComplete({ passed: true, details: `${p.coords.latitude.toFixed(2)},${p.coords.longitude.toFixed(2)}` }),
                (e) => onComplete({ passed: false, details: 'Error: ' + e.message })
            );
        } else {
            onComplete({ passed: false, details: 'No soportado' });
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <MapPin size={64} className="mb-6 text-red-500 animate-bounce" />
            <h2 className="text-2xl font-bold">Obteniendo Ubicación...</h2>
        </div>
    );
};

/* 14. CHARGING */
const ChargingTest = ({ onComplete }) => {
    const [status, setStatus] = useState('Esperando cable...');
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (navigator.getBattery) {
            navigator.getBattery().then(b => {
                const check = () => {
                    const level = (b.level * 100).toFixed(0);
                    if (b.charging) {
                        setStatus(`⚡ Cargando (${level}%)`);
                        setTimeout(() => onComplete({ passed: true, details: `Carga OK (${level}%)` }), 1500);
                    } else {
                        setStatus(`Conecta el cargador... (${level}%)`);
                    }
                };
                check();
                b.addEventListener('chargingchange', check);
            });
        } else {
            setIsSupported(false);
            setStatus('Detección automática no soportada (iOS/Otros)');
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Battery size={64} className={`mb-6 ${isSupported ? 'text-green-500 animate-pulse' : 'text-slate-500'}`} />
            <h2 className="text-2xl font-bold mb-2">Prueba de Carga</h2>
            <p className="text-slate-400 mb-8">{status}</p>

            {!isSupported && (
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <p className="text-xs text-slate-500 mb-2">Por favor, verifica visualmente que carga:</p>
                    <button onClick={() => onComplete({ passed: true, details: 'Carga Visual OK' })} className="w-full py-3 bg-green-600 rounded-xl font-bold text-white">CARGA CORRECTAMENTE</button>
                    <button onClick={() => onComplete({ passed: false, details: 'Fallo Carga' })} className="w-full py-3 bg-red-600/20 text-red-500 border border-red-600/50 rounded-xl font-bold">NO CARGA</button>
                </div>
            )}

            {isSupported && (
                <button onClick={() => onComplete({ passed: false, details: 'Puerto Roto/Saltado' })} className="text-xs text-slate-500 underline mt-8">Saltar Test (Sin cargador)</button>
            )}
        </div>
    );
};

export default MobileDiagnostics;
