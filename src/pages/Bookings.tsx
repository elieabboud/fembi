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
} from '@mui/material';
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
  const [newBooking, setNewBooking] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [submittedData, setSubmittedData] = useState<CreateAppointmentRequest | null>(null);
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

  const [loading, setLoading] = useState(true);
  const [loadingPostResponse, setLoadingPostResponse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);
  const [officersFilter, setOfficersFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [dataFetched, setDataFetched] = useState(false);

  const columns = createBookingColumns();
  
  const statusOptions = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'canceled', label: 'Canceled' },
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

const fetchBookingsData = useCallback(async () => {
  try {
    const formattedStart = formatDateForApi(dateRange.start);
    const formattedEnd = formatDateForApi(dateRange.end);
    
    const response = await bookingService.getCalendarData(formattedStart, formattedEnd);
    
    const bookingsWithStatus = addStatusToBookings(response);

    const filteredBookings = bookingsWithStatus.filter(booking => booking.bookingId !== null);

    setBookings(filteredBookings);
    setFilteredBookings(filteredBookings);

    const uniqueLocations = Array.from(new Set(filteredBookings.map(booking => booking.serviceLocation.displayName)))
      .map(location => ({ id: location, label: location }));
    setLocationOptions(uniqueLocations);
    
    const loanOfficers = Array.from(new Set(filteredBookings.map(booking => booking.loanData.loanOfficer)))
      .map(loanOfficer => ({ id: loanOfficer, label: loanOfficer }));
    setLoanOfficersOptions(loanOfficers);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
  }
}, []);

const fetchAvailableServicesData = useCallback(async () => {
  try {
    const response : BookingService[] = await bookingService.getAvailableServices();
    setServices(response);
  } catch (error) {
    console.error('Error fetching available services data:', error);
  }
}, []);

const fetchFollowersData = useCallback(async () => {
  try {
    const response : string[] = await bookingService.getFollowers();
    setFollowers(response);
  } catch (error) {
    console.error('Error fetching available services data:', error);
  }
}, []);
  
  useEffect(() => {
    const fetchAllData = async () => {
      if (dataFetched) return;
      try {
        setLoading(true);

        await Promise.all([
          fetchAvailableServicesData(),
          fetchFollowersData(),
          fetchBookingsData(),
        ]);

        setDataFetched(true);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dataFetched, fetchAvailableServicesData, fetchFollowersData, fetchBookingsData]);
  
  // Filter bookings when search query or filter values change
  useEffect(() => {
    let filtered = [...bookings];
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((booking) => {
        return (
          booking.loanData?.borrowerFirstName.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerLastName.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerAddress.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerCity.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.borrowerState.toLowerCase().includes(lowercaseQuery) ||
          booking.loanData?.loanOfficer.toLowerCase().includes(lowercaseQuery)
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

    setFilteredBookings(filtered);
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

  const handleEmailTo = () => {
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
      
      const loanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId);
      setLoanDetails(loanDetails);
      
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Error fetching Loan Details:', error);
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
        mb: 3,}}>
        <Typography variant="h4" component="h1" 
        sx={{ 
          fontWeight: 'bold', 
          fontSize: 36,
      }}>
          Bookings
        </Typography>
        <Button
          variant="contained"
          onClick = {()=> setNewBooking(!newBooking)}
        >
          New Booking
        </Button>
      </Box>

      <Box 
      sx={{ mb: 3, display: 'flex', flexDirection:{sm:'column', md:'row'}, gap: {sm: '10px', md: '5px'}, 
      justifyContent: 'space-evenly', alignItems: 'center', flexWrap: 'wrap' }}>
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
            // multiSelect={true}
            value={statusFilter}
            onChange={handleStatusFilterChange}
          />
          
          <FilterDropdown
            id="location-filter"
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
            onClick={() => exportBookingsToExcel(filteredBookings, columns, 'bookings_export.xlsx')}
          >
            Export as
          </Button>
  
          <Button
            variant="contained"
            onClick={handleEmailTo}
          >
            Email to
          </Button>
        </Box>

      </Box>

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
        onClose= {handleNewBookingClose}/>
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
              overflow: 'hidden'
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
      />
    </Box>
  );
};

export default Bookings;