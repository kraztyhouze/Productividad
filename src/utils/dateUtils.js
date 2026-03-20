import { format, parseISO, addWeeks, addDays } from 'date-fns';

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
