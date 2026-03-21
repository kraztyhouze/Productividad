import { useState, useEffect, useCallback } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

/**
 * useGerencia Hook
 * Centralizes data fetching and core state for the Gerencia module.
 */
export const useGerencia = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    
    const [tasks, setTasks] = useState([]);
    const [partners, setPartners] = useState([]);
    const [movements, setMovements] = useState([]);
    const [cashHistory, setCashHistory] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [zones, setZones] = useState([]);
    const [auditAlerts, setAuditAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);
        
        try {
            const h = { 
                'x-store-id': currentStore,
                'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role
            };

            const [tRes, pRes, mRes, cRes, bRes, iRes, oRes, aRes, zRes, eRes] = await Promise.all([
                fetch('/api/gerencia/tasks/unified', { headers: h }),
                fetch('/api/gerencia/goldsmith/partners', { headers: h }),
                fetch('/api/gerencia/goldsmith/movements', { headers: h }),
                fetch('/api/gerencia/cash-control', { headers: h }),
                fetch('/api/task-batteries', { headers: h }),
                fetch('/api/gerencia/goldsmith/inventory', { headers: h }),
                fetch('/api/gerencia/goldsmith/orders', { headers: h }),
                fetch('/api/gerencia/audit-alerts', { headers: h }),
                fetch('/api/gerencia/store-zones', { headers: h }),
                fetch('/api/employees', { headers: h })
            ]);
            
            if (tRes.ok) setTasks(await tRes.json());
            if (pRes.ok) setPartners(await pRes.json());
            if (mRes.ok) setMovements(await mRes.json());
            if (cRes.ok) setCashHistory(await cRes.json());
            if (bRes.ok) setBatteries(await bRes.json());
            if (iRes.ok) setInventory(await iRes.json());
            if (oRes.ok) setOrders(await oRes.json());
            if (aRes.ok) setAuditAlerts(await aRes.json());
            if (zRes.ok) setZones(await zRes.json());
            if (eRes.ok) setEmployees(await eRes.json());
            
        } catch (e) { 
            console.error("Error loading Gerencia data:", e);
        } finally { 
            setLoading(false); 
            setIsRefreshing(false);
        }
    }, [currentStore, user]);

    useEffect(() => {
        if (currentStore) loadData();
    }, [currentStore, loadData]);

    return {
        tasks, setTasks,
        partners, setPartners,
        movements, setMovements,
        cashHistory, setCashHistory,
        batteries, setBatteries,
        employees, setEmployees,
        inventory, setInventory,
        orders, setOrders,
        zones, setZones,
        auditAlerts, setAuditAlerts,
        loading, isRefreshing,
        refresh: () => loadData(true)
    };
};
