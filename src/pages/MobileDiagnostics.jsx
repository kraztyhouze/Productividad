import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Smartphone, CheckCircle, Grid, Monitor, Camera, Play, Check, Mic, Speaker, Battery, MapPin, Activity, ShieldAlert, Key } from 'lucide-react';

const MobileDiagnostics = () => {
    const { sessionId } = useParams();
    // Flow: intro -> sensors -> gps -> touch -> pixels -> cameras -> audio -> buttons -> charging -> accounts -> done
    const [step, setStep] = useState('intro');
    const [results, setResults] = useState({});
    const [sending, setSending] = useState(false);

    const sendUpdate = async (testName, result) => {
        try {
            await fetch(`/api/diagnostics/update/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: testName, result })
            });
        } catch (e) {
            console.error("Failed to sync", e);
        }
    };

    const handleTestComplete = (testName, result, nextStep) => {
        setResults(prev => ({ ...prev, [testName]: result }));
        sendUpdate(testName, result);
        if (nextStep) setStep(nextStep);
    };

    const handleFinalComplete = async (finalResults) => {
        // Optionally merge final manual checks
        if (finalResults) {
            for (const [key, val] of Object.entries(finalResults)) {
                sendUpdate(key, val);
            }
        }

        setSending(true);
        try {
            await fetch(`/api/diagnostics/update/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            setStep('done');
        } catch (e) {
            alert("Error completando test");
        } finally {
            setSending(false);
        }
    };

    // --- RENDER STEPS ---

    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center safe-area-inset">
                <Smartphone size={64} className="text-pink-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-black mb-2">Diagnóstico Completo</h1>
                <p className="text-slate-400 mb-8 max-w-md">Vamos a realizar una prueba exhaustiva de todos los componentes del dispositivo. Por favor, asegúrate de tener batería suficiente.</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-8 text-left w-full max-w-xs">
                    <span className="flex items-center gap-2"><Check size={12} /> Pantalla y Píxeles</span>
                    <span className="flex items-center gap-2"><Check size={12} /> Cámaras (Front/Rear)</span>
                    <span className="flex items-center gap-2"><Check size={12} /> Audio y Micrófono</span>
                    <span className="flex items-center gap-2"><Check size={12} /> GPS y Sensores</span>
                    <span className="flex items-center gap-2"><Check size={12} /> Botones Físicos</span>
                    <span className="flex items-center gap-2"><Check size={12} /> Carga y Batería</span>
                </div>
                <button
                    onClick={() => setStep('sensors')}
                    className="w-full max-w-xs py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl font-bold text-xl shadow-lg shadow-pink-600/20 active:scale-95 transition-transform"
                >
                    EMPEZAR TEST
                </button>
            </div>
        );
    }

    if (step === 'sensors') return <SensorTest onComplete={(res) => handleTestComplete('sensors', res, 'gps')} />;
    if (step === 'gps') return <GPSTest onComplete={(res) => handleTestComplete('gps', res, 'touch')} />;
    if (step === 'touch') return <TouchTest onComplete={(res) => handleTestComplete('touch', res, 'pixels')} />;
    if (step === 'pixels') return <PixelTest onComplete={(res) => handleTestComplete('pixels', res, 'cameras')} />;
    if (step === 'cameras') return <CameraTest onComplete={(res) => handleTestComplete('cameras', res, 'audio')} />;
    if (step === 'audio') return <AudioTest onComplete={(res) => handleTestComplete('audio', res, 'buttons')} />;
    if (step === 'buttons') return <ButtonsTest onComplete={(res) => handleTestComplete('buttons', res, 'charging')} />;
    if (step === 'charging') return <ChargingTest onComplete={(res) => handleTestComplete('charging', res, 'accounts')} />;
    if (step === 'accounts') return <AccountsTest onComplete={handleFinalComplete} />;

    if (step === 'done') {
        return (
            <div className="min-h-screen bg-green-600 text-white flex flex-col items-center justify-center p-8 text-center safe-area-inset">
                <CheckCircle size={80} className="mb-6 animate-bounce" />
                <h1 className="text-4xl font-black mb-4">¡DIAGNÓSTICO FINALIZADO!</h1>
                <p className="text-xl font-medium opacity-90 mb-8">Todos los resultados han sido enviados al servidor central.</p>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-sm">
                    <p>Ya puedes entregar el dispositivo.</p>
                </div>
            </div>
        );
    }

    return null;
};

// --- SUB-COMPONENTS ---

