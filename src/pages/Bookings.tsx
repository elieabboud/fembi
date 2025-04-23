import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AppTable from '../components/common/AppTable';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types/booking';
import { format } from 'date-fns';

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
    const theme = useTheme();
  

  // Column definitions for the table
  const columns = [
    { id: 'closingDate', label: 'Closing Date', format: (value: string) => format(new Date(value), 'MMMM d, yyyy') },
    { id: 'closingLocation', label: 'Closing Location' },
    { id: 'propertyAddress', label: 'Property Address' },
    { id: 'borrower', label: 'Borrower' },
    { id: 'loanCloser', label: 'Loan Closer' },
    { id: 'loanOfficer', label: 'Loan Officer' },
    { id: 'lender', label: 'Lender' },
    { 
      id: 'status', 
      label: 'Status',
      format: (value: string) => <StatusBadge status={value as any} />
    },
  ];

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch from API with bookingService.getBookings()
        // For demo, we'll use sample data
        const sampleBookings: Booking[] = [
          {
            id: '1',
            closingDate: '2024-07-24',
            closingLocation: 'San Juan',
            propertyAddress: '123 Oak Street, Anytown, USA',
            borrower: 'Sarah Miller',
            loanCloser: 'Mark Edwards',
            loanOfficer: 'John Davis',
            lender: 'First Fidelity Bank',
            status: 'Scheduled',
          },
          {
            id: '2',
            closingDate: '2024-07-25',
            closingLocation: 'Ponce',
            propertyAddress: '456 Elm Avenue, Springfield, USA',
            borrower: 'Robert Miller',
            loanCloser: 'Anna White',
            loanOfficer: 'Laura Chen',
            lender: 'Secure Mortgage Corp',
            status: 'Completed',
          },
          {
            id: '3',
            closingDate: '2024-07-28',
            closingLocation: 'San Juan',
            propertyAddress: '789 Pine Lane, Lakeside, USA',
            borrower: 'Emily Green',
            loanCloser: 'David Lee',
            loanOfficer: 'Michael Brown',
            lender: 'United Funding Group',
            status: 'Completed',
          },
          {
            id: '4',
            closingDate: '2024-07-27',
            closingLocation: 'Ponce',
            propertyAddress: '101 Maple Drive, Hillside, USA',
            borrower: 'James Wilson',
            loanCloser: 'Olivia Harris',
            loanOfficer: 'John Davis',
            lender: 'First Fidelity Bank',
            status: 'Scheduled',
          },
          {
            id: '5',
            closingDate: '2024-07-28',
            closingLocation: 'San Juan',
            propertyAddress: '222 Cedar Road, Rivertown, USA',
            borrower: 'Elizabeth Turner',
            loanCloser: 'Brian Clark',
            loanOfficer: 'Laura Chen',
            lender: 'Secure Mortgage Corp',
            status: 'Completed',
          },
          {
          id: '1',
          closingDate: '2024-07-24',
          closingLocation: 'San Juan',
          propertyAddress: '123 Oak Street, Anytown, USA',
          borrower: 'Sarah Miller',
          loanCloser: 'Mark Edwards',
          loanOfficer: 'John Davis',
          lender: 'First Fidelity Bank',
          status: 'Scheduled',
        },
        {
          id: '2',
          closingDate: '2024-07-25',
          closingLocation: 'Ponce',
          propertyAddress: '456 Elm Avenue, Springfield, USA',
          borrower: 'Robert Miller',
          loanCloser: 'Anna White',
          loanOfficer: 'Laura Chen',
          lender: 'Secure Mortgage Corp',
          status: 'Completed',
        },
        {
          id: '3',
          closingDate: '2024-07-28',
          closingLocation: 'San Juan',
          propertyAddress: '789 Pine Lane, Lakeside, USA',
          borrower: 'Emily Green',
          loanCloser: 'David Lee',
          loanOfficer: 'Michael Brown',
          lender: 'United Funding Group',
          status: 'Completed',
        },
        {
          id: '4',
          closingDate: '2024-07-27',
          closingLocation: 'Ponce',
          propertyAddress: '101 Maple Drive, Hillside, USA',
          borrower: 'James Wilson',
          loanCloser: 'Olivia Harris',
          loanOfficer: 'John Davis',
          lender: 'First Fidelity Bank',
          status: 'Scheduled',
        },
        {
          id: '5',
          closingDate: '2024-07-28',
          closingLocation: 'San Juan',
          propertyAddress: '222 Cedar Road, Rivertown, USA',
          borrower: 'Elizabeth Turner',
          loanCloser: 'Brian Clark',
          loanOfficer: 'Laura Chen',
          lender: 'Secure Mortgage Corp',
          status: 'Completed',
        },
        ];
        
        setBookings(sampleBookings);
        setFilteredBookings(sampleBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Filter bookings when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookings(bookings);
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = bookings.filter((booking) => {
      return (
        booking.borrower.toLowerCase().includes(lowercaseQuery) ||
        booking.propertyAddress.toLowerCase().includes(lowercaseQuery) ||
        booking.closingLocation.toLowerCase().includes(lowercaseQuery) ||
        booking.lender.toLowerCase().includes(lowercaseQuery) ||
        booking.loanOfficer.toLowerCase().includes(lowercaseQuery)
      );
    });

    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleNewBooking = () => {
    navigate('/bookings/new');
  };

  const handleEditBooking = (booking: Booking) => {
    navigate(`/bookings/edit/${booking.id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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
        {/* <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewBooking}
        >
          New Booking
        </Button> */}
      </Box>

      <Box sx={{ mb: 3, }}>
        <SearchBar
          placeholder="Search schedules..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </Box>

      <AppTable
        columns={columns}
        rows={filteredBookings}
        onEditClick={handleEditBooking}
      />
    </Box>
  );
};

export default Bookings;