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
  Select,
  FormControl,
  MenuItem,
  SelectChangeEvent,
  Dialog
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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import NewBookingForm from '../components/forms/NewBookingForm';
import Confirmation from '../components/forms/Confirmation';

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
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 3, 5)); // April 5, 2025
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const [submittedData, setSubmittedData] = useState<{
    serviceLocation: string;
    loanID: string;
    borrowerFirstName: string;
    borrowerLastName: string;
    borrowerEmail: string;
    borrowerPhone: string;
    borrowerAddress: string;
    city: string;
    state: string;
    zipCode: string;
    loanNumber: string;
    loanType: string;
    loanAmount: string;
    loanCloser: string;
    dpaProgram: string;
    notes: string;
    selectedDate: Date | null;
    selectedTime: string;
  } | null>(null);

  const handleFormSubmit = (formData: typeof submittedData) => {
    // Send data to backend here
    // On success:
    setOpenBookingModal(false);
    setSubmittedData(formData);
    setConfirmationOpen(true);
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2025, 3, 5)); // Set to April 5, 2025 to match the design
  };

  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    const newMonth = parseInt(event.target.value as string, 10);
    const newDate = new Date(currentDate);
    newDate.setMonth(newMonth);
    setCurrentDate(newDate);
  };

  const handleNewBooking = () => {
    // navigate('/bookings/new');
    setOpenBookingModal(true);
  };

    // Handle modal close
    const handleCloseModal = () => {
      setOpenBookingModal(false);
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
  const months = [
    'January', 'February', 'March', 'April', 
    'May', 'June', 'July', 'August', 
    'September', 'October', 'November', 'December'
  ];

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 160,
        width: 'auto',
      },
      sx: {
        // Put scrollbar hiding in sx instead of style
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none' as const, // TypeScript now knows this is a literal
        msOverflowStyle: 'none' as const,
      }
    },
    anchorOrigin: {
      vertical: 'bottom' as const,
      horizontal: 'left' as const,
    },
    transformOrigin: {
      vertical: 'top' as const,
      horizontal: 'left' as const,
    },
    variant: 'menu' as const,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: {xs: 1, md: 3} }}>
        <Typography 
        variant="h4" 
        component="h1"
        sx={{ 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 2,
        }}>
          Calendar
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mb: 3 }}>
        <Button
          variant="contained"
          // startIcon={<AddIcon />}
          onClick={handleNewBooking}
          sx={{height: 50, minWidth: 150, fontSize: 16, fontWeight: 'bold'}}
        >
          New Booking
        </Button>
      </Box>

      {/* Calendar Controls */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexDirection: { xs: 'column', md: 'row' },
        mb: 3,
        width: '100%',
        flexGrow: 1,
      }}>
          <FormControl size="small"
            sx={{
              minWidth: 120,
              display: 'flex',
              alignItems: {sx: 'start', md:'center'},
              justifyContent: 'center',
              width: {xs:'100%', md:'auto'},
            }}>
            <Box sx={{ alignItems: 'center', display: 'flex' }}>
              <CalendarMonthIcon/>
              <Select
                value={currentDate.getMonth()}
                onChange={handleMonthChange}
                displayEmpty
                variant="outlined"
                IconComponent={KeyboardArrowDownIcon}
                MenuProps={menuProps}
                sx={{
                  paddingRight: 3,
                  fontWeight: 'bold',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  border: 'none',
                  boxShadow: 'none',
                  outline: 'none'
                }}
              >
                {months.map((month, index) => (
                  <MenuItem key={month} value={index}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </FormControl>
          {/* calendar controls */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: { xs: 8, md: 0 },
          mt: {xs: 2, md: 0},}}>
          <Box sx={{
          display: 'flex',
          alignItems:'center',
          justifyContent: { xs: 'flex-start', md: 'center' },
          mb: 0,
          width: '100%',
          }}>
            <IconButton onClick={handlePrevMonth}>
              <PrevIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mx: {xs:0, md:2}, fontWeight: 'bold', width: {xs: '100%', md: 'auto'}, fontSize: {xs: '12px', md: '20px'} }}>
              {format(currentDate, 'dd MMM yyyy')}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <NextIcon />
            </IconButton>
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}>
            <Button
              variant="contained"
              onClick={handleToday}
              sx={{height: 40, mr: 3, fontSize: 16, fontWeight: 'bold'}}>
              Today
            </Button>
            <FilterListIcon/>
          </Box>
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
        <Grid container sx={{ 
          height: '600px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)'
        }}>
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
                key={index} 
                sx={{ 
                  overflow: 'auto',
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
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Loan Agents
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
      <Dialog
        open={openBookingModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="booking-dialog-title"
      >
        <NewBookingForm onSubmit={handleFormSubmit} onClose={handleCloseModal}/>
      </Dialog>

      {
        submittedData && (
          <Dialog
          open={confirmationOpen}
          onClose={() => setConfirmationOpen(false)}
          fullWidth
          maxWidth="sm"
          scroll="paper"
          aria-labelledby="booking-dialog-confirmation-title">
            <Confirmation
            open={confirmationOpen}
            onClose={() => setConfirmationOpen(false)}
            serviceLocation={submittedData.serviceLocation}
            dateTime={submittedData.selectedDate}
            loanCloser={submittedData.loanCloser}
            customer={submittedData.borrowerFirstName + ' ' + submittedData.borrowerLastName}
            />
          </Dialog>
        )
      }
    </Box>
  );
};

export default Calendar;