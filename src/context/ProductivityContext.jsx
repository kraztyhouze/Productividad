import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductivityContext = createContext(null);

export const ProductivityProvider = ({ children }) => {
    // --- STATE ---
    const [activeSessions, setActiveSessions] = useState([]);
    const [dailyRecords, setDailyRecords] = useState([]);
    const [dailyGroups, setDailyGroups] = useState({});
    const [closedDays, setClosedDays] = useState([]);
    const [dayIncidents, setDayIncidents] = useState({});
    const [productFamilies, setProductFamilies] = useState([]);

    // --- LOAD DATA ---
    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                fetch('/api/active-sessions'),
                fetch('/api/daily-records'),
                fetch('/api/daily-groups'),
                fetch('/api/closed-days'),
                fetch('/api/day-incidents'),
                fetch('/api/product-families')
            ]);

            const [sessionsRes, recordsRes, groupsRes, closedRes, incidentsRes, familiesRes] = results;

            if (sessionsRes.status === 'fulfilled' && sessionsRes.value.ok) setActiveSessions(await sessionsRes.value.json());
            if (recordsRes.status === 'fulfilled' && recordsRes.value.ok) setDailyRecords(await recordsRes.value.json());
            if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) setDailyGroups(await groupsRes.value.json());
            if (closedRes.status === 'fulfilled' && closedRes.value.ok) {
                const closedData = await closedRes.value.json();
                setClosedDays(closedData.map(d => d.date));
            }
            if (incidentsRes.status === 'fulfilled' && incidentsRes.value.ok) setDayIncidents(await incidentsRes.value.json());
            if (familiesRes.status === 'fulfilled' && familiesRes.value.ok) setProductFamilies(await familiesRes.value.json());
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };


    useEffect(() => {
        fetchData();
        // Polling every 5 seconds to keep in sync
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- ACTIONS ---

    const startSession = async (employeeId, employeeName) => {
        const idStr = String(employeeId);
        if (activeSessions.find(s => String(s.employeeId) === idStr)) return;

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSession)
            });
        } catch (err) {
            console.error("Error starting session", err);
        }
    };

    const toggleClientSession = async (employeeId, isStarting) => {
        const idStr = String(employeeId);
        const startTime = isStarting ? new Date().toISOString() : null;

        setActiveSessions(prev => prev.map(s =>
            String(s.employeeId) === idStr ? { ...s, clientStartTime: startTime } : s
        ));

        try {
            await fetch(`/api/active-sessions/${idStr}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientStartTime: startTime })
            });
        } catch (err) { console.error(err); }
    };

    const endSession = async (employeeId) => {
        const idStr = String(employeeId);
        const sessionIndex = activeSessions.findIndex(s => String(s.employeeId) === idStr);
        if (sessionIndex === -1) return;

        const session = activeSessions[sessionIndex];
        const endTime = new Date();
        const startTime = new Date(session.startTime);
        const durationSeconds = (endTime - startTime) / 1000;

        const record = {
            id: Date.now(),
            employeeId: idStr,
            employeeName: session.employeeName,
            startTime: session.startTime,
            endTime: endTime.toISOString(),
            durationSeconds: durationSeconds,
            date: new Date().toISOString().split('T')[0],
            groups: 0
        };

        // Optimistic UI
        const newSessions = [...activeSessions];
        newSessions.splice(sessionIndex, 1);
        setActiveSessions(newSessions);
        setDailyRecords(prev => [record, ...prev]);

        try {
            await Promise.all([
                fetch(`/api/active-sessions/${idStr}`, { method: 'DELETE' }),
                fetch('/api/daily-records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(record)
                })
            ]);
        } catch (err) {
            console.error("Error ending session", err);
        }
    };

    const updateDailyGroups = async (employeeId, date, updates) => {
        const key = `${employeeId}-${date}`;

        let newState = {};
        setDailyGroups(prev => {
            const current = prev[key];
            const safeCurrent = typeof current === 'number'
                ? { standard: current, jewelry: 0, recoverable: 0 }
                : (current || { standard: 0, jewelry: 0, recoverable: 0 });

            const safeUpdates = typeof updates === 'number'
                ? { standard: updates }
                : updates;

            newState = { ...safeCurrent, ...safeUpdates };
            return { ...prev, [key]: newState };
        });

        try {
            await fetch('/api/daily-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, data: newState })
            });
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationSeconds: newDurationSeconds })
        });
    };

    const deleteRecord = async (recordId) => {
        setDailyRecords(prev => prev.filter(r => r.id !== recordId));
        await fetch(`/api/daily-records/${recordId}`, { method: 'DELETE' });
    };

    const addManualRecord = async (record) => {
        setDailyRecords(prev => [record, ...prev]);
        await fetch('/api/daily-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
    };

    const updateDayIncident = async (date, text) => {
        setDayIncidents(prev => ({ ...prev, [date]: text }));
        await fetch('/api/day-incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, text })
        });
    };

    const closeDay = async (date, details = {}) => {
        if (!closedDays.includes(date)) {
            setClosedDays(prev => [...prev, date]);
            try {
                await fetch('/api/closed-days', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
            const res = await fetch(`/api/closed-days/${date}`, { method: 'DELETE' });
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
        const idStr = String(employeeId);

        try {
            // 1. If Today, remove active session immediately
            const isToday = new Date().toISOString().split('T')[0] === date;
            if (isToday) {
                // Optimistic local update
                setActiveSessions(prev => prev.filter(s => String(s.employeeId) !== idStr));
                await fetch(`/api/active-sessions/${idStr}`, { method: 'DELETE' });
            }

            // 2. Identify and remove records locally & remotely
            const recordsToDelete = dailyRecords.filter(r => String(r.employeeId) === idStr && r.date === date);
            const recordIds = recordsToDelete.map(r => r.id);
            setDailyRecords(prev => prev.filter(r => !(String(r.employeeId) === idStr && r.date === date)));

            await Promise.all(recordIds.map(id => fetch(`/api/daily-records/${id}`, { method: 'DELETE' })));

            // 3. Remove Daily Groups
            const groupKey = `${idStr}-${date}`;
            const newGroups = { ...dailyGroups };
            delete newGroups[groupKey];
            setDailyGroups(newGroups);

            await fetch(`/api/daily-groups/${groupKey}`, { method: 'DELETE' });

            // 4. Force Sync
            await fetchData();

        } catch (err) {
            console.error("Error deleting employee day data", err);
            // On error, we should re-fetch to ensure UI matches server
            fetchData();
        }
    };

    const getUnclosedPastDays = () => {
        const today = new Date().toISOString().split('T')[0];
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
                headers: { 'Content-Type': 'application/json' },
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
        await fetch(`/api/product-families/${id}`, { method: 'DELETE' });
    };

    return (
        <ProductivityContext.Provider value={{
            activeSessions,
            dailyRecords,
            startSession,
            endSession,
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
            getUnclosedPastDays,
            deleteEmployeeDayData,
            productFamilies,
            addProductFamily,
            removeProductFamily,
            addNoDealDetail: async (data) => {
                try {
                    await fetch('/api/no-deals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } catch (err) { console.error(err); }
            },
            deleteNoDeal: async (id) => {
                try {
                    await fetch(`/api/no-deals/${id}`, { method: 'DELETE' });
                    fetchData(); // Sync states (both noDeals list and groups counts)
                } catch (err) { console.error(err); }
            }
        }}>
            {children}
        </ProductivityContext.Provider>
    );
};

export const useProductivity = () => useContext(ProductivityContext);
