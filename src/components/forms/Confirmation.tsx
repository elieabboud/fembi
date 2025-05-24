import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  TextField,
  Box,
  Button,
  Stack,
  Grid,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { CreateAppointmentRequest } from '../../types/CreateAppointmentRequest';
import { LoanDetails } from '../../types/loanDetails';
import { bookingService } from '../../services/bookingService';
import { EmailRequestDTO } from '../../types/email';

type ConfirmationProps = {
  open: boolean;
  onClose: () => void;
  booking: CreateAppointmentRequest;
  loanDetails: LoanDetails | null; // Allow null for loading state
};

const Confirmation: React.FC<ConfirmationProps> = ({
  open,
  onClose,
  booking,
  loanDetails
}) => {
  // If loanDetails is null, we're still loading
  const isLoading = !loanDetails;

  const emailSubject = `Appointment Confirmation: ${booking.ServiceName}`;
  const emailBody = `
    Your appointment has been scheduled successfully.
    
    Appointment Details:
    - Service Name: ${booking.ServiceName}
    - Date & Time: ${booking.DateTimeInfo.SelectedDate} at ${booking.DateTimeInfo.SelectedTime}
    - Loan Officer: ${loanDetails?.loanOfficer || 'Loading...'}
    - Customer: ${booking.BorrowerInformation.FirstName} ${booking.BorrowerInformation.LastName}
    
    ${loanDetails ? `
    Loan Information:
    - Loan Number: ${loanDetails.loanNumber}
    - Loan Type: ${loanDetails.loanType}
    - Loan Amount: $${loanDetails.loanAmount?.toLocaleString()}
    ` : 'Loading loan details...'}
  `;

  const handleSendEmail = async () => {
    if (!loanDetails) {
      alert('Please wait for loan details to load before sending email.');
      return;
    }

    try {
      const emailRequest: EmailRequestDTO = {
        To: [booking.BorrowerInformation.Email],
        Subject: emailSubject,
        Body: emailBody,
        IsHtml: false,
      };

      const response = await bookingService.sendEmail(emailRequest);

      if (response.Success) {
        alert('Email sent successfully!');
      } else {
        alert(`Failed to send email: ${response.Message}`);
      }
    } catch (error) {
      alert('Failed to send email.');
      console.error(error);
    }
  };

  const handleCopyToClipboard = () => {
    if (!loanDetails) {
      alert('Please wait for loan details to load before copying.');
      return;
    }

    const textToCopy = `
    ${emailSubject}

    ${emailBody}
        `.trim();

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Appointment details copied to clipboard!');
      })
      .catch((err) => {
        alert('Failed to copy to clipboard');
        console.error(err);
      });
  };

  useEffect(() => {
    console.log('Confirmation - received booking:', booking);
    console.log('Confirmation - received loanDetails:', loanDetails);
  }, [booking, loanDetails]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box sx={{ p: 4, position: 'relative', color: 'gray' }}>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: '30px', fontWeight: 'bold', color: 'black' }}
          >
            Appointment Booked!
          </Typography>
          <CloseIcon 
            sx={{ float: 'right', color: 'gray', cursor: 'pointer' }} 
            onClick={onClose} 
          />
        </Grid>

        <DialogContent sx={{ py: 2, px: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
              <CircularProgress />
              <Typography variant="body1">
                Loading appointment details...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your appointment with <strong>{loanDetails.loanOfficer}</strong> has been scheduled successfully.
                A confirmation email will be sent to your inbox.<br />
                An email has been sent to both <strong>{booking.BorrowerInformation.FirstName} {booking.BorrowerInformation.LastName}</strong> and <strong>{loanDetails.loanOfficer}</strong>
              </Typography>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Appointment Details
              </Typography>

              <Stack spacing={2}>
                <TextField 
                  variant="outlined" 
                  label="Service Name" 
                  value={booking.ServiceName || ''} 
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }} 
                />
                <TextField
                  variant="outlined"
                  label="Date & Time"
                  value={`${booking.DateTimeInfo.SelectedDate || ''} at ${booking.DateTimeInfo.SelectedTime || ''}`}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }}
                />
                <TextField 
                  variant="outlined" 
                  label="Loan Officer" 
                  value={loanDetails.loanOfficer || ''} 
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }} 
                />
                <TextField 
                  variant="outlined" 
                  label="Customer" 
                  value={`${booking.BorrowerInformation.FirstName || ''} ${booking.BorrowerInformation.LastName || ''}`} 
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }} 
                />
                
                {/* Additional loan details */}
                <TextField 
                  variant="outlined" 
                  label="Loan Number" 
                  value={loanDetails.loanNumber || ''} 
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }} 
                />
                <TextField 
                  variant="outlined" 
                  label="Loan Type" 
                  value={loanDetails.loanType || ''} 
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }} 
                />
                <TextField 
                  variant="outlined" 
                  label="Loan Amount" 
                  value={loanDetails.loanAmount ? `$${loanDetails.loanAmount.toLocaleString()}` : ''} 
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }} 
                />
              </Stack>

              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Share & Export
              </Typography>

              <Stack direction="row" width={'100%'} justifyContent={'space-between'} spacing={2}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  startIcon={<EmailIcon />} 
                  onClick={handleSendEmail}
                  disabled={isLoading}
                >
                  Send via Email
                </Button>
                <Button 
                  fullWidth 
                  variant="contained" 
                  startIcon={<ContentCopyIcon />} 
                  onClick={handleCopyToClipboard}
                  disabled={isLoading}
                >
                  Copy to Clipboard
                </Button>
              </Stack>

              <Typography variant="body2" sx={{ mt: 2 }}>
                You can also find this appointment in your FEMBi Calendar.
              </Typography>
            </>
          )}
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default Confirmation;