import { format, parseISO, addWeeks, addDays, addMonths, addYears } from 'date-fns';

export const getElapsedDays = (dateStr) => {
    if (!dateStr) return 0;
    const date = parseISO(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getNextWeekDate = (dateStr) => {
    const date = dateStr ? parseISO(dateStr) : new Date();
    return format(addWeeks(date, 1), 'yyyy-MM-dd');
};

export const getNextOccurrenceISO = (dateStr, daysToAdd = 1) => {
    const date = dateStr ? parseISO(dateStr) : new Date();
    return format(addDays(date, daysToAdd), 'yyyy-MM-dd');
};

export const getNextOccurrenceDate = (currentDateStr, task) => {
    try {
        const { periodicity, recurring_days, recurring_month_day, recurring_interval = 1, recurring_type = 'simple' } = task;
        let next = parseISO(currentDateStr);
        if (isNaN(next.getTime())) return null;

        const interval = Number(recurring_interval) || 1;

        if (periodicity === 'Diario') {
            next = addDays(next, interval);
        } else if (periodicity === 'Semanal') {
            const dayMap = { 'D': 0, 'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6 };
            const selectedDays = (Array.isArray(recurring_days) ? recurring_days : []).map(d => dayMap[d]).filter(d => d !== undefined).sort((a,b) => a - b);
            
            if (selectedDays.length === 0) {
                next = addDays(next, 7 * interval);
            } else {
                let currentDay = next.getDay();
                let nextDay = selectedDays.find(d => d > currentDay);
                if (nextDay === undefined) {
                    nextDay = selectedDays[0];
                    next = addDays(next, (7 * interval - currentDay + nextDay));
                } else {
                    next = addDays(next, nextDay - currentDay);
                }
            }
        } else if (periodicity === 'Mensual') {
            if (recurring_type === 'on_day' && recurring_month_day) {
                next.setDate(1);
                next = addMonths(next, interval);
                next.setDate(Number(recurring_month_day));
            } else {
                next = addMonths(next, interval);
            }
        } else if (periodicity === 'Anual') {
            next = addYears(next, interval);
        } else {
            return null;
        }
        return format(next, 'yyyy-MM-dd');
    } catch (e) { return null; }
};

export const projectTasksForHorizon = (physicalTasks, monthsHorizon = 6) => {
    const projected = [];
    const horizon = addMonths(new Date(), monthsHorizon);
    
    physicalTasks.filter(t => t.recurring && t.status !== 'Hecha' && t.type !== 'jewelry_alert').forEach(task => {
        let currentStr = task.date;
        if (!currentStr) return;

        // Generate up to 50 instances to prevent infinite loops
        for (let i = 0; i < 50; i++) {
            const nextDate = getNextOccurrenceDate(currentStr, task);
            if (!nextDate || nextDate > format(horizon, 'yyyy-MM-dd')) break;
            
            projected.push({
                ...task,
                id: `virtual-${task.id}-${nextDate}`,
                date: nextDate,
                isVirtual: true
            });
            currentStr = nextDate;
        }
    });
    return projected;
};