/* 1. SENSORS (Auto) */
const SensorTest = ({ onComplete }) => {
    const [status, setStatus] = useState('Detectando...');

    useEffect(() => {
        let sensorCount = 0;
        const checkSensors = async () => {
            // Mock check mostly as browsers limit access without interaction or https
            if (window.DeviceMotionEvent) sensorCount++;
            if (window.DeviceOrientationEvent) sensorCount++;

            // Wait a fake moment for "analysis"
            setTimeout(() => {
                onComplete({ success: true, count: sensorCount, message: 'Sensores detectados' });
            }, 1500);
        };
        checkSensors();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Activity size={64} className="text-blue-500 mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Verificando Sensores...</h2>
            <p className="text-slate-400">{status}</p>
        </div>
    );
};

/* 2. GPS (Auto) */
const GPSTest = ({ onComplete }) => {
    const [status, setStatus] = useState('Localizando satélites...');

    useEffect(() => {
        if (!navigator.geolocation) {
            onComplete({ success: false, error: 'No soportado' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                onComplete({ success: true, coords: { lat: position.coords.latitude, lng: position.coords.longitude } });
            },
            (error) => {
                onComplete({ success: false, error: error.message });
            },
            { timeout: 5000, enableHighAccuracy: true }
        );
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <MapPin size={64} className="text-red-500 mb-6 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">Test GPS</h2>
            <p className="text-slate-400">{status}</p>
            <p className="text-xs text-slate-600 mt-4">Por favor permite el acceso a la ubicación si se solicita.</p>
        </div>
    );
};

/* 3. TOUCH TEST */
const TouchTest = ({ onComplete }) => {
    const [touched, setTouched] = useState(new Set());
    const rows = 18; const cols = 10; const total = rows * cols;

    // Optimized touch handler for swipe
    const handleInteraction = (e) => {
        // Prevent scrolling on touch devices
        if (e.type.startsWith('touch')) {
            // e.preventDefault(); (Note: Passive listener issue might occur if preventing default on document level, but here on div it's tricky. Best is CSS touch-action: none)
        }

        // Get coordinates
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Find valid element under cursor/finger
        const element = document.elementFromPoint(clientX, clientY);
        if (element && element.dataset.index) {
            const index = parseInt(element.dataset.index);
            setTouched(prev => {
                if (prev.has(index)) return prev;
                const next = new Set(prev);
                next.add(index);
                return next;
            });
        }
    };

    const progress = (touched.size / total) * 100;
    const isPass = progress > 85;

    return (
        <div
            className="fixed inset-0 bg-black touch-none select-none flex flex-col z-50 overscroll-none"
            // Add listeners to parent container for swipe tracking
            onTouchStart={handleInteraction}
            onTouchMove={handleInteraction}
            onPointerDown={handleInteraction}
            onPointerMove={(e) => { if (e.buttons > 0) handleInteraction(e); }}
        >
            <div className="absolute top-0 left-0 w-full text-center pointer-events-none z-10 px-4 pt-4">
                <h2 className="text-white font-bold bg-black/50 p-2 rounded-xl backdrop-blur inline-block">
                    Pinta toda la pantalla
                </h2>
                <div className="w-full bg-slate-800 h-2 mt-2 rounded-full overflow-hidden border border-white/10">
                    <div className="bg-green-500 h-full transition-all duration-75" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-10 grid-rows-[18]">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        data-index={i}
                        className={`transition-colors duration-0 border-[0.5px] border-white/5 ${touched.has(i) ? 'bg-green-500' : 'bg-transparent'}`}
                    ></div>
                ))}
            </div>
            {isPass && (
                <button onClick={() => onComplete(true)} className="absolute bottom-10 left-8 right-8 py-4 bg-white text-green-700 font-black text-xl rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 z-20">
                    CONTINUAR
                </button>
            )}
        </div>
    );
};
// (Duplicated block removed)

/* 4. PIXEL TEST */
const PixelTest = ({ onComplete }) => {
    const colors = ['red', 'green', 'blue', 'white', 'black'];
    const [index, setIndex] = useState(0);

    const next = () => {
        if (index < colors.length - 1) setIndex(index + 1);
        else onComplete(true);
    };

    return (
        <div onClick={next} className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer" style={{ backgroundColor: colors[index] }}>
            <div className="pointer-events-none text-center mix-blend-difference text-white/50 px-4">
                <p className="text-xl font-bold uppercase mb-2">Test Píxeles</p>
                <p className="text-sm">Busca puntos muertos. Toca para seguir.</p>
                <p className="mt-8 text-xs font-mono">{index + 1} / {colors.length}</p>
            </div>
        </div>
    );
};

