import { useEffect, useRef } from 'react';

/**
 * useKeepAlive — Anti-sleep hook para Render Free Tier
 *
 * Problema: Render duerme los servicios gratuitos tras 15 min sin peticiones HTTP.
 * Solución: Cuando hay un usuario logueado y la pestaña está visible, hacemos un
 * ping silencioso a /api/ping cada PING_INTERVAL_MS. Cuando la pestaña se oculta
 * (usuario minimiza o cambia de pestaña) el ping se pausa para no gastar datos.
 *
 * Consumo estimado: 1 req cada 10 min × 0.2 KB ≈ insignificante.
 * El servidor también tiene su propio self-ping, así que esto es capa doble.
 */

const PING_INTERVAL_MS  = 10 * 60 * 1000; // 10 minutos entre pings
const PING_TIMEOUT_MS   = 8000;            // Abortar si tarda más de 8 s

export function useKeepAlive(isLoggedIn) {
    const intervalRef  = useRef(null);
    const abortRef     = useRef(null);
    const isActiveRef  = useRef(!document.hidden);

    const clearKeepAlive = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    };

    const doPing = async () => {
        // No pingear si la pestaña está oculta (el servidor tiene su propio ping)
        if (!isActiveRef.current) return;

        try {
            abortRef.current = new AbortController();
            const timeout = setTimeout(() => abortRef.current?.abort(), PING_TIMEOUT_MS);
            await fetch('/api/ping', {
                method: 'GET',
                signal: abortRef.current.signal,
                cache: 'no-store'
            });
            clearTimeout(timeout);
        } catch {
            // Silencioso: no mostrar errores al usuario por un ping fallido
        }
    };

    useEffect(() => {
        if (!isLoggedIn) {
            clearKeepAlive();
            return;
        }

        // Iniciar ciclo de pings
        clearKeepAlive();
        intervalRef.current = setInterval(doPing, PING_INTERVAL_MS);

        // Pausar / reanudar según visibilidad de la pestaña
        const onVisibilityChange = () => {
            isActiveRef.current = !document.hidden;
            if (!document.hidden) {
                // La pestaña vuelve a estar activa: ping inmediato para "despertar" el servidor
                doPing();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearKeepAlive();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);
}