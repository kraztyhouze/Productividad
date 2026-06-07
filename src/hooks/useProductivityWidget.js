import { useState, useEffect } from 'react';

/**
 * Custom Hook useProductivityWidget
 * Maneja la máquina de estados y registra los Unix Timestamps para calcular y sincronizar:
 * 1. Tiempo Muerto: Desde que el empleado quedó libre o inició turno hasta que llama al cliente. Se guarda como log tipo 'idle_time'.
 * 2. Tiempo de Llamada: Desde que llama al cliente hasta que inicia la compra. Se guarda como log tipo 'call_time'.
 * 3. Tiempo de Atención: Gestionado directamente llamando a las funciones reales de la app (startClient y endClient).
 */
export const useProductivityWidget = ({
    employeeId,
    employeeName,
    startClient,
    endClient,
    clientSessions,
    activeSessions,
    logTransaction
}) => {
    // Buscar la sesión activa actual para saber cuándo empezó el turno
    const currentSession = activeSessions.find(s => String(s.employeeId).trim() === String(employeeId).trim());
    
    // Determinar si el empleado ya está atendiendo a un cliente
    const isCurrentlyServing = !!clientSessions[employeeId];
    
    const [currentState, setCurrentState] = useState(isCurrentlyServing ? 2 : 0); // 0 = Libre, 1 = Llamando, 2 = En Atención
    const [showTypeSelector, setShowTypeSelector] = useState(false); // Para mostrar la selección de tipo de compra

    const [timestamps, setTimestamps] = useState({
        horaLibre: currentSession ? new Date(currentSession.startTime).getTime() : Date.now(),
        horaLlamada: null,
        horaInicioCompra: null,
        horaFinCompra: null
    });

    const [lastDurations, setLastDurations] = useState({
        tiempoMuerto: null,
        tiempoLlamada: null,
        tiempoAtencion: null
    });

    // Sincronizar el estado del widget si cambia en la aplicación principal
    useEffect(() => {
        const active = !!clientSessions[employeeId];
        
        // Solo actualizar si el estado del widget no coincide con la realidad de la aplicación principal
        if (active && currentState !== 2) {
            setCurrentState(2);
            setShowTypeSelector(false);
        } else if (!active && currentState === 2) {
            setCurrentState(0);
            setShowTypeSelector(false);
            setTimestamps(prev => ({
                ...prev,
                horaLibre: Date.now()
            }));
        }
    }, [clientSessions, employeeId, currentState]);

    // Manejar transiciones
    const handleNextState = async () => {
        const now = Date.now();
        
        if (currentState === 0) {
            // TRANSICIÓN: Libre -> Llamando (Se hace clic en "Llamar Siguiente Cliente")
            const tiempoMuertoSec = Math.max(0, Math.floor((now - timestamps.horaLibre) / 1000));
            
            setTimestamps(prev => ({
                ...prev,
                horaLlamada: now
            }));
            
            setLastDurations(prev => ({
                ...prev,
                tiempoMuerto: tiempoMuertoSec
            }));

            // REGISTRO REAL EN LA BASE DE DATOS: Guardamos el Tiempo Muerto en transaction_logs
            if (logTransaction) {
                try {
                    await logTransaction(
                        employeeId, 
                        new Date(timestamps.horaLibre).toISOString(), 
                        new Date(now).toISOString(), 
                        'idle_time', 
                        JSON.stringify({ action: 'widget_idle', durationSeconds: tiempoMuertoSec })
                    );
                    console.log(`[Widget] Guardado Tiempo Muerto: ${tiempoMuertoSec}s`);
                } catch (err) {
                    console.error('Error al guardar Tiempo Muerto desde widget:', err);
                }
            }

            setCurrentState(1);
        }
        else if (currentState === 1) {
            // TRANSICIÓN: Llamando -> En Atención (Se hace clic en "Iniciar Compra")
            const tiempoLlamadaSec = Math.max(0, Math.floor((now - timestamps.horaLlamada) / 1000));

            setTimestamps(prev => ({
                ...prev,
                horaInicioCompra: now
            }));

            setLastDurations(prev => ({
                ...prev,
                tiempoLlamada: tiempoLlamadaSec
            }));

            // REGISTRO REAL EN LA BASE DE DATOS: Guardamos el Tiempo de Llamada/Espera
            if (logTransaction) {
                try {
                    await logTransaction(
                        employeeId, 
                        new Date(timestamps.horaLlamada).toISOString(), 
                        new Date(now).toISOString(), 
                        'call_time', 
                        JSON.stringify({ action: 'widget_call', durationSeconds: tiempoLlamadaSec })
                    );
                    console.log(`[Widget] Guardado Tiempo de Llamada: ${tiempoLlamadaSec}s`);
                } catch (err) {
                    console.error('Error al guardar Tiempo de Llamada desde widget:', err);
                }
            }

            // Iniciar compra en la aplicación principal (esto actualizará el estado de la BD)
            if (startClient) {
                await startClient(employeeId);
            }

            setCurrentState(2);
        }
        else if (currentState === 2) {
            // Al hacer clic en "Finalizar Compra", mostramos el selector de tipo de compra
            setShowTypeSelector(true);
        }
    };

    // Confirmar y guardar la compra con un tipo específico
    const handleConfirmPurchase = async (type, reason = '') => {
        const now = Date.now();
        const startClientTime = clientSessions[employeeId] || timestamps.horaInicioCompra || now;
        const tiempoAtencionSec = Math.max(0, Math.floor((now - startClientTime) / 1000));

        setTimestamps({
            horaLibre: now,
            horaLlamada: null,
            horaInicioCompra: null,
            horaFinCompra: now
        });

        setLastDurations(prev => ({
            ...prev,
            tiempoAtencion: tiempoAtencionSec
        }));

        setShowTypeSelector(false);

        // REGISTRO REAL EN LA BASE DE DATOS: Llamamos a endClient de la aplicación principal.
        // Esto automáticamente:
        // 1. Calcula la duración del cliente en base a la hora de inicio de la sesión.
        // 2. Incrementa el contador del tipo en la base de datos (daily_groups).
        // 3. Registra el log del tipo en transaction_logs.
        // 4. Actualiza la experiencia, nivel y monedas de gamificación del empleado.
        // 5. Finaliza la sesión activa del cliente (clientStartTime = null) en la base de datos.
        if (endClient) {
            try {
                await endClient(employeeId, type, reason);
                console.log(`[Widget] Compra finalizada de tipo: ${type} (${tiempoAtencionSec}s)`);
            } catch (err) {
                console.error('Error al finalizar compra desde el widget:', err);
            }
        }

        setCurrentState(0);
    };

    return {
        currentState,
        setCurrentState,
        timestamps,
        lastDurations,
        showTypeSelector,
        setShowTypeSelector,
        handleNextState,
        handleConfirmPurchase
    };
};