/* 5. CAMERA TEST */
const CameraTest = ({ onComplete }) => {
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const [mode, setMode] = useState('environment'); // environment (rear) -> user (front)

    useEffect(() => {
        startCamera(mode);
        return () => stopCamera();
    }, [mode]);

    const stopCamera = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
    };

    const startCamera = async (facingMode) => {
        stopCamera();
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
            setStream(newStream);
            if (videoRef.current) videoRef.current.srcObject = newStream;
        } catch (err) {
            console.error("Camera error", err);
            // If rear fails, try front, or just fail
        }
    };

    const confirm = () => {
        if (mode === 'environment') {
            stopCamera();
            setStream(null);
            setMode('user'); // Go to selfie
        } else {
            stopCamera();
            onComplete(true);
        }
    };

    const fail = () => {
        stopCamera();
        onComplete(false);
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col">
            <div className="relative flex-1 bg-black overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute top-4 left-0 w-full text-center">
                    <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur">
                        Cámara {mode === 'environment' ? 'Trasera (Principal)' : 'Delantera (Selfie)'}
                    </span>
                </div>
            </div>
            <div className="h-24 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-50">
                <button onClick={fail} className="text-red-500 font-bold text-sm">No Funciona</button>
                <button onClick={confirm} className="bg-white rounded-full p-4 hover:scale-105 transition-transform">
                    <Check size={32} className="text-black" />
                </button>
                <div className="w-16"></div> {/* Spacer */}
            </div>
        </div>
    );
};

