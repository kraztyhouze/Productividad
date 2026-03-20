import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, AlertTriangle, XCircle, FileText, Save, Send, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import { useMeetingDraft } from '../../hooks/useMeetingDraft';
import { generateTalentMeetingPDF } from '../../utils/pdfGenerator';

const MeetingForm = ({ employee, interviewer, onFinish }) => {
    const { draft, updateDraft, isSaving } = useMeetingDraft(employee.id, interviewer.id);
    const [criteria, setCriteria] = useState([]);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const res = await fetch('/api/gerencia/evaluation-criteria', {
                    headers: { 'x-user-role': interviewer.role || 'Gerente' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCriteria(data);
                }
            } catch (err) {
                console.error('Error fetching criteria:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCriteria();
    }, []);

    if (isLoading || !draft) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    );

    // Group criteria by Category
    const groupedCriteria = criteria.reduce((acc, c) => {
        if (!acc[c.category]) acc[c.category] = [];
        acc[c.category].push(c);
        return acc;
    }, {});

    const categories = Object.keys(groupedCriteria);
    const totalSteps = categories.length + 1; // Last step for summary

    const handleEval = (criterionId, value) => {
        const newEval = { ...(draft.evaluation || {}), [criterionId]: value };
        updateDraft({ evaluation: newEval });
    };

    const handleComment = (criterionId, text) => {
        const newComments = { ...(draft.comments || {}), [criterionId]: text };
        updateDraft({ comments: newComments });
    };

    const handleSummary = (field, text) => {
        const newSummary = { ...(draft.summary || {}), [field]: text };
        updateDraft({ summary: newSummary });
    };

    const finishMeeting = async () => {
        if (!window.confirm('¿Seguro que quieres finalizar y cerrar la reunión? El borrador se borrará y se generará el acta definitiva.')) return;
        
        try {
            await fetch('/api/gerencia/meetings/finalize', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-role': interviewer.role || 'Gerente' 
                },
                body: JSON.stringify({
                    employee_id: employee.id,
                    interviewer_id: interviewer.id,
                    date: new Date().toISOString().split('T')[0],
                    summary: draft
                })
            });

            // Generate PDF
            generateTalentMeetingPDF(employee.firstName + ' ' + (employee.lastName || ''), interviewer.name, draft, groupedCriteria);
            
            if (onFinish) onFinish();
        } catch (err) {
            console.error('Error finalizing meeting:', err);
            alert('Error al finalizar la reunión.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white/50 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <header className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg"><User className="w-6 h-6" /></div>
                    <div>
                        <h2 className="text-xl font-bold">Evaluación: {employee.firstName} {employee.lastName}</h2>
                        <p className="text-sm opacity-80 decoration-white/30">Entrevistador: {interviewer.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs opacity-70">Progreso</p>
                        <p className="text-lg font-mono font-bold">{Math.round((step / totalSteps) * 100)}%</p>
                    </div>
                    {isSaving && (
                        <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs">
                            <Save className="w-3 h-3 animate-pulse" /> Guardando...
                        </div>
                    )}
                </div>
            </header>

            <main className="p-8 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {step <= categories.length ? (
                        <motion.div
                            key={`step-${step}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="border-b border-indigo-100 pb-4">
                                <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Sección {step} de {categories.length}</span>
                                <h3 className="text-2xl font-bold text-slate-800">{categories[step - 1]}</h3>
                            </div>

                            <div className="space-y-6">
                                {groupedCriteria[categories[step - 1]].map(c => (
                                    <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">{c.title}</h4>
                                                <p className="text-sm text-slate-500 max-w-lg">{c.description}</p>
                                            </div>
                                            
                                            {/* Traffic Lights */}
                                            <div className="flex p-1 bg-slate-100 rounded-lg gap-1 border border-slate-200">
                                                <button 
                                                    onClick={() => handleEval(c.id, 'Rojo')}
                                                    className={`p-2 rounded-md transition-all ${draft.evaluation?.[c.id] === 'Rojo' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:bg-red-50'}`}
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEval(c.id, 'Ámbar')}
                                                    className={`p-2 rounded-md transition-all ${draft.evaluation?.[c.id] === 'Ámbar' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-amber-50'}`}
                                                >
                                                    <AlertTriangle className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEval(c.id, 'Verde')}
                                                    className={`p-2 rounded-md transition-all ${draft.evaluation?.[c.id] === 'Verde' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-emerald-50'}`}
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <textarea 
                                            placeholder="Observaciones de este punto..."
                                            value={draft.comments?.[c.id] || ''}
                                            onChange={(e) => handleComment(c.id, e.target.value)}
                                            className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none h-20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="final-summary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="border-b border-indigo-100 pb-4">
                                <h3 className="text-2xl font-bold text-slate-800 italic">Conclusiones y Compromisos</h3>
                                <p className="text-slate-500">Resume los puntos clave y define las acciones futuras para el empleado.</p>
                            </div>

                            <div className="grid gap-6">
                                {[
                                    { id: 'strengths', label: 'Fortalezas Identificadas', icon: CheckCircle, placeholder: 'Destaca 2 o 3 fortalezas principales...' },
                                    { id: 'improvements', label: 'Puntos de Mejora', icon: AlertTriangle, placeholder: 'Áreas donde el empleado debe enfocarse...' },
                                    { id: 'commitments', label: 'Acciones de Compromiso', icon: Send, placeholder: 'Qué hará el empleado y la empresa para mejorar...' }
                                ].map(sec => (
                                    <div key={sec.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold">
                                            <sec.icon className={`w-5 h-5 ${sec.id === 'strengths' ? 'text-emerald-500' : sec.id === 'improvements' ? 'text-amber-500' : 'text-indigo-500'}`} />
                                            {sec.label}
                                        </div>
                                        <textarea 
                                            value={draft.summary?.[sec.id] || ''}
                                            onChange={(e) => handleSummary(sec.id, e.target.value)}
                                            placeholder={sec.placeholder}
                                            className="w-full p-4 bg-white border border-slate-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none shadow-inner"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            <footer className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center sm:px-12">
                <button 
                    disabled={step === 1}
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronLeft className="w-5 h-5" /> Anterior
                </button>

                {step < totalSteps ? (
                    <button 
                        onClick={() => setStep(step + 1)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        Siguiente <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button 
                        onClick={finishMeeting}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        Finalizar y Generar Acta <Download className="w-5 h-5" />
                    </button>
                )}
            </footer>
        </div>
    );
};

export default MeetingForm;
