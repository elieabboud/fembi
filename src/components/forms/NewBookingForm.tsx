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

type BookingFormProps = {
  onClose: () => void;
  onSuccess?: (bookingData: CreateAppointmentRequest, response: any) => void;
}

const CreateBookingForm: React.FC<BookingFormProps> = ({ onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAdmin } = useAuth();
  
  
  const [services, setServices] = useState<BookingService[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [globalFollowers, setGlobalFollowers] = useState<string[]>([]);
  const [combinedFollowers, setCombinedFollowers] = useState<string[]>([]);
  const [showLoanDetails, setShowLoanDetails] = useState<boolean>(false);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>();
  const [selectedService, setSelectedService] = useState<BookingService>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingData, setBookingData] = useState<CreateAppointmentRequest>(
  {
    ServiceId: "",
    ServiceName: "",
    ServicePrice: 0,
    EncompassDetails: {
      EncompassLoanId: "",
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

  const handleLoanIdChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
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
  const selectedValue = event.target.value as string;
  const selectedService = services.find(s => s.DisplayName === selectedValue);
  if (selectedService) {
    setSelectedService(selectedService);
    setBookingData(prev => ({
      ...prev,
      ServiceName: selectedService.DisplayName,
      ServiceId: selectedService.Id,
      ServicePrice: selectedService.DefaultPrice,
    }));
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
  
    setIsSubmitting(true);

    try {
      const response = await bookingService.postBooking(bookingData);
      
      console.log('Post API Response:', response);

      if (onSuccess) {
        onSuccess(bookingData, response);
      }

      onClose();
    } catch (error) {
      console.error('Error posting booking:', error);
    } finally {
    setIsSubmitting(false);
  }
  };

  const fetchLoanDetails = async () => {
    try{
      const loanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId);

      setLoanDetails(loanDetails);

      setBookingData((prev) => ({
        ...prev,
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
    }
  };

  const fetchAvailableServicesData = useCallback(async () => {
    try {
      const response : BookingService[] = await bookingService.getAvailableServices();
      setServices(response);
    } catch (error) {
      console.error('Error fetching available services data:', error);
      setServices([]);
    }
  }, []);

  const handleDateTimeSelect = useCallback(() => {
    if (!selectedSlot || !selectedDate) return;

    const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Extract time "HH:mm" from StartTime ISO string
    const startTime = new Date(selectedSlot.StartTime);
    const time24 = startTime.toISOString().substr(11, 5); // "HH:mm"

    setBookingData((prev) => ({
      ...prev,
      DateTimeInfo: {
        SelectedDate: dateStr,
        SelectedTime: time24,
        FromDate: selectedSlot.StartTime,
        ToDate: selectedSlot.EndTime,
      },
      StaffMemberIds: [selectedSlot.StaffMemberId],
    }));
  }, [selectedSlot, selectedDate]);

  const fetchAvailableTimeSlots = useCallback(async () => { 
    if (!selectedService || !selectedDate) return; 

    try {
      const response: TimeSlot[] = await bookingService.getAvailableTimeSlots(
        selectedService.Id,
        selectedDate.toISOString()
      );
      setTimeSlots(response);
    } catch (error) {
      console.error('Error time slots for selected service:', error);
    }
  }, [selectedService, selectedDate]);

  const fetchFollowers = useCallback(async () => {
    try {
      const response = await bookingService.getFollowers();
      setFollowers(response);
    } catch (error) {
      console.error('Failed to fetch followers', error);
    }
  }, []);

  const fetchGlobalFollowers = useCallback(async () => {
    try {
      const response = await bookingService.getGlobalFollowers();
      setGlobalFollowers(response);
    } catch (error) {
      console.error('Failed to fetch global followers', error);
    }
  }, []);

  useEffect(() => {
    if (followers.length || globalFollowers.length) {
      const combined = Array.from(new Set([...followers, ...globalFollowers]));
      setCombinedFollowers(combined);
      
      const followersString = combined.join(',');
      setBookingData(prev => ({
        ...prev,
        Followers: followersString,
      }));
    }
  }, [followers, globalFollowers]);

  useEffect(() => {
    fetchAvailableServicesData();
    fetchFollowers();
    if (isAdmin) {
      fetchGlobalFollowers();
    }
  }, [fetchAvailableServicesData, fetchFollowers, fetchGlobalFollowers, isAdmin]);

  useEffect(() => {
    fetchAvailableTimeSlots();
  }, [selectedService, selectedDate, fetchAvailableTimeSlots]);

  useEffect(() => {
    handleDateTimeSelect();
  }, [selectedSlot, selectedDate, handleDateTimeSelect]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid 
      container 
      spacing={2} 
      p={4}
      sx={{
        borderRadius: '10px',
        color: 'gray',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
      >
        <Grid item xs={12} sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Typography sx={{fontSize: '30px', fontWeight: 'bold', color: 'black'}}>Schedule a New Booking</Typography>
            <CloseIcon sx={{float: 'right', color: 'gray', cursor: 'pointer'}} onClick={onClose} />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Add Client Details</Typography>
          <Grid sx={{display: 'flex', gap: '4px'}}>
            <TextField
              fullWidth
              label="Encompass Loan ID"
              variant='filled'
              value={bookingData.EncompassDetails.EncompassLoanId}
              onChange={handleLoanIdChange}
            />
            <Button onClick={() => fetchLoanDetails()}>Enter</Button>
          </Grid>
        </Grid>
        {showLoanDetails && (
        <Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Borrower Information</Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="First Name"
              variant='filled'
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
              variant='filled'
              value={bookingData.BorrowerInformation.LastName}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Email"
              variant='filled'
              value={bookingData.BorrowerInformation.Email}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Phone Number"
              variant='filled'
              value={bookingData.BorrowerInformation.PhoneNumber}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              variant='filled'
              value={bookingData.BorrowerInformation.Address.Street}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="City"
              variant='filled'
              value={bookingData.BorrowerInformation.Address.City}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
            fullWidth
            label="State"
            variant='filled'
            value={bookingData.BorrowerInformation.Address.State}
            InputProps={{
                readOnly: true,
              }}/>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Zip Code"
              variant='filled'
              value={bookingData.BorrowerInformation.Address.ZipCode}
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
              variant='filled'
              value={loanDetails?.loanId}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={6}>
          <TextField
            fullWidth
            value={loanDetails?.loanType}
            label="Loan Type"
            InputProps={{
              readOnly: true,
            }}
            variant="filled"/>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Loan Amount"
              variant='filled'
              InputProps={{
                readOnly: true,
              }} 
              value={loanDetails?.loanAmount}/>
          </Grid>
          <Grid item xs={6}>
          <TextField
            fullWidth
            value={loanDetails?.loanOfficer}
            label="Loan Closer"
            InputProps={{
              readOnly: true,
            }}
            variant="filled"/>
          </Grid>
          {/* to do: check dpa program */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="DPA Program"
              InputProps={{
                readOnly: true,
              }}
              variant='filled'
              value={loanDetails?.loanType}
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
              variant='filled'
              value={loanDetails?.notes}
            />
          </Grid>
        </Grid>
      )}

        <Grid item xs={12}>
          <Typography variant="h6">Select Service</Typography>
          <TextField
            fullWidth
            value={bookingData.ServiceName}
            onChange={handleServiceChange}
            select
            label="Service Name"
            variant="filled"
          >
            {services.map((service) => (
              <MenuItem key={service.Id} value={service.DisplayName}>
                {service.DisplayName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <StaticDatePicker
            onChange={(date: Date | null) => setSelectedDate(date)}
            orientation={isMobile ? 'portrait' : 'landscape'}
            slotProps={{
              actionBar: { actions: [] },
            }}
          />
        </Grid>

        <Grid sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
          {selectedDate && (
            <TimeSelector
            timeSlots={timeSlots}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
          />)}
          
          <Followers
          followers={combinedFollowers}
          onChange={(updatedFollowers) => {
            setCombinedFollowers(updatedFollowers);
            const followersString = updatedFollowers.join(',');
            setBookingData(prev => ({
              ...prev,
              Followers: followersString,
            }));
          }}/>

          <Grid sx={{display: 'flex', gap: '1rem'}}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={onClose}
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
              >
                Schedule
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default CreateBookingForm;
