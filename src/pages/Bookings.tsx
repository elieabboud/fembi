import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { bookingService, PaginationRequest, PaginatedResponse } from '../services/bookingService';
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

  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestIdRef = useRef<string | null>(null);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [bookings, setBookings] = useState<calendarBooking[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<calendarBooking[]>([]);
  const [newBooking, setNewBooking] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [submittedData, setSubmittedData] = useState<CreateAppointmentRequest | null>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>();

  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [loadingPostResponse, setLoadingPostResponse] = useState(false);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [officersFilter, setOfficersFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null
  });

  const [sortBy, setSortBy] = useState<string>('start');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [isLastOperationEdit, setIsLastOperationEdit] = useState(false);

  const [emailMenuAnchor, setEmailMenuAnchor] = useState<null | HTMLElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [emailInputValue, setEmailInputValue] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [loanOfficersOptions, setLoanOfficersOptions] = useState<{id: string, label: string}[]>([]);
  const [serviceOptions, setServiceOptions] = useState<{ id: string, label: string }[]>([]);

  const statusOptions = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  const columns = createBookingColumns();

  useEffect(() => {
    if (hasLoanId && !newBooking) {
      setNewBooking(true);
    }
  }, [hasLoanId, queryParams.loanId, newBooking]);

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

  const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

