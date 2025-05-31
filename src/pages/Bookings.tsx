import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  useTheme,
  Dialog,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Email as EmailIcon,
  AttachFile as AttachFileIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import AppTable from '../components/common/AppTable';
import SearchBar from '../components/common/SearchBar';
import { Booking } from '../types/booking';
import { bookingService } from '../services/bookingService';
import { BookingStatus, calendarBooking } from '../types/calendarBooking';
import { addStatusToBookings, determineBookingStatus } from '../services/bookingsUtils';
import { Column, createBookingColumns, exportBookingsToExcel } from '../services/exportToExcel';
import FilterDropdown from '../components/common/FilterDropDownComp';
import { formatDateForApi } from '../services/calendarUtils';
import { endOfYear, startOfYear } from 'date-fns';
import { BookingService } from '../types/service';
import CreateBookingForm from '../components/forms/NewBookingForm';
import { CreateAppointmentRequest } from '../types/CreateAppointmentRequest';
import { LoanDetails } from '../types/loanDetails';
import Confirmation from '../components/forms/Confirmation';
import { EmailService } from '../services/emailService'; 
import { TimezoneService } from '../services/timezoneUtils';

// Custom sorting function for bookings
const sortBookings = (bookings: calendarBooking[]): calendarBooking[] => {
  return [...bookings].sort((a, b) => {
    // Define status priority: inProgress = 1, upcoming = 2, completed = 3
    const getStatusPriority = (status: BookingStatus | undefined) => {
      switch (status) {
        case 'inProgress': return 1;
        case 'upcoming': return 2;
        case 'completed': return 3;
        default: return 4; // For any other status
      }
    };

    const statusPriorityA = getStatusPriority(a.status);
    const statusPriorityB = getStatusPriority(b.status);

    // First sort by status priority
    if (statusPriorityA !== statusPriorityB) {
      return statusPriorityA - statusPriorityB;
    }

    // If same status, sort by time (earliest first)
    if (a.start?.dateTime && b.start?.dateTime) {
      const timeA = new Date(a.start.dateTime).getTime();
      const timeB = new Date(b.start.dateTime).getTime();
      return timeA - timeB;
    }

    // If one doesn't have a start time, put it at the end
    if (!a.start?.dateTime) return 1;
    if (!b.start?.dateTime) return -1;

    return 0;
  });
};

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    start: startOfYear(new Date()),
    end: endOfYear(new Date()),
  });
  const [bookings, setBookings] = useState<calendarBooking[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<calendarBooking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<calendarBooking[]>([]);
  const [newBooking, setNewBooking] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [submittedData, setSubmittedData] = useState<CreateAppointmentRequest | null>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>();

  const [loading, setLoading] = useState(true);
  const [loadingPostResponse, setLoadingPostResponse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);
  const [officersFilter, setOfficersFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [dataFetched, setDataFetched] = useState(false);
  const [isLastOperationEdit, setIsLastOperationEdit] = useState(false);

  // Email functionality state
  const [emailMenuAnchor, setEmailMenuAnchor] = useState<null | HTMLElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  const columns = createBookingColumns();
  
  const statusOptions = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];
  const [loanOfficersOptions, setLoanOfficersOptions] = useState<{id: string, label: string}[]>([]);
  const [serviceOptions, setServiceOptions] = useState<{ id: string, label: string }[]>([]);
  const [dateOptions, setDateOptions] = useState<{ id: string, label: string }[]>([]);

  const handleConfirmationClose = () => {
    setShowSuccessMessage(false);
    setTimeout(() => {
      navigate('/calendar');
    }, 50);
  }

  const handleNewBookingClose = () => {
    setNewBooking(false);
  }

  // New handler for selection change
  const handleSelectionChange = (selectedRows: calendarBooking[]) => {
    setSelectedBookings(selectedRows);
  };

  const getUniqueDatesFromBookings = (bookings: calendarBooking[]): { id: string, label: string }[] => {
    const dateMap = new Map<string, string>();
    
    bookings.forEach(booking => {
      if (booking.start?.dateTime) {
        try {
          const dateId = TimezoneService.formatDateForUser(booking.start.dateTime, 'yyyy-MM-dd');
          const dateLabel = TimezoneService.formatDateForUser(booking.start.dateTime, 'MMMM d, yyyy');
          dateMap.set(dateId, dateLabel);
        } catch (error) {
          console.warn('Error processing date for booking:', booking.bookingId, error);
        }
      }
    });
    
    return Array.from(dateMap.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime());
  };

  const fetchBookingsData = useCallback(async () => {
    try {
      const formattedStart = formatDateForApi(dateRange.start);
      const formattedEnd = formatDateForApi(dateRange.end);
      
      const response = await bookingService.getCalendarData(formattedStart, formattedEnd);
      
      const bookingsWithStatus = addStatusToBookings(response);
      const filteredBookings = bookingsWithStatus.filter(booking => booking.bookingId !== null);
      
      // Apply custom sorting
      const sortedBookings = sortBookings(filteredBookings);

      setBookings(sortedBookings);
      setFilteredBookings(sortedBookings);

      const uniqueServices = Array.from(new Set(sortedBookings.map(booking => booking.serviceName)))
        .map(service => ({ id: service, label: service }));
      setServiceOptions(uniqueServices);
      
      const loanOfficers = Array.from(new Set(sortedBookings.map(booking => booking.loanData.loanOfficer)))
        .map(loanOfficer => ({ id: loanOfficer, label: loanOfficer }));
      setLoanOfficersOptions(loanOfficers);

      const uniqueDates = getUniqueDatesFromBookings(sortedBookings);
      setDateOptions(uniqueDates);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  }, []);
  
  useEffect(() => {
    const fetchAllData = async () => {
      if (dataFetched) return;
      try {
        setLoading(true);
        await fetchBookingsData();
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dataFetched, fetchBookingsData]);
  
  // Filter bookings when search query or filter values change
  useEffect(() => {
    let filtered = [...bookings];
    
    const searchInBooking = (booking: calendarBooking, query: string): boolean => {
      const lowercaseQuery = query.toLowerCase();
      
      const getNestedValue = (obj: any, path: string): string => {
        return path.split('.').reduce((current, key) => current?.[key], obj) || '';
      };
      
      const extractSearchableText = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      };
      
      const getFormattedDateTimeValues = (booking: calendarBooking): string[] => {
        const values: string[] = [];
        
        if (booking.start?.dateTime) {
          try {
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MMMM d, yyyy')); // "June 1, 2025"
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MMM d, yyyy'));   // "Jun 1, 2025"
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MM/dd/yyyy'));    // "06/01/2025"
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'yyyy-MM-dd'));    // "2025-06-01"
            
            values.push(TimezoneService.formatTimeForUser(booking.start.dateTime, 'h:mm a'));        // "9:00 AM"
            values.push(TimezoneService.formatTimeForUser(booking.start.dateTime, 'HH:mm'));         // "09:00"
            values.push(TimezoneService.formatTimeForUser(booking.start.dateTime, 'h a'));           // "9 AM"
            
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MMMM d, yyyy') + ' ' + 
                      TimezoneService.formatTimeForUser(booking.start.dateTime, 'h:mm a')); // "June 1, 2025 9:00 AM"
          } catch (error) {
            console.warn('Error formatting date/time for search:', error);
          }
        }
        
        return values;
      };
      
      const searchableFields = [
        // Direct booking properties
        'bookingId',
        'customerName',
        'serviceName',
        'customerEmailAddress',
        'customerPhone',
        'status',
        'encompassLoanId',
        'LoanCloser',
        'LoanOfficer',
        'dpa',
        
        // Loan data properties
        'loanData.borrowerFirstName',
        'loanData.borrowerLastName',
        'loanData.borrowerEmail',
        'loanData.borrowerPhone',
        'loanData.borrowerAddress',
        'loanData.borrowerCity',
        'loanData.borrowerState',
        'loanData.borrowerZipCode',
        'loanData.loanNumber',
        'loanData.loanType',
        'loanData.loanAmount',
        'loanData.loanOfficer',
        'loanData.loanCloser',
        'loanData.dpa',
        'loanData.notes',
        
        // Service location properties
        'serviceLocation.displayName',
        'serviceLocation.address.street',
        'serviceLocation.address.city',
        'serviceLocation.address.state',
        'serviceLocation.address.postalCode',
        
        // Customer array (if exists)
        'customers.0.name',
        'customers.0.emailAddress',
        'customers.0.phone'
      ];
      
      // Search through all defined fields
      const fieldMatches = searchableFields.some(fieldPath => {
        const value = getNestedValue(booking, fieldPath);
        const searchableText = extractSearchableText(value).toLowerCase();
        return searchableText.includes(lowercaseQuery);
      });
      
      // Search through formatted date/time values
      const formattedDateTimeValues = getFormattedDateTimeValues(booking);
      const dateTimeMatches = formattedDateTimeValues.some(dateTimeValue => 
        dateTimeValue.toLowerCase().includes(lowercaseQuery)
      );
      
      // Also search for status in formatted form
      const formattedStatus = booking.status ? (() => {
        switch (booking.status) {
          case 'upcoming': return 'Upcoming';
          case 'inProgress': return 'In Progress';
          case 'completed': return 'Completed';
          case 'canceled': return 'Canceled';
          // default: return booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
        }
      })() : '';
      const statusMatches = formattedStatus.toLowerCase().includes(lowercaseQuery);
      
      return fieldMatches || dateTimeMatches || statusMatches;
    };
    
    // Apply search query filter using enhanced search
    if (searchQuery.trim()) {
      filtered = filtered.filter(booking => searchInBooking(booking, searchQuery));
    }
    
    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(booking => {
        if(!booking.status) return false;
        return statusFilter.includes(booking.status);
      });
    }

    // Apply loan Officers filter
    if (officersFilter.length > 0) {
      filtered = filtered.filter(booking => {
        if (!booking.loanData) return false;
        const officer = booking.loanData.loanOfficer || booking.LoanOfficer;
        return officer && officersFilter.includes(officer);
      });
    }
    
    // Apply location filter
    if (serviceFilter) {
      filtered = filtered.filter(booking => booking.serviceName === serviceFilter);
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(booking => isBookingOnDate(booking, dateFilter));
    }

    // Apply sorting to filtered results
    const sortedFiltered = sortBookings(filtered);
    setFilteredBookings(sortedFiltered);
  }, [searchQuery, bookings, statusFilter, officersFilter, serviceFilter, dateFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (value: string | string[]) => {
    setStatusFilter(value as BookingStatus[]);
  };

  const handleOfficersFilterChange = (value: string | string[]) => {
    setOfficersFilter(value as string[]);
  };

  const handleServiceFilterChange = (value: string | string[]) => {
    setServiceFilter(value as string);
  };

  const handleDateFilterChange = (value: string | string[]) => {
    setDateFilter(value as string);
  };

  const isBookingOnDate = (booking: calendarBooking, selectedDate: string): boolean => {
    if (!booking.start?.dateTime || !selectedDate) return true;
    
    try {
      const bookingDateId = TimezoneService.formatDateForUser(booking.start.dateTime, 'yyyy-MM-dd');
      return bookingDateId === selectedDate;
    } catch (error) {
      console.warn('Error comparing dates:', error);
      return false;
    }
  };

  // Email functionality handlers
  const handleEmailMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEmailMenuAnchor(event.currentTarget);
  };

  const handleEmailMenuClose = () => {
    setEmailMenuAnchor(null);
  };

  const handleEmailOption = (option: 'eml' | 'mailto' | 'copy') => {
    const dataToEmail = selectedBookings.length > 0 ? selectedBookings : filteredBookings;
    
    switch (option) {
      case 'eml':
        EmailService.createEMLFile(dataToEmail, columns, recipientEmail);
        break;
      case 'mailto':
        const success = EmailService.openDefaultEmailClient(dataToEmail, columns, recipientEmail);
        if (!success) {
          // Fallback to EML if mailto fails
          EmailService.createEMLFile(dataToEmail, columns, recipientEmail);
        }
        break;
      case 'copy':
        EmailService.copyToClipboard(dataToEmail, columns).then(success => {
          if (success) {
            alert('Bookings data copied to clipboard! You can now paste it into any email client.');
          } else {
            alert('Failed to copy to clipboard. Please try another option.');
          }
        });
        break;
    }
    
    handleEmailMenuClose();
  };

  const handleEmailWithRecipient = () => {
    setEmailDialogOpen(true);
    handleEmailMenuClose();
  };

  const handleSendEmailWithRecipient = async () => {
    const dataToEmail = selectedBookings.length > 0 ? selectedBookings : filteredBookings;
    await EmailService.sendEmailWithRecipient(dataToEmail, columns, recipientEmail);
    setEmailDialogOpen(false);
    setRecipientEmail('');
  };

  // Export handler
  const handleExport = () => {
    const dataToExport = selectedBookings.length > 0 ? selectedBookings : filteredBookings;
    const filename = selectedBookings.length > 0 
      ? `bookings_selected_${selectedBookings.length}_items.xlsx`
      : 'bookings_export.xlsx';
    
    exportBookingsToExcel(dataToExport, columns, filename);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

const handleBookingSuccess = async (bookingData: CreateAppointmentRequest, response: any) => {
  try {
    setNewBooking(false);
    setLoadingPostResponse(true);
    setSubmittedData(bookingData);
    
    setIsLastOperationEdit(false);
    
    const realLoanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId);
    setLoanDetails(realLoanDetails);
    
    setShowSuccessMessage(true);
    
    await fetchBookingsData();
  } catch (error) {
    console.error('Error fetching Loan Details:', error);
    setShowSuccessMessage(true);
  } finally {
    setLoadingPostResponse(false);
  }
};

