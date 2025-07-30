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
  InputAdornment,
  IconButton,
  useMediaQuery,
  Snackbar,
  Autocomplete,
} from '@mui/material';
import {
  Email as EmailIcon,
  AttachFile as AttachFileIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
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
import { ClearIcon, DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useUrlQueryParams } from '../hooks/useUrlQueryParams';

// Custom sorting function for bookings
const sortBookings = (bookings: calendarBooking[]): calendarBooking[] => {
  return [...bookings].sort((a, b) => {
    const getStatusPriority = (status: BookingStatus | undefined) => {
      switch (status) {
        case 'inProgress': return 1;
        case 'upcoming': return 2;
        case 'completed': return 3;
        default: return 4;
      }
    };

    const statusPriorityA = getStatusPriority(a.status);
    const statusPriorityB = getStatusPriority(b.status);

    if (statusPriorityA !== statusPriorityB) {
      return statusPriorityA - statusPriorityB;
    }

    if (a.start?.dateTime && b.start?.dateTime) {
      const timeA = new Date(a.start.dateTime).getTime();
      const timeB = new Date(b.start.dateTime).getTime();
      return timeA - timeB;
    }

    if (!a.start?.dateTime) return 1;
    if (!b.start?.dateTime) return -1;

    return 0;
  });
};

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { queryParams, clearQueryParams, hasLoanId } = useUrlQueryParams();
  
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [dataFetched, setDataFetched] = useState(false);
  const [isLastOperationEdit, setIsLastOperationEdit] = useState(false);

  // Email functionality state
  const [emailMenuAnchor, setEmailMenuAnchor] = useState<null | HTMLElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [emailInputValue, setEmailInputValue] = useState('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const columns = createBookingColumns();
  
  const statusOptions = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];
  const [loanOfficersOptions, setLoanOfficersOptions] = useState<{id: string, label: string}[]>([]);
  const [serviceOptions, setServiceOptions] = useState<{ id: string, label: string }[]>([]);

  useEffect(() => {
    if (hasLoanId && !newBooking) {
      setNewBooking(true);
    }
  }, [hasLoanId, queryParams.loanId, newBooking]);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleConfirmationClose = () => {
    setShowSuccessMessage(false);
    setTimeout(() => {
      navigate('/calendar');
    }, 50);
  }

  const handleNewBookingClose = () => {
    setNewBooking(false);
    if (hasLoanId) {
      clearQueryParams();
    }
  }

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
      
      const sortedBookings = sortBookings(filteredBookings);

      setBookings(sortedBookings);
      setFilteredBookings(sortedBookings);

      const uniqueServices = Array.from(new Set(sortedBookings.map(booking => booking.serviceName)))
        .map(service => ({ id: service, label: service }));
      setServiceOptions(uniqueServices);
      
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
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MMMM d, yyyy'));
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MMM d, yyyy'));
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MM/dd/yyyy'));
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'yyyy-MM-dd'));
            
            values.push(TimezoneService.formatTimeForUser(booking.start.dateTime, 'h:mm a'));
            values.push(TimezoneService.formatTimeForUser(booking.start.dateTime, 'HH:mm'));
            values.push(TimezoneService.formatTimeForUser(booking.start.dateTime, 'h a'));
            
            values.push(TimezoneService.formatDateForUser(booking.start.dateTime, 'MMMM d, yyyy') + ' ' + 
                      TimezoneService.formatTimeForUser(booking.start.dateTime, 'h:mm a'));
          } catch (error) {
            console.warn('Error formatting date/time for search:', error);
          }
        }
        
        return values;
      };
      
      const searchableFields = [
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
        'loanData.loanPurpose',
        
        'serviceLocation.displayName',
        'serviceLocation.address.street',
        'serviceLocation.address.city',
        'serviceLocation.address.state',
        'serviceLocation.address.postalCode',
        
        'customers.0.name',
        'customers.0.emailAddress',
        'customers.0.phone'
      ];
      
      const specificLoanPurposeChecks = [
        booking.loanData?.loanPurpose,
        booking.loanData?.loanType,
      ].filter(Boolean).map(value => extractSearchableText(value).toLowerCase());
      
      const fieldMatches = searchableFields.some(fieldPath => {
        const value = getNestedValue(booking, fieldPath);
        const searchableText = extractSearchableText(value).toLowerCase();
        return searchableText.includes(lowercaseQuery);
      });
      
      const loanPurposeMatches = specificLoanPurposeChecks.some(text => 
        text.includes(lowercaseQuery)
      );
      
      const formattedDateTimeValues = getFormattedDateTimeValues(booking);
      const dateTimeMatches = formattedDateTimeValues.some(dateTimeValue => 
        dateTimeValue.toLowerCase().includes(lowercaseQuery)
      );
      
      const formattedStatus = booking.status ? (() => {
        switch (booking.status) {
          case 'upcoming': return 'Upcoming';
          case 'inProgress': return 'In Progress';
          case 'completed': return 'Completed';
          case 'canceled': return 'Canceled';
          default: return booking.status;
        }
      })() : '';
      const statusMatches = formattedStatus.toLowerCase().includes(lowercaseQuery);
      
      const borrowerNameMatches = (() => {
        if (booking.loanData) {
          const fullName = `${booking.loanData.borrowerFirstName || ''} ${booking.loanData.borrowerLastName || ''}`.trim().toLowerCase();
          return fullName.includes(lowercaseQuery);
        }
        return false;
      })();
      
      return fieldMatches || 
             loanPurposeMatches || 
             dateTimeMatches || 
             statusMatches || 
             borrowerNameMatches;
    };
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(booking => searchInBooking(booking, searchQuery));
    }
    
    if (statusFilter.length > 0) {
      filtered = filtered.filter(booking => {
        if(!booking.status) return false;
        return statusFilter.includes(booking.status);
      });
    }

    if (officersFilter.length > 0) {
      filtered = filtered.filter(booking => {
        if (!booking.loanData) return false;
        const officer = booking.loanData.loanOfficer || booking.LoanOfficer;
        return officer && officersFilter.includes(officer);
      });
    }
    
    if (serviceFilter) {
      filtered = filtered.filter(booking => booking.serviceName === serviceFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter(booking => isBookingOnDate(booking, dateFilter));
    }

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
        EmailService.createEMLFile(dataToEmail, columns, recipientEmails.join(', '));
        break;
      case 'mailto':
        const success = EmailService.openDefaultEmailClient(dataToEmail, columns, recipientEmails.join(', '));
        if (!success) {
          EmailService.createEMLFile(dataToEmail, columns, recipientEmails.join(', '));
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

  const handleSendEmailWithRecipients = async () => {
    if (recipientEmails.length === 0) {
      alert('Please add at least one email recipient.');
      return;
    }

    setIsSending(true);
    const dataToEmail = selectedBookings.length > 0 ? selectedBookings : filteredBookings;
    
    try {
      await EmailService.sendEmailWithRecipient(dataToEmail, columns, recipientEmails);
      setEmailDialogOpen(false);
      setRecipientEmails([]);
      setEmailInputValue('');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailRecipientsChange = (event: any, newValue: string[]) => {
    const validEmails = newValue.filter((email, index, self) => 
      isValidEmail(email) && self.indexOf(email) === index
    );
    setRecipientEmails(validEmails);
  };

  const handleEmailInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && emailInputValue.trim()) {
      event.preventDefault();
      const email = emailInputValue.trim();
      
      if (isValidEmail(email) && !recipientEmails.includes(email)) {
        setRecipientEmails([...recipientEmails, email]);
        setEmailInputValue('');
      }
    }
  };

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
      if (hasLoanId) {
        clearQueryParams();
      }
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
        <Box id="new-booking-mobile">
          <Button
            id= "newBooking"
            variant="contained"
            onClick={() => setNewBooking(!newBooking)}
          >
            New Booking
          </Button>
        </Box>
      </Box>

      <Box id="bookings-header">
        <Box id="search-bar">
          <SearchBar
            placeholder="Search schedules..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </Box>
        
        <Box id="date-filter" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DatePicker 
            label="Filter by Date" 
            value={selectedDate}
            onChange={(newValue) => {
              setSelectedDate(newValue);
              if (newValue) {
                const formattedDate = TimezoneService.formatDateForUser(newValue.toISOString(), 'yyyy-MM-dd');
                setDateFilter(formattedDate);
              } else {
                setDateFilter('');
              }
            }}
            componentsProps={{
              actionBar: {
                actions: ['clear'],
              },
            }}
            slotProps={{ 
              textField: { 
                size: 'small',
                placeholder: 'Select date to filter',
              },
              actionBar: {
                actions: ['clear'],
              },
            }}
            sx={{
              width: '100%',
            }}
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
        </Box>
        
        <Box id="actions">
          <Box id="new-booking-desktop">
            <Button
              id= "newBooking"
              variant="contained"
              onClick={() => setNewBooking(!newBooking)}
            >
              New Booking
            </Button>
          </Box>
          <Button
            id='button'
            variant={isSmall ? 'contained' : 'outlined'}
            onClick={handleExport}
          >
            {selectedBookings.length > 0 
              ? `Export Selected (${selectedBookings.length})` 
              : 'Export All'
            }
          </Button>
  
          <Button
            id='button'
            variant={isSmall ? 'contained' : 'outlined'}
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
            primary="Send to Recipients" 
            secondary="Specify email addresses"
          />
        </MenuItem>
      </Menu>

      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Bookings Report</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, pt: 1}}>
            <Autocomplete
              multiple
              freeSolo
              value={recipientEmails}
              onChange={handleEmailRecipientsChange}
              inputValue={emailInputValue}
              onInputChange={(event, newInputValue) => {
                setEmailInputValue(newInputValue);
              }}
              options={[]}
              renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      variant="outlined"
                      label={option}
                      {...tagProps}
                      sx={{
                        backgroundColor: isValidEmail(option) ? 'primary.main' : 'error.main',
                        color: isValidEmail(option) ? 'white' : 'white',
                        '& .MuiChip-deleteIcon': {
                          color: 'white',
                        },
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Email Recipients"
                  placeholder="Type email addresses and press Enter"
                  helperText="Press Enter to add each email address. You can add multiple recipients."
                  onKeyDown={handleEmailInputKeyDown}
                  fullWidth
                />
              )}
              sx={{ mb: 2 }}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {recipientEmails.length > 0 && (
              <>
                Recipients: <strong>{recipientEmails.length}</strong> email(s)
                <br />
              </>
            )}
            {selectedBookings.length > 0 && `Including ${selectedBookings.length} selected bookings.`}
          </Typography>

          {recipientEmails.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recipients ({recipientEmails.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {recipientEmails.map((email, index) => (
                  <Chip
                    key={index}
                    label={email}
                    size="small"
                    variant="outlined"
                    color={isValidEmail(email) ? 'primary' : 'error'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEmailDialogOpen(false);
            setRecipientEmails([]);
            setEmailInputValue('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmailWithRecipients} 
            variant="contained" 
            disabled={isSending || recipientEmails.length === 0}
            startIcon={isSending ? <CircularProgress size={16} /> : <EmailIcon />}
          >
            {isSending ? 'Sending...' : `Send to ${recipientEmails.length} Recipient${recipientEmails.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', height: 'auto' }}>
          <CircularProgress size={30} thickness={4} sx={{ my: 1 }} />
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
          prefilledLoanId={queryParams.loanId}
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
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={() => setSnackbarOpen(false)}
      message="Email sent successfully to all recipients"
    />
    </LocalizationProvider>
    
  );
};

export default Bookings;