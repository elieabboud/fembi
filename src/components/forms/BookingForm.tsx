import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { bookingService } from '../../services/bookingService';

// Sample data for dropdowns
const serviceLocations = ['San Juan', 'Ponce', 'Mayagüez', 'Carolina', 'Bayamón'];
const loanOfficers = ['John Davis', 'Laura Chen', 'Michael Brown', 'Jahn Devis'];
const loanTypes = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo'];

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(new Date());
  
  // Form data
  const [formData, setFormData] = useState({
    encompassLoanId: '',
    borrowerFirstName: '',
    borrowerLastName: '',
    borrowerEmail: '',
    borrowerPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    loanNumber: '',
    loanType: '',
    loanAmount: '',
    loanOfficer: '',
    notes: '',
    serviceLocation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Collect all form data
    const bookingData = {
      ...formData,
      closingDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      closingTime: selectedTime ? format(selectedTime, 'HH:mm') : '',
      borrower: `${formData.borrowerFirstName} ${formData.borrowerLastName}`,
      propertyAddress: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
      status: 'Scheduled',
    };

    try {
      // In a real app, you would call the API to create the booking
      // await bookingService.createBooking(bookingData);
      console.log('Booking data:', bookingData);
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
    navigate('/bookings');
  };

  const handleCancel = () => {
    navigate('/bookings');
  };

  const steps = ['Select Service', 'Add Client Details', 'Select Date'];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Schedule a New Booking
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 1 }}>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Select Service */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Service
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel id="service-location-label">Service Location</InputLabel>
                <Select
                  labelId="service-location-label"
                  id="serviceLocation"
                  name="serviceLocation"
                  value={formData.serviceLocation}
                  label="Service Location"
                  onChange={handleSelectChange}
                  required
                >
                  {serviceLocations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Add Client Details */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Add Client Details
              </Typography>
              
              <TextField
                fullWidth
                margin="normal"
                label="Encompass Loan ID"
                name="encompassLoanId"
                value={formData.encompassLoanId}
                onChange={handleChange}
              />

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Borrower Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="First Name"
                    name="borrowerFirstName"
                    value={formData.borrowerFirstName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Last Name"
                    name="borrowerLastName"
                    value={formData.borrowerLastName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Borrower Contact Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    type="email"
                    name="borrowerEmail"
                    value={formData.borrowerEmail}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Phone Number"
                    name="borrowerPhone"
                    value={formData.borrowerPhone}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Borrower Address
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="city-label">City</InputLabel>
                    <Select
                      labelId="city-label"
                      id="city"
                      name="city"
                      value={formData.city}
                      label="City"
                      onChange={handleSelectChange}
                      required
                    >
                      <MenuItem value="San Juan">San Juan</MenuItem>
                      <MenuItem value="Ponce">Ponce</MenuItem>
                      <MenuItem value="Mayagüez">Mayagüez</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="state-label">State</InputLabel>
                    <Select
                      labelId="state-label"
                      id="state"
                      name="state"
                      value={formData.state}
                      label="State"
                      onChange={handleSelectChange}
                      required
                    >
                      <MenuItem value="PR">Puerto Rico</MenuItem>
                      <MenuItem value="FL">Florida</MenuItem>
                      <MenuItem value="TX">Texas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Zip Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Loan Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Loan Number"
                    name="loanNumber"
                    value={formData.loanNumber}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="loan-type-label">Loan Type</InputLabel>
                    <Select
                      labelId="loan-type-label"
                      id="loanType"
                      name="loanType"
                      value={formData.loanType}
                      label="Loan Type"
                      onChange={handleSelectChange}
                    >
                      {loanTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Loan Amount"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="loan-officer-label">Loan Officer</InputLabel>
                    <Select
                      labelId="loan-officer-label"
                      id="loanOfficer"
                      name="loanOfficer"
                      value={formData.loanOfficer}
                      label="Loan Officer"
                      onChange={handleSelectChange}
                    >
                      {loanOfficers.map((officer) => (
                        <MenuItem key={officer} value={officer}>
                          {officer}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                margin="normal"
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={4}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3: Select Date */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Date
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12}>
                    <DatePicker
                      label="Closing Date"
                      value={selectedDate}
                      onChange={(newDate) => setSelectedDate(newDate)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle1" gutterBottom>
                  Select Time
                </Typography>
                <Grid container spacing={2}>
                  {['09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM'].map((time) => (
                    <Grid item xs={6} sm={4} key={time}>
                      <Button
                        variant={selectedTime && format(selectedTime, 'hh:mm a') === time ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={() => {
                          const [hours, minutes] = time.split(':');
                          const isPM = time.includes('PM');
                          const date = new Date();
                          date.setHours(
                            isPM ? parseInt(hours) + 12 : parseInt(hours),
                            parseInt(minutes),
                            0
                          );
                          setSelectedTime(date);
                        }}
                        sx={{ py: 1 }}
                      >
                        {time}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </LocalizationProvider>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Box>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                  >
                    Schedule
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </form>
      </Paper>

      {/* Booking Confirmation Dialog */}
      <Dialog open={successDialogOpen} onClose={handleCloseSuccessDialog}>
        <DialogTitle>
          Appointment Booked!
          <IconButton
            aria-label="close"
            onClick={handleCloseSuccessDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your appointment with {formData.borrowerFirstName} {formData.borrowerLastName} has been scheduled successfully.
            A confirmation email has been sent to your inbox.
          </DialogContentText>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Appointment Details</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Property Location</Typography>
              <TextField
                fullWidth
                margin="dense"
                value={`${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Date & Time</Typography>
              <TextField
                fullWidth
                margin="dense"
                value={selectedDate && selectedTime ? 
                  `${format(selectedDate, 'EEEE MMMM do, yyyy')} — ${format(selectedTime, 'hh:mm a')} - ${format(new Date(selectedTime.getTime() + 60 * 60 * 1000), 'hh:mm a')}`
                  : ""}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Loan Type</Typography>
              <TextField
                fullWidth
                margin="dense"
                value={formData.loanType || "Mortgage"}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Customer</Typography>
              <TextField
                fullWidth
                margin="dense"
                value={`${formData.borrowerFirstName} ${formData.borrowerLastName}`}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Button 
              startIcon={<span role="img" aria-label="email">📧</span>}
              variant="outlined"
              onClick={handleCloseSuccessDialog}
            >
              Send via Email
            </Button>
            <Button 
              startIcon={<span role="img" aria-label="clipboard">📋</span>}
              variant="contained"
              onClick={handleCloseSuccessDialog}
            >
              Send to Clipboard
            </Button>
          </Box>
        </DialogActions>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            You can also find this appointment in your FNTIS Calendar.
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BookingForm;