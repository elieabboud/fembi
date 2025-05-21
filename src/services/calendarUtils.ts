import { format, isSameDay } from 'date-fns';
import { calendarBooking, DateTimeInfo } from '../types/calendarBooking';
import { 
  startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, 
  startOfDay, endOfDay, 
  addMonths, addDays,
  isSameMonth, isSameWeek,
  isWithinInterval
} from 'date-fns';
import { CalendarViewType } from '../components/calendar/CalendarViewSelector';

export const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const isToday = (date: Date) => {
  return isSameDay(date, new Date());
};

export const formatEventTime = (event: { start: DateTimeInfo; end: DateTimeInfo }) => {
  if (!event?.start || !event?.end || !event.start.dateTime || !event.end.dateTime) {
    return false;
  }

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
};

export const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d, yyyy');
  };

export const groupEventsByDate = (events: calendarBooking[]): { [key: string]: calendarBooking[] } => {
  const grouped: { [key: string]: calendarBooking[] } = {};
  
  events.forEach(event => {
    if (!event?.start?.dateTime) return;
    
    try {
      const startDate = new Date(event.start.dateTime);
      
      if (isNaN(startDate.getTime())) {
        console.warn('Invalid date encountered:', event.start.dateTime);
        return;
      }
      
      const dateKey = format(startDate, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(event);
    } catch (error) {
      console.error('Error processing event:', error, event);
    }
  });
  
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      if (!a?.start?.dateTime) return 1;
      if (!b?.start?.dateTime) return -1;
      
      const dateA = new Date(a.start.dateTime);
      const dateB = new Date(b.start.dateTime);
      
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      
      return dateA.getTime() - dateB.getTime();
    });
  });
  
  return grouped;
};

export const isAllDayEvent = (event: { start: DateTimeInfo; end: DateTimeInfo }): boolean => {
  if (!event.start.dateTime || !event.end.dateTime) {
    return false;
  }

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  const isSameDay = start.toDateString() === end.toDateString();

  const isStartMidnight = start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0;

  return isSameDay && isStartMidnight;
};


export function parseDateTime(dateTimeInfo: { dateTime?: string } | undefined): Date {
  if (!dateTimeInfo || !dateTimeInfo.dateTime) {
    console.warn('Invalid dateTime provided to parseDateTime', dateTimeInfo);
    return new Date(); // Return current date as fallback
  }
  
  try {
    const date = new Date(dateTimeInfo.dateTime);
    
    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date parsed from:', dateTimeInfo.dateTime);
      return new Date(); // Return current date as fallback
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date(); // Return current date as fallback
  }
}

export function calculateDateRange(date: Date, view: CalendarViewType) {
  let start: Date, end: Date;
  
  switch (view) {
    case 'month':
      start = startOfMonth(date);
      end = endOfMonth(date);
      start = startOfWeek(start, { weekStartsOn: 0 });
      end = endOfWeek(end, { weekStartsOn: 0 });
      break;
    
    case 'week':
      start = startOfWeek(date, { weekStartsOn: 0 });
      end = endOfWeek(date, { weekStartsOn: 0 });
      break;
    
    case 'day':
      start = startOfDay(date);
      end = endOfDay(date);
      break;
    
    case 'agenda':
      start = startOfMonth(addMonths(date, -1));
      end = endOfMonth(addMonths(date, 1));
      break;
    
    default:
      start = startOfMonth(date);
      end = endOfMonth(date);
  }
  
  return { start, end };
}

export function shouldFetchNewData(
  currentRange: { start: Date; end: Date }, 
  newDate: Date, 
  view: CalendarViewType
): boolean {
  
  const { start: currentStart, end: currentEnd } = currentRange;
  
  const isWithinCurrentRange = isWithinInterval(newDate, {
    start: currentStart,
    end: currentEnd
  });
  
  if (view === 'month') {
    return !isSameMonth(newDate, new Date((currentStart.getTime() + currentEnd.getTime()) / 2));
  }
  
  if (view === 'week') {
    return !isSameWeek(newDate, new Date((currentStart.getTime() + currentEnd.getTime()) / 2), { weekStartsOn: 0 });
  }
  
  if (view === 'day') {
    return true; 
  }
  
  if (view === 'agenda') {
    return !isWithinCurrentRange;
  }
  
  return !isWithinCurrentRange;
}

export function formatDateForApi(date: Date): string {
  return date.toISOString();
}

export function getDateRangeText(date: Date, view: CalendarViewType): string {
  if (view === 'month') {
    return format(date, 'MMMM yyyy');
  } else if (view === 'week') {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  } else if (view === 'day') {
    return format(date, 'EEEE, MMMM d, yyyy');
  } else {
    return format(date, 'MMMM yyyy');
  }
}

export function filterEventsByDateRange(
  events: calendarBooking[], 
  start: Date, 
  end: Date
): calendarBooking[] {
  return events.filter(event => {
    try {
      if (!event?.start?.dateTime || !event?.end?.dateTime) {
        return false;
      }
      
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      // Event starts within range, ends within range, or spans the range
      return (
        (eventStart >= start && eventStart <= end) ||
        (eventEnd >= start && eventEnd <= end) ||
        (eventStart <= start && eventEnd >= end)
      );
    } catch (error) {
      console.error('Error filtering event:', error);
      return false;
    }
  });
}