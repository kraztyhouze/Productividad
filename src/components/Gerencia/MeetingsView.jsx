import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Zap, 
    ShieldAlert, 
    FileText, 
    Trash2, 
    CheckCircle2, 
    UserCheck,
    Calendar,
    ArrowRight,
    AlertCircle,
    Download,
    Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, ROLES } from '../../context/AuthContext';
import { generateMeetingPDF } from '../../utils/pdfGenerator';

const MeetingsView = ({ storeId }) => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [interviews, setInterviews] = useState([]); // Roles authorized to interview
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedInterviewer, setSelectedInterviewer] = useState(user?.id || '');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // Monthly default
    const [category, setCategory] = useState('Ventas');
    const [metrics, setMetrics] = useState([]);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [purgeStep, setPurgeStep] = useState(0); // 0: Open, 1: Confirm 1, 2: Confirm 2
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (employees.length > 0) {
            setInterviews(employees.filter(e => e.isInterviewer));
        }
    }, [employees]);

    useEffect(() => {
        if (selectedEmployee && reportDate) {
            fetchEmployeeMetrics();
        }
    }, [selectedEmployee, reportDate, category]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees', {
                headers: { 'x-store-id': storeId }
            });
            const data = await res.json();
            setEmployees(data);
            setInterviews(data.filter(e => ['Gerente', 'Supervisor', 'Responsable'].includes(e.role)));
        } catch (e) { console.error(e); }
    };

    const fetchEmployeeMetrics = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/gerencia/metrics?report_date=${reportDate}&category=${category}`, {
                headers: { 
                    'x-store-id': storeId,
                    'x-user-role': user?.role
                }
            });
            const data = await res.json();
            // Filter metrics for this specific employee
            const empMetrics = data.filter(m => m.employee_id === selectedEmployee);
            setMetrics(empMetrics);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleGeneratePDF = async () => {
        if (!selectedEmployee || !selectedInterviewer) {
            setStatusMsg({ type: 'error', text: 'Selecciona empleado y entrevistador' });
            return;
        }

        const employee = employees.find(e => e.id === selectedEmployee);
        const interviewer = employees.find(e => e.id === selectedInterviewer);

        const meetingData = {
            employeeName: `${employee?.first_name} ${employee?.last_name || ''}`,
            interviewerName: `${interviewer?.first_name} ${interviewer?.last_name || ''}`,
            date: new Date().toLocaleDateString(),
            category,
            metrics: metrics,
            summary
        };

        generateMeetingPDF(meetingData);

        // Optional: Save meeting record to DB
        try {
            await fetch('/api/gerencia/meetings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-store-id': storeId,
                    'x-user-role': user?.role
                },
                body: JSON.stringify({
                    employee_id: selectedEmployee,
                    interviewer_id: selectedInterviewer,
                    date: new Date().toISOString().split('T')[0],
                    category,
                    summary: { text: summary, metrics_count: metrics.length }
                })
            });
            setStatusMsg({ type: 'success', text: 'Acta generada y registrada correctamente.' });
        } catch (e) { console.error(e); }
    };

    const handlePurge = async () => {
        try {
            const res = await fetch('/api/gerencia/metrics/purge', {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-store-id': storeId,
                    'x-user-role': user?.role
                },
                body: JSON.stringify({ report_date: reportDate, category })
            });
            const data = await res.json();
            if (data.success) {
                setStatusMsg({ type: 'success', text: data.message });
                setPurgeStep(0);
                setMetrics([]);
                setSelectedEmployee('');
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: 'Error al purgar datos' });
        }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const dataToImport = [];
            
            // Expected CSV: employee_id, metric_name, metric_value
            // Skipping header
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length >= 3) {
                    dataToImport.push({
                        employee_id: parts[0].trim(),
                        metric_name: parts[1].trim(),
                        metric_value: parseFloat(parts[2].trim()) || 0,
                        report_date: reportDate,
                        category: category
                    });
                }
            }

            if (dataToImport.length > 0) {
                try {
                    const res = await fetch('/api/gerencia/metrics/bulk', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-store-id': storeId,
                            'x-user-role': user?.role
                        },
                        body: JSON.stringify({ metrics: dataToImport })
                    });
                    const result = await res.json();
                    if (result.success) {
                        setStatusMsg({ type: 'success', text: `${result.count} métricas importadas correctamente.` });
                        if (selectedEmployee) fetchEmployeeMetrics();
                    }
                } catch (err) {
                    setStatusMsg({ type: 'error', text: 'Error en la importación bulk.' });
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Users className="text-[#FF8C9D]" />
                        REUNIONES 1:1
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Seguimiento de desempeño y firma de actas
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="text-[10px] font-black uppercase border-none focus:ring-0 bg-transparent"
                        >
                            <option>Ventas</option>
                            <option>Compras</option>
                        </select>
                        <input 
                            type="month" 
                            value={reportDate}
                            onChange={e => setReportDate(e.target.value)}
                            className="text-[10px] font-black border-none focus:ring-0 bg-transparent"
                        />
                    </div>
                    <label className="bg-[#1A365D] hover:bg-[#2a4a7a] text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase cursor-pointer flex items-center gap-2 transition-all shadow-md active:scale-95">
                        <Upload size={14}/> Cargar Excel/CSV
                        <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                    </label>
                </div>
            </div>

            {statusMsg.text && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                >
                    {statusMsg.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                    {statusMsg.text}
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selector Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap size={14} className="text-amber-400"/> CONFIGURACIÓN SESIÓN
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Entrevistador</label>
                                <select 
                                    value={selectedInterviewer}
                                    onChange={e => setSelectedInterviewer(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-[#1A365D]/10"
                                >
                                    <option value="">Seleccionar responsable...</option>
                                    {interviews.map(e => (
                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName || ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Empleado a entrevistar</label>
                                <select 
                                    value={selectedEmployee}
                                    onChange={e => setSelectedEmployee(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-[#1A365D]/10"
                                >
                                    <option value="">Seleccionar empleado...</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name || ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Destruction Mode Card */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform">
                            <ShieldAlert size={120} />
                        </div>
                        
                        <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Trash2 size={14}/> MODO DESTRUCCIÓN
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold mb-4">
                            Cierra el ciclo mensual y elimina los datos brutos de Excel permanentemente.
                        </p>

                        {purgeStep === 0 ? (
                            <button 
                                onClick={() => setPurgeStep(1)}
                                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase transition-all"
                            >
                                Finalizar Ciclo y Purgar
                            </button>
                        ) : purgeStep === 1 ? (
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-amber-400 uppercase animate-pulse">¿Confirmar primera destrucción?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setPurgeStep(0)} className="py-2 bg-slate-800 rounded-lg text-[8px] font-bold">CANCELAR</button>
                                    <button onClick={() => setPurgeStep(2)} className="py-2 bg-red-600 rounded-lg text-[8px] font-bold">CONFIRMAR (1/2)</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-red-500 uppercase animate-bounce">⚠️ ACCIÓN IRREVERSIBLE ⚠️</p>
                                <button 
                                    onClick={handlePurge}
                                    className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-900/50"
                                >
                                    ELIMINAR TODO PARA {reportDate.split('-')[1]}/{reportDate.split('-')[0]}
                                </button>
                                <button onClick={() => setPurgeStep(0)} className="w-full text-[8px] font-bold text-slate-500 uppercase mt-1">Me he arrepentido</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Metrics & Meeting Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-[#1A365D]"/> PANEL DE REUNIÓN
                            </h3>
                            {selectedEmployee && (
                                <span className="bg-[#1A365D]/5 text-[#1A365D] px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                    Empleado: {employees.find(e => e.id === selectedEmployee)?.first_name}
                                </span>
                            )}
                        </div>

                        {!selectedEmployee ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
                                <UserCheck size={48} strokeWidth={1}/>
                                <p className="text-[10px] font-black uppercase">Selecciona un empleado para ver sus métricas</p>
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-[#1A365D]/20 border-t-[#1A365D] rounded-full animate-spin"></div>
                            </div>
                        ) : metrics.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-2 py-20">
                                <AlertCircle size={32} />
                                <p className="text-[10px] font-black uppercase">No hay datos cargados para este periodo</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Metrics Table */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {metrics.map((m, i) => (
                                        <div key={i} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase">{m.metric_name}</p>
                                                <p className="text-sm font-black text-slate-800">{m.metric_value}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[9px] font-black py-1 px-2 rounded-lg ${Number(m.metric_value) > 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {Number(m.metric_value) > 100 ? '+100%' : 'MÉTRICA OK'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Meeting Notes */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Acuerdos y Compromisos</label>
                                    <textarea 
                                        value={summary}
                                        onChange={e => setSummary(e.target.value)}
                                        placeholder="Escribe aquí las notas de la reunión, puntos de mejora y compromisos adquiridos..."
                                        className="w-full bg-slate-50 border-none rounded-3xl p-6 text-xs font-medium min-h-[150px] focus:ring-2 focus:ring-[#1A365D]/10"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleGeneratePDF}
                                        className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#2a4a7a] transition-all shadow-lg shadow-[#1A365D]/20"
                                    >
                                        <Download size={14}/> Generar Acta y Descargar PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingsView;
