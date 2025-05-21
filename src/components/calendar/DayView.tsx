import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { isSameDay } from 'date-fns';
import { calendarBooking } from '../../types/calendarBooking';
import { formatEventTime, isToday, parseDateTime } from '../../services/calendarUtils';

interface DayViewProps {
  currentDate: Date;
  events: calendarBooking[];
  onDateChange: (date: Date) => void;
  onEventClick?: (booking: calendarBooking) => void; // Add this prop
}

const DayView: React.FC<DayViewProps> = ({ 
  currentDate, 
  events, 
  onDateChange,
  onEventClick 
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get events for the current day only
  const eventsForDay = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventStart = parseDateTime(event?.start);
    return eventStart && isSameDay(eventStart, currentDate);
  });

  // Group overlapping events
  const groupOverlappingEvents = (events: calendarBooking[]) => {
    if (!events.length) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => {
      if (!a.start?.dateTime || !b.start?.dateTime) return 0;
      const aStart = parseDateTime(a.start).getTime();
      const bStart = parseDateTime(b.start).getTime();
      return aStart - bStart;
    });

    // Group events that overlap
    const groups: { events: calendarBooking[]; groupIndex: number }[][] = [];
    
    for (const event of sortedEvents) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;
      const eventStart = parseDateTime(event.start).getTime();
      const eventEnd = parseDateTime(event.end).getTime();
      
      let placed = false;
      
      for (const group of groups) {
        let columnFound = false;
        
        for (let colIndex = 0; colIndex < 4; colIndex++) { // Max 4 events
          const column = group.filter(item => item.groupIndex === colIndex);
          
          const noOverlap = column.every(item => {
            if (!item.events[0]?.start?.dateTime || !item.events[0]?.end?.dateTime) return false;
            const itemStart = parseDateTime(item.events[0].start).getTime();
            const itemEnd = parseDateTime(item.events[0].end).getTime();
            return eventEnd <= itemStart || eventStart >= itemEnd;
          });
          
          if (noOverlap) {
            group.push({ events: [event], groupIndex: colIndex });
            columnFound = true;
            placed = true;
            break;
          }
        }
        
        if (columnFound) break;
      }
      
      if (!placed) {
        groups.push([{ events: [event], groupIndex: 0 }]);
      }
    }
    
    return groups.flat();
  };

  const groupedEvents = groupOverlappingEvents(eventsForDay);

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', height: 'calc(100% - 60px)', bgcolor: isToday(currentDate) ? 'rgba(206, 203, 203, 0.12)' : 'transparent' }}>
        {/* Time labels column */}
        <Box sx={{ width: '60px', borderRight: '1px solid #ddd', flexShrink: 0 }}>
          {hours.map(hour => (
            <Box
              key={hour}
              sx={{
                height: '60px',
                borderTop: '1px solid #ddd',
                p: 0.5,
                textAlign: 'right',
                pr: 1
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Events area */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {/* Hour grid lines */}
          {hours.map(hour => (
            <Box
              key={hour}
              sx={{
                height: '60px',
                borderTop: '1px solid #ddd',
                width: '100%',
                '&:last-child': { borderBottom: '1px solid #ddd' }
              }}
            />
          ))}

          {/* Event cards */}
          {groupedEvents.map((groupItem, index) => {
            const event = groupItem.events[0];
            const columnIndex = groupItem.groupIndex;
            const totalColumns = 4;
            
            const startDateTime = parseDateTime(event?.start);
            const endDateTime = parseDateTime(event?.end);
            
            const startHour = startDateTime.getHours();
            const startMinutes = startDateTime.getMinutes();
            const top = startHour * 60 + startMinutes;
            
            const endHour = endDateTime.getHours();
            const endMinutes = endDateTime.getMinutes();
            const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
            
            const columnWidth = 95 / totalColumns;
            const left = columnIndex * columnWidth;
            
            return (
              <Paper
                key={`event-${index}`}
                onClick={() => onEventClick && onEventClick(event)}
                sx={{
                  position: 'absolute',
                  top: `${top}px`,
                  left: `${left}%`,
                  width: `${columnWidth}%`,
                  height: `${duration}px`,
                  bgcolor: event?.color,
                  color: 'white',
                  p: 1,
                  overflow: 'hidden',
                  borderRadius: 1,
                  zIndex: 10,
                  cursor: 'pointer', // Add this to show it's clickable
                  '&:hover': {
                    opacity: 0.9,
                    boxShadow: 2
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                  {formatEventTime(event)}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
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
    </Box>
  );
};

export default DayView;