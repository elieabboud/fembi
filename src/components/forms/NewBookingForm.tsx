import React, { useCallback, useEffect, useState } from 'react';
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

type BookingFormProps = {
  onClose: () => void;
  onSuccess?: (bookingData: CreateAppointmentRequest, response: any) => void;
  initialData?: calendarBooking;
  isEditMode?: boolean;
  isViewMode?: boolean; // New prop for view-only mode
  setLoading?: (loading: boolean) => void;
}

const CreateBookingForm: React.FC<BookingFormProps> = ({ 
  onClose, 
  onSuccess, 
  initialData, 
  isEditMode = false,
  isViewMode = false, // New prop
  setLoading 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAdmin } = useAuth();
  
  // Loading states for different operations
  const [loadingStates, setLoadingStates] = useState({
    loanDetails: false,
    services: false,
    timeSlots: false,
    followers: false,
    submitting: false,
    initializing: false
  });
  
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
  const readOnlyMode = isViewMode; // For view-only mode

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

  const handleLoanIdChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    if (readOnlyMode) return; // Prevent changes in view mode
    
    const loanId = event.target.value;
    setBookingData((prev) => ({
      ...prev,
      EncompassDetails: {
        ...prev.EncompassDetails,
        EncompassLoanId: loanId,
      },
    }));
  };

const handleServiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
  if (readOnlyMode) return; // Prevent changes in view mode
  
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
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (readOnlyMode || loadingStates.submitting) return; // Prevent submit in view mode

  let newError:string;
  let hasError = false;
  
  if (!bookingData.EncompassDetails.EncompassLoanId
    || !editMode && !showLoanDetails
    || !bookingData.ServiceId
    || !selectedDate
    || !selectedSlot
  ) {
    newError = "There are some missing fields.";
    hasError = true;
  }
  
  if (hasError) {
    setError(newError);
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
      console.log('Update API Response:', response);
    } else {
      debugger;
      response = await bookingService.postBooking(bookingData);
      console.log('Post API Response:', response);
    }

    if (onSuccess) {
      onSuccess(bookingData, response);
      window.location.reload();
    }
  } catch (error) {
    console.error(`Error ${editMode ? 'updating' : 'creating'} booking:`, error);
  } finally {
    updateLoadingState('submitting', false);
    setLoading?.(false);
  }
};

  const fetchLoanDetails = async () => {
    if (loadingStates.submitting || readOnlyMode) return; // Prevent in view mode

    updateLoadingState('loanDetails', true);
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
    }catch (error) {
      console.error('Error fetching Loan Details:', error);
    }finally{
      updateLoadingState('loanDetails', false);
    }
  };

  const fetchAvailableServicesData = useCallback(async () => {
    updateLoadingState('services', true);
    try {
      const response: BookingService[] = await bookingService.getAvailableServices();
      setServices(response);
      
      // In edit mode, find and set the selected service
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
    if (!selectedSlot || !selectedDate || readOnlyMode) return; // Prevent in view mode

    const dateStr = toLocalISOString(selectedDate).split('T')[0]; // YYYY-MM-DD

    // Extract time "HH:mm" from StartTime ISO string
    const startTime = new Date(selectedSlot.startTime);
    const time24 = toLocalISOString(startTime).substr(11, 5); // "HH:mm"

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

  const fetchAvailableTimeSlots = useCallback(async () => {     
  if (!selectedDate || !bookingData?.ServiceId) return;

  updateLoadingState('timeSlots', true);
  try {
    console.log(`Fetching time slots for serviceId: ${bookingData.ServiceId} and date: ${toLocalISOString(selectedDate)}`);
    const response: TimeSlot[] = await bookingService.getAvailableTimeSlots(
      bookingData.ServiceId,
      toLocalISOString(selectedDate)
    );

    setTimeSlots(response);

    // Set the selected slot if we're in edit mode AND we have the time data
    if (editMode && bookingData.DateTimeInfo?.SelectedTime && !selectedSlot) {
      const timeToMatch = bookingData.DateTimeInfo.SelectedTime; // This should be in HH:mm format
      console.log("Looking for time slot matching:", timeToMatch);
      console.log("Available slots:", response.map(slot => ({
        startTime: slot.startTime,
        displayText: slot.displayText || 'No display text'
      })));
      
      const matchingSlot = response.find(slot => {
        // Convert the slot's start time to user timezone and extract HH:mm
        const userSlotTime = TimezoneService.convertBackendTimeToLocal(slot.startTime);
        const slotTime = toLocalISOString(userSlotTime).substr(11, 5); // "HH:mm"
        console.log(`Comparing slot time ${slotTime} with target ${timeToMatch}`);
        return slotTime === timeToMatch;
      });
      
      if (matchingSlot) {
        console.log("Found matching time slot:", matchingSlot);
        setSelectedSlot(matchingSlot);
      } else {
        console.log("No matching time slot found. Available times:", 
          response.map(slot => {
            const userTime = TimezoneService.convertBackendTimeToLocal(slot.startTime);
            return toLocalISOString(userTime).substr(11, 5);
          })
        );
      }
    }
  } catch (error) {
    console.error('Error fetching time slots for selected service:', error);
  } finally {
    updateLoadingState('timeSlots', false);
  }
}, [selectedService, selectedDate, editMode, bookingData.DateTimeInfo?.SelectedTime, bookingData.ServiceId, selectedSlot]);

  const fetchAllFollowers = useCallback(async () => {
    updateLoadingState('followers', true);
    try {
      // Always fetch regular followers
      const regularFollowersPromise = bookingService.getFollowers();
      
      // If admin, also fetch global followers
      const promises = [regularFollowersPromise];
      if (isAdmin) {
        promises.push(bookingService.getGlobalFollowers());
      }
      
      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      // Combine and deduplicate results
      let allFollowers: string[] = [];
      results.forEach(result => {
        if (Array.isArray(result)) {
          allFollowers = [...allFollowers, ...result];
        }
      });
      
      // Remove duplicates
      const uniqueFollowers = Array.from(new Set(allFollowers));
      setFetchedFollowers(uniqueFollowers);
      
    } catch (error) {
      console.error('Failed to fetch followers', error);
      setFetchedFollowers([]);
    } finally {
      updateLoadingState('followers', false);
    }
  }, [isAdmin]);

    // Handle adding a new follower
  const handleAddFollower = (newFollower: string) => {
    if (readOnlyMode) return; // Prevent in view mode
    
    // Only add if not already in either list
    if (!fetchedFollowers.includes(newFollower) && !addedFollowers.includes(newFollower)) {
      setAddedFollowers(prev => [...prev, newFollower]);
    }
  };

  // Add this effect after your state declarations
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

        console.log("after setting:", formattedData); // Use formattedData here

        if (formattedData.DateTimeInfo?.SelectedDate) {
          setSelectedDate(new Date(formattedData.DateTimeInfo.SelectedDate));
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

  useEffect(() => {
    fetchAvailableServicesData();
    fetchAllFollowers();
  }, [fetchAvailableServicesData, fetchAllFollowers]);

  // Update bookingData.Followers whenever either follower list changes
  useEffect(() => {
    // Combine fetched (read-only) and added followers
    const allFollowers = [...fetchedFollowers, ...addedFollowers];
    // Remove any duplicates
    const uniqueFollowers = Array.from(new Set(allFollowers));
    // Join as comma-separated string for the API
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
    if (!readOnlyMode) { // Only handle date/time select if not in view mode
      handleDateTimeSelect();
    }
  }, [selectedSlot, selectedDate, handleDateTimeSelect, readOnlyMode]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Loading Backdrop for major operations */}
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
             loadingStates.initializing ? 'Loading booking details...' : 'Processing...'}
          </Typography>
        </Box>
      </Backdrop>

      {/* Loading Progress Bar */}
      {isAnyLoading && !loadingStates.submitting && !loadingStates.initializing && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10 }}>
          <LinearProgress />
        </Box>
      )}

      <Grid 
      container 
      spacing={2} 
      padding={{xs: 2, sm: 4}}
      sx={{
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

        <Box sx={{ width: '100%', padding: {xs: 2, sm: 4} }}>
          <Grid item xs={12}>
            <Typography variant="h6">Client Details</Typography>
            <Grid sx={{display: 'flex', gap: '4px', mt: '10px'}}>
              <TextField
                fullWidth
                label="Encompass Loan ID"
                variant='outlined'
                required
                value={bookingData.EncompassDetails.EncompassLoanId || ''}
                onChange={handleLoanIdChange}
                InputProps={{
                  readOnly: editMode || readOnlyMode,
                }}
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
        <Box sx={{ width: '100%', padding: {xs: 2, sm: 4} }}>
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
                value={loanDetails?.loanAmount || ''}/>
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

        <Grid item xs={12}>
          <Typography variant="h6">Service Details</Typography>
          <TextField
            fullWidth
            value={bookingData.ServiceName || ''}
            required
            onChange={handleServiceChange}
            select={!editMode && !readOnlyMode}
            label="Service Name"
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

        <Grid item xs={12}>
          <StaticDatePicker
            disabled={!selectedService || readOnlyMode}
            value={selectedDate}
            onChange={(date: Date | null) => !readOnlyMode && setSelectedDate(date)}
            orientation={isMobile ? 'portrait' : 'landscape'}
            slotProps={{
              actionBar: { actions: [] }
            }}
            readOnly={readOnlyMode}
            disablePast
          />
        </Grid>

        <Grid container sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
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
            <Grid sx={{display: 'flex', gap: '1rem', mt: '16px'}}>
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
                  disabled={isAnyLoading}
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