const debouncedFetchBookings = useCallback((
    page: number = 1,
    resetPagination: boolean = false,
    immediate: boolean = false,
    isInitialLoad: boolean = false,
    customPageSize?: number
  ) => {
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const delay = immediate ? 0 : 300;

    fetchTimerRef.current = setTimeout(async () => {
      const requestId = generateRequestId();
      lastRequestIdRef.current = requestId;

      abortControllerRef.current = new AbortController();

      // Process date range to ensure end date includes full day
      let processedDateRange = undefined;
      if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
        processedDateRange = {
          startDate: dateRangeFilter.startDate ? formatDateForApi(dateRangeFilter.startDate) : undefined,
          endDate: dateRangeFilter.endDate ? 
            formatDateForApi(new Date(
              dateRangeFilter.endDate.getFullYear(), 
              dateRangeFilter.endDate.getMonth(), 
              dateRangeFilter.endDate.getDate(), 
              23, 59, 59, 999
            )) : undefined,
        };
      }

      const paginationRequest: PaginationRequest = {
        page: resetPagination ? 1 : page,
        pageSize: customPageSize || pagination.pageSize,
        sortBy,
        sortDirection,
        searchQuery: searchQuery.trim() || undefined,
        filters: {
          status: statusFilter && statusFilter.length > 0 ? statusFilter as BookingStatus[] : undefined,
          serviceLocation: serviceFilter && serviceFilter.trim() !== "" ? serviceFilter : undefined,
          loanOfficers: officersFilter && officersFilter.length > 0 ? officersFilter : undefined,
          dateRange: processedDateRange
        }
      };

      await fetchBookingsData(
        paginationRequest,
        resetPagination ? 1 : page,
        isInitialLoad,
        abortControllerRef.current.signal,
        requestId
      );
    }, delay);
  }, [
    pagination.pageSize,
    sortBy,
    sortDirection,
    searchQuery,
    statusFilter,
    officersFilter,
    serviceFilter,
    dateRangeFilter
  ]);

  const fetchBookingsData = async (
    paginationRequest: PaginationRequest,
    targetPage: number,
    isInitialLoad: boolean = false,
    signal?: AbortSignal,
    requestId?: string
  ) => {
    try {
      if (isRequestInProgress && !isInitialLoad) {
        return;
      }

      setIsRequestInProgress(true);

      if (isInitialLoad) {
        setLoading(true);
        setFetchingData(false);
      } else {
        setFetchingData(true);
        setLoading(false);
      }

      const response: PaginatedResponse<calendarBooking> = await bookingService.getPaginatedBookings(paginationRequest);

      if (signal?.aborted) {
        return;
      }

      if (requestId !== lastRequestIdRef.current) {
        return;
      }

      const bookingsWithStatus = addStatusToBookings(response.data);

      setBookings(bookingsWithStatus);
      setPagination({
        currentPage: response.pagination.currentPage,
        pageSize: response.pagination.pageSize,
        totalItems: response.pagination.totalItems,
        totalPages: response.pagination.totalPages,
        hasNextPage: response.pagination.hasNextPage,
        hasPreviousPage: response.pagination.hasPreviousPage,
      });

      var loanOfficers = null
      

      if(response.data[0].loanOfficers != null || response.data[0].loanOfficers.length > 0){

        loanOfficers = Array.from(new Set(response.data[0].loanOfficers))
          .filter(officer => officer)
          .map(loanOfficer => ({ id: loanOfficer, label: loanOfficer }));
      }else{
        loanOfficers = Array.from(new Set(bookingsWithStatus.map(booking => booking.loanData?.loanOfficer || booking.LoanOfficer)))
          .filter(officer => officer)
          .map(loanOfficer => ({ id: loanOfficer, label: loanOfficer }));
      }  
      setLoanOfficersOptions(loanOfficers);

    } catch (error) {
      if (signal?.aborted || (error as any)?.name === 'AbortError') {
        return;
      }

      setBookings([]);
      setPagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      if (!signal?.aborted && requestId === lastRequestIdRef.current) {
        setIsRequestInProgress(false);
        setLoading(false);
        setFetchingData(false);
      }
    }
  };

  const fetchServicesData = useCallback(async () => {
    try {
      const servicesResponse = await bookingService.getAvailableServices();
      setServices(servicesResponse);

      const serviceOptionsFromAPI = servicesResponse.map(service => ({
        id: service.displayName,
        label: service.displayName
      }));
      setServiceOptions(serviceOptionsFromAPI);

    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  }, []);

  const handleStatusFilterChange = useCallback((value: string | string[]) => {
    const newStatusFilter = Array.isArray(value) ? value : [];
    setStatusFilter(newStatusFilter);
  }, []);

  const handleOfficersFilterChange = useCallback((value: string | string[]) => {
    const newOfficersFilter = Array.isArray(value) ? value : [];
    setOfficersFilter(newOfficersFilter);
  }, []);

  const handleServiceFilterChange = useCallback((value: string | string[]) => {
    const newServiceFilter = Array.isArray(value)
      ? (value.length > 0 ? value[0] : '')
      : (value || '');
    setServiceFilter(newServiceFilter);
  }, []);

  const handleDateRangeChange = useCallback((newDateRange: { startDate: Date | null; endDate: Date | null }) => {
    setDateRangeFilter(newDateRange);
  }, []);

  useEffect(() => {
    debouncedFetchBookings(1, true, false, false);
  }, [statusFilter, officersFilter, serviceFilter, dateRangeFilter]);

  useEffect(() => {
    fetchServicesData();
    debouncedFetchBookings(1, true, true, true);
  }, []);

  useEffect(() => {
    debouncedFetchBookings(1, true, false, false);
  }, [searchQuery]);

  useEffect(() => {
    debouncedFetchBookings(1, true, true, false);
  }, [sortBy, sortDirection]);

  useEffect(() => {
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    debouncedFetchBookings(newPage, false, true, false);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize }));
    debouncedFetchBookings(1, true, true, false, newPageSize);
  };

  const handleSortChange = (newSortBy: string, newSortDirection: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEmailMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEmailMenuAnchor(event.currentTarget);
  };

  const handleEmailMenuClose = () => {
    setEmailMenuAnchor(null);
  };

  const handleEmailOption = (option: 'eml' | 'mailto' | 'copy') => {
    const dataToEmail = selectedBookings.length > 0 ? selectedBookings : bookings;

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
    const dataToEmail = selectedBookings.length > 0 ? selectedBookings : bookings;

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
    const dataToExport = selectedBookings.length > 0 ? selectedBookings : bookings;
    const filename = selectedBookings.length > 0
      ? `bookings_selected_${selectedBookings.length}_items.xlsx`
      : `bookings_export_page_${pagination.currentPage}.xlsx`;

    exportBookingsToExcel(dataToExport, columns, filename);
  };

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

      await debouncedFetchBookings(pagination.currentPage, false, true, false);
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

      await debouncedFetchBookings(pagination.currentPage, false, true, false);
    } catch (error) {
      console.error('Error fetching Loan Details:', error);
      setShowSuccessMessage(true);
    } finally {
      setLoadingPostResponse(false);
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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

        <Box id="date-filter" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          width: { xs: '100%', sm: '100%' }
        }}>
          <DatePicker
            label="Start Date"
            value={dateRangeFilter.startDate}
            onChange={(newValue) => {
              handleDateRangeChange({
                ...dateRangeFilter,
                startDate: newValue
              });
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  width: { xs: '49%', sm: '49%' },
                  '& .MuiInputBase-root': {
                    height: '40px'
                  }
                }
              }
            }}
          />

          <DatePicker
            label="End Date"
            value={dateRangeFilter.endDate}
            onChange={(newValue) => {
              handleDateRangeChange({
                ...dateRangeFilter,
                endDate: newValue
              });
            }}
            minDate={dateRangeFilter.startDate || undefined}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  width: { xs: '49%', sm: '49%' },
                  '& .MuiInputBase-root': {
                    height: '40px'
                  }
                }
              }
            }}
          />

          {(dateRangeFilter.startDate || dateRangeFilter.endDate) && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                handleDateRangeChange({
                  startDate: null,
                  endDate: null
                });
              }}
            >
              Clear
            </Button>
          )}
        </Box>

        <Box id="filters">
          <FilterDropdown
            id="status-filter"
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            multiSelect={true}
          />

          <FilterDropdown
            id="officers-filter"
            label="Loan Officers"
            options={loanOfficersOptions}
            value={officersFilter}
            onChange={handleOfficersFilterChange}
            multiSelect={true}
          />

          <FilterDropdown
            id="service-filter"
            label="Service"
            options={serviceOptions}
            value={serviceFilter}
            onChange={handleServiceFilterChange}
            multiSelect={false}
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
              : `Export Current Page (${bookings.length})`
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {bookings.length} of {pagination.totalItems} total bookings
          {pagination.totalPages > 1 && ` (Page ${pagination.currentPage} of ${pagination.totalPages})`}
        </Typography>
        {(fetchingData || isRequestInProgress) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          </Box>
        )}
      </Box>

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
            {selectedBookings.length > 0 ?
              `Including ${selectedBookings.length} selected bookings.` :
              `Including all ${bookings.length} bookings from current page.`
            }
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
        rows={bookings}
        onSelectionChange={handleSelectionChange}
        onEditSuccess={handleEditSuccess}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        loading={fetchingData || isRequestInProgress}
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