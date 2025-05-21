import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import CalendarContainer from '../components/calendar/CalendarContainer';
import { calendarBooking } from '../types/calendarBooking';
import { bookingService } from '../services/bookingService';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addMonths, isEqual } from 'date-fns';
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
  
  // Use a ref to track the last fetch parameters to prevent duplicate requests
  const lastFetchParamsRef = useRef<{ start: string, end: string } | null>(null);
  
  // Add a fetch timer to prevent rapid successive calls
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCalendarData = useCallback(async (start: Date, end: Date) => {
    try {
      // Format dates for API
      const formattedStart = formatDateForApi(start);
      const formattedEnd = formatDateForApi(end);
      
      // Check if we're already fetching the same date range
      if (lastFetchParamsRef.current && 
          lastFetchParamsRef.current.start === formattedStart && 
          lastFetchParamsRef.current.end === formattedEnd) {
        return; // Skip duplicate fetches
      }
      
      // Update our tracking of what we're fetching
      lastFetchParamsRef.current = { start: formattedStart, end: formattedEnd };
      
      setFetchingMore(true);
      
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
    // Clear any pending fetch timer
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
    }
    
    const { start, end } = calculateDateRange(date, view);
    
    // Check if this is actually a change
    if (dateRange.view === view && 
        isEqual(dateRange.start, start) && 
        isEqual(dateRange.end, end)) {
      return; // No change, don't update state or fetch
    }
    
    setDateRange({
      start,
      end,
      view
    });
    
    // Debounce the fetch operation
    fetchTimerRef.current = setTimeout(() => {
      fetchCalendarData(start, end);
    }, 300); // 300ms debounce
  }, [calculateDateRange, dateRange, fetchCalendarData]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    const { start, end } = dateRange;
    fetchCalendarData(start, end);
    
    // Clean up function to cancel any pending fetch on unmount or re-render
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, []); // Empty dependency array for initial fetch only
  
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