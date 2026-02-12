import React, { createContext, useContext, useState, useEffect } from 'react';

const PlanningContext = createContext(null);

export const PlanningProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [holidays, setHolidays] = useState([]);

    // --- LOAD INITIAL DATA ---
    useEffect(() => {
        const storedTasks = localStorage.getItem('is_planning_tasks');
        if (storedTasks) setTasks(JSON.parse(storedTasks));
        else {
            // Default mock tasks
            setTasks([
                { id: 1, date: '2026-01-07', title: 'Inicio Rebajas', assignedTo: ['Responsable de Ventas'], type: 'critical', color: '#ef4444', status: 'pending', completedBy: null, completedAt: null, comments: [] }
            ]);
        }

        const storedNotifications = localStorage.getItem('is_planning_notifications');
        if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

        const storedHolidays = localStorage.getItem('is_planning_holidays');
        if (storedHolidays) setHolidays(JSON.parse(storedHolidays));
    }, []);

    // --- PERSISTENCE ---
    useEffect(() => {
        if (tasks.length > 0) localStorage.setItem('is_planning_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        if (notifications.length > 0) localStorage.setItem('is_planning_notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        if (holidays.length > 0 || localStorage.getItem('is_planning_holidays')) {
            localStorage.setItem('is_planning_holidays', JSON.stringify(holidays));
        }
    }, [holidays]);


    // --- TASK ACTIONS ---
    const addTask = (task) => {
        const newTask = {
            ...task,
            id: Date.now(),
            status: 'pending',
            completedBy: null,
            completedAt: null,
            comments: [],
            completions: [] // For recurring tasks exception tracking
        };
        setTasks(prev => [...prev, newTask]);
    };

    const deleteTask = (id) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    // Standard completion (for non-recurring)
    const completeTask = (taskId, userName, comment) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                const updatedTask = {
                    ...task,
                    status: 'completed',
                    completedBy: userName,
                    completedAt: new Date().toISOString(),
                    comments: comment ? [...task.comments, {
                        id: Date.now(),
                        text: comment,
                        author: userName,
                        timestamp: new Date().toISOString()
                    }] : task.comments
                };

                // Notify
                const notification = {
                    id: Date.now(),
                    type: 'task_completed',
                    taskTitle: task.title,
                    completedBy: userName,
                    completedAt: new Date().toISOString(),
                    comment: comment,
                    read: false
                };
                setNotifications(prev => [notification, ...prev]);

                return updatedTask;
            }
            return task;
        }));
    };

    // Recurring instance completion
    const completeRecurringInstance = (taskId, dateKey, userName, comment) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                // Add exception record
                const newCompletion = {
                    date: dateKey,
                    completedBy: userName,
                    completedAt: new Date().toISOString(),
                    comments: comment ? [{ id: Date.now(), text: comment, author: userName, timestamp: new Date().toISOString() }] : []
                };

                const updatedTask = {
                    ...task,
                    completions: [...(task.completions || []), newCompletion]
                };

                const notification = {
                    id: Date.now(),
                    type: 'task_completed',
                    taskTitle: `${task.title} (${dateKey})`,
                    completedBy: userName,
                    completedAt: new Date().toISOString(),
                    comment: comment,
                    read: false
                };
                setNotifications(prev => [notification, ...prev]);

                return updatedTask;
            }
            return task;
        }));
    };

    const addCommentToTask = (taskId, userName, comment) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    comments: [...task.comments, {
                        id: Date.now(),
                        text: comment,
                        author: userName,
                        timestamp: new Date().toISOString()
                    }]
                };
            }
            return task;
        }));
    };

    // --- HOLIDAY ACTIONS ---
    const setHoliday = (date, type, name) => {
        setHolidays(prev => {
            const index = prev.findIndex(h => h.date === date);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = { date, type, name };
                return updated;
            }
            return [...prev, { date, type, name }];
        });
    };

    const removeHoliday = (date) => {
        setHolidays(prev => prev.filter(h => h.date !== date));
    };

    // --- NOTIFICATION ACTIONS ---
    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev => prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
        ));
    };

    const clearNotifications = () => {
        setNotifications([]);
        localStorage.removeItem('is_planning_notifications');
    };

    return (
        <PlanningContext.Provider value={{
            tasks, addTask, deleteTask, completeTask, completeRecurringInstance, addCommentToTask,
            notifications, markNotificationAsRead, clearNotifications,
            holidays, setHoliday, removeHoliday
        }}>
            {children}
        </PlanningContext.Provider>
    );
};

export const usePlanning = () => useContext(PlanningContext);
