import React from 'react';
import { useProductivityWidget } from '../../hooks/useProductivityWidget';
import { UserPlus, Play, CheckCircle, Clock, ShoppingBag, Sparkles, RefreshCw, UserX, ChevronLeft } from 'lucide-react';

/**
 * Componente ProductivityWidget
 * Interfaz minimalista del Widget Flotante de Productividad para el empleado.
 * Sincroniza en tiempo real los tiempos con la base de datos principal de la tienda.
 */
export const ProductivityWidget = ({ 
    employee, 
    onClose,
    startClient,
    endClient,
    clientSessions,
    activeSessions,
    logTransaction
}) => {
    const { id: employeeId, firstName, lastName } = employee;
    const employeeName = `${firstName} ${lastName}`;

    const {
        currentState,
        lastDurations,
        showTypeSelector,
        setShowTypeSelector,
        handleNextState,
        handleConfirmPurchase
    } = useProductivityWidget({
        employeeId,
        employeeName,
        startClient,
        endClient,
        clientSessions,
        activeSessions,
        logTransaction
    });

    // Configuración de visualización y estilo para cada uno de los 3 estados del botón principal
    const stateConfig = {
        0: {
            text: "Llamar Siguiente Cliente",
            color: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30 active:bg-emerald-600 focus:ring-emerald-400",
            icon: <UserPlus className="w-12 h-12 text-white" />,
            glow: "bg-emerald-500 shadow-emerald-500/50"
        },
        1: {
            text: "Iniciar Compra",
            color: "bg-blue-500 hover:bg-blue-400 shadow-blue-500/30 active:bg-blue-600 focus:ring-blue-400",
            icon: <Play className="w-12 h-12 text-white" />,
            glow: "bg-blue-500 shadow-blue-500/50"
        },
        2: {
            text: "Finalizar Compra",
            color: "bg-orange-500 hover:bg-orange-400 shadow-orange-500/30 active:bg-orange-600 focus:ring-orange-400",
            icon: <CheckCircle className="w-12 h-12 text-white" />,
            glow: "bg-orange-500 shadow-orange-500/50"
        }
    };

    const currentConfig = stateConfig[currentState];

    return (
        <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 font-sans select-none overflow-hidden justify-between">
            {/* Header del Widget */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${showTypeSelector ? 'bg-orange-400 animate-pulse' : 'animate-pulse ' + currentConfig.glow}`}></span>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 truncate max-w-[150px]">
                        {firstName}
                    </h2>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition-all"
                    >
                        Cerrar
                    </button>
                )}
            </div>

            {/* Cuerpo del Widget: Botón Único o Selector de Tipo */}
            <div className="flex-1 flex flex-col items-center justify-center py-3">
                {!showTypeSelector ? (
                    <button
                        onClick={handleNextState}
                        className={`w-36 h-36 rounded-3xl flex flex-col items-center justify-center gap-2.5 transition-all duration-300 transform active:scale-95 shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${currentConfig.color}`}
                    >
                        {currentConfig.icon}
                        <span className="font-black text-white uppercase text-center px-3 leading-tight tracking-tight text-[11px]">
                            {currentConfig.text}
                        </span>
                    </button>
                ) : (
                    /* Selector de Tipo de Compra al finalizar */
                    <div className="w-full flex flex-col gap-2.5 animate-in">
                        <div className="text-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">¿Tipo de Operación?</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {/* Compra Estándar */}
                            <button
                                onClick={() => handleConfirmPurchase('standard')}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-all font-bold text-[10px] gap-1 active:scale-95"
                            >
                                <ShoppingBag size={18} />
                                <span>Estándar</span>
                            </button>

                            {/* Compra Joyas */}
                            <button
                                onClick={() => handleConfirmPurchase('jewelry')}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 transition-all font-bold text-[10px] gap-1 active:scale-95"
                            >
                                <Sparkles size={18} />
                                <span>Joyas</span>
                            </button>

                            {/* Compra Recuperable */}
                            <button
                                onClick={() => handleConfirmPurchase('recoverable')}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-blue-500/30 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 transition-all font-bold text-[10px] gap-1 active:scale-95"
                            >
                                <RefreshCw size={18} />
                                <span>Recuperable</span>
                            </button>

                            {/* Sin Trato */}
                            <button
                                onClick={() => handleConfirmPurchase('noDeal', '')}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all font-bold text-[10px] gap-1 active:scale-95"
                            >
                                <UserX size={18} />
                                <span>Sin Trato</span>
                            </button>
                        </div>

                        {/* Botón de Atrás */}
                        <button
                            onClick={() => setShowTypeSelector(false)}
                            className="w-full mt-1.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95"
                        >
                            <ChevronLeft size={12} />
                            <span>Volver</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer / Panel de Métricas Rápidas */}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 font-mono text-[10px] space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800/50 pb-1 mb-1">
                    <Clock size={11} className="text-slate-400" />
                    <span>Métricas de Sesión</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">T. Muerto:</span>
                    <span className={`font-bold ${lastDurations.tiempoMuerto !== null ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {lastDurations.tiempoMuerto !== null ? `${lastDurations.tiempoMuerto}s` : '---'}
                    </span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">T. Llamada:</span>
                    <span className={`font-bold ${lastDurations.tiempoLlamada !== null ? 'text-blue-400' : 'text-slate-600'}`}>
                        {lastDurations.tiempoLlamada !== null ? `${lastDurations.tiempoLlamada}s` : '---'}
                    </span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">T. Atención:</span>
                    <span className={`font-bold ${lastDurations.tiempoAtencion !== null ? 'text-orange-400' : 'text-slate-600'}`}>
                        {lastDurations.tiempoAtencion !== null ? `${lastDurations.tiempoAtencion}s` : '---'}
                    </span>
                </div>
            </div>
        </div>
    );
};