const handleEditSuccess = async (bookingData: CreateAppointmentRequest, response: any) => {
  try {
    setLoadingPostResponse(true);
    setSubmittedData(bookingData);
    
    setIsLastOperationEdit(true);
    
    const realLoanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId);
    setLoanDetails(realLoanDetails);
    
    setShowSuccessMessage(true);
    
    await fetchBookingsData();
  } catch (error) {
    console.error('Error fetching Loan Details:', error);
    setShowSuccessMessage(true);
  } finally {
    setLoadingPostResponse(false);
  }
};

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: 36,
          }}
        >
          Bookings
        </Typography>
        <Button
          variant="contained"
          onClick={() => setNewBooking(!newBooking)}
        >
          New Booking
        </Button>
      </Box>

      <Box
        id = "bookings-header"
      >
        <Box id="search-bar">
          <SearchBar
            placeholder="Search schedules..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </Box>
        
        <Box id="filters">
          <FilterDropdown
            id="status-filter"
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusFilterChange}
          />
          
          <FilterDropdown
            id="officers-filter"
            label="Loan Officers"
            options={loanOfficersOptions}
            value={officersFilter}
            onChange={handleOfficersFilterChange}
          />
          
          <FilterDropdown
            id="service-filter"
            label="Service"
            options={serviceOptions}
            value={serviceFilter}
            onChange={handleServiceFilterChange}
          />

          <FilterDropdown
            id="date-filter"
            label="Date"
            options={dateOptions}
            value={dateFilter}
            onChange={handleDateFilterChange}
          />
        </Box>
        
        <Box id="actions">
          <Button
            id='button'
            variant="contained"
            onClick={handleExport}
          >
            {selectedBookings.length > 0 
              ? `Export Selected (${selectedBookings.length})` 
              : 'Export All'
            }
          </Button>
  
          <Button
            id='button'
            variant="contained"
            onClick={handleEmailMenuOpen}
            endIcon={<ExpandMoreIcon />}
          >
            Email to
          </Button>
        </Box>
      </Box>

      {/* Email Menu */}
      <Menu
        anchorEl={emailMenuAnchor}
        open={Boolean(emailMenuAnchor)}
        onClose={handleEmailMenuClose}
        PaperProps={{
          style: {
            maxHeight: 200,
            width: '250px',
          },
        }}
      >        
        <MenuItem onClick={() => handleEmailOption('copy')}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Copy to Clipboard" 
            secondary="Paste in any email"
          />
        </MenuItem>
        
        <MenuItem onClick={handleEmailWithRecipient}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Send to Recipient" 
            secondary="Specify email address"
          />
        </MenuItem>
      </Menu>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Bookings Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Recipient Email"
            type="email"
            fullWidth
            variant="outlined"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Enter recipient's email address"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will create an EML file with the bookings data that you can send via email.
            {selectedBookings.length > 0 && ` Including ${selectedBookings.length} selected bookings.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendEmailWithRecipient} variant="contained">
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', height: 'auto' }}>
          <CircularProgress size={30} thickness={4} sx={{ my: 1 }} />
        </Box>
      )}

      {/* NEW BOOKING DIALOG */}
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
        />
      </Dialog>

      {loadingPostResponse && (
        <Dialog
          open={loadingPostResponse}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            style: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              overflow: 'hidden',
              zIndex: 1000,
            }
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 2
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {isLastOperationEdit ? "Updating booking...": "Creating booking..."}
            </Typography>
          </Box>
        </Dialog>
      )}

      {/* NEW BOOKING CONFIRMATION */}
      {showSuccessMessage && submittedData && (
        <Dialog
          open={showSuccessMessage}
          onClose={handleConfirmationClose}
          fullWidth
          maxWidth="sm"
          scroll="paper"
          aria-labelledby="booking-dialog-confirmation-title"
        >
          <Confirmation
            open={showSuccessMessage}
            onClose={handleConfirmationClose}
            booking={submittedData}
            loanDetails={loanDetails}
            editMode={isLastOperationEdit}
          />
        </Dialog>
      )}

      <AppTable
        selectable={true}
        columns={columns}
        availableServices={services}
        followers={followers}
        rows={filteredBookings}
        onSelectionChange={handleSelectionChange}
        onEditSuccess={handleEditSuccess}
      />
    </Box>
  );
};

export default Bookings;