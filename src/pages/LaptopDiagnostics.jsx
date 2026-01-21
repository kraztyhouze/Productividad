import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, Cpu, Keyboard, Wifi, Camera, Mic, Battery, Play, CheckCircle, XCircle, Grid, MousePointer, Activity, ShieldAlert, Lock, Zap } from 'lucide-react';


const TESTS = [
    { id: 'security', name: 'Seguridad y BIOS', icon: ShieldAlert },
    { id: 'specs', name: 'Especificaciones', icon: Cpu },
    { id: 'battery', name: 'Batería', icon: Battery },
    { id: 'storage', name: 'Disco Duro', icon: Grid },
    { id: 'stress', name: 'Estrés CPU', icon: Activity },
    { id: 'gpu', name: 'Estrés GPU', icon: Zap },
    { id: 'trackpad', name: 'Trackpad', icon: MousePointer },
    { id: 'keyboard', name: 'Teclado', icon: Keyboard },
    { id: 'screen', name: 'Pantalla', icon: Monitor },
    { id: 'mic', name: 'Micrófono', icon: Mic },
    { id: 'webcam', name: 'Cámara', icon: Camera },
    { id: 'audio', name: 'Audio', icon: Play },
];

const LaptopDiagnostics = () => {
    const { sessionId } = useParams();
    const [step, setStep] = useState('mode_selection'); // Changed default to mode_selection
    const [results, setResults] = useState({});
    const [specs, setSpecs] = useState(null);
    const [selectedTests, setSelectedTests] = useState(TESTS.map(t => t.id));
    const [remoteStatus, setRemoteStatus] = useState(null); // For monitoring remote session

    const sendUpdate = async (testName, result) => {
        try {
            await fetch(`/api/diagnostics/update/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result: {
                        name: testName,
                        passed: (typeof result === 'object' && 'passed' in result) ? result.passed : (result === true || (typeof result === 'object' && !result.error)),
                        skipped: (typeof result === 'object' && result.skipped),
                        details: typeof result === 'object' ? (result.details || JSON.stringify(result)) : (result ? 'Passed' : 'Failed')
                    }
                })
            });
        } catch (e) {
            console.error("Failed to sync", e);
        }
    };

    const handleTestPass = (test, data = true) => {
        setResults(prev => ({ ...prev, [test]: data }));
        sendUpdate(test, data);
    };

    // Find next selected test
    const handleNext = (currentStep) => {
        const currentIndex = TESTS.findIndex(t => t.id === currentStep);
        if (currentIndex === -1) return;

        // Find next test in order that is ALSO selected
        let nextIndex = currentIndex + 1;
        while (nextIndex < TESTS.length) {
            if (selectedTests.includes(TESTS[nextIndex].id)) {
                setStep(TESTS[nextIndex].id);
                return;
            }
            nextIndex++;
        }
        setStep('done');
    };

    const startDiagnostics = () => {
        // Find first selected test
        const first = TESTS.find(t => selectedTests.includes(t.id));
        if (first) setStep(first.id);
        else setStep('done');
    };

    const toggleTest = (id) => {
        if (selectedTests.includes(id)) setSelectedTests(prev => prev.filter(t => t !== id));
        else setSelectedTests(prev => [...prev, id]);
    };

    // Polling for Remote Monitor Mode
    useEffect(() => {
        if (step === 'monitor_remote') {
            const interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/diagnostics/session/${sessionId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setRemoteStatus(data);
                        if (data.status === 'completed' || (data.results && data.results.length > 0)) {
                            // Update local results for display
                            const newResults = {};
                            data.results.forEach(r => {
                                newResults[r.name] = r;
                            });
                            setResults(newResults);
                            if (data.deviceInfo) setSpecs(data.deviceInfo);
                        }
                    }
                } catch (err) { console.error("Polling error", err); }
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [step, sessionId]);

    // Auto-finish on done
    useEffect(() => {
        if (step === 'done') {
            fetch(`/api/diagnostics/update/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'completed',
                    results: Object.entries(results).map(([k, v]) => {
                        const isObj = typeof v === 'object';
                        return {
                            name: k,
                            passed: isObj && 'passed' in v ? v.passed : (v === true || (isObj && !v.error)),
                            skipped: isObj && v.skipped,
                            details: isObj ? (v.details || JSON.stringify(v)) : (v ? 'Passed' : 'Failed')
                        };
                    }),
                    deviceInfo: specs
                })
            }).catch(console.error);
        }
    }, [step]); // Warning: Missing dependencies results, specs, sessionId. Kept as per original logic structure.

    if (step === 'mode_selection') {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="bg-slate-900/50 p-10 rounded-3xl border border-white/5 max-w-2xl w-full shadow-2xl backdrop-blur-sm">
                    <Monitor size={60} className="text-pink-500 mx-auto mb-6" />
                    <h1 className="text-4xl font-black mb-4 tracking-tight">Menú de Diagnóstico</h1>
                    <p className="text-slate-400 mb-10 text-lg">¿Dónde quieres ejecutar las pruebas?</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setStep('intro')}
                            className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-slate-700 hover:border-pink-500 bg-slate-800/50 hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <div className="p-4 bg-slate-700 rounded-full group-hover:bg-pink-500 transition-colors">
                                <Monitor size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl mb-1">Este Equipo</h3>
                                <p className="text-xs text-slate-400">Ejecutar tests aquí mismo</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setStep('monitor_remote')}
                            className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-slate-700 hover:border-cyan-400 bg-slate-800/50 hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <div className="absolute top-3 right-3 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase rounded-full border border-cyan-500/30">Nuevo</div>
                            <div className="p-4 bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors">
                                <Wifi size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl mb-1">Equipo Remoto</h3>
                                <p className="text-xs text-slate-400">Generar código para otro PC</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'monitor_remote') {
        const completedTests = remoteStatus?.results?.length || 0;
        const totalTests = TESTS.length; // Approx hardcoded or from TESTS
        const progress = (completedTests / totalTests) * 100;
        const isDone = remoteStatus?.status === 'completed';

        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="max-w-4xl w-full flex flex-col items-center">
                    <div className="mb-10 text-center">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">MODO MONITOR REMOTO</h2>
                        <h1 className="text-5xl font-black text-white mb-6">Escanea o Introduce el Código</h1>

                        <div className="bg-white text-black p-8 rounded-3xl inline-flex flex-col items-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                            <div className="text-6xl font-black font-mono tracking-widest mb-2">{sessionId}</div>
                            <p className="text-sm font-bold opacity-60">CÓDIGO DE SESIÓN</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/10 w-full mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                <Wifi size={24} className="text-cyan-400 animate-pulse" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-lg">Esperando conexión...</p>
                                <p className="text-sm text-slate-400">Entra en <span className="text-cyan-400 font-mono">productividad.onrender.com/laptop-remote-test</span></p>
                            </div>
                        </div>
                        {isDone && <div className="px-4 py-1 bg-green-500 text-black text-xs font-bold uppercase rounded-full animate-bounce">Completado</div>}
                    </div>

                    {remoteStatus?.results?.length > 0 && (
                        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
                            {remoteStatus.results.map((r, i) => (
                                <div key={i} className={`p-3 rounded-lg border flex items-center gap-3 ${r.passed ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                                    {r.passed ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                                    <span className="text-sm font-bold truncate">{r.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {isDone && (
                        <button onClick={() => setStep('done')} className="mt-8 px-10 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-lg transition-transform active:scale-95">
                            Ver Informe Completo
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
                <Monitor size={60} className="text-cyan-400 mb-6" />
                <h1 className="text-3xl font-black mb-2">Configura tu Diagnóstico</h1>
                <p className="text-slate-400 mb-8 max-w-xl">
                    Selecciona las pruebas que deseas ejecutar. Puedes saltarlas individualmente luego.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 w-full max-w-4xl px-4">
                    {TESTS.map((t) => {
                        const isActive = selectedTests.includes(t.id);
                        return (
                            <button
                                key={t.id}
                                onClick={() => toggleTest(t.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${isActive ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'bg-slate-800 border-white/5 text-slate-500 grayscale'}`}
                            >
                                <t.icon size={20} className={isActive ? 'text-cyan-400' : 'text-slate-600'} />
                                <span className="font-bold text-sm">{t.name}</span>
                                {isActive && <CheckCircle size={16} className="ml-auto text-cyan-500" />}
                            </button>
                        )
                    })}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setSelectedTests(TESTS.map(t => t.id))}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-sm transition-colors text-slate-300"
                    >
                        Seleccionar Todo
                    </button>
                    <button
                        onClick={startDiagnostics}
                        disabled={selectedTests.length === 0}
                        className="px-12 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
                    >
                        INICIAR ({selectedTests.length})
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'specs') {
        return <SpecsTest onComplete={(data) => {
            handleTestPass('specs', data);
            setSpecs(data);
            handleNext('specs');
        }} />;
    }

    if (step === 'security') return <SecurityTest onComplete={(res) => { handleTestPass('security', res); handleNext('security'); }} />;
    if (step === 'battery') return <BatteryTest onComplete={(res) => { handleTestPass('battery', res); handleNext('battery'); }} />;
    if (step === 'storage') return <StorageTest onComplete={(res) => { handleTestPass('storage', res); handleNext('storage'); }} />;
    if (step === 'stress') return <StressTest onComplete={(res) => { handleTestPass('stress', res); handleNext('stress'); }} />;
    if (step === 'gpu') return <GPUStressTest onComplete={(res) => { handleTestPass('gpu', res); handleNext('gpu'); }} />;
    if (step === 'trackpad') return <TrackpadTest onComplete={(res) => { handleTestPass('trackpad', res); handleNext('trackpad'); }} />;
    if (step === 'keyboard') return <KeyboardTest onComplete={(res) => { handleTestPass('keyboard', res); handleNext('keyboard'); }} />;
    if (step === 'screen') return <ScreenTest onComplete={(res) => { handleTestPass('screen', res); handleNext('screen'); }} />;
    if (step === 'mic') return <MicTest onComplete={(res) => { handleTestPass('mic', res); handleNext('mic'); }} />;
    if (step === 'webcam') return <WebcamTest onComplete={(res) => { handleTestPass('webcam', res); handleNext('webcam'); }} />;
    if (step === 'audio') return <AudioTest onComplete={(res) => { handleTestPass('audio', res); handleNext('audio'); }} />;

    if (step === 'done') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/10 max-w-2xl w-full text-center">
                    <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-black mb-2">Diagnóstico Completado</h1>
                    <p className="text-slate-400 mb-8">Los datos han sido enviados al tasador.</p>

                    {specs && (
                        <div className="text-left bg-black/20 p-6 rounded-xl font-mono text-sm grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <span className="block text-slate-500 text-xs uppercase">CPU</span>
                                <span className="text-white text-xs">{specs.cpuModel || specs.cpu}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs uppercase">RAM</span>
                                <span className="text-white text-xs">{specs.ramTotal || specs.ram}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="block text-slate-500 text-xs uppercase">GPU</span>
                                <span className="text-cyan-400 font-bold text-xs truncate">{specs.gpu}</span>
                                {specs.gpuDetails && <span className="block text-[10px] text-slate-400">{specs.gpuDetails}</span>}
                            </div>
                            <div className="col-span-2">
                                <span className="block text-slate-500 text-xs uppercase">Almacenamiento</span>
                                <span className="text-white text-xs">{specs.storage || 'No especificado'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="block text-slate-500 text-xs uppercase">Resolución</span>
                                <span className="text-white text-xs">{specs.resolution}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="block text-slate-500 text-xs uppercase">Sistema Operativo</span>
                                <span className="text-white text-xs">{specs.os}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

// --- HELPER COMPONENT ---
const TestIntro = ({ title, icon: Icon, desc, onStart, onSkip }) => (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <Icon size={80} className="mb-6 text-cyan-500" />
        <h2 className="text-3xl font-black mb-4">{title}</h2>
        <p className="text-slate-400 mb-12 max-w-lg text-lg leading-relaxed">{desc}</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={onStart} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 font-bold text-xl rounded-2xl shadow-lg transition-transform active:scale-95">
                COMENZAR PRUEBA
            </button>
            <button onClick={onSkip} className="w-full py-3 bg-transparent text-slate-500 hover:text-white font-bold text-sm rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                SALTAR ESTE TEST
            </button>
        </div>
    </div>
);

// --- COMPONENTS ---

const BatteryTest = ({ onComplete }) => {
    const [battery, setBattery] = useState(null);
    const [status, setStatus] = useState('Detectando...');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started) return;

        if (navigator.getBattery) {
            navigator.getBattery().then(batt => {
                const update = () => {
                    setBattery({
                        level: (batt.level * 100).toFixed(0),
                        charging: batt.charging,
                        chargingTime: batt.chargingTime,
                        dischargingTime: batt.dischargingTime
                    });
                };
                update();
                batt.addEventListener('chargingchange', update);
                batt.addEventListener('levelchange', update);
                setStatus('Batería Detectada');
            }).catch(() => setStatus('API Batería no soportada / Sin batería'));
        } else {
            setStatus('Navegador no soporta lectura de batería');
        }
    }, [started]);

    // Generate Health Report using PowerShell
    const copyPowerShell = () => {
        const cmd = "powercfg /batteryreport /output \"$env:USERPROFILE\\Desktop\\battery_report.html\"; Start-Process \"$env:USERPROFILE\\Desktop\\battery_report.html\"";
        navigator.clipboard.writeText(cmd);
        alert("Comando copiado.\\n\\n1. Abre PowerShell (Admin si es posible).\\n2. Pega y pulsa Enter.\\n3. Se abrirá un informe detallado con la SALUD real de la batería.");
    };

    if (!started) return <TestIntro title="Test de Batería" icon={Battery} desc="Analizaremos el estado de carga y salud de la batería. Necesitarás el cargador a mano." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Battery size={80} className={`mb-6 ${battery?.charging ? 'text-green-500 animate-pulse' : 'text-slate-500'}`} />
            <h2 className="text-3xl font-bold mb-2">Estado de Batería</h2>

            <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 mb-8 w-full max-w-lg">
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                        <span className="text-xs uppercase text-slate-500">Nivel Actual</span>
                        <div className="text-2xl font-bold">{battery ? `${battery.level}%` : '-'}</div>
                    </div>
                    <div>
                        <span className="text-xs uppercase text-slate-500">Estado</span>
                        <div className="text-xl font-bold text-cyan-400">{battery?.charging ? 'Cargando⚡' : 'Descargando'}</div>
                    </div>
                </div>
            </div>

            <p className="text-slate-400 mb-6 max-w-md text-sm">
                Para ver la capacidad real (Salud/Ciclos), genera el reporte oficial de Windows.
            </p>

            <button onClick={copyPowerShell} className="mb-8 px-6 py-2 bg-slate-700 text-cyan-300 font-mono text-sm rounded-lg border border-dashed border-cyan-500/30 hover:bg-slate-600">
                &gt; Generar Reporte Oficial (PowerShell)
            </button>

            <div className="flex gap-4">
                <button onClick={() => onComplete({ passed: true, details: `Nivel: ${battery?.level}%, Cargando: ${battery?.charging}` })} className="px-8 py-3 bg-green-600 font-bold rounded-xl">
                    OK, FUNCIONA
                </button>
                <button onClick={() => onComplete({ passed: false, details: 'Batería muerta / No detectada' })} className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-500 font-bold rounded-xl">
                    FALLO / SIN BATERÍA
                </button>
            </div>
        </div>
    );
};

