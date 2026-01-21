import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Battery, Wifi, Monitor, Speaker, Mic, Camera, CheckCircle, XCircle, Play, ArrowRight } from 'lucide-react';

const LaptopRemoteTest = () => {
    const [accessCode, setAccessCode] = useState('');
    const [connected, setConnected] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [currentTest, setCurrentTest] = useState(null); // null = menu, 'screen', 'audio', etc.
    const [results, setResults] = useState({});

    // Connection Handler
    const handleConnect = async () => {
        if (!accessCode) return;
        try {
            // In a real scenario, verify code with backend. 
            // For now, we assume code IS the session ID or maps to it directly.
            // Simplified: "code-123" -> Session 123
            // Assuming the technician created a session with this ID.

            // Simulation
            setSessionId(accessCode);
            setConnected(true);
        } catch (e) {
            alert("Error conectando. Verifica el código.");
        }
    };

    // Send Result to Technician
    const reportResult = async (testName, status, details = {}) => {
        const newResults = { ...results, [testName]: status };
        setResults(newResults);

        // POST to backend (fire & forget)
        try {
            await fetch(`/api/diagnostics/remote/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: testName, status, details })
            });
        } catch (e) { console.error(e); }

        setCurrentTest(null); // Back to menu
    };

    // TESTS IMPLEMENTATION (Simplified Versions)

    // 1. Screen (Dead Pixels)
    const ScreenTest = () => {
        const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-white', 'bg-black'];
        const [step, setStep] = useState(0);

        return (
            <div
                className={`fixed inset-0 z-50 ${colors[step]} flex items-center justify-center cursor-pointer`}
                onClick={() => {
                    if (step < colors.length - 1) setStep(step + 1);
                    else {
                        if (confirm("¿Viste algún pixel muerto o mancha?")) reportResult('screen', 'FAIL');
                        else reportResult('screen', 'PASS');
                    }
                }}
            >
                <p className="text-white/50 font-mono text-xs absolute bottom-10 bg-black/50 px-2 rounded">
                    Tap to change color ({step + 1}/{colors.length})
                </p>
            </div>
        );
    };

    // 2. Audio (Speaker)
    const SpeakerTest = () => {
        const playSound = () => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => osc.stop(), 1000);
        };

        return (
            <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
                <Speaker size={64} className="text-pink-500 animate-pulse" />
                <h2 className="text-2xl font-bold text-white text-center">Prueba de Altavoces</h2>
                <p className="text-slate-400 text-center max-w-md">Pulsa el botón para reproducir un sonido. Asegúrate de tener el volumen subido.</p>

                <button onClick={playSound} className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all flex items-center gap-2">
                    <Play size={20} /> Reproducir Sonido
                </button>

                <div className="flex gap-4 mt-8">
                    <button onClick={() => reportResult('speakers', 'PASS')} className="px-6 py-2 bg-green-500/20 text-green-400 border border-green-500 rounded-lg hover:bg-green-500/30">Se oye bien</button>
                    <button onClick={() => reportResult('speakers', 'FAIL')} className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500 rounded-lg hover:bg-red-500/30">No se oye / Distorsionado</button>
                </div>
            </div>
        );
    };

    // 3. Microphone
    const MicTest = () => {
        const [listening, setListening] = useState(false);
        const [level, setLevel] = useState(0);

        useEffect(() => {
            let stream = null;
            let audioContext = null;
            let analyser = null;
            let microphone = null;
            let javascriptNode = null;

            const startMic = async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setListening(true);
                    audioContext = new AudioContext();
                    analyser = audioContext.createAnalyser();
                    microphone = audioContext.createMediaStreamSource(stream);
                    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                    analyser.smoothingTimeConstant = 0.8;
                    analyser.fftSize = 1024;

                    microphone.connect(analyser);
                    analyser.connect(javascriptNode);
                    javascriptNode.connect(audioContext.destination);

                    javascriptNode.onaudioprocess = () => {
                        const array = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(array);
                        let values = 0;
                        const length = array.length;
                        for (let i = 0; i < length; i++) values += array[i];
                        const average = values / length;
                        setLevel(average);
                    };
                } catch (err) {
                    console.error("Mic error", err);
                    reportResult('mic', 'FAIL', { error: 'Access Denied' });
                }
            };
            startMic();

            return () => {
                if (stream) stream.getTracks().forEach(track => track.stop());
                if (audioContext) audioContext.close();
            };
        }, []);

        return (
            <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
                <Mic size={64} className={`text-blue-500 transition-transform ${listening ? 'scale-110' : ''}`} />
                <h2 className="text-2xl font-bold text-white text-center">Prueba de Micrófono</h2>
                <p className="text-slate-400 text-center max-w-md">Di algo en voz alta...</p>

                <div className="w-64 h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${Math.min(100, level * 2)}%` }}></div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={() => reportResult('mic', 'PASS')} className="px-6 py-2 bg-green-500/20 text-green-400 border border-green-500 rounded-lg hover:bg-green-500/30">Detecta voz</button>
                    <button onClick={() => reportResult('mic', 'FAIL')} className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500 rounded-lg hover:bg-red-500/30">No detecta nada</button>
                </div>
            </div>
        );
    };

    // 4. Camera (Webcam)
    const CameraTest = () => {
        const videoRef = React.useRef(null);

        useEffect(() => {
            let stream = null;
            const startCam = async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) videoRef.current.srcObject = stream;
                } catch (e) {
                    reportResult('webcam', 'FAIL', { error: 'Access Denied' });
                }
            };
            startCam();
            return () => {
                if (stream) stream.getTracks().forEach(track => track.stop());
            }
        }, []);

        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
                <h2 className="text-xl font-bold text-white">Prueba de Webcam</h2>
                <div className="w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden border border-slate-700">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                </div>

                <div className="flex gap-4 mt-4">
                    <button onClick={() => reportResult('webcam', 'PASS')} className="px-6 py-2 bg-green-500/20 text-green-400 border border-green-500 rounded-lg">Se ve bien</button>
                    <button onClick={() => reportResult('webcam', 'FAIL')} className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500 rounded-lg">No se ve / Negro</button>
                </div>
            </div>
        );
    };


    // LOGIN SCREEN
    if (!connected) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
                    <div className="text-center">
                        <Terminal size={48} className="text-pink-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white">Diagnóstico Remoto</h1>
                        <p className="text-slate-400 text-sm mt-2">Introduce el código de sesión del técnico</p>
                    </div>

                    <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO (ej: 1234)"
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-2xl font-mono text-white tracking-widest outline-none focus:border-pink-500 transition-colors uppercase"
                    />

                    <button
                        onClick={handleConnect}
                        disabled={!accessCode}
                        className="w-full p-4 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        Conectar <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    // MAIN DASHBOARD (Connected)
    if (!currentTest) {
        return (
            <div className="min-h-screen bg-slate-950 p-4">
                <div className="max-w-2xl mx-auto flex flex-col gap-6">
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Cpu size={24} className="text-pink-500" />
                                Panel de Pruebas
                            </h1>
                            <p className="text-slate-400 text-xs font-mono mt-1">SESIÓN: {sessionId}</p>
                        </div>
                        <div className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20 animate-pulse">
                            Conectado
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TestCard
                            title="Pantalla"
                            icon={Monitor}
                            status={results.screen}
                            onClick={() => setCurrentTest('screen')}
                        />
                        <TestCard
                            title="Altavoces"
                            icon={Speaker}
                            status={results.speakers}
                            onClick={() => setCurrentTest('audio')}
                        />
                        <TestCard
                            title="Micrófono"
                            icon={Mic}
                            status={results.mic}
                            onClick={() => setCurrentTest('mic')}
                        />
                        <TestCard
                            title="Webcam"
                            icon={Camera}
                            status={results.webcam}
                            onClick={() => setCurrentTest('webcam')}
                        />
                        <TestCard
                            title="Batería"
                            icon={Battery}
                            status={results.battery}
                            onClick={() => setCurrentTest('battery')}
                            disabled={true}
                            subtitle="(Automático)"
                        />
                        <TestCard
                            title="WiFi"
                            icon={Wifi}
                            status={results.wifi}
                            onClick={() => setCurrentTest('wifi')}
                            disabled={true}
                            subtitle="(Automático)"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // RUNNING TEST
    return (
        <div className="fixed inset-0 bg-slate-950 z-40 flex flex-col">
            <div className="flex-1 overflow-hidden relative">
                {currentTest === 'screen' && <ScreenTest />}
                {currentTest === 'audio' && <SpeakerTest />}
                {currentTest === 'mic' && <MicTest />}
                {currentTest === 'webcam' && <CameraTest />}
            </div>
            {currentTest !== 'screen' && (
                <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-between items-center">
                    <button onClick={() => setCurrentTest(null)} className="text-slate-400 hover:text-white">Cancelar / Volver</button>
                </div>
            )}
        </div>
    );
};

const TestCard = ({ title, icon: Icon, status, onClick, disabled, subtitle }) => {
    let statusColor = "border-white/5 bg-slate-800/50 text-slate-400";
    let StatusIcon = null;

    if (status === 'PASS') {
        statusColor = "border-green-500/50 bg-green-500/10 text-green-400";
        StatusIcon = CheckCircle;
    } else if (status === 'FAIL') {
        statusColor = "border-red-500/50 bg-red-500/10 text-red-400";
        StatusIcon = XCircle;
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all relative overflow-hidden group ${statusColor} ${!disabled && 'hover:bg-slate-800 hover:border-pink-500/50'}`}
        >
            <Icon size={32} className={`mb-1 ${status === 'PASS' ? 'text-green-500' : status === 'FAIL' ? 'text-red-500' : 'text-slate-500 group-hover:text-pink-500'}`} />
            <div className="text-center">
                <span className="font-bold block">{title}</span>
                {subtitle && <span className="text-[10px] opacity-50">{subtitle}</span>}
            </div>
            {StatusIcon && <StatusIcon size={16} className="absolute top-3 right-3" />}
        </button>
    );
};

export default LaptopRemoteTest;
