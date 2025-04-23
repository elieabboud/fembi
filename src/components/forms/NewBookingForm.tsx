import React, { useState } from 'react';
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
import { DateCalendar, StaticDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import BlockTimePicker from './BlockTimePicker';

interface FormData {
  serviceLocation: string;
  loanID: string;
  borrowerFirstName: string;
  borrowerLastName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  borrowerAddress: string;
  city: string;
  state: string;
  zipCode: string;
  loanNumber: string;
  loanType: string;
  loanAmount: string;
  loanCloser: string;
  dpaProgram: string;
  notes: string;
  selectedDate: Date | null;
  selectedTime: string;
}

type BookingFormProps = {
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, onClose }) => {
  const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState<FormData>({
    serviceLocation: '',
    loanID: '',
    borrowerFirstName: '',
    borrowerLastName: '',
    borrowerEmail: '',
    borrowerPhone: '',
    borrowerAddress: '',
    city: '',
    state: '',
    zipCode: '',
    loanNumber: '',
    loanType: '',
    loanAmount: '',
    loanCloser: '',
    dpaProgram: '',
    notes: '',
    selectedDate: new Date(),
    selectedTime: '',
  });

  const handleChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      selectedDate: date,
    }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTime: time,
    }));
  };

  const getAvailableTimesForDate = (date: string): string[] => {
    // This would typically come from your API or state management
    return [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', 
      '1:00 PM', '1:30 PM', '2:00 PM', '3:30 PM', '4:00 PM'
    ];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);

    onSubmit(formData);
  };

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
          <Typography variant="h6">Select Service</Typography>
          <TextField
          fullWidth
          value={formData.serviceLocation}
          onChange={handleChange('serviceLocation')}
          select
          label="Service Location"
          variant="filled"
        >
              <MenuItem value="Location 1">Location 1</MenuItem>
              <MenuItem value="Location 2">Location 2</MenuItem>
        </TextField>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Add Client Details</Typography>
          <TextField
            fullWidth
            label="Encompass Loan ID"
            variant='filled'
            value={formData.loanID}
            onChange={handleChange('loanID')}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Borrower Information</Typography>
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="First Name"
            variant='filled'
            value={formData.borrowerFirstName}
            onChange={handleChange('borrowerFirstName')}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Last Name"
            variant='filled'
            value={formData.borrowerLastName}
            onChange={handleChange('borrowerLastName')}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Email"
            variant='filled'
            value={formData.borrowerEmail}
            onChange={handleChange('borrowerEmail')}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Phone Number"
            variant='filled'
            value={formData.borrowerPhone}
            onChange={handleChange('borrowerPhone')}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            variant='filled'
            value={formData.borrowerAddress}
            onChange={handleChange('borrowerAddress')}
          />
        </Grid>

        <Grid item xs={4}>
          <TextField
            fullWidth
            label="City"
            variant='filled'
            value={formData.city}
            onChange={handleChange('city')}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
          fullWidth
          value={formData.state}
          label="State"
          variant='filled'
          onChange={handleChange('state')}
          select
        >
              <MenuItem value="CA">California</MenuItem>
              <MenuItem value="NY">New York</MenuItem>
              <MenuItem value="TX">Texas</MenuItem>
        </TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Zip Code"
            variant='filled'
            value={formData.zipCode}
            onChange={handleChange('zipCode')}
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
            value={formData.loanNumber}
            onChange={handleChange('loanNumber')}
          />
        </Grid>
        <Grid item xs={6}>
        <TextField
          fullWidth
          select
          value={formData.loanType}
          label="Loan Type"
          onChange={handleChange('loanType')}
          variant="filled"
        >
              <MenuItem value="Location 1">Location 1</MenuItem>
              <MenuItem value="Location 2">Location 2</MenuItem>
        </TextField>
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Loan Amount"
            variant='filled'
            value={formData.loanAmount}
            onChange={handleChange('loanAmount')}
          />
        </Grid>
        <Grid item xs={6}>
        <TextField
          fullWidth
          value={formData.loanCloser}
          label="Loan Closer"
          onChange={handleChange('loanCloser')}
          select
          variant="filled"
        >
              <MenuItem value="Closer 1">Closer 1</MenuItem>
              <MenuItem value="Closer 2">Closer 2</MenuItem>
        </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="DPA Program"
            variant='filled'
            value={formData.dpaProgram}
            onChange={handleChange('dpaProgram')}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            variant='filled'
            value={formData.notes}
            onChange={handleChange('notes')}
          />
        </Grid>

        <Grid item xs={12}>
          <StaticDatePicker
            onChange={(date: Date | null) => handleDateChange(date)}
            orientation={isMobile ? 'portrait' : 'landscape'}
            slotProps={{
              actionBar: { actions: [] },
            }}
          />
        </Grid>

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
    </LocalizationProvider>
  );
};

export default BookingForm;