const StorageTest = ({ onComplete }) => {
    const [started, setStarted] = useState(false);
    if (!started) return <TestIntro title="Salud del Disco Duro" icon={Grid} desc="Verifique si el disco hace ruidos extraños, si el sistema va lento o si hay errores SMART usando la guía manual." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Grid size={80} className="mb-6 text-blue-500" />
            <h2 className="text-3xl font-bold mb-4">Salud del Disco Duro</h2>

            <div className="bg-[#0f172a] p-6 rounded-3xl border border-blue-500/30 shadow-xl max-w-xl w-full mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-300 mb-6">
                        Los navegadores no pueden leer el estado S.M.A.R.T. del disco por seguridad.
                        <br /><br />
                        <strong className="text-white">Verificación Recomendada:</strong>
                        <ul className="text-left text-sm mt-4 space-y-2 bg-black/20 p-4 rounded-xl">
                            <li>1. Abre el Administrador de Tareas (Ctrl+Shift+Esc).</li>
                            <li>2. Ve a la pestaña "Rendimiento" -&gt; Disco.</li>
                            <li>3. Verifica que el "Tiempo de respuesta" sea bajo (0-50ms).</li>
                            <li>4. Si es SSD, asegúrate que no esté al 100% sin hacer nada.</li>
                        </ul>
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={() => onComplete({ passed: true, details: 'Verificado Manualmente' })} className="px-8 py-3 bg-blue-600 font-bold rounded-xl shadow-lg shadow-blue-600/20">
                    DISCO SALUDABLE
                </button>
                <button onClick={() => onComplete({ passed: false, details: 'Ruido / Lento / SMART Error' })} className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-500 font-bold rounded-xl">
                    FALLO DISCO
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTS ---

const SecurityTest = ({ onComplete }) => {
    const [started, setStarted] = useState(false);

    // PowerShell to check BitLocker and User Accounts
    const copyScript = () => {
        const script = "Get-BitLockerVolume | Select MountPoint, EncryptionMethod, ProtectionStatus | ConvertTo-Json -Compress | Tee-Object -Variable bl; $u = Get-LocalUser | Select Name, Enabled | ConvertTo-Json -Compress; Write-Host \"BitLocker: $bl | Users: $u\"";
        navigator.clipboard.writeText(script);
        alert("Comando copiado.\\n1. Pega en PowerShell.\\n2. Verifica si 'ProtectionStatus' es 'On' (Cifrado) o 'Off' (Libre).\\n3. Verifica usuarios.");
    };

    if (!started) return <TestIntro title="Seguridad y Bloqueos" icon={ShieldAlert} desc="Vamos a comprobar si el equipo tiene BIOS bloqueada, BitLocker activo o cuentas de empresa ocultas." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-slate-900">
            <ShieldAlert size={80} className="mb-6 text-amber-500" />
            <h2 className="text-3xl font-black mb-2">Seguridad y Bloqueos</h2>
            <p className="text-slate-400 mb-8 max-w-xl">
                Antes de comprar, verifica que el equipo no esté cifrado, gestionado por empresas o con BIOS bloqueada.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-8">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 text-left">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-500"><Lock size={20} /> 1. BIOS Check</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1 accent-amber-500" />
                            <span>Reinicia y entra en BIOS (F2, F10, Supr).</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1 accent-amber-500" />
                            <span>¿Pide contraseña para entrar o cambiar ajustes?</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1 accent-amber-500" />
                            <span>Verifica que "Secure Boot" se pueda cambiar.</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 text-left">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-400"><ShieldAlert size={20} /> 2. BitLocker & Cuentas</h3>
                    <p className="text-xs text-slate-400 mb-4">Ejecuta el script para ver si el disco está cifrado.</p>
                    <button onClick={copyScript} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-mono text-cyan-300 border border-dashed border-cyan-500/30 mb-3">
                        &gt; Copiar Script Check
                    </button>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1 accent-blue-500" />
                            <span>BitLocker: Off (Desactivado)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1 accent-blue-500" />
                            <span>Sin cuentas de Empresa/Escuela vinculadas.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={() => onComplete({ passed: true, details: 'Seguridad Verificada' })} className="px-8 py-3 bg-green-600 hover:bg-green-500 font-bold rounded-xl shadow-lg transition-all">
                    LIMPIO / SEGURO
                </button>
                <button onClick={() => onComplete({ passed: false, details: 'Bloqueado/Cifrado' })} className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-500 font-bold rounded-xl hover:bg-red-600/30">
                    BLOQUEO DETECTADO
                </button>
            </div>
        </div>
    );
};

