import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { format, startOfMonth, isSameMonth, isToday } from 'date-fns';
import { calendarBooking } from '../../types/calendarBooking';
import { weekdays, formatEventTime, parseDateTime, formatEventTimeMonth } from '../../services/calendarUtils';
import { TimezoneService } from '../../services/timezoneUtils';

interface MonthViewProps {
  currentDate: Date;
  events: calendarBooking[];
  onDateChange: (date: Date) => void;
  onEventClick?: (booking: calendarBooking) => void;
  onViewChange?: (view: 'month' | 'week' | 'day' | 'agenda') => void;
  onDayClick?: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ 
  currentDate, 
  events, 
  onDateChange,
  onEventClick,
  onViewChange,
  onDayClick
}) => {
  const monthStart = startOfMonth(currentDate);

  const getEventsForDay = (day: Date) => {
  const dayEvents = events.filter((event) => {
    if (!event.start?.dateTime) return false;
    const eventDate = parseDateTime(event.start);
    return (
      eventDate.getDate() === day.getDate() &&
      eventDate.getMonth() === day.getMonth() &&
      eventDate.getFullYear() === day.getFullYear()
    );
  });

  // Sort events by start time for the day
  return dayEvents.sort((a, b) => {
    if (!a?.start?.dateTime || !b?.start?.dateTime) return 0;
    
    try {
      const timeA = TimezoneService.convertBackendTimeToLocal(a.start.dateTime);
      const timeB = TimezoneService.convertBackendTimeToLocal(b.start.dateTime);
      
      // Sort by start time (hour and minute)
      const minutesA = timeA.getHours() * 60 + timeA.getMinutes();
      const minutesB = timeB.getHours() * 60 + timeB.getMinutes();
      
      return minutesA - minutesB;
    } catch (error) {
      console.error('Error sorting events in month view:', error);
      return 0;
    }
  });
};


  const getMaxEventsForDay = (day: Date) => {
    return getEventsForDay(day).length;
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 1, overflow: 'hidden' }}>
      <Grid container>
        {weekdays.map((day) => (
          <Grid item xs key={day} sx={{ textAlign: 'center', p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="subtitle2">{day}</Typography>
          </Grid>
        ))}
      </Grid>

      <Grid container sx={{ height: '600px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}>
        {Array.from({ length: 35 }).map((_, index) => {
          const dayOffset = index - monthStart.getDay();
          const day = new Date(monthStart);
          day.setDate(day.getDate() + dayOffset);

          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const dayEvents = getEventsForDay(day);
          const maxEvents = getMaxEventsForDay(day);

          return (
            <Grid
              item
              onClick={() => {
                if (onDayClick) {
                  onDayClick(day);
                } else {
                  onDateChange(day);
                  if (onViewChange) onViewChange('day');
                }
              }}
              key={index}
              sx={{
                position: 'relative',
                borderRight: index % 7 === 6 ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                p: 1,
                backgroundColor: isCurrentDay ? 'rgba(186, 183, 183, 0.12)' : 'transparent',
                color: !isCurrentMonth ? 'rgba(0, 0, 0, 0.38)' : 'inherit',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                },
              }}
            >
              <Typography 
              sx={{position: 'absolute', top:1, left:1}} 
              variant="body2"
              onClick={(e) => {
                e.stopPropagation();
                onDateChange(day);
                if (onViewChange) onViewChange('day');
              }}>
                {day.getDate()}
              </Typography>

              {/* Events for this day */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 20, // leaves space for date
                  bottom: 2,
                  left: 2,
                  right: 2,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}>
                {dayEvents.map((event, eventIndex) => {
                  return (
                    <Box
                      key={eventIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEventClick) onEventClick(event);
                      }}
                      sx={{
                        backgroundColor: event?.color,
                        color: 'white',
                        borderRadius: '4px',
                        p: 0.5,
                        mb: 0.5,
                        flexShrink: 0,
                        minHeight: '20px',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                          boxShadow: '0px 2px 4px rgba(0,0,0,0.2)'
                        },
                      }}>
                    {event?.start?.dateTime && (
                      <span style={{ marginRight: '4px' }}>
                        {formatEventTimeMonth(event)}
                      </span>
                    )}
                      {event?.customerName}
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default MonthView;