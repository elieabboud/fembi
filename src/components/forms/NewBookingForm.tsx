import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Box,
  CircularProgress,
  Backdrop,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TimeSelector from './TimeSelector';
import Followers from './Followers';
import { CreateAppointmentRequest } from '../../types/CreateAppointmentRequest';
import { bookingService } from '../../services/bookingService';
import { LoanDetails } from '../../../src/types/loanDetails';
import { BookingService, TimeSlot } from '../../types/service';
import { useAuth } from '../../context/AuthContext';
import { calendarBooking } from '../../types/calendarBooking';
import { mapCalendarBookingToFormData } from '../../services/bookingFormUtils';
import { toLocalISOString } from '../../utils/general';
import { TimezoneService } from '../../services/timezoneUtils';
import { EmailRequestDTO } from '../../types/email';
import { AvailabilityService, AvailabilitySettings, DateRange } from '../../services/availabilityService';

type BookingFormProps = {
  onClose: () => void;
  onSuccess?: (bookingData: CreateAppointmentRequest, response: any) => void;
  initialData?: calendarBooking;
  isEditMode?: boolean;
  isViewMode?: boolean;
  setLoading?: (loading: boolean) => void;
}

const CreateBookingForm: React.FC<BookingFormProps> = ({ 
  onClose, 
  onSuccess, 
  initialData, 
  isEditMode = false,
  isViewMode = false,
  setLoading 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAdmin, user } = useAuth();
  
  // Loading states for different operations
  const [loadingStates, setLoadingStates] = useState({
    loanDetails: false,
    services: false,
    timeSlots: false,
    followers: false,
    submitting: false,
    initializing: false,
    sendingEmail: false
  });
  
  // NEW: Availability constraint states
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  const [services, setServices] = useState<BookingService[]>([]);
  const [fetchedFollowers, setFetchedFollowers] = useState<string[]>([]);
  const [addedFollowers, setAddedFollowers] = useState<string[]>([]);
  const [combinedFollowers, setCombinedFollowers] = useState<string[]>([]);
  const [showLoanDetails, setShowLoanDetails] = useState<boolean>(false);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>();
  const [selectedService, setSelectedService] = useState<BookingService>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState<string>("");

  
  
  // NEW: State to track if loan details have been loaded and validated
  const [isLoanDetailsValidated, setIsLoanDetailsValidated] = useState<boolean>(false);
  
  const [bookingData, setBookingData] = useState<CreateAppointmentRequest>(
  {
    ServiceId: "",
    ServiceName: "",
    ServicePrice: 0,
    EncompassDetails: {
      EncompassLoanId: "",
      LoanCloser: "",
      LoanOfficer: "",
      dpa: ""
    },
    BorrowerInformation: {
      FirstName: "",
      LastName: "",
      Email: "",
      PhoneNumber: "",
      Address: {
        Street: "",
        City: "",
        State: "",
        ZipCode: "",
      },
    },
    DateTimeInfo: {
      SelectedDate: "",
      SelectedTime: "",
      FromDate: "",
      ToDate: "",
    },
    Followers: "",
    Duration: "PT1H",
    PreBuffer: "PT0S",
    PostBuffer: "PT30M",
    PriceType: "notSet",
    StaffMemberIds: [],
  });

  const editMode = isEditMode || !!initialData;
  const readOnlyMode = isViewMode;

  // Helper function to update loading states
  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Check if any loading is in progress
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  // Get the title based on mode
  const getFormTitle = () => {
    if (isViewMode) return 'View Appointment';
    if (editMode) return 'Edit Booking';
    return 'Schedule a New Booking';
  };

  // NEW: Function to format loan amount with commas
  const formatLoanAmount = (amount: number | undefined): string => {
    if (!amount) return '';
    return amount.toLocaleString();
  };

  // NEW: Fetch availability settings when service is selected
  const fetchAvailabilitySettings = useCallback(async (serviceId?: string) => {
    if (editMode || readOnlyMode) return; // Only apply to create mode
    
    setIsLoadingAvailability(true);
    try {
      console.log('📅 Fetching availability settings for create mode...', serviceId ? `serviceId: ${serviceId}` : '');
      
      const settings = await bookingService.getAvailability(serviceId);
      setAvailabilitySettings(settings);
      
      const calculatedRange = AvailabilityService.calculateDateRange(settings);
      setDateRange(calculatedRange);
      
      // 🔥 NEW: Auto-select the first available date
      if (calculatedRange.minDate) {
        console.log('📅 Auto-selecting first available date:', calculatedRange.minDate.toLocaleDateString());
        setSelectedDate(calculatedRange.minDate);
      }
      
      console.log('📅 Availability constraints applied:', {
        serviceId,
        settings,
        dateRange: calculatedRange
      });
      
    } catch (error) {
      console.error('❌ Error fetching availability settings:', error);
      setAvailabilitySettings(null);
      setDateRange(null);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [editMode, readOnlyMode]);

  const handleLoanIdChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    if (readOnlyMode) return;
    
    const loanId = event.target.value;
    setBookingData((prev) => ({
      ...prev,
      EncompassDetails: {
        ...prev.EncompassDetails,
        EncompassLoanId: loanId,
      },
    }));
    
    if (!editMode) {
      setIsLoanDetailsValidated(false);
      setShowLoanDetails(false);
    }
  };

  // UPDATED: Handle service change with availability fetching
  const handleServiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (readOnlyMode) return;
    
    const selectedValue = event.target.value as string;
    const selectedService = services.find(s => s.displayName === selectedValue);
    if (selectedService) {
      setSelectedService(selectedService);
      setBookingData(prev => ({
        ...prev,
        ServiceName: selectedService.displayName,
        ServiceId: selectedService.id,
        ServicePrice: selectedService.defaultPrice,
      }));

      // NEW: Fetch availability settings when service is selected
      if (!editMode && !readOnlyMode) {
        console.log('🔧 Service selected, fetching availability for:', selectedService.id);
        fetchAvailabilitySettings(selectedService.id);
      }
    }
  };

  const sendEmailNotifications = async (response: any) => {
    if (readOnlyMode || editMode) return;
    updateLoadingState('sendingEmail', true);
    
    try {
      const currentUserEmail = user?.email || '';
      
      const recipientEmails: string[] = [];
      
      if (currentUserEmail) {
        recipientEmails.push(currentUserEmail);
      }
      
      if (bookingData.BorrowerInformation.Email) {
        recipientEmails.push(bookingData.BorrowerInformation.Email);
      }
      
      if (bookingData.Followers) {
        const followerEmails = bookingData.Followers
          .split(',')
          .map(email => email.trim())
          .filter(email => email.length > 0 && email.includes('@'));
        recipientEmails.push(...followerEmails);
      }
      
      const uniqueEmails = Array.from(new Set(recipientEmails));
      
      if (uniqueEmails.length === 0) {
        console.log('No valid email addresses found for notification');
        return;
      }
      
      const appointmentDate = new Date(bookingData.DateTimeInfo.SelectedDate).toLocaleDateString();
      const appointmentTime = bookingData.DateTimeInfo.SelectedTime;
      const borrowerName = `${bookingData.BorrowerInformation.FirstName} ${bookingData.BorrowerInformation.LastName}`.trim();
      
      const htmlBody = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">
                New Appointment Scheduled
              </h2>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #28a745;">Appointment Details</h3>
                <p><strong>Service:</strong> ${bookingData.ServiceName}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentTime}</p>
                <p><strong>Loan ID:</strong> ${bookingData.EncompassDetails.EncompassLoanId}</p>
              </div>
              
              <div style="background-color: #e9ecef; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #007bff;">Borrower Information</h3>
                <p><strong>Name:</strong> ${borrowerName}</p>
                <p><strong>Email:</strong> ${bookingData.BorrowerInformation.Email}</p>
                <p><strong>Phone:</strong> ${bookingData.BorrowerInformation.PhoneNumber}</p>
                <p><strong>Address:</strong> ${bookingData.BorrowerInformation.Address.Street}, ${bookingData.BorrowerInformation.Address.City}, ${bookingData.BorrowerInformation.Address.State} ${bookingData.BorrowerInformation.Address.ZipCode}</p>
              </div>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #856404;">Loan Information</h3>
                <p><strong>Loan Closer:</strong> ${bookingData.EncompassDetails.LoanCloser}</p>
                <p><strong>Loan Officer:</strong> ${bookingData.EncompassDetails.LoanOfficer}</p>
                ${bookingData.EncompassDetails.dpa ? `<p><strong>DPA Program:</strong> ${bookingData.EncompassDetails.dpa}</p>` : ''}
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
                <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      const emailRequest: EmailRequestDTO = {
        To: uniqueEmails,
        Subject: `New Appointment Scheduled - ${bookingData.ServiceName} for ${borrowerName}`,
        Body: htmlBody,
        IsHtml: true
      };
      
      const emailResponse = await bookingService.sendEmail(emailRequest);

      console.log("received response:" , emailResponse);
      
      if (emailResponse.Success) {
        console.log(`Email notifications sent successfully to: ${uniqueEmails.join(', ')}`);
      } else {
        console.error('Failed to send some email notifications:', emailResponse.FailedRecipients);
        console.error('Email error message:', emailResponse.Message);
      }
      
    } catch (error) {
      console.error('Error sending email notifications:', error);
    } finally {
      updateLoadingState('sendingEmail', false);
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnlyMode || loadingStates.submitting) return;

    if (!editMode && !isLoanDetailsValidated) {
      setError("Please enter a valid Loan ID and press Enter to load loan details before submitting.");
      return;
    }

    if (!bookingData.ServiceId) {
      setError("Please select a service.");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }

    setError("");
    
    updateLoadingState('submitting', true);
    setLoading?.(true);

  try {
    let response;
    
    if (editMode) {
      const updateData = {
        id: initialData?.bookingId || '',
        selectedDate: bookingData.DateTimeInfo.SelectedDate,
        selectedTime: bookingData.DateTimeInfo.SelectedTime,
        fromDate: bookingData.DateTimeInfo.FromDate,
        toDate: bookingData.DateTimeInfo.ToDate,
        staffMemberIds: bookingData.StaffMemberIds
      };
      
      response = await bookingService.updateBooking(updateData);
    } else {
      response = await bookingService.postBooking(bookingData);
      console.log('Post API Response:', response);
    }

    if (response) {
      await sendEmailNotifications(response);
    }

    if (onSuccess) {
      onSuccess(bookingData, response);
      //window.location.reload();
    }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} booking:`, error);
      setError(`Failed to ${editMode ? 'update' : 'create'} booking. Please try again.`);
    } finally {
      updateLoadingState('submitting', false);
      setLoading?.(false);
    }
  };

  const fetchLoanDetails = async () => {
    if (loadingStates.submitting || readOnlyMode) return;

    if (!bookingData.EncompassDetails.EncompassLoanId.trim()) {
      setError("Please enter a Loan ID.");
      return;
    }

    updateLoadingState('loanDetails', true);
    setError("");
    
    try{
      const loanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId || initialData?.encompassLoanId);

      setLoanDetails(loanDetails);
      
      setBookingData((prev) => ({
        ...prev,
        EncompassDetails: {
          EncompassLoanId: loanDetails?.loanId,
          LoanCloser: loanDetails?.loanCloser,
          LoanOfficer: loanDetails?.loanOfficer,
          dpa: loanDetails?.dpa
        },
        BorrowerInformation: {
          FirstName: loanDetails.borrowerFirstName,
          LastName: loanDetails.borrowerLastName,
          Email: loanDetails.borrowerEmail,
          PhoneNumber: loanDetails.borrowerPhone,
          Address: {
            Street: loanDetails.borrowerAddress,
            City: loanDetails.borrowerCity,
            State: loanDetails.borrowerState,
            ZipCode: loanDetails.borrowerZipCode,
          },
        },
      }));

      setShowLoanDetails(true);
      setIsLoanDetailsValidated(true);
    }catch (error) {
      console.error('Error fetching Loan Details:', error);
      setError("Failed to load loan details. Please check the Loan ID and try again.");
      setIsLoanDetailsValidated(false);
    }finally{
      updateLoadingState('loanDetails', false);
    }
  };

  const handleLoanIdKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchLoanDetails();
    }
  };

  const fetchAvailableServicesData = useCallback(async () => {
    updateLoadingState('services', true);
    try {
      const response: BookingService[] = await bookingService.getAvailableServices();
      setServices(response);
      
      if (editMode && bookingData.ServiceId) {
        console.log('looking for service');
        const matchedService = response.find(s => s.id === bookingData.ServiceId);
        if (matchedService) {
          setSelectedService(matchedService);
          console.log("Selected service in edit mode:", matchedService);
        }
      }
    } catch (error) {
      console.error('Error fetching available services data:', error);
      setServices([]);
    } finally {
      updateLoadingState('services', false);
    }
  }, [editMode]);

  const handleDateTimeSelect = useCallback(() => {
    if (!selectedSlot || !selectedDate || readOnlyMode) return;

    console.log('🕐 Form: Handling date/time selection:', { 
      selectedSlot: selectedSlot.startTime, 
      selectedDate: selectedDate.toLocaleDateString() 
    });

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startTimeUser = TimezoneService.convertBackendTimeToLocalReliable(selectedSlot.startTime);
    const time24 = format(startTimeUser, 'HH:mm');

    console.log('🕐 Form: Date/time processed:', {
      dateStr,
      time24,
      displayTime: startTimeUser.toLocaleString(),
      keepingOriginalESTTimes: {
        fromDate: selectedSlot.startTime,
        toDate: selectedSlot.endTime
      }
    });

    setBookingData((prev) => ({
      ...prev,
      DateTimeInfo: {
        SelectedDate: dateStr,
        SelectedTime: time24,
        FromDate: selectedSlot.startTime,
        ToDate: selectedSlot.endTime,
      },
      StaffMemberIds: [selectedSlot.staffMemberId],
    }));
  }, [selectedSlot, selectedDate, readOnlyMode]);

  // UPDATED: Apply availability filtering to time slots
  const fetchAvailableTimeSlots = useCallback(async () => {     
    if (!selectedDate || !bookingData?.ServiceId) return;

    updateLoadingState('timeSlots', true);
    try {
      console.log('🕐 ===== FETCH TIME SLOTS DEBUG =====');
      console.log('🕐 selectedDate object:', selectedDate);
      console.log('🕐 Mode check - editMode:', editMode, 'isViewMode:', isViewMode);
      console.log('🕐 ServiceId:', bookingData.ServiceId);
      
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const backendDateString = `${year}-${month}-${day}T00:00:00`;
      
      console.log('🕐 Final backendDateString for API:', backendDateString);
      
      // 🔥 UPDATED: Pass edit mode to filter past slots
      const response: TimeSlot[] = await bookingService.getAvailableTimeSlots(
        bookingData.ServiceId,
        backendDateString,
        editMode // Pass edit mode flag
      );

      console.log('🕐 Time slots received from backend:', response.length, 'slots');

      // Apply availability filtering for create mode only
      let filteredSlots = response;
      
      if (!editMode && !readOnlyMode && dateRange) {
        console.log('📅 Applying availability filtering to time slots...');
        filteredSlots = AvailabilityService.filterTimeSlots(response, selectedDate, dateRange);
        console.log(`📅 Filtered ${response.length} slots to ${filteredSlots.length} available slots`);
      }

      setTimeSlots(filteredSlots);

      if (editMode && bookingData.DateTimeInfo?.SelectedTime && !selectedSlot) {
        const timeToMatch = bookingData.DateTimeInfo.SelectedTime;
        console.log("🕐 Edit mode: Looking for time slot matching:", timeToMatch);
        
        const matchingSlot = filteredSlots.find(slot => {
          try {
            const userSlotTime = TimezoneService.convertBackendTimeToLocal(slot.startTime);
            const slotTimeFormatted = format(userSlotTime, 'HH:mm');
            console.log(`🕐 Comparing: backend ${slot.startTime} -> user ${slotTimeFormatted} vs target ${timeToMatch}`);
            return slotTimeFormatted === timeToMatch;
          } catch (error) {
            console.error('Error comparing slot time:', error);
            return false;
          }
        });
        
        if (matchingSlot) {
          console.log("✅ Found matching time slot in edit mode:", matchingSlot);
          setSelectedSlot(matchingSlot);
        } else {
          console.log("❌ No matching time slot found in edit mode");
        }
      }
    } catch (error) {
      console.error('Error fetching time slots for selected service:', error);
      setTimeSlots([]);
    } finally {
      updateLoadingState('timeSlots', false);
    }
  }, [selectedService, selectedDate, editMode, isViewMode, bookingData.DateTimeInfo?.SelectedTime, bookingData.ServiceId, selectedSlot, dateRange]);
  
  const fetchAllFollowers = useCallback(async () => {
    updateLoadingState('followers', true);
    try {
      const regularFollowersPromise = bookingService.getFollowers();
      
      const promises = [regularFollowersPromise];
      if (isAdmin) {
        promises.push(bookingService.getGlobalFollowers());
      }
      
      const results = await Promise.all(promises);
      
      let allFollowers: string[] = [];
      results.forEach(result => {
        if (Array.isArray(result)) {
          allFollowers = [...allFollowers, ...result];
        }
      });
      
      const uniqueFollowers = Array.from(new Set(allFollowers));
      setFetchedFollowers(uniqueFollowers);
      
    } catch (error) {
      console.error('Failed to fetch followers', error);
      setFetchedFollowers([]);
    } finally {
      updateLoadingState('followers', false);
    }
  }, [isAdmin]);

  const handleAddFollower = (newFollower: string) => {
    if (readOnlyMode) return;
    
    if (!fetchedFollowers.includes(newFollower) && !addedFollowers.includes(newFollower)) {
      setAddedFollowers(prev => [...prev, newFollower]);
    }
  };

  useEffect(() => {
    const initializeEditMode = async () => {
      if (editMode && initialData) {
        updateLoadingState('initializing', true);
        
        console.log('Edit mode activated with initial data:', initialData);
        
        const formattedData = mapCalendarBookingToFormData(initialData as any);

        try {
          const loanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId || initialData?.encompassLoanId);
          setLoanDetails(loanDetails);
          setShowLoanDetails(true);
          setIsLoanDetailsValidated(true);
          
          setBookingData((prev) => ({
            ...formattedData,
            BorrowerInformation: {
              FirstName: loanDetails.borrowerFirstName,
              LastName: loanDetails.borrowerLastName,
              Email: loanDetails.borrowerEmail,
              PhoneNumber: loanDetails.borrowerPhone,
              Address: {
                Street: loanDetails.borrowerAddress,
                City: loanDetails.borrowerCity,
                State: loanDetails.borrowerState,
                ZipCode: loanDetails.borrowerZipCode,
              },
            },
          }));

          console.log("after setting:", formattedData);

          if (formattedData.DateTimeInfo?.SelectedDate) {
            const dateStr = formattedData.DateTimeInfo.SelectedDate;
            console.log('🗓️ Edit mode: Setting selectedDate from dateStr:', dateStr);
            
            if (dateStr.includes('-')) {
              const [year, month, day] = dateStr.split('-').map(Number);
              const correctDate = new Date(year, month - 1, day);
              console.log('🗓️ Edit mode: Created selectedDate:', correctDate);
              setSelectedDate(correctDate);
            } else {
              console.warn('🗓️ Edit mode: Invalid date format:', dateStr);
              setSelectedDate(new Date());
            }
          }

          if (formattedData.Followers) {
            const followerArray = formattedData.Followers.split(',');
            setFetchedFollowers(followerArray);
          }
        } catch (error) {
          console.error('Error initializing edit mode:', error);
        } finally {
          updateLoadingState('initializing', false);
        }
      }
    };

    initializeEditMode();
  }, [editMode, initialData]);

  // UPDATED: Remove automatic availability fetching on mount
  useEffect(() => {
    fetchAvailableServicesData();
    fetchAllFollowers();
    
    // Note: Availability settings will be fetched when service is selected
  }, [fetchAvailableServicesData, fetchAllFollowers]);

  useEffect(() => {
    const allFollowers = [...fetchedFollowers, ...addedFollowers];
    const uniqueFollowers = Array.from(new Set(allFollowers));
    const followersString = uniqueFollowers.join(',');
    
    setBookingData(prev => ({
      ...prev,
      Followers: followersString,
    }));
  }, [fetchedFollowers, addedFollowers]);

  useEffect(() => {
    if (!readOnlyMode && selectedDate && bookingData.ServiceId) {
      fetchAvailableTimeSlots();
    }
  }, [selectedService, selectedDate, readOnlyMode]);

  useEffect(() => {
    if (!readOnlyMode) {
      handleDateTimeSelect();
    }
  }, [selectedSlot, selectedDate, handleDateTimeSelect, readOnlyMode]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'absolute',
          backdropFilter: 'blur(3px)',
        }}
        open={loadingStates.submitting || loadingStates.initializing}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6">
            {loadingStates.submitting ? (editMode ? 'Updating booking...' : 'Creating booking...') : 
            loadingStates.initializing ? 'Loading booking details...' : 
            loadingStates.sendingEmail ? 'Sending email notifications...' : 'Processing...'}
          </Typography>
        </Box>
      </Backdrop>

      {isAnyLoading && !loadingStates.submitting && !loadingStates.initializing && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10 }}>
          <LinearProgress />
        </Box>
      )}

      <Grid
      container 
      spacing={2} 
      padding={2}
      sx={{
        width: '100%',
        margin: 0,
        borderRadius: '10px',
        color: 'gray',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        position: 'relative',
      }}
      >
        <Grid item xs={12} sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Typography sx={{fontSize: '30px', fontWeight: 'bold', color: 'black'}}>
              {getFormTitle()}
            </Typography>
            <CloseIcon sx={{float: 'right', color: 'gray', cursor: 'pointer'}} onClick={onClose} />
        </Grid>

        <Box sx={{ width: '100%', padding: 2 }}>
          <Grid item xs={12}>
            <Typography variant="h6">Client Details</Typography>
            <Grid sx={{display: 'flex', gap: '4px', mt: '10px', maxHeight: '56px'}}>
              <TextField
                fullWidth
                label="Encompass Loan ID"
                variant='outlined'
                required
                value={bookingData.EncompassDetails.EncompassLoanId || ''}
                onChange={handleLoanIdChange}
                onKeyDown={!editMode && !readOnlyMode ? handleLoanIdKeyDown : undefined}
                InputProps={{
                  readOnly: editMode || readOnlyMode,
                }}
                helperText={!editMode && !readOnlyMode ? "Press Enter after entering Loan ID" : ""}
              />
              {!editMode && !readOnlyMode && (
                <Button 
                  disabled={!bookingData.EncompassDetails.EncompassLoanId || loadingStates.loanDetails} 
                  variant="contained" 
                  onClick={() => fetchLoanDetails()}
                  sx={{ minWidth: 120 }}
                >
                  {loadingStates.loanDetails ? <CircularProgress size={24} color="inherit" /> : 'Enter'}
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>

        {loadingStates.loanDetails && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary">Loading loan details...</Typography>
            </Box>
          </Grid>
        )}

        {showLoanDetails && (
        <Box sx={{ width: '100%', padding: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Borrower Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                variant='outlined'
                value={bookingData.BorrowerInformation.FirstName}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                variant='outlined'
                value={bookingData.BorrowerInformation.LastName || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                variant='outlined'
                value={bookingData.BorrowerInformation.Email || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone Number"
                variant='outlined'
                value={bookingData.BorrowerInformation.PhoneNumber || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                variant='outlined'
                value={bookingData.BorrowerInformation.Address.Street || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="City"
                variant='outlined'
                value={bookingData.BorrowerInformation.Address.City || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
              fullWidth
              label="State"
              variant='outlined'
              value={bookingData.BorrowerInformation.Address.State || ''}
              InputProps={{
                  readOnly: true,
                }}/>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Zip Code"
                variant='outlined'
                value={bookingData.BorrowerInformation.Address.ZipCode || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Loan Details</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Loan Number"
                variant='outlined'
                value={loanDetails?.loanNumber || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
            <TextField
              fullWidth
              value={loanDetails?.loanType || ''}
              label="Loan Type"
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"/>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Loan Amount"
                variant='outlined'
                InputProps={{
                  readOnly: true,
                }}
                value={formatLoanAmount(loanDetails?.loanAmount)}/>
            </Grid>
            <Grid item xs={6}>
            <TextField
              fullWidth
              value={loanDetails?.loanCloser || ''}
              label="Loan Closer"
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"/>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DPA Program"
                InputProps={{
                  readOnly: true,
                }}
                variant='outlined'
                value={loanDetails?.dpa || ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                InputProps={{
                  readOnly: true,
                }}
                variant='outlined'
                value={loanDetails?.notes || ''}
              />
            </Grid>
          </Grid>
        </Box>
      )}

        <Grid item xs={12} sx={{padding: '16px'}}>
          <Typography variant="h6">Appointment Details</Typography>
          <TextField
            fullWidth
            value={bookingData.ServiceName || ''}
            required
            onChange={handleServiceChange}
            select={!editMode && !readOnlyMode}
            label="Location"
            variant="outlined"    
            InputProps={{
              readOnly: editMode || readOnlyMode,
              endAdornment: loadingStates.services ? <CircularProgress size={20} /> : null,
            }}
            sx={{mt: '10px'}}
          >
          {!readOnlyMode && (Array.isArray(services) ? services : []).map((service) => (
            <MenuItem key={service.id} value={service.displayName}>
              {service.displayName}
            </MenuItem>
          ))}
          </TextField>
        </Grid>

        {isLoadingAvailability && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary">Loading availability settings...</Typography>
            </Box>
          </Grid>
        )}

        <Grid item xs={12} sx={{padding: '16px'}}>
          <StaticDatePicker
            disabled={(!selectedService && !editMode) || readOnlyMode || isLoadingAvailability}
            value={selectedDate}
            onChange={(date: Date | null) => !readOnlyMode && setSelectedDate(date)}
            orientation={isMobile ? 'portrait' : 'landscape'}
            slotProps={{
              actionBar: { actions: [] }
            }}
            readOnly={readOnlyMode}
            // NEW: Apply availability constraints for create mode
            minDate={!editMode && !readOnlyMode && dateRange ? dateRange.minDate : undefined}
            maxDate={!editMode && !readOnlyMode && dateRange ? dateRange.maxDate : undefined}
            shouldDisableDate={(date) => {
              // For create mode, apply availability constraints
              if (!editMode && !readOnlyMode) {
                // Require service selection first
                if (!selectedService) {
                  console.log('📅 Disabling date - no service selected:', date.toLocaleDateString());
                  return true;
                }
                
                // If we have dateRange constraints, apply them
                if (dateRange) {
                  const shouldDisable = AvailabilityService.shouldDisableDate(date, dateRange);
                  if (shouldDisable) {
                    console.log('📅 Disabling date due to availability constraints:', date.toLocaleDateString());
                    return true;
                  }
                }
                
                // 🔥 REMOVED: Don't add extra past date filtering since AvailabilityService handles it
                return false;
              }
              
              // For edit mode, allow the currently selected date even if it's in the past
              if (editMode && selectedDate && date.toDateString() === selectedDate.toDateString()) {
                return false;
              }
              
              // For edit mode, disable past dates (but allow current selected date)
              if (editMode) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateToCheck = new Date(date);
                dateToCheck.setHours(0, 0, 0, 0);
                return dateToCheck < today;
              }
              
              // Default: don't disable
              return false;
            }}
            // ADDED: Disable past dates in create mode by default
            disablePast={!editMode && !readOnlyMode}
          />
          
          {/* Show message when no service is selected */}
          {!editMode && !readOnlyMode && !selectedService && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="grey.700">
                Please select a service first to see available dates.
              </Typography>
            </Box>
          )}
          
          {/* Show message when service is selected but availability is loading */}
          {!editMode && !readOnlyMode && selectedService && isLoadingAvailability && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="grey.700">
                Loading availability for selected service...
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Debug info display (remove after debugging) */}
        {/* {!editMode && !readOnlyMode && process.env.NODE_ENV === 'development' && (
          <Grid item xs={12} sx={{padding: '16px'}}>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }}>
              <Typography variant="h6" color="grey.700">DEBUG INFO</Typography>
              <Typography variant="body2" color="grey.700">
                <strong>Selected Service:</strong> {selectedService?.id || 'None'}<br/>
                <strong>Has Availability Settings:</strong> {availabilitySettings ? 'Yes' : 'No'}<br/>
                <strong>Has Date Range:</strong> {dateRange ? 'Yes' : 'No'}<br/>
                <strong>Loading Availability:</strong> {isLoadingAvailability ? 'Yes' : 'No'}<br/>
                {availabilitySettings && (
                  <>
                    <strong>Min Lead Time:</strong> {availabilitySettings.minimumLeadTime}<br/>
                    <strong>Max Advance:</strong> {availabilitySettings.maximumAdvance}<br/>
                  </>
                )}
                {dateRange && (
                  <>
                    <strong>Min Date:</strong> {dateRange.minDate.toLocaleDateString()}<br/>
                    <strong>Max Date:</strong> {dateRange.maxDate.toLocaleDateString()}<br/>
                    <strong>Min DateTime (Local):</strong> {dateRange.minDateTime.toLocaleString()}<br/>
                    <strong>Max DateTime (Local):</strong> {dateRange.maxDateTime.toLocaleString()}<br/>
                  </>
                )}
              </Typography>
            </Box>
          </Grid>
        )} */}

        {/* Availability info display */}
        {/* {!editMode && !readOnlyMode && dateRange && availabilitySettings && (
          <Grid item xs={12} sx={{padding: '16px'}}>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, mt: 2, p: 2 }}>
              <Typography variant="body2" color="grey.700">
                <strong>Booking Window:</strong> From {dateRange.minDate.toLocaleDateString()} to {dateRange.maxDate.toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="grey.700">
                Minimum lead time: {availabilitySettings.minimumLeadTime} | Maximum advance: {availabilitySettings.maximumAdvance}
              </Typography>
            </Box>
          </Grid>
        )} */}

        <Grid container sx={{display: 'flex', flexDirection: 'column', width: '100%', padding: '16px'}}>
          {(timeSlots.length > 0 || selectedSlot || (editMode && selectedDate)) && (
            <TimeSelector
            timeSlots={timeSlots}
            selectedSlot={selectedSlot}
            onSelect={!readOnlyMode ? setSelectedSlot : () => {}}
            loading={loadingStates.timeSlots}
            readOnly={readOnlyMode}
          />)}
          
          <Followers
            editMode={editMode || readOnlyMode}
            fetchedFollowers={fetchedFollowers}
            addedFollowers={addedFollowers}
            onAddFollower={handleAddFollower}
            loading={loadingStates.followers}
            onRemoveFollower={(followerToRemove) => {
              if (!readOnlyMode) {
                setAddedFollowers(prev => prev.filter(f => f !== followerToRemove));
              }
            }}
          />

          {error.length > 0 && !readOnlyMode && (
            <Typography color="error" variant="caption" sx={{ margin: 2, display: 'block' }}>
              {error}
            </Typography>
          )}

          {!readOnlyMode && (
            <Grid sx={{display: 'flex', gap: '1rem'}}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onClose}
                  disabled={loadingStates.submitting}
                  sx={{
                    backgroundColor: '#D3323A',
                  }}
                >
                  Cancel
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isAnyLoading || (!editMode && !isLoanDetailsValidated)}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{
                    position: 'relative',
                  }}
                >
                  {loadingStates.submitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      {editMode ? 'Updating...' : 'Scheduling...'}
                    </Box>
                  ) : (
                    editMode ? 'Update' : 'Schedule'
                  )}
                </Button>
              </Grid>
            </Grid>
          )}

          {readOnlyMode && (
            <Grid sx={{display: 'flex', justifyContent: 'center', mt: '16px'}}>
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  minWidth: 150,
                }}
              >
                Close
              </Button>
            </Grid>
          )}
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default CreateBookingForm;