const StressTest = ({ onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(15);
    const [started, setStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const workersRef = useRef([]);

    useEffect(() => {
        if (!started || isFinished) return;

        // Spawn workers for ALL cores to ensure 100% Load
        const cores = navigator.hardwareConcurrency || 4;
        const workerScript = `
            self.onmessage = function() {
                const end = Date.now() + 15000;
                while (Date.now() < end) { Math.sqrt(Math.random() * Math.random()); }
                self.postMessage('done');
            }
        `;
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        for (let i = 0; i < cores; i++) {
            const w = new Worker(workerUrl);
            w.postMessage('start');
            workersRef.current.push(w);
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsFinished(true);
                    cleanup();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            cleanup();
        };
    }, [started, isFinished]);

    const cleanup = () => {
        workersRef.current.forEach(w => w.terminate());
        workersRef.current = [];
    };

    if (!started) return <TestIntro title="Test de Estrés CPU" icon={Activity} desc="Vamos a poner el procesador al 100% (Todos los núcleos) durante 15 segundos. El ventilador debería sonar fuerte." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    if (isFinished) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
                <Activity size={80} className="text-green-500 mb-6" />
                <h2 className="text-3xl font-black mb-2 text-green-400">¡Prueba Finalizada!</h2>
                <p className="text-slate-400 mb-8">¿El equipo se mantuvo encendido y estable?</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => onComplete({ passed: true, details: 'Estable' })} className="px-8 py-3 bg-green-600 font-bold rounded-xl shadow-lg hover:bg-green-500 transition-colors">ESTABLE</button>
                    <button onClick={() => onComplete({ passed: false, details: 'Apagado/Ruido' })} className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-500 font-bold rounded-xl hover:bg-red-600/30">FALLO</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
            <Activity size={80} className="mb-6 text-red-500 animate-pulse" />
            <h2 className="text-3xl font-black mb-2">Estresando CPU...</h2>

            <div className="text-8xl font-black font-mono text-red-500 tabular-nums my-8">
                {timeLeft}s
            </div>

            <p className="text-slate-400 mb-8 max-w-md animate-pulse">
                Ejecutando carga máxima en {navigator.hardwareConcurrency || 4} núcleos.
            </p>

            <button onClick={() => onComplete({ skipped: true, details: 'Cancelado durante test' })} className="text-sm underline text-slate-500 hover:text-white">
                Saltar / Cancelar Test
            </button>
        </div>
    );
};

