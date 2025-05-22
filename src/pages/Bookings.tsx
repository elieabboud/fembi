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
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [dataFetched, setDataFetched] = useState(false);

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
  const [locationOptions, setLocationOptions] = useState<{ id: string, label: string }[]>([]);

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

      const uniqueLocations = Array.from(new Set(sortedBookings.map(booking => booking.serviceLocation.displayName)))
        .map(location => ({ id: location, label: location }));
      setLocationOptions(uniqueLocations);
      
      const loanOfficers = Array.from(new Set(sortedBookings.map(booking => booking.loanData.loanOfficer)))
        .map(loanOfficer => ({ id: loanOfficer, label: loanOfficer }));
      setLoanOfficersOptions(loanOfficers);
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
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((booking) => {
        return (
          booking.loanData?.borrowerFirstName?.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerLastName?.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerAddress?.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerCity?.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerState?.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.loanOfficer?.toLowerCase().includes(lowercaseQuery)
        );
      });
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
        if(!booking.loanData) return false;
        return officersFilter.includes(booking.loanData.loanOfficer);
      });
    }
    
    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(booking => booking.serviceLocation.displayName === locationFilter);
    }

    // Apply sorting to filtered results as well
    const sortedFiltered = sortBookings(filtered);
    setFilteredBookings(sortedFiltered);
  }, [searchQuery, bookings, statusFilter, officersFilter, locationFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (value: string | string[]) => {
    setStatusFilter(value as BookingStatus[]);
  };

  const handleOfficersFilterChange = (value: string | string[]) => {
    setOfficersFilter(value as string[]);
  };

  const handleLocationFilterChange = (value: string | string[]) => {
    setLocationFilter(value as string);
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

  const handleSendEmailWithRecipient = () => {
    const dataToEmail = selectedBookings.length > 0 ? selectedBookings : filteredBookings;
    EmailService.createEMLFile(dataToEmail, columns, recipientEmail);
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
    <Box sx={{ px: 4, py: 2 }}>
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
        sx={{ 
          mb: 3, 
          display: 'flex', 
          flexDirection: {sm:'column', md:'row'}, 
          gap: {sm: '10px', md: '5px'}, 
          justifyContent: 'space-evenly', 
          alignItems: 'center', 
          flexWrap: 'wrap' 
        }}
      >
        <Box sx={{ flexGrow: 1, width: '100%', maxWidth: {md: '260px'} }}>
          <SearchBar
            placeholder="Search schedules..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </Box>
        
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: '10px' }}>
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
            id="location-filter"
            label="Location"
            options={locationOptions}
            value={locationFilter}
            onChange={handleLocationFilterChange}
          />
        </Box>
        
        <Box sx={{display: 'flex', justifyContent: {sm: 'start',md:'center'}, gap: 2, width: {sm:'100%', md: 'auto'}}}>
          <Button
            variant="contained"
            onClick={handleExport}
          >
            {selectedBookings.length > 0 
              ? `Export Selected (${selectedBookings.length})` 
              : 'Export All'
            }
          </Button>
  
          <Button
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
        <MenuItem onClick={() => handleEmailOption('eml')}>
          <ListItemIcon>
            <AttachFileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Create EML File" 
            secondary="Opens in email client"
          />
        </MenuItem>
        
        <MenuItem onClick={() => handleEmailOption('mailto')}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Quick Email" 
            secondary="Default email app"
          />
        </MenuItem>
        
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
            Create Email File
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
              Creating booking...
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
      />
    </Box>
  );
};

export default Bookings;