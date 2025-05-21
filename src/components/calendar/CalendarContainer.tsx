import React, { useEffect, useState, useCallback } from 'react';
import { Avatar, Box, Button, Chip, Dialog, Paper, Stack, Typography, CircularProgress } from '@mui/material';
import CalendarViewSelector, { CalendarViewType } from './CalendarViewSelector';
import WeekView from './WeekView';
import DayView from './DayView';
import AgendaView from './AgendaView';
import MonthView from './MonthView';
import Confirmation from '../forms/Confirmation';
import CalendarHeader from './CalendarHeader';
import { addDays, subDays, addMonths, subMonths, startOfWeek, endOfWeek, format } from 'date-fns';
import { calendarBooking } from '../../types/calendarBooking';
import { parseDateTime } from '../../services/calendarUtils';
import CreateBookingForm from '../forms/NewBookingForm';
import { useAuth } from '../../context/AuthContext';
import FollowersInput from '../profile/FollowersInput';
import { CreateAppointmentRequest } from '../../types/CreateAppointmentRequest';
import { Dns } from '@mui/icons-material';
import { bookingService } from '../../services/bookingService';
import { LoanDetails } from '../../types/loanDetails';

interface CalendarContainerProps {
  bookings: calendarBooking[];
  onDateRangeChange: (date: Date, view: CalendarViewType) => void;
  isFetchingMore?: boolean;
}

