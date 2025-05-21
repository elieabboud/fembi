import { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import CalendarContainer from '../components/calendar/CalendarContainer';
import { calendarBooking } from '../types/calendarBooking';
import { bookingService } from '../services/bookingService';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addMonths } from 'date-fns';
import { addColorToBookings, addStatusToBookings } from '../services/bookingsUtils';
import { formatDateForApi } from '../services/calendarUtils';

function Calendar() {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<calendarBooking[]>([]);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
    view: 'month' as 'month' | 'week' | 'day' | 'agenda'
  });
  const [fetchingMore, setFetchingMore] = useState(false);

  const fetchCalendarData = useCallback(async (start: Date, end: Date) => {
    try {
      setFetchingMore(true);
      
      const formattedStart = formatDateForApi(start);
      const formattedEnd = formatDateForApi(end);
      
      const response = await bookingService.getCalendarData(formattedStart, formattedEnd);
      
      const bookingsWithStatus = addStatusToBookings(response);
      const bookingsWithColor = addColorToBookings(bookingsWithStatus);

      const filteredBookings = bookingsWithColor.filter(booking => booking.bookingId !== null);

      setCalendarData(filteredBookings);

      setFetchingMore(false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setFetchingMore(false);
      setLoading(false);
    }
  }, []);

  const calculateDateRange = useCallback((date: Date, view: 'month' | 'week' | 'day' | 'agenda') => {
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
        start = startOfWeek(date, { weekStartsOn: 0 });
        end = endOfWeek(date, { weekStartsOn: 0 });
        break;
      
      default:
        start = startOfMonth(date);
        end = endOfMonth(date);
    }
    
    return { start, end };
  }, []);

  const handleDateRangeChange = useCallback((date: Date, view: 'month' | 'week' | 'day' | 'agenda') => {
    const { start, end } = calculateDateRange(date, view);
    
    setDateRange({
      start,
      end,
      view
    });
  }, [calculateDateRange]);

  useEffect(() => {
    const { start, end } = dateRange;
    fetchCalendarData(start, end);
  }, [dateRange, fetchCalendarData]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress size={30} thickness={4} />
    </Box>;
  }
  
  return (
    <Box sx={{ px: 4, py: 2 }}>
      <CalendarContainer 
        bookings={calendarData} 
        onDateRangeChange={handleDateRangeChange}
        isFetchingMore={fetchingMore}
      />
    </Box>
  );
}

export default Calendar;