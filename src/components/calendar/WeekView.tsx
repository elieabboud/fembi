import React, { useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { calendarBooking } from '../../types/calendarBooking';
import { formatEventTime, isToday, parseDateTime } from '../../services/calendarUtils';

interface WeekViewProps {
  currentDate: Date;
  events: calendarBooking[];
  onDateChange: (date: Date) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onDateChange }) => {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0 = Sunday

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

  // Fixed function to properly filter events by day
  const getEventsByDay = (day: Date) => {
    return events.filter(event => {
      if (!event.start?.dateTime) return false;
      const eventStart = parseDateTime(event.start);
      return eventStart && isSameDay(eventStart, day);
    });
  };

  useEffect(() => {
    weekDays.forEach(day => {
      const dayEvents = getEventsByDay(day);
    });
  }, [events, currentDate]);

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', height: 'calc(100% - 60px)' }}>
        <Box sx={{ width: '60px', mt: '60px', borderRight: '1px solid #ddd' }}>
          {hours.map(hour => (
            <Box
              key={hour}
              sx={{
                height: '60px',
                borderTop: '1px solid #ddd',
                p: 0.5,
                textAlign: 'right',
                pr: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexGrow: 1, overflowX: 'auto' }}>
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsByDay(day);
            
            return (
              <Box
                key={dayIndex}
                sx={{
                  flexGrow: 1,
                  minWidth: '120px',
                  width: '14.28%',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: '60px',
                    p: 1,
                    textAlign: 'center',
                    borderBottom: '1px solid #ddd',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: isToday(day) ? 'bold' : 'normal',
                      color: isToday(day) ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {format(day, 'EEE')}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: isToday(day) ? 'bold' : 'normal',
                      color: isToday(day) ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                </Box>

                {/* Hour cells */}
                <Box
                  sx={{
                    bgcolor: isToday(day) ? 'rgba(224, 222, 222, 0.12)' : 'transparent',
                  }}
                >
                  {hours.map(hour => (
                    <Box
                      key={hour}
                      sx={{
                        height: '60px',
                        borderTop: '1px solid #ddd',
                        borderLeft: '1px solid #ddd',
                        '&:last-child': { borderBottom: '1px solid #ddd' },
                      }}
                    />
                  ))}
                </Box>

                <Box sx={{ position: 'absolute', top: '60px', left: 0, right: 0, zIndex: 2 }}>
                  {dayEvents.map((event, eventIndex) => {
                    const eventStart = parseDateTime(event.start);
                    const eventEnd = parseDateTime(event.end);
                    
                    if (!eventStart || !eventEnd) return null;
                    
                    // Calculate positioning
                    const startHour = eventStart.getHours();
                    const startMinutes = eventStart.getMinutes();
                    const top = startHour * 60 + startMinutes; // Position based on actual time
                    
                    const endHour = eventEnd.getHours();
                    const endMinutes = eventEnd.getMinutes();
                    const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
                    
                    // Calculate event width based on overlapping events
                    const eventsAtSameTime = dayEvents.filter(e => {
                      const eStart = parseDateTime(e.start);
                      const eEnd = parseDateTime(e.end);
                      if (!eStart || !eEnd) return false;
                      
                      // Check if events overlap
                      return (eStart <= eventEnd && eEnd >= eventStart);
                    });
                    
                    const eventPosition = eventsAtSameTime.indexOf(event);
                    const totalOverlappingEvents = eventsAtSameTime.length;
                    const leftOffset = (100 / totalOverlappingEvents) * eventPosition;
                    const eventWidth = 100 / totalOverlappingEvents;

                    return (
                      <Paper
                        key={`${eventIndex}-${event.bookingId || eventIndex}`}
                        sx={{
                          position: 'absolute',
                          top: `${top}px`,
                          left: `${leftOffset}%`,
                          width: `${eventWidth}%`,
                          height: `${Math.max(duration, 30)}px`, // Minimum height of 30px
                          bgcolor: event?.color,
                          color: 'white',
                          p: 0.5,
                          overflow: 'hidden',
                          borderRadius: 1,
                          '&:hover': {
                            opacity: 0.9,
                            cursor: 'pointer',
                            boxShadow: 2,
                          },
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                          {formatEventTime(event)}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.8rem' }}>
                          {event?.serviceName}
                        </Typography>
                        {event?.serviceLocation?.displayName && (
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.9 }}
                          >
                            {event?.serviceLocation?.displayName}
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default WeekView;