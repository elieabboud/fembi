import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Avatar, Box, Button, Chip, Dialog, Paper, Stack, Typography, CircularProgress } from '@mui/material';
import CalendarViewSelector, { CalendarViewType } from './CalendarViewSelector';
import WeekView from './WeekView';
import DayView from './DayView';
import AgendaView from './AgendaView';
import MonthView from './MonthView';
import Confirmation from '../forms/Confirmation';
import CalendarHeader from './CalendarHeader';
import { addDays, subDays, addMonths, subMonths, startOfWeek, endOfWeek, format, isEqual } from 'date-fns';
import { calendarBooking } from '../../types/calendarBooking';
import { parseDateTime } from '../../services/calendarUtils';
import CreateBookingForm from '../forms/NewBookingForm';
import { useAuth } from '../../context/AuthContext';
import FollowersInput from '../profile/FollowersInput';
import { CreateAppointmentRequest } from '../../types/CreateAppointmentRequest';
import { Dns } from '@mui/icons-material';
import { bookingService } from '../../services/bookingService';
import { LoanDetails } from '../../types/loanDetails';
import { User } from '../../types/userModel';
import LoanAgentsInput from './LoanAgentsInput';
import BookingColorLegend from './BookingColorLegend';

interface CalendarContainerProps {
  bookings: calendarBooking[];
  onDateRangeChange: (date: Date, view: CalendarViewType) => void;
  isFetchingMore?: boolean;
  prefilledLoanId?: string;
  clearQueryParams?: () => void;
}

