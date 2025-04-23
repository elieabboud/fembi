import React from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type ConfirmationProps = {
  open: boolean;
  onClose: () => void;
  serviceLocation: string;
  dateTime: Date | null;
  loanCloser: string;
  customer: string;
};

const Confirmation: React.FC<ConfirmationProps> = ({
  open,
  onClose,
  serviceLocation,
  dateTime,
  loanCloser,
  customer,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box sx={{ p: 4, position: 'relative', color: 'gray' }}>
      <Grid item xs={12} sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Typography
          variant="h4" 
          component="h1"
          sx={{fontSize: '30px', fontWeight: 'bold', color: 'black'}}>Appointment Booked!</Typography>
          <CloseIcon sx={{float: 'right', color: 'gray', cursor: 'pointer'}} onClick={onClose} />
        </Grid>

        <DialogContent sx={{ py: 2, px: 0 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your appointment with <strong>{customer}</strong> has been scheduled successfully.
            A confirmation email has been sent to your inbox.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Appointment Details
          </Typography>

          <Stack spacing={2}>
            <TextField variant="filled" label="Service Location" value={serviceLocation} fullWidth
            InputProps={{
            readOnly: true,
            sx: {
            userSelect: 'none',
            pointerEvents: 'none',
            },
            }} />
            <TextField variant="filled" label="Date & Time" value={dateTime} fullWidth
            InputProps={{
            readOnly: true,
            sx: {
            userSelect: 'none',
            pointerEvents: 'none',
            },
            }} />
            <TextField variant="filled" label="Loan Closer" value={loanCloser} fullWidth
            InputProps={{
            readOnly: true,
            sx: {
            userSelect: 'none',
            pointerEvents: 'none',
            },
            }} />
            <TextField variant="filled" label="Customer" value={customer} fullWidth
            InputProps={{
            readOnly: true,
            sx: {
            userSelect: 'none',
            pointerEvents: 'none',
            },
            }} />
          </Stack>

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Share & Export
          </Typography>

          <Stack direction="row" width={'100%'} justifyContent={'space-between'} spacing={2}>
            <Button fullWidth variant="contained" startIcon={<EmailIcon />}>
              Send via Email
            </Button>
            <Button fullWidth variant="contained" startIcon={<ContentCopyIcon />}>
              Send to Clipboard
            </Button>
          </Stack>

          <Typography variant="body2" sx={{ mt: 2 }}>
            You can also find this appointment in your FEMBi Calendar.
          </Typography>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default Confirmation;
