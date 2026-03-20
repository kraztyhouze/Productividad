import { useState, useEffect, useCallback, useRef } from 'react';

export const useMeetingDraft = (employeeId, interviewerId) => {
    const [draft, setDraft] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimer = useRef(null);

    // Load draft from server
    useEffect(() => {
        if (!employeeId) return;

        const loadDraft = async () => {
            try {
                const res = await fetch(`/api/gerencia/meetings/draft/${employeeId}`, {
                    headers: { 'x-user-role': 'Gerente' }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.data) {
                        setDraft(data.data);
                    } else {
                        setDraft({}); // New draft
                    }
                }
            } catch (err) {
                console.error('Error loading draft:', err);
                setDraft({});
            }
        };

        loadDraft();
    }, [employeeId]);

    // Handle Autosave (Debounced)
    const saveToServer = useCallback(async (currentData) => {
        if (!employeeId || !currentData) return;
        setIsSaving(true);
        try {
            await fetch('/api/gerencia/meetings/draft', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-role': 'Gerente' 
                },
                body: JSON.stringify({
                    employee_id: employeeId,
                    interviewer_id: interviewerId,
                    data: currentData
                })
            });
        } catch (err) {
            console.error('Error saving draft:', err);
        } finally {
            setIsSaving(false);
        }
    }, [employeeId, interviewerId]);

    const updateDraft = (updates) => {
        setDraft(prev => {
            const next = { ...prev, ...updates };
            
            // Queue save
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                saveToServer(next);
            }, 2000);

            return next;
        });
    };

    const clearDraft = async () => {
        setDraft({});
        if (saveTimer.current) clearTimeout(saveTimer.current);
        // Backend handles cleanup during finalize, 
        // but we can also have a manual clear if needed.
    };

    return { draft, updateDraft, isSaving, clearDraft };
};