const CalendarContainer: React.FC<CalendarContainerProps> = ({ 
  bookings, 
  onDateRangeChange,
  isFetchingMore = false,
  prefilledLoanId,
  clearQueryParams
}) => {
  const { isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [newBooking, setNewBooking] = useState(false);
  const [showEditBooking, setShowEditBooking] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loanAgents, setLoanAgents] = useState<User[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<User[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<calendarBooking[]>([]);
  const [selectedRow, setSelectedRow] = useState<calendarBooking | undefined>();
  const [submittedData, setSubmittedData] = useState<CreateAppointmentRequest | null>({
    ServiceId: "svc123",
    ServiceName: "Home Loan Consultation",
    ServicePrice: 150.0,
    EncompassDetails: {
      EncompassLoanId: "loan-abc-123",
      LoanCloser: "",
      LoanOfficer: "",
      dpa: ""
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
  const [loanDetails, setLoanDetails] = useState<LoanDetails>();
  const [isLastOperationEdit, setIsLastOperationEdit] = useState(false);
  
  // Track the last applied date/view to prevent unnecessary updates
  const lastAppliedRef = useRef<{ date: Date, view: CalendarViewType } | null>(null);

  useEffect(() => {
    if (prefilledLoanId && !newBooking) {
      setNewBooking(true);
    }
  }, [prefilledLoanId, newBooking]);
  
  // Centralized function to update date and view with a single API call
  const updateDateAndView = useCallback((date: Date, view: CalendarViewType) => {
    // Check if this is actually a change to avoid unnecessary updates
    if (lastAppliedRef.current && 
        isEqual(lastAppliedRef.current.date, date) && 
        lastAppliedRef.current.view === view) {
      return; // No change, don't update
    }
    
    // Update our tracking of what's been applied
    lastAppliedRef.current = { date, view };
    
    setCurrentDate(date);
    setCurrentView(view);
    
    // Notify parent with a single call
    onDateRangeChange(date, view);
  }, [onDateRangeChange]);

  const handleViewChange = useCallback((view: CalendarViewType) => {
    updateDateAndView(currentDate, view);
  }, [currentDate, updateDateAndView]);

  const handleDateChange = useCallback((date: Date) => {
    updateDateAndView(date, currentView);
  }, [currentView, updateDateAndView]);

  const handleToday = useCallback(() => {
    const today = new Date();
    updateDateAndView(today, currentView);
  }, [currentView, updateDateAndView]);

  const handlePrev = useCallback(() => {
    let newDate: Date;
    
    if (currentView === 'month') {
      newDate = subMonths(currentDate, 1);
    } else if (currentView === 'week' || currentView === 'agenda') {
      newDate = startOfWeek(subDays(currentDate, 7), { weekStartsOn: 0 });
    } else {
      newDate = subDays(currentDate, 1);
    }
    
    updateDateAndView(newDate, currentView);
  }, [currentDate, currentView, updateDateAndView]);

  const handleNext = useCallback(() => {
    let newDate: Date;
    
    if (currentView === 'month') {
      newDate = addMonths(currentDate, 1);
    } else if (currentView === 'week' || currentView === 'agenda') {
      newDate = startOfWeek(addDays(currentDate, 7), { weekStartsOn: 0 });
    } else {
      newDate = addDays(currentDate, 1);
    }
    
    updateDateAndView(newDate, currentView);
  }, [currentDate, currentView, updateDateAndView]);

  const onConfirmationClose = () => {
    setShowSuccessMessage(false);
    window.location.reload();
  }

  const handleBookingSuccess = async (bookingData: CreateAppointmentRequest, response: any) => {
  setShowSuccessMessage(true);
  setIsLastOperationEdit(showEditBooking);
  setNewBooking(false);
  setShowEditBooking(false);
  setSubmittedData(bookingData);
  
  if (clearQueryParams) {
    clearQueryParams();
  }
  
  try {
    // Fetch real loan details using the loan ID from the booking data
    const realLoanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId);
    setLoanDetails(realLoanDetails);
    
    // Refresh calendar data after successful booking
    onDateRangeChange(currentDate, currentView);
  } catch (error) {
    console.error('Error fetching Loan Details:', error);
    const fallbackLoanDetails: LoanDetails = {
      loanId: bookingData.EncompassDetails.EncompassLoanId,
      borrowerFirstName: bookingData.BorrowerInformation.FirstName,
      borrowerLastName: bookingData.BorrowerInformation.LastName,
      borrowerEmail: bookingData.BorrowerInformation.Email,
      borrowerPhone: bookingData.BorrowerInformation.PhoneNumber,
      borrowerAddress: bookingData.BorrowerInformation.Address.Street,
      borrowerCity: bookingData.BorrowerInformation.Address.City,
      borrowerState: bookingData.BorrowerInformation.Address.State,
      borrowerZipCode: bookingData.BorrowerInformation.Address.ZipCode,
      loanNumber: "N/A",
      loanType: "N/A",
      loanAmount: 0,
      loanOfficer: bookingData.EncompassDetails.LoanOfficer || "N/A",
      loanOfficerEmail: bookingData.EncompassDetails.loanOfficerEmail || "N/A",
      notes: "",
      loanCloser: bookingData.EncompassDetails.LoanCloser || "N/A",
      loanCloserEmail: bookingData.EncompassDetails.loanCloserEmail || "N/A",
      dpa: bookingData.EncompassDetails.dpa || "N/A",
      followers: null,
      loanPurpose: "N/A"
    };
    setLoanDetails(fallbackLoanDetails);
  }
};

  const handleEventClick = useCallback((booking: calendarBooking) => {
    
    // Store the original selected item for edit mode
    localStorage.setItem("selectedItem", JSON.stringify(booking.start));
    
    // Set the selected booking for editing
    setSelectedRow(booking);
    setShowEditBooking(true);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    updateDateAndView(date, 'day');
  }, [updateDateAndView]);

  // UPDATED: Clear URL params when modal closes
  const handleNewBookingClose = () => {
    setNewBooking(false);
    if (clearQueryParams) {
      clearQueryParams();
    }
  };
  
  const renderCalendarView = () => {
    switch (currentView) {
      case 'week':
        return (
          <WeekView 
            currentDate={currentDate} 
            events={filteredBookings} 
            onDateChange={handleDateChange} 
            onEventClick={handleEventClick}
          />
        );
      case 'day':
        return (
          <DayView 
            currentDate={currentDate} 
            events={filteredBookings} 
            onDateChange={handleDateChange} 
            onEventClick={handleEventClick}
          />
        );
      case 'agenda':
        return (
          <AgendaView 
            currentDate={currentDate} 
            events={filteredBookings} 
            onDateChange={handleDateChange} 
            onEventClick={handleEventClick}
          />
        );
      case 'month':
      default:
        return (
          <MonthView
            currentDate={currentDate} 
            events={filteredBookings}
            onDateChange={handleDateChange} 
            onEventClick={handleEventClick}
            onViewChange={handleViewChange}
            onDayClick={handleDayClick}
          />
        );
    }
  };

  const fetchUsersFromDatabase = async () => {
    try {
      const response = await bookingService.getUsers({ tableName: 'user' });
      const agents = response.result as unknown as User[];
      const agentsWithBookings = agents.filter(agent => {
        const agentMicrosoftId = String(agent.microsoft_id);
        
        // Check if this agent has any bookings
        const hasBookings = bookings.some(booking => {
          const bookingOwnerId = String(booking.ownerId);
          return bookingOwnerId === agentMicrosoftId;
        });
        
        return hasBookings;
      });
      setLoanAgents(agentsWithBookings);
    } catch (error) {
      console.error('Error fetching users from database: ', error);
    }
  };

  const handleAgentsChange = useCallback((newSelectedAgents: User[]) => {
    setSelectedAgents(newSelectedAgents);
  }, []);

  const applyAgentFiltering = useCallback(() => {
    
    // If no agents are selected, show no bookings (empty filter)
    if (selectedAgents.length === 0) {
      setFilteredBookings([]);
      return;
    }

    // Create a set of selected agent microsoft_ids for efficient lookup
    const selectedAgentIds = new Set(
      selectedAgents.map(agent => String(agent.microsoft_id))
    );
        
    // Filter bookings where ownerId matches any selected agent's microsoft_id
    const filtered = bookings.filter(booking => {
      const ownerIdStr = String(booking.ownerId);
      const matches = selectedAgentIds.has(ownerIdStr);
      return matches;
    });
    
    setFilteredBookings(filtered);
  }, [bookings, selectedAgents]);
  
  // Initialize agents on component mount
  useEffect(() => {
     if (isAdmin && bookings.length > 0) {
        fetchUsersFromDatabase();
      }
  }, [isAdmin, bookings]);

  // Initialize selectedAgents with all agents when agents are first loaded
  useEffect(() => {
    if (loanAgents.length > 0 && selectedAgents.length === 0) {
      const allAgents = [...loanAgents];
      setSelectedAgents(allAgents);
    }
  }, [loanAgents]);

  // Apply filtering whenever bookings or selected agents change
  useEffect(() => {
    applyAgentFiltering();
  }, [applyAgentFiltering]);

  // If not admin or no bookings, show all bookings without filtering
  useEffect(() => {
    if (!isAdmin) {
      setFilteredBookings(bookings);
    }
  }, [bookings, isAdmin]);

  return (
    <Box>      
      {/* TITLE + NEW BOOKING BUTTON */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: {xs: 1, md: 3} }}>
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

      {/* COLOR LEGEND */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <BookingColorLegend 
          bookings={filteredBookings}
          variant="compact"
          orientation="horizontal"
          showCounts={true}
          maxItems={6}
        />
      </Box>

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

      {/* LOAN AGENTS FILTER */}
      {isAdmin && loanAgents.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Filter by Loan Officers
          </Typography>
          <LoanAgentsInput 
            agents={loanAgents}
            selectedAgents={selectedAgents}
            onChange={handleAgentsChange} 
            label="Select Loan Officers"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredBookings.length} of {bookings.length} bookings
              {selectedAgents.length === 0 ? ' (no officer selected)' :
               selectedAgents.length < loanAgents.length ? 
                ` (filtered by ${selectedAgents.length} agent${selectedAgents.length !== 1 ? 's' : ''})` :
                ' (all officers with bookings selected)'
              }
            </Typography>
          </Box>
        </Box>
      )}

 
      <Dialog
        open={newBooking}
        onClose={handleNewBookingClose}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="booking-dialog-title"
      >
        <CreateBookingForm
        onSuccess={handleBookingSuccess}
        onClose={handleNewBookingClose}
        prefilledLoanId={prefilledLoanId}
        />
      </Dialog>
      
      {/* EDIT BOOKING DIALOG */}
      <Dialog
        open={showEditBooking}
        onClose={() => setShowEditBooking(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="edit-booking-dialog-title"
      >
        <CreateBookingForm
          onSuccess={handleBookingSuccess}
          onClose={() => setShowEditBooking(false)}
          initialData={selectedRow}
          isEditMode={true}
        />
      </Dialog>
      
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
            onClose={onConfirmationClose}
            booking={submittedData}
            loanDetails={loanDetails}
            editMode={isLastOperationEdit}
          />
        </Dialog>
      )}
    </Box>
  );
};

export default CalendarContainer;