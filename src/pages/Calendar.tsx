import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  IconButton,
  Stack,
  Chip,
  Avatar,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
  ViewModule as ModuleIcon,
  ViewList as ListIcon,
  ViewDay as DayIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

// Sample events for the calendar
const sampleEvents = [
  {
    id: '1',
    title: 'John Smith',
    date: new Date(2025, 3, 5), // April 5, 2025
    time: '2:00p',
    color: '#1a3c75',
  },
  {
    id: '2',
    title: 'Charity Gala Dinner',
    date: new Date(2025, 3, 2), // April 2, 2025
    time: null,
    color: '#7986cb',
  },
  {
    id: '3',
    title: 'Spring Art Exhibition',
    date: new Date(2025, 3, 5), // April 5, 2025
    time: '3:30p',
    color: '#7986cb',
  },
  {
    id: '4',
    title: 'Gerald Mathews',
    date: new Date(2025, 3, 7), // April 7, 2025
    time: '6:51p',
    color: '#1a3c75',
  },
  {
    id: '5',
    title: 'Anthony Hardy',
    date: new Date(2025, 3, 7), // April 7, 2025
    time: '8:51p',
    color: '#1a3c75',
  },
  {
    id: '6',
    title: 'Andrea Perez',
    date: new Date(2025, 3, 7), // April 7, 2025
    time: '10:51p',
    color: '#1a3c75',
  },
  {
    id: '7',
    title: 'Regional Sports Conference',
    date: new Date(2025, 3, 8), // April 8, 2025
    time: '12:51p',
    color: '#7986cb',
  },
  {
    id: '8',
    title: 'Book Launch Event',
    date: new Date(2025, 3, 11), // April 11, 2025
    time: '5:36p',
    color: '#7986cb',
  },
];

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 3, 5)); // April 5, 2025
  
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2025, 3, 5)); // Set to April 5, 2025 to match the design
  };

  const handleNewBooking = () => {
    navigate('/bookings/new');
  };

  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return sampleEvents.filter(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Calendar
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewBooking}
        >
          New Booking
        </Button>
      </Box>

      {/* Calendar Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePrevMonth}>
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {format(currentDate, 'dd MMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <NextIcon />
          </IconButton>
        </Box>
        <Box>
          <Button variant="outlined" onClick={handleToday} sx={{ mr: 1 }}>
            Today
          </Button>
          <IconButton sx={{ mr: 1 }}>
            <ModuleIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Paper elevation={0} sx={{ borderRadius: 1, overflow: 'hidden' }}>
        {/* Weekday Headers */}
        <Grid container>
          {weekdays.map((day) => (
            <Grid item xs key={day} sx={{ textAlign: 'center', p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Typography variant="subtitle2">{day}</Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Days */}
        <Grid container sx={{ minHeight: '600px' }}>
          {Array.from({ length: 35 }).map((_, index) => {
            const dayOffset = index - monthStart.getDay();
            const day = new Date(monthStart);
            day.setDate(day.getDate() + dayOffset);
            
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const dayEvents = getEventsForDay(day);
            
            return (
              <Grid 
                item 
                xs 
                key={index} 
                sx={{ 
                  height: '100px',
                  borderRight: index % 7 === 6 ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  p: 1,
                  backgroundColor: isCurrentDay ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  color: !isCurrentMonth ? 'rgba(0, 0, 0, 0.38)' : 'inherit',
                  position: 'relative',
                }}
              >
                <Typography variant="body2">{day.getDate()}</Typography>
                
                {/* Events for this day */}
                <Box sx={{ mt: 1 }}>
                  {dayEvents.map((event) => (
                    <Box 
                      key={event.id} 
                      sx={{ 
                        backgroundColor: event.color,
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
                      {event.time && <span style={{ marginRight: '4px' }}>{event.time}</span>}
                      {event.title}
                    </Box>
                  ))}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Agents Filter */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Agents
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            avatar={<Avatar>S</Avatar>}
            label="Sandra Lopez"
            onDelete={() => {}}
            color="primary"
          />
          <Chip
            avatar={<Avatar>U</Avatar>}
            label="User User"
            onDelete={() => {}}
            sx={{ bgcolor: 'grey.400' }}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default Calendar;