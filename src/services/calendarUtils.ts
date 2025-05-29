import { format, isSameDay, parseISO } from 'date-fns';
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
import { TimezoneService } from './timezoneUtils';

export const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const isToday = (date: Date) => {
  return isSameDay(date, new Date());
};

// 🔥 FIXED: Use TimezoneService for event time formatting
export const formatEventTime = (event: { start: DateTimeInfo; end: DateTimeInfo }) => {
  if (!event?.start || !event?.end || !event.start.dateTime || !event.end.dateTime) {
    return '';
  }

  try {
    // console.log('🕐 Formatting event time:', event.start.dateTime, '->', event.end.dateTime);
    
    // Use TimezoneService to format times in user's timezone
    const startTimeUser = TimezoneService.formatTimeForUser(event.start.dateTime, 'h:mm a');
    const endTimeUser = TimezoneService.formatTimeForUser(event.end.dateTime, 'h:mm a');

    const result = `${startTimeUser} - ${endTimeUser}`;
    // console.log('🕐 Formatted event time result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error formatting event time:', error);
    return 'Time unavailable';
  }
};

export const formatEventTimeMonth = (event: { start: DateTimeInfo }) => {
  if (!event?.start || !event.start.dateTime) {
    return '';
  }

  try {
    const startTimeUser = TimezoneService.formatTimeForUser(event.start.dateTime, 'h:mm a');

    const result = `${startTimeUser}`;
    return result;
  } catch (error) {
    return 'Time unavailable';
  }
};

export const getFormattedDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date unavailable';
  }
};

// 🔥 FIXED: Use TimezoneService for grouping events
export const groupEventsByDate = (events: calendarBooking[]): { [key: string]: calendarBooking[] } => {
  const grouped: { [key: string]: calendarBooking[] } = {};
  
  events.forEach(event => {
    if (!event?.start?.dateTime) return;
    
    try {
      // console.log('🗓️ Grouping event:', event.start.dateTime);
      
      // Convert backend time to user's timezone
      const userDate = TimezoneService.convertBackendTimeToLocalReliable(event.start.dateTime);
      
      // Format date in user's timezone
      const dateKey = format(userDate, 'yyyy-MM-dd');
      
      // console.log('🗓️ Event grouped under date:', dateKey);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(event);
    } catch (error) {
      console.error('Error processing event for grouping:', error, event);
    }
  });
  
  // Sort events within each date by start time in user's timezone
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      if (!a?.start?.dateTime || !b?.start?.dateTime) return 0;
      
      try {
        const userDateA = TimezoneService.convertBackendTimeToLocalReliable(a.start.dateTime);
        const userDateB = TimezoneService.convertBackendTimeToLocalReliable(b.start.dateTime);
        
        // Get times in user's timezone for comparison
        const timeA = format(userDateA, 'HHmm');
        const timeB = format(userDateB, 'HHmm');
        
        return parseInt(timeA) - parseInt(timeB);
      } catch (error) {
        console.error('Error sorting events:', error);
        return 0;
      }
    });
  });
  
  return grouped;
};

export const isAllDayEvent = (event: { start: DateTimeInfo; end: DateTimeInfo }): boolean => {
  if (!event.start.dateTime || !event.end.dateTime) {
    return false;
  }

  try {
    // Convert to user's timezone before checking
    const userStartDate = TimezoneService.convertBackendTimeToLocalReliable(event.start.dateTime);
    const userEndDate = TimezoneService.convertBackendTimeToLocalReliable(event.end.dateTime);
    
    // Check if it's the same day and starts at midnight in user's timezone
    const startDateStr = format(userStartDate, 'yyyy-MM-dd');
    const endDateStr = format(userEndDate, 'yyyy-MM-dd');
    const startTime = format(userStartDate, 'HH:mm:ss');

    const isSameDay = startDateStr === endDateStr;
    const isStartMidnight = startTime === '00:00:00';

    return isSameDay && isStartMidnight;
  } catch (error) {
    console.error('Error checking if all day event:', error);
    return false;
  }
};

// 🔥 FIXED: Use TimezoneService for parsing date time
export function parseDateTime(dateTimeInfo: { dateTime?: string } | undefined): Date {
  if (!dateTimeInfo || !dateTimeInfo.dateTime) {
    console.warn('Invalid dateTime provided to parseDateTime', dateTimeInfo);
    return new Date();
  }
  
  try {
    const backendDate = parseISO(dateTimeInfo.dateTime);
    
    if (isNaN(backendDate.getTime())) {
      console.warn('Invalid date parsed from:', dateTimeInfo.dateTime);
      return new Date();
    }
    
    // console.log('🗓️ Parsing dateTime:', dateTimeInfo.dateTime);
    
    // Use TimezoneService to convert backend time to user's timezone
    const userDate = TimezoneService.convertBackendTimeToLocalReliable(dateTimeInfo.dateTime);
    
    // console.log('🗓️ Parsed to user timezone:', userDate.toLocaleString());
    return userDate;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
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

// 🔥 FIXED: Use TimezoneService for API date formatting
export function formatDateForApi(date: Date): string {
  try {
    // Convert user's local time to backend timezone (EST/EDT) for API calls
    return TimezoneService.convertLocalTimeToBackend(date);
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return date.toISOString();
  }
}

export function getDateRangeText(date: Date, view: CalendarViewType): string {
  try {
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
  } catch (error) {
    console.error('Error getting date range text:', error);
    return 'Date Range';
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
      
      // Convert backend times to user timezone for filtering
      const eventStartUser = TimezoneService.convertBackendTimeToLocalReliable(event.start.dateTime);
      const eventEndUser = TimezoneService.convertBackendTimeToLocalReliable(event.end.dateTime);
      
      // Event starts within range, ends within range, or spans the range
      return (
        (eventStartUser >= start && eventStartUser <= end) ||
        (eventEndUser >= start && eventEndUser <= end) ||
        (eventStartUser <= start && eventEndUser >= end)
      );
    } catch (error) {
      console.error('Error filtering event:', error);
      return false;
    }
  });
}