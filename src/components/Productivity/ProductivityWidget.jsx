import React from 'react';
import { useProductivityWidget } from '../../hooks/useProductivityWidget';
import { UserPlus, Play, CheckCircle, Clock } from 'lucide-react';

/**
 * Componente ProductivityWidget
 * Interfaz minimalista del Widget Flotante de Productividad para el empleado.
 * Muestra un botón grande centralizado y una pequeña sección de estadísticas de la sesión actual.
 */
export const ProductivityWidget = ({ employee, onClose }) => {
    const { id: employeeId, firstName, lastName } = employee;
    const employeeName = `${firstName} ${lastName}`;

    const {
        currentState,
        lastDurations,
        handleNextState
    } = useProductivityWidget(employeeId, employeeName);

    // Configuración de visualización y estilo para cada uno de los 3 estados
    const stateConfig = {
        0: {
            text: "Llamar Siguiente Cliente",
            color: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30 active:bg-emerald-600 focus:ring-emerald-400",
            icon: <UserPlus className="w-12 h-12 text-white animate-soft-pulse" />,
            glow: "bg-emerald-500 shadow-emerald-500/50"
        },
        1: {
            text: "Iniciar Compra",
            color: "bg-blue-500 hover:bg-blue-400 shadow-blue-500/30 active:bg-blue-600 focus:ring-blue-400",
            icon: <Play className="w-12 h-12 text-white animate-soft-pulse" />,
            glow: "bg-blue-500 shadow-blue-500/50"
        },
        2: {
            text: "Finalizar Compra",
            color: "bg-orange-500 hover:bg-orange-400 shadow-orange-500/30 active:bg-orange-600 focus:ring-orange-400",
            icon: <CheckCircle className="w-12 h-12 text-white animate-soft-pulse" />,
            glow: "bg-orange-500 shadow-orange-500/50"
        }
    };

    const currentConfig = stateConfig[currentState];

    return (
        <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 font-sans select-none overflow-hidden justify-between">
            {/* Header del Widget */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${currentConfig.glow}`}></span>
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

            {/* Cuerpo: Botón Único */}
            <div className="flex-1 flex flex-col items-center justify-center py-4">
                <button
                    onClick={handleNextState}
                    className={`w-40 h-40 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${currentConfig.color}`}
                >
                    {currentConfig.icon}
                    <span className="font-black text-white uppercase text-center px-3 leading-tight tracking-tight text-xs">
                        {currentConfig.text}
                    </span>
                </button>
            </div>

            {/* Footer / Panel de Métricas Rápidas */}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 font-mono text-[10px] space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800/50 pb-1 mb-1">
                    <Clock size={11} className="text-slate-400" />
                    <span>Métricas Recientes</span>
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
