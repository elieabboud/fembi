import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { format, startOfMonth, isSameMonth, isToday } from 'date-fns';
import { calendarBooking } from '../../types/calendarBooking';
import { weekdays, formatEventTime, parseDateTime } from '../../services/calendarUtils';

interface MonthViewProps {
  currentDate: Date;
  events: calendarBooking[];
  onDateChange: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, events, onDateChange }) => {
  const monthStart = startOfMonth(currentDate);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      if (!event.start?.dateTime) return false;
      const eventDate = parseDateTime(event.start);
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      );
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

      <Grid container sx={{ height: '600px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
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
              key={index}
              sx={{
                overflow: 'auto',
                borderRight: index % 7 === 6 ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                p: 1,
                backgroundColor: isCurrentDay ? 'rgba(186, 183, 183, 0.12)' : 'transparent',
                color: !isCurrentMonth ? 'rgba(0, 0, 0, 0.38)' : 'inherit',
                position: 'relative',
              }}
            >
              <Typography variant="body2" onClick={() => onDateChange(day)}>
                {day.getDate()}
              </Typography>

              {/* Events for this day */}
              <Box sx={{ mt: 1 }}>
                {dayEvents.map((event, eventIndex) => {
                  const leftOffset = (100 / maxEvents) * eventIndex;
                  const eventWidth = 100 / maxEvents;

                  return (
                    <Box
                      key = {eventIndex}
                      sx={{
                        backgroundColor: event?.color,
                        color: 'white',
                        borderRadius: '4px',
                        p: 0.5,
                        mb: 0.5,
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        position: 'absolute',
                        left: `${leftOffset}%`,
                        width: `${eventWidth}%`,
                      }}
                    >
                    {event?.start?.dateTime && (
                      <span style={{ marginRight: '4px' }}>
                        {formatEventTime(event)}
                      </span>
                    )}
                      {event?.serviceName}
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
