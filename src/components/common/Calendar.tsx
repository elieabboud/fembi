import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  ButtonGroup,
  Button,
  IconButton,
  Grid,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

interface CalendarProps {
  events?: Array<{
    id: string;
    title: string;
    date: Date;
    color?: string;
  }>;
  onSelectDate?: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ 
  events = [], 
  onSelectDate 
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Paper elevation={0} sx={{ p: 0, borderRadius: 1, overflow: 'hidden' }}>
      {/* Calendar Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth} size="small">
            <NextIcon />
          </IconButton>
        </Box>
        <Button variant="outlined" size="small" onClick={handleToday}>
          Today
        </Button>
      </Box>

      {/* Calendar Grid */}
      <Box>
        {/* Weekday Headers */}
        <Grid container>
          {weekdays.map((day) => (
            <Grid item xs key={day} sx={{ 
              textAlign: 'center', 
              p: 1,
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              bgcolor: 'rgba(0, 0, 0, 0.03)'
            }}>
              <Typography variant="subtitle2">{day}</Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Days */}
        <Grid container>
          {/* Empty cells before the first day of the month */}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <Grid 
              item 
              xs 
              key={`empty-start-${index}`} 
              sx={{ 
                height: '100px',
                borderRight: (index + 1) % 7 === 0 ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                p: 1,
                bgcolor: 'rgba(0, 0, 0, 0.03)'
              }}
            />
          ))}

          {/* Actual days of the month */}
          {days.map((day, index) => {
            const isCurrentDay = isToday(day);
            const dayEvents = getEventsForDay(day);
            
            return (
              <Grid 
                item 
                xs 
                key={day.toString()} 
                sx={{ 
                  height: '100px',
                  borderRight: (monthStart.getDay() + index + 1) % 7 === 0 ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  p: 1,
                  bgcolor: isCurrentDay ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  cursor: onSelectDate ? 'pointer' : 'default',
                  '&:hover': { bgcolor: onSelectDate ? 'rgba(0, 0, 0, 0.04)' : 'inherit' },
                }}
                onClick={() => onSelectDate && onSelectDate(day)}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isCurrentDay ? 'bold' : 'regular',
                    color: isCurrentDay ? 'white' : 'inherit',
                    display: 'inline-block',
                    width: '24px',
                    height: '24px', 
                    textAlign: 'center',
                    lineHeight: '24px',
                    borderRadius: '50%',
                    bgcolor: isCurrentDay ? 'primary.light' : 'transparent',
                  }}
                >
                  {day.getDate()}
                </Typography>
                
                {/* Events for this day */}
                <Box sx={{ mt: 1 }}>
                  {dayEvents.map((event) => (
                    <Box 
                      key={event.id} 
                      sx={{ 
                        backgroundColor: event.color || 'primary.main',
                        color: 'white',
                        borderRadius: '4px',
                        p: 0.5,
                        mb: 0.5,
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {event.title}
                    </Box>
                  ))}
                </Box>
              </Grid>
            );
          })}

          {/* Empty cells after the last day of the month */}
          {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
            <Grid 
              item 
              xs 
              key={`empty-end-${index}`}
              sx={{ 
                height: '100px',
                borderRight: (monthEnd.getDay() + index + 1) % 7 === 0 ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                p: 1,
                bgcolor: 'rgba(0, 0, 0, 0.03)'
              }}
            />
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default Calendar;