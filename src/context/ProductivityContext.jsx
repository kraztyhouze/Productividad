import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from './StoreContext'; // Importar hook del store

const ProductivityContext = createContext(null);

export const ProductivityProvider = ({ children }) => {
    const { currentStore } = useStore(); // Get current store explicitly

    // Helper for Local Date (YYYY-MM-DD) - Forced to Madrid to match Server
    const formatLocal = (d) => {
        return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
    };

    // --- STATE ---
    const [activeSessions, setActiveSessions] = useState([]);
    const [dailyRecords, setDailyRecords] = useState([]);
    const [dailyGroups, setDailyGroups] = useState({});
    const [closedDays, setClosedDays] = useState([]);
    const [dayIncidents, setDayIncidents] = useState({});
    const [productFamilies, setProductFamilies] = useState([]);
    const [transactionLogs, setTransactionLogs] = useState([]);
    const [goldPrice, setGoldPrice] = useState('0'); // Default to 0 or safe string

    // Helper for Multi-Store Headers
    const getHeaders = () => {
        // Use currentStore from context if available, otherwise fallback/localStorage. 
        // Sync with what useStore provides is safer.
        const storeId = currentStore || localStorage.getItem('tiktak_current_store') || 'store_1';
        return {
            'Content-Type': 'application/json',
            'x-store-id': storeId
        };
    };

    const getFetchOptions = () => ({
        headers: getHeaders(),
        cache: 'no-store' // CRITICAL: Prevent browser from reusing data from Store A when switching to Store B
    });

    // --- LOAD DATA ---
    const fetchData = async () => {
        try {
            const options = getFetchOptions();
            const res = await fetch('/api/sync/productivity', options);
            if (!res.ok) throw new Error('Sync failed');

            const data = await res.json();

            // SANIZE AND DEDUPLICATE ACTIVE SESSIONS
            const rawSessions = data.activeSessions || [];
            const sanitizedSessions = [];
            const seenIds = new Set();
            rawSessions.forEach(s => {
                const cid = String(s.employeeId || '').trim();
                if (cid && !seenIds.has(cid)) {
                    sanitizedSessions.push({ ...s, employeeId: cid });
                    seenIds.add(cid);
                }
            });
            setActiveSessions(sanitizedSessions);

            // SANIZE DAILY RECORDS
            setDailyRecords((data.dailyRecords || []).map(r => ({
                ...r,
                employeeId: String(r.employeeId || '').trim()
            })));

            // NORMALIZE DAILY GROUPS KEYS (Fix for "JMH/RML Mixup")
            const rawGroups = data.dailyGroups || {};
            const normalizedGroups = {};
            Object.keys(rawGroups).forEach(k => {
                // k format: "{ID}-{YYYY}-{MM}-{DD}" or "{ID}-{DATE}"
                // Split carefully
                const parts = k.split('-');
                if (parts.length >= 4) {
                    const datePart = parts.slice(-3).join('-');
                    const idPart = parts.slice(0, -3).join('-');
                    const cleanId = String(parseInt(idPart) || idPart).trim(); // Attempt clean numeric ID

                    const newKey = `${cleanId}-${datePart}`;
                    // Merge if duplicate (sum up) to avoid data loss
                    if (normalizedGroups[newKey]) {
                        normalizedGroups[newKey] = {
                            standard: (normalizedGroups[newKey].standard || 0) + (rawGroups[k].standard || 0),
                            jewelry: (normalizedGroups[newKey].jewelry || 0) + (rawGroups[k].jewelry || 0),
                            recoverable: (normalizedGroups[newKey].recoverable || 0) + (rawGroups[k].recoverable || 0),
                            noDeal: (normalizedGroups[newKey].noDeal || 0) + (rawGroups[k].noDeal || 0),
                            clientSeconds: (normalizedGroups[newKey].clientSeconds || 0) + (rawGroups[k].clientSeconds || 0)
                        };
                    } else {
                        normalizedGroups[newKey] = rawGroups[k];
                    }
                } else {
                    normalizedGroups[k] = rawGroups[k];
                }
            });
            setDailyGroups(normalizedGroups);

            setClosedDays(data.closedDays || []);
            setDayIncidents(data.dayIncidents || {});
            setProductFamilies(data.productFamilies || []);
            setTransactionLogs(data.transactionLogs || []);
        } catch (error) {
            console.error("Error loading sync data:", error);
        }
    };

    // --- EFFECT: STORE CHANGED or MOUNT ---
    useEffect(() => {
        // 1. Wipe clean old store data
        setActiveSessions([]);
        setDailyRecords([]);
        setDailyGroups({});
        setClosedDays([]);
        setDayIncidents({});
        setProductFamilies([]);
        setTransactionLogs([]);

        // 2. Load new store data
        if (currentStore) {
            fetchData();
            fetchInternalGold();
        }
    }, [currentStore]); // Dependencies: Re-run ONLY when store changes

    // --- GOLD PRICE LOGIC ---
    const fetchInternalGold = async () => {
        try {
            const res = await fetch('/api/settings/gold', {
                headers: getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setGoldPrice(data.price);
            }
        } catch (e) { console.error("Error fetching internal gold price", e); }
    };

    const updateGoldPrice = async (newPrice) => {
        try {
            await fetch('/api/settings/gold', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ price: newPrice })
            });
            setGoldPrice(newPrice);
        } catch (e) {
            console.error("Error updating gold price", e);
            throw e;
        }
    };

    // --- EFFECT: POLLING ---
    useEffect(() => {
        if (!currentStore) return;

        const interval = setInterval(() => {
            // Only poll if tab is active to save egress
            if (document.visibilityState === 'visible') {
                fetchData();
                fetchInternalGold();
            }
        }, 30000); // Increased from 5s to 30s for bandwidth optimization

        // Also fetch immediately when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchData();
                fetchInternalGold();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentStore]);

    // --- ACTIONS ---

    const startSession = async (employeeId, employeeName) => {
        const idStr = String(employeeId).trim();
        if (activeSessions.find(s => String(s.employeeId).trim() === idStr)) return;

        const newSession = {
            employeeId: idStr,
            employeeName,
            startTime: new Date().toISOString(),
            clientStartTime: null
        };

        // Optimistic update
        setActiveSessions(prev => [...prev, newSession]);

        try {
            await fetch('/api/active-sessions', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newSession)
            });
        } catch (err) {
            console.error("Error starting session", err);
        }
    };

    const toggleClientSession = async (employeeId, isStarting) => {
        const idStr = String(employeeId).trim();

        // Find current session to get start time if stopping
        const currentSession = activeSessions.find(s => String(s.employeeId).trim() === idStr);
        const startTime = isStarting ? new Date().toISOString() : null;

        // If stopping, log the transaction
        if (!isStarting && currentSession && currentSession.clientStartTime) {
            const endTime = new Date().toISOString();
            // Log for stats
            try {
                await fetch('/api/transaction-logs', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        employeeId: idStr,
                        startTime: currentSession.clientStartTime,
                        endTime,
                        type: 'shopping',
                        details: JSON.stringify({ action: 'manual_stop' })
                    })
                });
            } catch (err) { console.error('Error logging transaction:', err); }
        }

        setActiveSessions(prev => prev.map(s =>
            String(s.employeeId).trim() === idStr ? { ...s, clientStartTime: startTime } : s
        ));

        try {
            await fetch(`/api/active-sessions/${idStr}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ clientStartTime: startTime })
            });
        } catch (err) { console.error(err); }
    };

    const endSession = async (employeeId) => {
        const idStr = String(employeeId).trim();
        const sessionIndex = activeSessions.findIndex(s => String(s.employeeId).trim() === idStr);
        if (sessionIndex === -1) return;

        const session = activeSessions[sessionIndex];
        const endTime = new Date();
        const startTime = new Date(session.startTime);

        // If they were shopping, log that transaction too
        if (session.clientStartTime) {
            try {
                await fetch('/api/transaction-logs', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        employeeId: idStr,
                        startTime: session.clientStartTime,
                        endTime: endTime.toISOString(),
                        type: 'shopping',
                        details: JSON.stringify({ action: 'shift_end_auto_stop' })
                    })
                });
            } catch (err) { console.error('Error logging closing transaction:', err); }
        }

        const durationSeconds = (endTime - startTime) / 1000;

        const record = {
            id: Date.now(),
            employeeId: idStr,
            employeeName: session.employeeName,
            startTime: session.startTime,
            endTime: endTime.toISOString(),
            durationSeconds: isNaN(durationSeconds) ? 0 : Math.max(0, durationSeconds), // Prevent NaN and Negative
            date: formatLocal(new Date()), // Use Local Date
            groups: 0
        };

        // Safety check: If duration is 0, warn but allow (maybe they clicked unintentionally)
        if (record.durationSeconds === 0) {
            console.warn(`[Productivity] Session ended with 0 duration. Start: ${session.startTime}, End: ${endTime.toISOString()}`);
            // Optional: Set a minimum of 1s if valid start time?
            if (session.startTime) record.durationSeconds = 1;
        }

        // Optimistic UI
        const newSessions = [...activeSessions];
        newSessions.splice(sessionIndex, 1);
        setActiveSessions(newSessions);
        setDailyRecords(prev => [record, ...prev]);

        try {
            await Promise.all([
                fetch(`/api/active-sessions/${idStr}`, { method: 'DELETE', headers: getHeaders() }),
                fetch('/api/daily-records', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(record)
                })
            ]);
        } catch (err) {
            console.error("Error ending session", err);
        }
    };

    const cancelSession = async (employeeId) => {
        const idStr = String(employeeId).trim();
        const sessionIndex = activeSessions.findIndex(s => String(s.employeeId).trim() === idStr);
        if (sessionIndex === -1) return;

        // Optimistic UI
        const newSessions = [...activeSessions];
        newSessions.splice(sessionIndex, 1);
        setActiveSessions(newSessions);

        try {
            await fetch(`/api/active-sessions/${idStr}`, { method: 'DELETE', headers: getHeaders() });
        } catch (err) {
            console.error("Error canceling session", err);
        }
    };

    const updateDailyGroups = async (employeeId, date, updates) => {
        // SANITIZE ID: ensure it is a clean string (e.g. " 55 " -> "55")
        const cleanId = String(parseInt(employeeId) || employeeId).trim();
        const key = `${cleanId}-${date}`;

        // 1. Calculate newState safely using current scope state (or default)
        const current = dailyGroups[key] || { standard: 0, jewelry: 0, recoverable: 0, noDeal: 0, clientSeconds: 0 };
        const newState = { ...current, ...updates };

        // 2. Optimistic Update
        setDailyGroups(prev => ({ ...prev, [key]: newState }));

        try {
            const res = await fetch('/api/daily-groups', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ key, data: newState })
            });
            if (res.ok) return await res.json();
        } catch (err) {
            console.error("Error updating groups", err);
        }
    };

    const updateRecord = async (recordId, newDurationSeconds) => {
        setDailyRecords(prev => prev.map(r => {
            if (r.id === recordId) return { ...r, durationSeconds: newDurationSeconds };
            return r;
        }));

        await fetch(`/api/daily-records/${recordId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ durationSeconds: newDurationSeconds })
        });
    };

    const deleteRecord = async (recordId) => {
        setDailyRecords(prev => prev.filter(r => r.id !== recordId));
        await fetch(`/api/daily-records/${recordId}`, { method: 'DELETE', headers: getHeaders() });
    };

    const addManualRecord = async (record) => {
        setDailyRecords(prev => [record, ...prev]);
        await fetch('/api/daily-records', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(record)
        });
    };

    const updateEmployeeShiftTime = async (employeeId, date, newTotalSeconds) => {
        const idStr = String(employeeId).trim();

        const employeeRecords = dailyRecords.filter(r => String(r.employeeId).trim() === idStr && r.date === date);
        const activeSession = formatLocal(new Date()) === date ? activeSessions.find(s => String(s.employeeId).trim() === idStr) : null;
        const activeDuration = activeSession ? (new Date() - new Date(activeSession.startTime)) / 1000 : 0;
        const currentClosedTotal = employeeRecords.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);

        const targetClosedTotal = Math.max(0, newTotalSeconds - activeDuration);

        if (employeeRecords.length === 0) {
            if (activeSession) {
                const newStartTime = new Date(Date.now() - newTotalSeconds * 1000).toISOString();
                setActiveSessions(prev => prev.map(s => String(s.employeeId).trim() === idStr ? { ...s, startTime: newStartTime } : s));
                try {
                    await fetch(`/api/active-sessions/${idStr}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ startTime: newStartTime }) });
                } catch (e) { console.error(e); }
            } else {
                console.warn('No records found for employee on this date');
            }
            return;
        }

        if (currentClosedTotal === 0 && targetClosedTotal > 0) {
            console.warn('Current closed total is 0, cannot proportionally adjust');
            return;
        }

        const scaleFactor = targetClosedTotal === 0 ? 0 : targetClosedTotal / currentClosedTotal;
        const updates = employeeRecords.map(record => ({
            id: record.id,
            newDuration: Math.round((record.durationSeconds || 0) * scaleFactor)
        }));

        setDailyRecords(prev => prev.map(r => {
            const update = updates.find(u => u.id === r.id);
            if (update) return { ...r, durationSeconds: update.newDuration };
            return r;
        }));

        try {
            await Promise.all(updates.map(({ id, newDuration }) =>
                fetch(`/api/daily-records/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ durationSeconds: newDuration }) })
            ));
            fetchData();
        } catch (err) {
            console.error('Error updating shift time:', err);
            fetchData();
        }
    };

    const updateDayIncident = async (date, text) => {
        setDayIncidents(prev => ({ ...prev, [date]: text }));
        await fetch('/api/day-incidents', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ date, text })
        });
    };

    const closeDay = async (date, details = {}) => {
        if (!closedDays.includes(date)) {
            setClosedDays(prev => [...prev, date]);
            try {
                await fetch('/api/closed-days', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        date,
                        total_groups: details.total_groups || 0,
                        users_report: details.users_report || '[]',
                        observation: details.observation || '',
                        max_concurrent: details.max_concurrent || 0
                    })
                });
                fetchData(); // Non-blocking sync
            } catch (err) { console.error(err); fetchData(); }
        }
    };

    const reopenDay = async (date) => {
        // Optimistic
        setClosedDays(prev => prev.filter(d => d !== date));

        try {
            console.log(`Attempting to reopen day: ${date}`);
            const res = await fetch(`/api/closed-days/${date}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to reopen day');
            }
            // Success
            await fetchData();
        } catch (err) {
            console.error("Reopen failed:", err);
            alert(`Error al reabrir el día: ${err.message}`);
            fetchData(); // Revert
        }
    };

    const deleteEmployeeDayData = async (employeeId, date) => {
        const idStr = String(employeeId).trim();

        try {
            // 1. If Today, remove active session immediately
            const isToday = formatLocal(new Date()) === date;
            if (isToday) {
                // Optimistic local update
                setActiveSessions(prev => prev.filter(s => String(s.employeeId).trim() !== idStr));
                await fetch(`/api/active-sessions/${idStr}`, { method: 'DELETE', headers: getHeaders() });
            }

            // 2. Identify and remove records locally & remotely
            const recordsToDelete = dailyRecords.filter(r => String(r.employeeId).trim() === idStr && r.date === date);
            const recordIds = recordsToDelete.map(r => r.id);
            setDailyRecords(prev => prev.filter(r => !(String(r.employeeId).trim() === idStr && r.date === date)));

            await Promise.all(recordIds.map(id => fetch(`/api/daily-records/${id}`, { method: 'DELETE', headers: getHeaders() })));

            // 3. Remove Daily Groups
            const groupKey = `${idStr}-${date}`;
            const newGroups = { ...dailyGroups };
            delete newGroups[groupKey];
            setDailyGroups(newGroups);

            await fetch(`/api/daily-groups/${groupKey}`, { method: 'DELETE', headers: getHeaders() });

            // 4. Remove Transaction Logs locally and recursively delete
            setTransactionLogs(prev => prev.filter(l => !(String(l.employee_id).trim() === idStr && String(l.start_time).startsWith(date))));
            await fetch(`/api/transaction-logs/employee/${idStr}/${date}`, { method: 'DELETE', headers: getHeaders() });

            // 5. Force Sync
            await fetchData();

        } catch (err) {
            console.error("Error deleting employee day data", err);
            // On error, we should re-fetch to ensure UI matches server
            fetchData();
        }
    };

    const getUnclosedPastDays = () => {
        const today = formatLocal(new Date());
        const allDates = [...new Set(dailyRecords.map(r => r.date))];
        return allDates.filter(d => d < today && !closedDays.includes(d)).sort();
    };

    const addProductFamily = async (name, type, date) => {
        // Optimistic
        const tempId = Date.now();
        const newFam = { id: tempId, name, type, date };
        setProductFamilies(prev => [...prev, newFam]);

        try {
            const res = await fetch('/api/product-families', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name, type, date })
            });
            if (res.ok) {
                const realFam = await res.json();
                setProductFamilies(prev => prev.map(f => f.id === tempId ? realFam : f));
            }
        } catch (err) { console.error(err); }
    };

    const removeProductFamily = async (id) => {
        setProductFamilies(prev => prev.filter(f => f.id !== id));
        await fetch(`/api/product-families/${id}`, { method: 'DELETE', headers: getHeaders() });
    };

    return (
        <ProductivityContext.Provider value={{
            activeSessions,
            dailyRecords,
            startSession,
            endSession,
            cancelSession,
            toggleClientSession,
            dailyGroups,
            updateDailyGroups,
            closedDays,
            closeDay,
            reopenDay,
            dayIncidents,
            updateDayIncident,
            updateRecord,
            deleteRecord,
            addManualRecord,
            updateEmployeeShiftTime,
            getUnclosedPastDays,
            deleteEmployeeDayData,
            productFamilies,
            addProductFamily,
            removeProductFamily,
            addNoDealDetail: async (data) => {
                try {
                    await fetch('/api/no-deals', {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify(data)
                    });
                } catch (err) { console.error(err); }
            },
            deleteNoDeal: async (id) => {
                try {
                    await fetch(`/api/no-deals/${id}`, { method: 'DELETE', headers: getHeaders() });
                    fetchData(); // Sync states (both noDeals list and groups counts)
                } catch (err) { console.error(err); }
            },
            transactionLogs, // Exposed for Timeline
            goldPrice,
            updateGoldPrice,
            logTransaction: async (employeeId, startTime, endTime, type, details) => {
                try {
                    const res = await fetch('/api/transaction-logs', {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify({ employeeId, startTime, endTime, type, details })
                    });
                    if (res.ok) {
                        const logged = await res.json();
                        fetchData(); // Refresh UI state immediately
                        return logged;
                    }
                } catch (err) { console.error('Error logging transaction:', err); }
            },
            
            // --- ADMINISTRATIVE ACTIONS (MANAGER ONLY) ---
            adminActions: {
                updateTransaction: async (id, data) => {
                    const res = await fetch(`/api/gerencia/transactions/${id}`, {
                        method: 'PUT',
                        headers: { ...getHeaders(), 'x-user-role': 'Gerente' },
                        body: JSON.stringify(data)
                    });
                    if (res.ok) { fetchData(); return true; }
                    return false;
                },
                deleteTransaction: async (id) => {
                    const res = await fetch(`/api/gerencia/transactions/${id}`, {
                        method: 'DELETE',
                        headers: { ...getHeaders(), 'x-user-role': 'Gerente' }
                    });
                    if (res.ok) { fetchData(); return true; }
                    return false;
                },
                approveCashControl: async (id) => {
                    const res = await fetch(`/api/gerencia/cash-control/${id}/approve`, {
                        method: 'PUT',
                        headers: { ...getHeaders(), 'x-user-role': 'Gerente' }
                    });
                    return res.ok;
                },
                reopenCashControl: async (id) => {
                    const res = await fetch(`/api/gerencia/cash-control/${id}/reopen`, {
                        method: 'PUT',
                        headers: { ...getHeaders(), 'x-user-role': 'Gerente' }
                    });
                    return res.ok;
                },
                grantBonusXP: async (employeeId, xp, reason) => {
                    const res = await fetch('/api/gamification/grant-reward', {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify({ employeeId, xp, reason })
                    });
                    return res.ok;
                }
            }
        }}>
            {children}
        </ProductivityContext.Provider>
    );
};

export const useProductivity = () => useContext(ProductivityContext);
