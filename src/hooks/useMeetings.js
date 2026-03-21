import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '../context/StoreContext';

/**
 * useMeetings Hook
 * Handles 1:1 meetings logic, including fetching history, schedules, and managing active sessions.
 */
export const useMeetings = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    
    const [history, setHistory] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadMeetings = useCallback(async () => {
        if (!currentStore) return;
        setLoading(true);
        try {
            const h = { 'x-store-id': currentStore };
            const [hRes, sRes, cRes] = await Promise.all([
                fetch('/api/gerencia/meetings/history/all', { headers: h }),
                fetch('/api/gerencia/meetings/schedules', { headers: h }),
                fetch('/api/gerencia/meetings/criteria', { headers: h })
            ]);
            
            if (hRes.ok) setHistory(await hRes.json());
            if (sRes.ok) setSchedules(await sRes.json());
            if (cRes.ok) setCriteria(await cRes.json());
        } catch (err) {
            console.error("Error loading meetings:", err);
        } finally {
            setLoading(false);
        }
    }, [currentStore]);

    useEffect(() => {
        loadMeetings();
    }, [loadMeetings]);

    const saveMeetingDraft = async (employeeId, draftData) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/gerencia/meetings/save-draft`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-store-id': currentStore 
                },
                body: JSON.stringify({ employeeId, draftData })
            });
            if (res.ok) setLastSaved(new Date());
        } catch (err) {
            console.error("Draft save error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const finishMeeting = async (employeeId) => {
        try {
            const res = await fetch(`/api/gerencia/meetings/finish`, {
                method: 'POST',
                headers: { 'x-store-id': currentStore },
                body: JSON.stringify({ employeeId })
            });
            if (res.ok) {
                await loadMeetings();
                setSelectedEmployee(null);
                return { success: true };
            }
        } catch (err) {
            console.error("Finish meeting error:", err);
        }
        return { success: false };
    };

    return {
        history,
        schedules,
        criteria,
        selectedEmployee,
        setSelectedEmployee,
        isSaving,
        lastSaved,
        loading,
        refresh: loadMeetings,
        saveMeetingDraft,
        finishMeeting
    };
};
