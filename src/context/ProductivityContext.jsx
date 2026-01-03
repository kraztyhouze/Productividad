import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductivityContext = createContext(null);

export const ProductivityProvider = ({ children }) => {
    // --- STATE ---
    const [activeSessions, setActiveSessions] = useState([]);
    const [dailyRecords, setDailyRecords] = useState([]);
    const [dailyGroups, setDailyGroups] = useState({});
    const [closedDays, setClosedDays] = useState([]);
    const [dayIncidents, setDayIncidents] = useState({});

    // --- LOAD DATA ---
    const fetchData = async () => {
        try {
            const [sessionsRes, recordsRes, groupsRes, closedRes, incidentsRes] = await Promise.all([
                fetch('/api/active-sessions'),
                fetch('/api/daily-records'),
                fetch('/api/daily-groups'),
                fetch('/api/closed-days'),
                fetch('/api/day-incidents')
            ]);

            if (sessionsRes.ok) setActiveSessions(await sessionsRes.json());
            if (recordsRes.ok) setDailyRecords(await recordsRes.json());
            if (groupsRes.ok) setDailyGroups(await groupsRes.json());
            if (closedRes.ok) setClosedDays(await closedRes.json());
            if (incidentsRes.ok) setDayIncidents(await incidentsRes.json());
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    useEffect(() => {
        fetchData();
        // Optional: Polling every 1 minute to keep in sync with other users
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- ACTIONS ---

    const startSession = async (employeeId, employeeName) => {
        if (activeSessions.find(s => s.employeeId === employeeId)) return;

        const newSession = {
            employeeId,
            employeeName,
            startTime: new Date().toISOString()
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
            // Revert on error would go here
        }
    };

    const endSession = async (employeeId) => {
        const sessionIndex = activeSessions.findIndex(s => s.employeeId === employeeId);
        if (sessionIndex === -1) return;

        const session = activeSessions[sessionIndex];
        const endTime = new Date();
        const startTime = new Date(session.startTime);
        const durationSeconds = (endTime - startTime) / 1000;

        const record = {
            id: Date.now(), // Client-side ID mainly, DB might ignore or use it
            employeeId: session.employeeId,
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
            // 1. Remove active session
            await fetch(`/api/active-sessions/${employeeId}`, { method: 'DELETE' });
            // 2. Add record
            await fetch('/api/daily-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
        } catch (err) {
            console.error("Error ending session", err);
        }
    };

    const updateDailyGroups = async (employeeId, date, updates) => {
        const key = `${employeeId}-${date}`;

        // Calculate new state for optimistic update
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

        // API Call
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

    const closeDay = async (date) => {
        if (!closedDays.includes(date)) {
            setClosedDays(prev => [...prev, date]);
            await fetch('/api/closed-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
        }
    };

    const reopenDay = async (date) => {
        setClosedDays(prev => prev.filter(d => d !== date));
        await fetch(`/api/closed-days/${date}`, { method: 'DELETE' });
    };

    const getUnclosedPastDays = () => {
        const today = new Date().toISOString().split('T')[0];
        const allDates = [...new Set(dailyRecords.map(r => r.date))];
        return allDates.filter(d => d < today && !closedDays.includes(d)).sort();
    };

    return (
        <ProductivityContext.Provider value={{
            activeSessions,
            dailyRecords,
            startSession,
            endSession,
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
            getUnclosedPastDays
        }}>
            {children}
        </ProductivityContext.Provider>
    );
};

export const useProductivity = () => useContext(ProductivityContext);
