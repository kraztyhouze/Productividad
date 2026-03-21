import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '../context/StoreContext';
import { parseISO, format } from 'date-fns';

/**
 * useAgenda Hook
 * Manages the task scheduling system, notifications, and agenda-specific state.
 */
export const useAgenda = (initialTasks = []) => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const [tasks, setTasks] = useState(initialTasks);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Scheduler for browser notifications
    useEffect(() => {
        if (!("Notification" in window)) return;
        
        const requestPermission = async () => {
            const permission = await Notification.requestPermission();
            if (permission === "granted") console.log("Notificaciones autorizadas.");
        };

        if (Notification.permission === "default") requestPermission();

        const interval = setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.status === 'Hecha' || !task.time) return;
                
                const taskDate = parseISO(task.date);
                const [h, m] = task.time.split(':');
                taskDate.setHours(parseInt(h), parseInt(m), 0);
                
                const diffMinutes = Math.floor((taskDate - now) / 60000);
                
                if (diffMinutes === 15) {
                    new Notification("TikTak Agenda: Próxima Tarea", {
                        body: `${task.title} - Comienza en 15 min.`,
                        icon: '/logo192.png'
                    });
                }
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [tasks]);

    const saveTask = async (taskData) => {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-store-id': currentStore 
                },
                body: JSON.stringify(taskData)
            });
            if (res.ok) {
                const newTask = await res.json();
                setTasks(prev => [...prev, newTask]);
                return { success: true, task: newTask };
            }
        } catch (err) {
            console.error("Save task error:", err);
        }
        return { success: false };
    };

    const toggleTaskStatus = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'Hecha' ? 'Pendiente' : 'Hecha';
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-store-id': currentStore 
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
                return true;
            }
        } catch (err) {
            console.error("Update task error:", err);
        }
        return false;
    };

    return {
        tasks,
        setTasks,
        saveTask,
        toggleTaskStatus
    };
};