const CalendarContainer: React.FC<CalendarContainerProps> = ({ 
  bookings, 
  onDateRangeChange,
  isFetchingMore = false
}) => {
    const { isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [newBooking, setNewBooking] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(true);
  const [submittedData, setSubmittedData] = useState<CreateAppointmentRequest | null>({
    ServiceId: "svc123",
    ServiceName: "Home Loan Consultation",
    ServicePrice: 150.0,
    EncompassDetails: {
      EncompassLoanId: "loan-abc-123",
    },
    BorrowerInformation: {
      FirstName: "John",
      LastName: "Doe",
      Email: "john.doe@example.com",
      PhoneNumber: "+1234567890",
      Address: {
        Street: "123 Main St",
        City: "Springfield",
        State: "IL",
        ZipCode: "62704",
      },
    },
    DateTimeInfo: {
      SelectedDate: "2025-06-01",
      SelectedTime: "14:30",
      FromDate: "2025-06-01T14:30:00Z",
      ToDate: "2025-06-01T15:30:00Z",
    },
    Followers: "manager@example.com,assistant@example.com",
    Duration: "PT1H",
    PreBuffer: "PT15M",
    PostBuffer: "PT10M",
    PriceType: "Fixed",
    StaffMemberIds: ["staff001", "staff002"],
  });
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loanId: "c91c19fc-df1b-4f26-a664-902f3b05f4ce",
    borrowerFirstName: "Disclose HM",
    borrowerLastName: "Test",
    borrowerEmail: "hmartinez@fembi.com",
    borrowerPhone: "305-505-8479",
    borrowerAddress: "111 RD PALMAR WARD",
    borrowerCity: "Aguadilla",
    borrowerState: "PR",
    borrowerZipCode: "00603",
    loanNumber: "PR022408123184",
    loanType: "FHA QM",
    loanAmount: 235653,
    loanOfficer: "Maria Torres Botty",
    notes: "",
  });
  
  const handleViewChange = useCallback((view: CalendarViewType) => {
    setCurrentView(view);
    onDateRangeChange(currentDate, view);
  }, [currentDate, onDateRangeChange]);

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    onDateRangeChange(date, currentView);
  }, [currentView, onDateRangeChange]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    onDateRangeChange(today, currentView);
  }, [currentView, onDateRangeChange]);

  const handlePrev = useCallback(() => {
    let newDate: Date;
    
    if (currentView === 'month') {
      newDate = subMonths(currentDate, 1);
    } else if (currentView === 'week' || currentView === 'agenda') {
      newDate = startOfWeek(subDays(currentDate, 7), { weekStartsOn: 0 });
    } else {
      newDate = subDays(currentDate, 1);
    }
    
    setCurrentDate(newDate);
    onDateRangeChange(newDate, currentView);
  }, [currentDate, currentView, onDateRangeChange]);

  const handleNext = useCallback(() => {
    let newDate: Date;
    
    if (currentView === 'month') {
      newDate = addMonths(currentDate, 1);
    } else if (currentView === 'week' || currentView === 'agenda') {
      newDate = startOfWeek(addDays(currentDate, 7), { weekStartsOn: 0 });
    } else {
      newDate = addDays(currentDate, 1);
    }
    
    setCurrentDate(newDate);
    onDateRangeChange(newDate, currentView);
  }, [currentDate, currentView, onDateRangeChange]);

  const handleBookingSuccess = async (bookingData: CreateAppointmentRequest, response: any) => {
    setShowSuccessMessage(true);
    setSubmittedData(bookingData);
    setNewBooking(false);
    //to-do: refresh the page optionally

    //fetch loan details
    try{
      const loanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId);

      setLoanDetails(loanDetails);
    }catch (error) {
      console.error('Error fetching Loan Details:', error);
    }
  };
  
  const renderCalendarView = () => {
    switch (currentView) {
      case 'week':
        return (
          <WeekView 
            currentDate={currentDate} 
            events={bookings} 
            onDateChange={handleDateChange} 
          />
        );
      case 'day':
        return (
          <DayView 
            currentDate={currentDate} 
            events={bookings} 
            onDateChange={handleDateChange} 
          />
        );
      case 'agenda':
        return (
          <AgendaView 
            currentDate={currentDate} 
            events={bookings} 
            onDateChange={handleDateChange} 
          />
        );
      case 'month':
      default:
        return (
          <MonthView
            currentDate={currentDate} 
            events={bookings}
            onDateChange={handleDateChange} 
          />
        );
    }
  };

  return (
    <Box>      
      {/* TITLE + NEW BOOKING BUTTON */}
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
          onClick={() => {setNewBooking(!newBooking)}}
          sx={{height: 50, minWidth: 150, fontSize: 16, fontWeight: 'bold'}}
        >
          New Booking
        </Button>
      </Box>

      {/* HEADER */}
      <CalendarHeader
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={handleViewChange}
        currentView={currentView}
      />

      {/* LOADING INDICATOR */}
      {isFetchingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', height: 'auto' }}>
          <CircularProgress size={30} thickness={4} sx={{ my: 1 }} />
        </Box>
      )}

      {/* RENDERED VIEW */}
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
          {renderCalendarView()}
        </Box>
      </Box>

      {/* AGENTS */}
      {
        isAdmin && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Loan Agents
            </Typography>
            {/* to-do: fetch users from db and display as loan agents */}
            <FollowersInput 
            followers= {[
              'Alice Johnson',
              'Bob Smith',
              'Charlie Davis',
              'Diana Evans',
              'Ethan Brown',
              'Fiona Clark',
              'George Harris',
              'Hannah Lee',
              'Ian Miller',
              'Julia Roberts',]}
              />
          </Box>
        )
      }

      {/* NEW BOOKING DIALOG */}
      <Dialog
        open={newBooking}
        onClose={() => setNewBooking(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="booking-dialog-title"
      >
        <CreateBookingForm
        onSuccess={handleBookingSuccess}
        onClose= {() => setNewBooking(false)}/>
      </Dialog>
      
      {/* NEW BOOKING CONFIRMATION */}
      {submittedData && (
        <Dialog
          open={showSuccessMessage}
          onClose={() => setShowSuccessMessage(false)}
          fullWidth
          maxWidth="sm"
          scroll="paper"
          aria-labelledby="booking-dialog-confirmation-title"
        >
          <Confirmation
            open={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
            booking={submittedData}
            loanDetails={loanDetails}
          />
        </Dialog>
      )}
    </Box>
  );
};

export default CalendarContainer;