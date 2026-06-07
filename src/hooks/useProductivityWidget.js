import { useState } from 'react';

/**
 * Custom Hook useProductivityWidget
 * Maneja la máquina de estados y registra los Unix Timestamps para calcular los tiempos de:
 * 1. Tiempo Muerto (Estado Libre -> Estado Llamando)
 * 2. Tiempo de Espera/Llamada (Estado Llamando -> Estado En Atención)
 * 3. Tiempo de Atención/Servicio (Estado En Atención -> Estado Libre)
 */
export const useProductivityWidget = (employeeId, employeeName) => {
    const [currentState, setCurrentState] = useState(0); // 0 = Libre (Verde), 1 = Llamando (Azul), 2 = En Atención (Naranja)
    
    const [timestamps, setTimestamps] = useState({
        horaLibre: Date.now(),
        horaLlamada: null,
        horaInicioCompra: null,
        horaFinCompra: null
    });

    const [lastDurations, setLastDurations] = useState({
        tiempoMuerto: null,
        tiempoLlamada: null,
        tiempoAtencion: null
    });

    const handleNextState = async () => {
        const now = Date.now();
        
        if (currentState === 0) {
            // TRANSICIÓN: Libre -> Llamando (Se hace clic en "Llamar Siguiente Cliente")
            const tiempoMuertoSec = Math.floor((now - timestamps.horaLibre) / 1000);
            
            setTimestamps(prev => ({
                ...prev,
                horaLlamada: now
            }));
            
            setLastDurations(prev => ({
                ...prev,
                tiempoMuerto: tiempoMuertoSec
            }));

            console.log(`[Widget Productividad] Tiempo Muerto Registrado: ${tiempoMuertoSec}s`);

            // =========================================================================
            // PLACEHOLDER PARA EL DESARROLLADOR: REGISTRO DE TIEMPO MUERTO
            // =========================================================================
            // Aquí debes realizar la petición fetch/axios a la base de datos de tu tienda.
            // Ejemplo de llamada:
            // try {
            //     const response = await fetch('/api/productividad/tiempo-muerto', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({
            //             employeeId: employeeId,
            //             employeeName: employeeName,
            //             durationSeconds: tiempoMuertoSec,
            //             recordedAt: new Date(now).toISOString()
            //         })
            //     });
            //     if (response.ok) {
            //         console.log('Tiempo Muerto guardado correctamente en la BD.');
            //     }
            // } catch (error) {
            //     console.error('Error al realizar fetch de Tiempo Muerto:', error);
            // }
            // =========================================================================

            setCurrentState(1);
        }
        else if (currentState === 1) {
            // TRANSICIÓN: Llamando -> En Atención (Se hace clic en "Iniciar Compra")
            const tiempoLlamadaSec = Math.floor((now - timestamps.horaLlamada) / 1000);

            setTimestamps(prev => ({
                ...prev,
                horaInicioCompra: now
            }));

            setLastDurations(prev => ({
                ...prev,
                tiempoLlamada: tiempoLlamadaSec
            }));

            console.log(`[Widget Productividad] Tiempo de Llamada Registrado: ${tiempoLlamadaSec}s`);

            // =========================================================================
            // PLACEHOLDER PARA EL DESARROLLADOR: REGISTRO DE TIEMPO DE LLAMADA
            // =========================================================================
            // Aquí debes registrar el tiempo que transcurrió desde que se llamó al cliente
            // hasta que efectivamente se inició la compra en la caja.
            // Ejemplo de llamada:
            // try {
            //     const response = await fetch('/api/productividad/tiempo-llamada', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({
            //             employeeId: employeeId,
            //             employeeName: employeeName,
            //             durationSeconds: tiempoLlamadaSec,
            //             recordedAt: new Date(now).toISOString()
            //         })
            //     });
            //     if (response.ok) {
            //         console.log('Tiempo de Llamada guardado correctamente en la BD.');
            //     }
            // } catch (error) {
            //     console.error('Error al realizar fetch de Tiempo de Llamada:', error);
            // }
            // =========================================================================

            setCurrentState(2);
        }
        else if (currentState === 2) {
            // TRANSICIÓN: En Atención -> Libre (Se hace clic en "Finalizar Compra")
            const tiempoAtencionSec = Math.floor((now - timestamps.horaInicioCompra) / 1000);

            setTimestamps({
                horaLibre: now, // La hora libre para el siguiente ciclo comienza inmediatamente
                horaLlamada: null,
                horaInicioCompra: null,
                horaFinCompra: now
            });

            setLastDurations(prev => ({
                ...prev,
                tiempoAtencion: tiempoAtencionSec
            }));

            console.log(`[Widget Productividad] Tiempo de Atención Registrado: ${tiempoAtencionSec}s`);

            // =========================================================================
            // PLACEHOLDER PARA EL DESARROLLADOR: REGISTRO DE TIEMPO DE ATENCIÓN
            // =========================================================================
            // Aquí debes registrar el tiempo que tomó atender al cliente y completar la compra.
            // Ejemplo de llamada:
            // try {
            //     const response = await fetch('/api/productividad/tiempo-atencion', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({
            //             employeeId: employeeId,
            //             employeeName: employeeName,
            //             durationSeconds: tiempoAtencionSec,
            //             recordedAt: new Date(now).toISOString()
            //         })
            //     });
            //     if (response.ok) {
            //         console.log('Tiempo de Atención guardado correctamente en la BD.');
            //     }
            // } catch (error) {
            //     console.error('Error al realizar fetch de Tiempo de Atención:', error);
            // }
            // =========================================================================

            setCurrentState(0);
        }
    };

    return {
        currentState,
        setCurrentState,
        timestamps,
        lastDurations,
        handleNextState
    };
};