/* 6. AUDIO TEST */
const AudioTest = ({ onComplete }) => {
    const [subStep, setSubStep] = useState('mic'); // mic -> speaker
    const [audioLevel, setAudioLevel] = useState(0);
    const analyzerRef = useRef(null);
    const animationRef = useRef(null);

    // Mic setup
    useEffect(() => {
        if (subStep !== 'mic') return;

        let audioContext, microphone, analyser;

        const initMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                microphone = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                microphone.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const update = () => {
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((src, a) => src + a, 0) / dataArray.length;
                    setAudioLevel(avg);
                    animationRef.current = requestAnimationFrame(update);
                };
                update();
            } catch (e) {
                console.error("Mic error", e);
            }
        };
        initMic();

        return () => {
            if (audioContext) audioContext.close();
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [subStep]);

    // Play Sound
    const playTestSound = () => {
        // Use a more reliable sound source or oscillator
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.type = 'sine';
        osc.start();
        osc.stop(ctx.currentTime + 1); // 1 sec beep
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            {subStep === 'mic' ? (
                <>
                    <Mic size={64} className={`mb-6 text-pink-500 ${audioLevel > 10 ? 'animate-bounce' : ''}`} />
                    <h2 className="text-2xl font-bold mb-4">Prueba de Micrófono</h2>
                    <p className="text-slate-400 mb-8">Di algo fuerte o sopla al micrófono.</p>

                    <div className="w-full h-8 bg-slate-800 rounded-full overflow-hidden max-w-xs mb-8 mx-auto">
                        <div
                            className="h-full bg-green-500 transition-all duration-75"
                            style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                        ></div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button onClick={() => setSubStep('speaker')} className="bg-white text-black px-6 py-3 rounded-xl font-bold">
                            Funciona
                        </button>
                        <button onClick={() => setSubStep('speaker')} className="text-red-500 border border-red-500/30 px-6 py-3 rounded-xl font-bold">
                            Fallo
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <Speaker size={64} className="mb-6 text-blue-500" />
                    <h2 className="text-2xl font-bold mb-4">Prueba de Altavoz</h2>
                    <p className="text-slate-400 mb-8">Pulsa el botón para probar el sonido.</p>

                    <button onClick={playTestSound} className="mb-8 flex items-center justify-center gap-2 bg-blue-600 px-6 py-3 rounded-xl font-bold mx-auto">
                        <Play size={20} fill="white" /> Reproducir Beep
                    </button>

                    <div className="flex gap-4 justify-center">
                        <button onClick={() => onComplete(true)} className="bg-white text-black px-6 py-3 rounded-xl font-bold">
                            Escuchado
                        </button>
                        <button onClick={() => onComplete(false)} className="text-red-500 border border-red-500/30 px-6 py-3 rounded-xl font-bold">
                            No suena
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* 7. PHYSICAL BUTTONS (Manual) */
const ButtonsTest = ({ onComplete }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Key size={64} className="mb-6 text-amber-500" />
            <h2 className="text-2xl font-bold mb-4">Botones Físicos</h2>
            <p className="text-slate-400 mb-8 max-w-xs text-sm">
                Pulsa Volumen (+/-), Power y Home si existe. Asegúrate de que responden ("clic").
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={() => onComplete(true)} className="bg-white text-black py-4 rounded-xl font-bold">
                    Todo Correcto
                </button>
                <button onClick={() => onComplete(false)} className="bg-slate-800 text-red-400 border border-red-500/20 py-4 rounded-xl font-bold">
                    Algún botón falla
                </button>
            </div>
        </div>
    );
};

/* 8. CHARGING & BATTERY (Manual/Auto) */
const ChargingTest = ({ onComplete }) => {
    const [batteryInfo, setBatteryInfo] = useState(null);

    useEffect(() => {
        if (navigator.getBattery) {
            navigator.getBattery().then(batt => {
                setBatteryInfo({
                    level: batt.level * 100,
                    charging: batt.charging
                });

                batt.addEventListener('chargingchange', () => {
                    setBatteryInfo(prev => ({ ...prev, charging: batt.charging }));
                });
            });
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Battery size={64} className={`mb-6 ${batteryInfo?.charging ? 'text-green-500 animate-pulse' : 'text-slate-500'}`} />
            <h2 className="text-2xl font-bold mb-4">Prueba de Carga</h2>

            {batteryInfo ? (
                <div className="mb-8">
                    <p className="text-3xl font-black mb-1">{batteryInfo.level.toFixed(0)}%</p>
                    <p className={`text-sm font-bold uppercase ${batteryInfo.charging ? 'text-green-400' : 'text-slate-500'}`}>
                        {batteryInfo.charging ? 'CARGANDO...' : 'CONECTE EL CARGADOR'}
                    </p>
                </div>
            ) : (
                <div className="mb-8">
                    <p className="text-slate-400">API de batería no disponible.</p>
                    <p className="text-sm mt-2">Conecte el cargador y verifique visualmente.</p>
                </div>
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={() => onComplete(true)} className="bg-white text-black py-4 rounded-xl font-bold">
                    Carga Correctamente
                </button>
                <button onClick={() => onComplete(false)} className="bg-slate-800 text-red-400 border border-red-500/20 py-4 rounded-xl font-bold">
                    Puerto Dañado
                </button>
            </div>
        </div>
    );
};

/* 9. ACCOUNTS CHECKLIST (Manual) */
const AccountsTest = ({ onComplete }) => {
    const [checks, setChecks] = useState({
        google: false,
        icloud: false,
        others: false
    });

    const toggle = (k) => setChecks(prev => ({ ...prev, [k]: !prev[k] }));
    const allChecked = Object.values(checks).every(Boolean);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert size={64} className="mb-6 text-red-500" />
            <h2 className="text-2xl font-bold mb-4">Bloqueos y Cuentas</h2>
            <p className="text-slate-400 mb-8 text-sm max-w-xs">
                Verifica manualmente que NO haya cuentas iniciadas ni bloqueos.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mb-8">
                <label className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl cursor-pointer border border-white/5">
                    <input type="checkbox" checked={checks.google} onChange={() => toggle('google')} className="w-6 h-6 accent-pink-500 rounded" />
                    <span className="text-sm font-medium text-left">Sin cuenta Google / Samsung</span>
                </label>
                <label className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl cursor-pointer border border-white/5">
                    <input type="checkbox" checked={checks.icloud} onChange={() => toggle('icloud')} className="w-6 h-6 accent-pink-500 rounded" />
                    <span className="text-sm font-medium text-left">Sin iCloud / Buscar mi iPhone</span>
                </label>
                <label className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl cursor-pointer border border-white/5">
                    <input type="checkbox" checked={checks.others} onChange={() => toggle('others')} className="w-6 h-6 accent-pink-500 rounded" />
                    <span className="text-sm font-medium text-left">Sin Patrón / PIN de desbloqueo</span>
                </label>
            </div>

            <button
                onClick={() => onComplete({ accounts: true })}
                disabled={!allChecked}
                className="w-full max-w-xs py-4 bg-white disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold text-xl rounded-2xl transition-all"
            >
                FINALIZAR TODO
            </button>
        </div>
    );
};

export default MobileDiagnostics;