const GPUStressTest = ({ onComplete }) => {
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(20);
    const canvasRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        if (!started) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
        if (!gl) { alert("WebGL no soportado"); return; }

        // Maximize Burden: Match Physical Pixels
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // HEAVY SHADER: Raymarching Fractal / Noise
        const vs = `attribute vec2 p; void main() { gl_Position = vec4(p,0,1); }`;
        const fs = `precision highp float; 
        uniform float t; 
        uniform vec2 r;
        
        // Pseudo-random
        float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

        void main() { 
            vec2 uv = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y);
            vec3 col = vec3(0.0);
            
            // HEAVY LOOP: 50 Iterations of fractal-like math per pixel
            // Intentionally unoptimized math to burn cycles
            vec2 z = uv;
            float s = 0.0;
            for(float i=0.0; i<80.0; i++) {
                z = abs(z) / dot(z,z) - 0.55;
                float d = length(z);
                s += d;
                
                // Nonsense math to keep ALUs busy
                s += sin(t * 5.0 + i) * cos(z.x * 20.0);
                s += pow(abs(tan(z.y * 0.1 + t*0.1)), 1.1);
            }
            
            col = vec3(sin(s*0.1 + t), cos(s*0.2), sin(s*0.5));
            
            // Noise overlay
            col += rnd(uv + t) * 0.1;
            
            gl_FragColor = vec4(col, 1.0); 
        }`;

        const createShader = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
            return s;
        }

        const p = gl.createProgram();
        gl.attachShader(p, createShader(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, createShader(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);
        gl.useProgram(p);

        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(p, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const tLoc = gl.getUniformLocation(p, "t");
        const rLoc = gl.getUniformLocation(p, "r");
        let startT = Date.now();

        const loop = () => {
            if (timeLeft <= 0) return;
            const time = (Date.now() - startT) * 0.001;
            gl.uniform1f(tLoc, time);
            gl.uniform2f(rLoc, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            frameRef.current = requestAnimationFrame(loop);
        };
        loop();

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    cancelAnimationFrame(frameRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { clearInterval(timer); cancelAnimationFrame(frameRef.current); };
    }, [started]);

    if (!started) return <TestIntro title="Test de Estrés GPU" icon={Zap} desc="Vamos a generar fractales matemáticos complejos en tiempo real para poner la gráfica al 100%. Busca puntos verdes, parpadeos o cuelgues." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
            {timeLeft > 0 ? (
                <>
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                    <div className="z-10 bg-black/50 backdrop-blur px-8 py-4 rounded-2xl text-center border border-white/10 shadow-2xl">
                        <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">GPU BURNER</h2>
                        <div className="flex items-baseline justify-center gap-2">
                            <Zap className="text-yellow-400 animate-pulse" />
                            <p className="text-6xl font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{timeLeft}s</p>
                        </div>
                        <p className="text-xs text-slate-300 mt-2">Renderizando Fractales Complejos a {window.innerWidth}x{window.innerHeight}</p>
                    </div>
                </>
            ) : (
                <div className="z-10 bg-slate-900 p-8 rounded-2xl text-center border border-white/20 animate-in zoom-in shadow-2xl">
                    <Zap size={64} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-6">Test GPU Finalizado</h2>
                    <p className="text-slate-400 mb-8 max-w-sm">¿Viste "nieve", colores raros, o la pantalla se congeló?</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => onComplete({ passed: true, details: 'Sin Artifacts' })} className="px-8 py-3 bg-green-600 font-bold rounded-xl text-white shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all">CORRECTO</button>
                        <button onClick={() => onComplete({ passed: false, details: 'Artifacts/Crash' })} className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-500 font-bold rounded-xl hover:bg-red-600/30 transition-all">FALLO / ARTIFACTS</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrackpadTest = ({ onComplete }) => {
    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { innerWidth, innerHeight } = window;
        canvas.width = innerWidth;
        canvas.height = innerHeight;

        const cw = innerWidth / 8;
        const ch = innerHeight / 6;
        const grid = new Array(8 * 6).fill(false);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, innerWidth, innerHeight);

        // Guidelines
        ctx.strokeStyle = '#334155';
        for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, innerHeight); ctx.stroke(); }
        for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(0, i * ch); ctx.lineTo(innerWidth, i * ch); ctx.stroke(); }

        const draw = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ctx.fillStyle = '#06b6d4'; // cyan
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Grid logic
            const c = Math.floor(x / cw);
            const r = Math.floor(y / ch);
            const idx = r * 8 + c;
            if (idx >= 0 && idx < grid.length && !grid[idx]) {
                grid[idx] = true;
                const p = (grid.filter(Boolean).length / grid.length) * 100;
                setProgress(p);
                if (p > 70) setTimeout(() => onComplete({ passed: true, details: 'Trackpad Funcional' }), 500);
            }
        };

        let isDrawing = false;
        const start = () => isDrawing = true;
        const stop = () => isDrawing = false;
        const move = (e) => { if (isDrawing) draw(e); };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mouseup', stop);
        canvas.addEventListener('mousemove', move);

        return () => {
            canvas.removeEventListener('mousedown', start);
            canvas.removeEventListener('mouseup', stop);
            canvas.removeEventListener('mousemove', move);
        };
    }, [started]);

    if (!started) return <TestIntro title="Test de Trackpad" icon={MousePointer} desc="Verificaremos que el ratón funciona en todas las zonas de la pantalla. Deberás pintar el área cuadriculada." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="fixed inset-0 bg-slate-900 cursor-crosshair">
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div className="absolute top-10 left-0 w-full text-center pointer-events-none">
                <span className="bg-black/50 text-white backdrop-blur px-8 py-4 rounded-full text-xl font-bold shadow-2xl border border-white/20">
                    <MousePointer className="inline mr-2 mb-1" /> Haz clic y arrastra para pintar: <span className="text-cyan-400">{progress.toFixed(0)}%</span>
                </span>
            </div>
            <div className="absolute bottom-10 right-10 flex gap-4">
                <button onClick={() => onComplete({ passed: false, details: 'Fallan zonas' })} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-lg z-50">FALLA / SALTAR</button>
            </div>
        </div>
    );
};

