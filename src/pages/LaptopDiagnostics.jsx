import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, Cpu, Keyboard, Wifi, Camera, Mic, Battery, Play, CheckCircle, XCircle, Grid } from 'lucide-react';

const LaptopDiagnostics = () => {
    const { sessionId } = useParams();
    const [step, setStep] = useState('intro'); // intro, specs, keyboard, screen, webcam, audio, done
    const [results, setResults] = useState({});
    const [specs, setSpecs] = useState(null);

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

    const handleTestPass = (test, data = true) => {
        setResults(prev => ({ ...prev, [test]: data }));
        sendUpdate(test, data);
    };

    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-12 text-center">
                <Monitor size={80} className="text-cyan-400 mb-6" />
                <h1 className="text-4xl font-black mb-4">Diagnóstico de Portátil</h1>
                <p className="text-xl text-slate-400 mb-8 max-w-2xl">
                    Esta herramienta analizará el hardware (GPU, CPU, RAM), probará el teclado tecla por tecla, la pantalla, cámara y audio.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 text-sm text-slate-500 font-mono">
                    <span className="bg-slate-800 p-2 rounded">🖥️ Pantalla</span>
                    <span className="bg-slate-800 p-2 rounded">⌨️ Teclado</span>
                    <span className="bg-slate-800 p-2 rounded">📷 Webcam</span>
                    <span className="bg-slate-800 p-2 rounded">🔊 Audio</span>
                </div>
                <button
                    onClick={() => setStep('specs')}
                    className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-cyan-600/20 transition-all"
                >
                    COMENZAR ANÁLISIS
                </button>
            </div>
        );
    }

    if (step === 'specs') {
        return <SpecsTest onComplete={(data) => {
            handleTestPass('specs', data);
            setSpecs(data);
            setStep('keyboard');
        }} />;
    }

    if (step === 'keyboard') return <KeyboardTest onComplete={(res) => { handleTestPass('keyboard', res); setStep('screen'); }} />;
    if (step === 'screen') return <ScreenTest onComplete={(res) => { handleTestPass('screen', res); setStep('webcam'); }} />;
    if (step === 'webcam') return <WebcamTest onComplete={(res) => { handleTestPass('webcam', res); setStep('audio'); }} />;
    if (step === 'audio') return <AudioTest onComplete={(res) => { handleTestPass('audio', res); setStep('done'); }} />;

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

// --- COMPONENTS ---

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

    // Standard layout mapping could be huge, let's use a simplified logical map
    // We'll capture codes.

    useEffect(() => {
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
    }, []);

    const keys = [
        ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Delete'],
        ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
        ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
        ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
        ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
        ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'ControlRight']
    ];

    const isDone = pressed.size > 15; // Arbitrary threshold to pass "working keyboard"

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

    if (idx === -1) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
                <Grid size={64} className="mb-6 text-purple-500" />
                <h2 className="text-2xl font-bold mb-4">Test de Pantalla</h2>
                <p className="text-slate-400 mb-8 max-w-md text-center">
                    La pantalla cambiará de colores. Busca píxeles muertos o manchas. Haz clic para avanzar.
                </p>
                <button onClick={() => setIdx(0)} className="px-8 py-3 bg-purple-600 rounded-xl font-bold">EMPEZAR</button>
            </div>
        )
    }

    const handleClick = () => {
        if (idx < colors.length - 1) setIdx(idx + 1);
        else onComplete(true);
    };

    return (
        <div onClick={handleClick} className={`min-h-screen w-full cursor-pointer ${colors[idx]} flex items-center justify-center`}>
            {colors[idx] === 'bg-white' && <span className="text-black font-bold opacity-10">BLANCO</span>}
            {colors[idx] === 'bg-black' && <span className="text-white font-bold opacity-10">NEGRO (Backlight)</span>}
        </div>
    );
};

const WebcamTest = ({ onComplete }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(e => console.error(e));
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><Camera /> Webcam</h2>
            <div className="bg-black rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl mb-8 w-full max-w-2xl aspect-video relative">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4">
                <button onClick={() => onComplete(true)} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl">Sí, se ve</button>
                <button onClick={() => onComplete(false)} className="px-8 py-3 bg-red-600/20 text-red-500 font-bold rounded-xl border border-red-500">No funciona</button>
            </div>
        </div>
    );
};

const AudioTest = ({ onComplete }) => {
    const playSound = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><Monitor /> Audio</h2>
            <button onClick={playSound} className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors mb-8 shadow-xl">
                <Play size={40} fill="white" />
            </button>
            <p className="mb-8 font-bold">¿Escuchaste el sonido?</p>
            <div className="flex gap-4">
                <button onClick={() => onComplete(true)} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl">Sí, Correcto</button>
                <button onClick={() => onComplete(false)} className="px-8 py-3 bg-red-600/20 text-red-500 font-bold rounded-xl border border-red-500">No</button>
            </div>
        </div>
    )
}

export default LaptopDiagnostics;
