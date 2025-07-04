import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { isSameDay } from 'date-fns';
import { calendarBooking } from '../../types/calendarBooking';
import { formatEventTime, isToday, parseDateTime } from '../../services/calendarUtils';
import { TimezoneService } from '../../services/timezoneUtils';

interface DayViewProps {
  currentDate: Date;
  events: calendarBooking[];
  onDateChange: (date: Date) => void;
  onEventClick?: (booking: calendarBooking) => void;
}

interface EventPosition {
  event: calendarBooking;
  startMinutes: number;
  endMinutes: number;
  column: number;
  totalColumns: number;
}

const DayView: React.FC<DayViewProps> = ({ 
  currentDate, 
  events, 
  onDateChange,
  onEventClick 
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get events for the current day only
  const eventsForDay = events
    .filter(event => {
      if (!event.start?.dateTime) return false;
      const eventStart = parseDateTime(event?.start);
      return eventStart && isSameDay(eventStart, currentDate);
    })
    .sort((a, b) => {
      if (!a?.start?.dateTime || !b?.start?.dateTime) return 0;
      
      try {
        const timeA = TimezoneService.convertBackendTimeToLocal(a.start.dateTime);
        const timeB = TimezoneService.convertBackendTimeToLocal(b.start.dateTime);
        
        const minutesA = timeA.getHours() * 60 + timeA.getMinutes();
        const minutesB = timeB.getHours() * 60 + timeB.getMinutes();
        
        return minutesA - minutesB;
      } catch (error) {
        console.error('Error sorting events in day view:', error);
        return 0;
      }
    });

  // Calculate event positions with proper width distribution
  const calculateEventPositions = (events: calendarBooking[]): EventPosition[] => {
    if (!events.length) return [];

    // Convert events to time intervals
    const intervals = events.map(event => {
      const startDateTime = parseDateTime(event?.start);
      const endDateTime = parseDateTime(event?.end);
      const startMinutes = startDateTime.getHours() * 60 + startDateTime.getMinutes();
      const endMinutes = endDateTime.getHours() * 60 + endDateTime.getMinutes();
      
      return {
        event,
        startMinutes,
        endMinutes
      };
    }).filter(interval => interval.startMinutes < interval.endMinutes);

    // Sort by start time, then by end time
    intervals.sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) {
        return a.startMinutes - b.startMinutes;
      }
      return a.endMinutes - b.endMinutes;
    });

    const positions: EventPosition[] = [];
    
    for (const interval of intervals) {
      // Find overlapping events that are already positioned
      const overlapping = positions.filter(pos => 
        pos.startMinutes < interval.endMinutes && pos.endMinutes > interval.startMinutes
      );

      // Find the first available column by checking which columns are occupied
      let column = 0;
      const occupiedColumns = new Set(overlapping.map(pos => pos.column));
      
      while (occupiedColumns.has(column)) {
        column++;
      }

      // Add this event to positions temporarily to calculate max simultaneous
      const tempPosition = {
        event: interval.event,
        startMinutes: interval.startMinutes,
        endMinutes: interval.endMinutes,
        column,
        totalColumns: 1
      };
      
      // Calculate the maximum number of overlapping events including this one
      const allOverlapping = [...overlapping, tempPosition];
      const maxColumns = Math.max(...allOverlapping.map(pos => pos.column)) + 1;

      positions.push({
        ...tempPosition,
        totalColumns: maxColumns
      });
    }

    // Third pass: ensure all overlapping events have the same totalColumns
    const groups: EventPosition[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < positions.length; i++) {
      if (processed.has(i)) continue;

      const group: EventPosition[] = [positions[i]];
      const queue = [i];
      processed.add(i);

      while (queue.length > 0) {
        const currentIndex = queue.shift()!;
        const current = positions[currentIndex];

        for (let j = 0; j < positions.length; j++) {
          if (processed.has(j)) continue;
          
          const other = positions[j];
          // Check if they overlap
          if (current.startMinutes < other.endMinutes && current.endMinutes > other.startMinutes) {
            group.push(other);
            queue.push(j);
            processed.add(j);
          }
        }
      }

      groups.push(group);
    }

    // Update totalColumns for each group
    groups.forEach(group => {
      const maxColumns = Math.max(...group.map(pos => pos.column)) + 1;
      group.forEach(pos => {
        pos.totalColumns = maxColumns;
      });
    });

    return positions;
  };

  const eventPositions = calculateEventPositions(eventsForDay);

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
          {eventPositions.map((position, index) => {
            const { event, startMinutes, endMinutes, column, totalColumns } = position;
            
            const duration = endMinutes - startMinutes;
            const columnWidth = 100 / totalColumns;
            const left = columnWidth * column;
            
            return (
              <Paper
                key={`event-${index}`}
                onClick={() => onEventClick && onEventClick(event)}
                sx={{
                  position: 'absolute',
                  top: `${startMinutes}px`,
                  width: `${columnWidth}%`,
                  left: `${left}%`,
                  height: `${duration}px`,
                  bgcolor: event?.color,
                  color: 'white',
                  p: 1,
                  overflow: 'hidden',
                  borderRadius: 1,
                  zIndex: 10,
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    opacity: 0.9,
                    boxShadow: 2
                  },
                  paddingTop: duration >= 90? 1 : 0
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem', display: 'inline'}}>
                  {formatEventTime(event)}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'inline', marginLeft: 2 }}>
                  {event?.customerName}
                </Typography>
                {event?.serviceName && (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.7rem', opacity: 0.9, display: duration >= 90? 'block':'inline', marginLeft: duration >= 90? 0 : 2 }}
                  >
                    {event?.serviceName}
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