const MicTest = ({ onComplete }) => {
    const [status, setStatus] = useState('idle');
    const [audioUrl, setAudioUrl] = useState(null);
    const [started, setStarted] = useState(false);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/web' });
                setAudioUrl(URL.createObjectURL(blob));
                setStatus('playback');
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setStatus('recording');
            setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 3000);
        } catch (e) {
            alert("Error micro: " + e.message);
        }
    };

    if (!started) return <TestIntro title="Test de Micrófono" icon={Mic} desc="Grabaremos 3 segundos de audio y lo reproduciremos para confirmar que el micrófono funciona correctamente." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <Mic size={80} className={`mb-6 ${status === 'recording' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            <h2 className="text-3xl font-bold mb-4">Prueba de Micrófono</h2>

            {status === 'idle' && (
                <button onClick={startRecording} className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 font-bold text-xl rounded-2xl shadow-lg">
                    GRABAR VOZ (3s)
                </button>
            )}

            {status === 'recording' && <div className="text-2xl font-mono text-red-400">GRABANDO... HABLA AHORA</div>}

            {status === 'playback' && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in">
                    <audio src={audioUrl} controls className="w-64" />
                    <p className="text-slate-400">¿Te escuchas bien?</p>
                    <div className="flex gap-4">
                        <button onClick={() => onComplete({ passed: true, details: 'Mic Audio OK' })} className="px-8 py-3 bg-green-600 font-bold rounded-xl">SÍ, CLARO</button>
                        <button onClick={() => onComplete({ passed: false, details: 'Ruido/Silencio' })} className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-500 font-bold rounded-xl">NO / RUIDO</button>
                    </div>
                    <button onClick={() => setStatus('idle')} className="text-sm underline text-slate-500">Reintentar</button>
                </div>
            )}
        </div>
    );
};

const SpecsTest = ({ onComplete }) => {
    const [analyzing, setAnalyzing] = useState(true);
    const [basicSpecs, setBasicSpecs] = useState(null);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [manualSpecs, setManualSpecs] = useState({
        cpuModel: '',
        ramTotal: '',
        storage: '',
        gpuDetails: '',
        os: 'Windows'
    });

    useEffect(() => {
        // Collect Basic Specs via Browser API
        const getGPU = () => {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            } catch (e) { return 'Unknown GPU'; }
        };

        const specs = {
            userAgent: navigator.userAgent,
            os: navigator.platform,
            cpu: navigator.hardwareConcurrency || 'N/A',
            ram: navigator.deviceMemory ? `>=${navigator.deviceMemory}GB` : 'N/A',
            resolution: `${window.screen.width}x${window.screen.height}`,
            gpu: getGPU()
        };

        setBasicSpecs(specs);
        setTimeout(() => setAnalyzing(false), 1500);
    }, []);

    const handleAdvancedSubmit = () => {
        let finalSpecs = { ...basicSpecs, ...manualSpecs };

        // Try to parse JSON if provided
        if (jsonInput.trim()) {
            try {
                // Sanitize input: sometimes users copy extra whitespace or "JSON copiado..." text
                const cleanJson = jsonInput.substring(jsonInput.indexOf('{'), jsonInput.lastIndexOf('}') + 1);
                const parsed = JSON.parse(cleanJson);

                // Parse GPUs (Handle Array or Single Object)
                let gpuText = '';
                if (Array.isArray(parsed.GPUs)) {
                    gpuText = parsed.GPUs.map(g => `${g.Name} (${g.VRAM || 'N/A'}MB)`).join(' + ');
                } else if (parsed.GPUs) {
                    gpuText = `${parsed.GPUs.Name} (${parsed.GPUs.VRAM || 'N/A'}MB)`;
                } else {
                    gpuText = finalSpecs.gpu;
                }

                // Parse Disks
                let diskText = '';
                if (Array.isArray(parsed.Disks)) {
                    diskText = parsed.Disks.map(d => `${d.MediaType || 'Disk'} ${d.SizeGB}GB (${d.FriendlyName})`).join(' + ');
                } else if (parsed.Disks) {
                    diskText = `${parsed.Disks.FriendlyName} (${parsed.Disks.SizeGB}GB) ${parsed.Disks.MediaType || ''}`;
                }

                finalSpecs = {
                    ...finalSpecs,
                    cpu: parsed.CPU || finalSpecs.cpu,
                    ram: parsed.RAM ? `${parsed.RAM} GB` : finalSpecs.ram,
                    storage: diskText,
                    gpu: gpuText,
                    os: parsed.OS || 'Windows'
                };
            } catch (e) {
                console.error(e);
                alert("Error al leer el JSON. Asegúrate de copiar SOLO el texto entre { y }.");
            }
        }

        onComplete(finalSpecs);
    };

    const copyScript = () => {
        // Updated Script: Uses Registry for TRUE Dedicated VRAM (HardwareInformation.QwMemorySize)
        // avoiding "Shared System Memory" reporting from WMI which caused inflated values.
        const script = "& { " +
            "$cpu = (Get-CimInstance Win32_Processor).Name.Trim(); " +
            "$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1); " +
            "$os = (Get-CimInstance Win32_OperatingSystem).Caption.Trim(); " +
            "try { $disks = Get-PhysicalDisk | Select FriendlyName, MediaType, @{N='SizeGB';E={[math]::Round($_.Size / 1GB)}} } catch { $disks = Get-CimInstance Win32_DiskDrive | Select @{N='FriendlyName';E={$_.Model}}, @{N='MediaType';E={'HDD/SSD'}}, @{N='SizeGB';E={[math]::Round($_.Size / 1GB)}} }; " +

            // GPU Detection via Registry (More accurate for VRAM, ignores Shared)
            "$gpus = Get-ItemProperty 'HKLM:\\SYSTEM\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\*' | Where-Object { $_.DriverDesc -and ($_. 'HardwareInformation.QwMemorySize' -or $_. 'HardwareInformation.MemorySize') } | ForEach-Object { " +
            "$mem = 0; " +
            "if ($_.'HardwareInformation.QwMemorySize') { $mem = $_.'HardwareInformation.QwMemorySize' } " +
            "elseif ($_.'HardwareInformation.MemorySize') { $mem = $_.'HardwareInformation.MemorySize' } " +
            "if ($mem -gt 0) { [PSCustomObject]@{Name=$_.DriverDesc; VRAM=[math]::Round($mem / 1MB)} } " +
            "}; " +
            // Fallback to WMI if registry finds nothing (e.g. some iGPUs)
            "if (-not $gpus) { $gpus = Get-CimInstance Win32_VideoController | Select Name, @{N='VRAM';E={[math]::Round($_.AdapterRAM / 1MB)}} }; " +

            "[PSCustomObject]@{CPU=$cpu;RAM=$ram;OS=$os;Disks=$disks;GPUs=$gpus} | ConvertTo-Json -Depth 2 -Compress " +
            "} | Tee-Object -Variable jsonOutput | Set-Clipboard; Write-Host 'JSON COPIADO! VUELVE A LA WEB Y PEGA'; Write-Host $jsonOutput";

        navigator.clipboard.writeText(script);
        alert("Comando Actualizado (Modo Registro VRAM).\n\n1. Abre PowerShell.\n2. Pega y pulsa Enter.\n3. El JSON se copiará. Pégalo aquí para ver los GB Reales.");
    };

    if (analyzing) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
                <Cpu size={64} className="text-cyan-400 mb-6 animate-spin-slow" />
                <h2 className="text-2xl font-bold">Analizando Hardware...</h2>
                <p className="text-slate-500 mt-2">Identificando componentes básicos</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 overflow-y-auto">
            <h2 className="text-3xl font-black mb-6 text-cyan-400">Especificaciones Técnicas</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full">
                {/* BASIC INFO FOUND */}
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/10">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Monitor size={20} /> Detectado (Básico)</h3>
                    <div className="space-y-4 text-sm font-mono text-slate-300">
                        <div>
                            <span className="block text-slate-500 text-xs uppercase">GPU Renderer</span>
                            <span className="text-white font-bold block truncate">{basicSpecs?.gpu}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-slate-500 text-xs uppercase">Cores (Lógicos)</span>
                                <span className="text-white">{basicSpecs?.cpu}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs uppercase">RAM (Min)</span>
                                <span className="text-white">{basicSpecs?.ram}</span>
                            </div>
                        </div>
                        <div>
                            <span className="block text-slate-500 text-xs uppercase">Resolución</span>
                            <span className="text-white">{basicSpecs?.resolution}</span>
                        </div>
                    </div>
                </div>

                {/* ADVANCED INPUT */}
                <div className="bg-[#0f172a] p-6 rounded-3xl border border-cyan-500/30 shadow-xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-50"><Cpu size={100} className="text-cyan-900/50" /></div>

                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-cyan-400 relative z-10">
                        <Monitor size={20} /> Escaneo Profundo
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 relative z-10 w-full max-w-sm">
                        El navegador bloquea detalles de Discos, VRAM y Modelo exacto de CPU. Para obtenerlos, usa nuestra herramienta de PowerBridge.
                    </p>

                    {!advancedMode ? (
                        <div className="flex flex-col gap-3 relative z-10 flex-1 justify-center">
                            <button onClick={copyScript} className="py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-left text-xs font-mono text-cyan-300 border border-dashed border-cyan-500/50 transition-all active:scale-95">
                                &gt; Copiar Comando Mágico
                            </button>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => {
                                    setJsonInput(e.target.value);
                                    if (e.target.value.includes('{')) setAdvancedMode(true); // Auto-detect JSON
                                }}
                                placeholder="Pega aquí el resultado mágico..."
                                className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white h-24 font-mono outline-none focus:border-cyan-500 transition-colors resize-none"
                            />
                            <div className="text-center text-[10px] text-slate-500">O rellena manualmente abajo</div>
                        </div>
                    ) : (
                        <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30 text-center animate-in fade-in zoom-in">
                            <CheckCircle className="text-green-500 mx-auto mb-2" />
                            <p className="text-green-400 font-bold text-sm">¡Datos Mágicos Detectados!</p>
                            <button onClick={() => setAdvancedMode(false)} className="text-[10px] underline text-slate-400 mt-2">Editar JSON</button>
                        </div>
                    )}

                    {/* MANUAL FALLBACK FORM */}
                    <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <input type="text" placeholder="Modelo CPU (ej. i5-10400)" value={manualSpecs.cpuModel} onChange={e => setManualSpecs({ ...manualSpecs, cpuModel: e.target.value })} className="bg-slate-800 rounded p-2 text-xs border border-white/5 outline-none focus:border-cyan-500" />
                            <input type="text" placeholder="RAM Total (ej. 16GB)" value={manualSpecs.ramTotal} onChange={e => setManualSpecs({ ...manualSpecs, ramTotal: e.target.value })} className="bg-slate-800 rounded p-2 text-xs border border-white/5 outline-none focus:border-cyan-500" />
                            <input type="text" placeholder="Almacenamiento (ej. 512 SSD)" value={manualSpecs.storage} onChange={e => setManualSpecs({ ...manualSpecs, storage: e.target.value })} className="bg-slate-800 rounded p-2 text-xs border border-white/5 outline-none focus:border-cyan-500 col-span-2" />
                            <input type="text" placeholder="VRAM / GPU Dedicada" value={manualSpecs.gpuDetails} onChange={e => setManualSpecs({ ...manualSpecs, gpuDetails: e.target.value })} className="bg-slate-800 rounded p-2 text-xs border border-white/5 outline-none focus:border-cyan-500 col-span-2" />
                        </div>
                        <button onClick={handleAdvancedSubmit} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white shadow-lg shadow-cyan-600/20">
                            {jsonInput || manualSpecs.cpuModel ? 'CONFIRMAR DATOS COMPLETOS' : 'CONTINUAR CON BÁSICOS'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KeyboardTest = ({ onComplete }) => {
    const [pressed, setPressed] = useState(new Set());
    const [started, setStarted] = useState(false);

    // Standard layout mapping could be huge, let's use a simplified logical map
    // We'll capture codes.

    useEffect(() => {
        if (!started) return;
        const handleDown = (e) => {
            e.preventDefault();
            setPressed(prev => {
                const n = new Set(prev);
                n.add(e.code);
                return n;
            });
        };
        window.addEventListener('keydown', handleDown);
        return () => window.removeEventListener('keydown', handleDown);
    }, [started]);

    const keys = [
        ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Delete'],
        ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
        ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
        ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
        ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
        ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'ControlRight']
    ];

    const isDone = pressed.size > 15; // Arbitrary threshold to pass "working keyboard"

    if (!started) return <TestIntro title="Test de Teclado" icon={Keyboard} desc="Presiona al menos 15 teclas diferentes para verificar que el teclado responde." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Keyboard /> Test de Teclado</h2>
            <p className="text-slate-400 mb-8">Presiona las teclas para verificarlas. (Mínimo 15 teclas)</p>

            <div className="flex flex-col gap-2 bg-slate-800 p-8 rounded-3xl border border-white/5 shadow-2xl">
                {keys.map((row, i) => (
                    <div key={i} className="flex gap-2 justify-center">
                        {row.map(k => (
                            <div
                                key={k}
                                className={`
                                    h-12 min-w-[3rem] px-2 rounded flex items-center justify-center text-xs font-bold transition-all
                                    ${pressed.has(k) ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 scale-95' : 'bg-slate-700 text-slate-500'}
                                    ${k === 'Space' ? 'w-64' : ''}
                                `}
                            >
                                {k.replace('Key', '').replace('Digit', '')}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-4">
                {isDone && (
                    <button onClick={() => onComplete(true)} className="px-8 py-3 bg-white text-black font-bold rounded-xl animate-bounce">
                        CONTINUAR
                    </button>
                )}
            </div>
            <button onClick={() => onComplete(false)} className="mt-4 text-xs text-red-500 underline">
                Saltar / Teclado Roto
            </button>
        </div>
    );
};

const ScreenTest = ({ onComplete }) => {
    const colors = ['bg-red-600', 'bg-green-600', 'bg-blue-600', 'bg-white', 'bg-black'];
    const [idx, setIdx] = useState(-1); // -1 = intro
    const [started, setStarted] = useState(false);

    if (!started) return <TestIntro title="Test de Pantalla (Píxeles)" icon={Grid} desc="La pantalla pasará por varios colores (Rojo, Verde, Azul, Blanco, Negro) para que busques píxeles muertos o manchas." onStart={() => { setStarted(true); setIdx(0); }} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    if (idx === -1 && started) {
        // Redundant catch, but functional
        setIdx(0);
    }

    const handleClick = () => {
        if (idx < colors.length - 1) setIdx(idx + 1);
        else onComplete(true);
    };

    if (!started) return null;

    return (
        <div onClick={handleClick} className={`min-h-screen w-full cursor-pointer ${colors[idx]} flex items-center justify-center`}>
            {colors[idx] === 'bg-white' && <span className="text-black font-bold opacity-10">BLANCO</span>}
            {colors[idx] === 'bg-black' && <span className="text-white font-bold opacity-10">NEGRO (Backlight)</span>}
            <span className="fixed bottom-10 text-white/50 text-sm pointer-events-none">Toca para siguiente color</span>
        </div>
    );
};

const WebcamTest = ({ onComplete }) => {
    const videoRef = useRef(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started) return;
        let stream = null;
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => {
                stream = s;
                if (videoRef.current) videoRef.current.srcObject = s;
            })
            .catch(e => console.error(e));

        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        }
    }, [started]);

    if (!started) return <TestIntro title="Test de Webcam" icon={Camera} desc="Activaremos la cámara para verificar que la imagen es nítida y no hay artefactos visuales." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><Camera /> Webcam</h2>
            <div className="bg-black rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl mb-8 w-full max-w-2xl aspect-video relative">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4">
                <button onClick={() => onComplete({ passed: true, details: 'Webcam OK' })} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl">Sí, se ve</button>
                <button onClick={() => onComplete({ passed: false, details: 'Fallo Webcam' })} className="px-8 py-3 bg-red-600/20 text-red-500 font-bold rounded-xl border border-red-500">No funciona</button>
            </div>
        </div>
    );
};

const AudioTest = ({ onComplete }) => {
    const [started, setStarted] = useState(false);

    const playSound = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
    };

    if (!started) return <TestIntro title="Test de Audio" icon={Play} desc="Reproduciremos un sonido de prueba (beep) para confirmar que los altavoces funcionan." onStart={() => setStarted(true)} onSkip={() => onComplete({ skipped: true, details: 'Saltado por usuario' })} />;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><Play /> Audio</h2>
            <button onClick={playSound} className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors mb-8 shadow-xl">
                <Play size={40} fill="white" />
            </button>
            <p className="mb-8 font-bold">¿Escuchaste el sonido?</p>
            <div className="flex gap-4">
                <button onClick={() => onComplete({ passed: true, details: 'Audio OK' })} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl">Sí, Correcto</button>
                <button onClick={() => onComplete({ passed: false, details: 'Sin Audio' })} className="px-8 py-3 bg-red-600/20 text-red-500 font-bold rounded-xl border border-red-500">No</button>
            </div>
        </div>
    )
}

export default LaptopDiagnostics;
