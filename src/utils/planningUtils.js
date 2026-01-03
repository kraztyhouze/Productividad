export const formatDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const doesTaskOccurOnDate = (task, date) => {
    const dateKey = formatDateKey(date);

    // 1. Single Task
    if (!task.recurrence) {
        return task.date === dateKey;
    }

    // 2. Recurring Task
    const r = task.recurrence;
    const taskStart = new Date(task.startDate);

    // Check Start Bound
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    taskStart.setHours(0, 0, 0, 0);

    if (checkDate < taskStart) return false;

    // Check End Bound
    if (r.endDate) {
        const taskEnd = new Date(r.endDate);
        taskEnd.setHours(0, 0, 0, 0);
        if (checkDate > taskEnd) return false;
    }

    // Check Rules
    if (r.type === 'weekly') {
        const day = checkDate.getDay(); // 0-6
        return r.weekDays && r.weekDays.includes(day);
    }

    if (r.type === 'monthly') {
        if (r.monthlyType === 'day') {
            return checkDate.getDate() === parseInt(r.monthlyDay);
        }
        if (r.monthlyType === 'relative') {
            const day = checkDate.getDay();
            if (day !== parseInt(r.monthlyWeekday)) return false;

            const d = checkDate.getDate();
            const weekNum = Math.ceil(d / 7);

            if (parseInt(r.monthlyOrdinal) === 5) { // Last
                const nextWeek = new Date(checkDate);
                nextWeek.setDate(d + 7);
                return nextWeek.getMonth() !== checkDate.getMonth();
            }
            return weekNum === parseInt(r.monthlyOrdinal);
        }
    }

    if (r.type === 'yearly') {
        return checkDate.getDate() === taskStart.getDate() && checkDate.getMonth() === taskStart.getMonth();
    }

    return false;
};

export const getPriorityColor = (type) => {
    if (type === 'critical') return 'border-red-500/30 bg-red-500/10 text-red-100 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]';
    if (type === 'priority') return 'border-amber-500/30 bg-amber-500/10 text-amber-100 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]';
    return 'border-white/5 bg-[#1e293b]/60 text-slate-300 shadow-lg';
};

export const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};
