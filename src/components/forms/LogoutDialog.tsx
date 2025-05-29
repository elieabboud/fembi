import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, CircularProgress } from '@mui/material';

type LogoutDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onConfirm }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = () => {
    try {
      setIsLoggingOut(true);      
      // Call the logout function (now synchronous)
      onConfirm();
    } catch (error) {
      console.error('LogoutDialog: Logout failed:', error);
      setIsLoggingOut(false);
      // Fallback redirect
      window.location.href = '/login';
    }
  };

  const handleClose = () => {
    if (!isLoggingOut) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={isLoggingOut}
    >
      <Box sx={{ p: 3 }}>
        <DialogTitle sx={{ textAlign: 'left', px: 0 }}>
          {isLoggingOut ? 'Logging out...' : 'Are you sure you want to log out?'}
        </DialogTitle>
        
        {isLoggingOut && (
          <DialogContent sx={{ px: 0, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <span>Please wait while we log you out...</span>
            </Box>
          </DialogContent>
        )}
        
        <DialogActions sx={{ justifyContent: 'end', px: 0 }}>
          <Button 
            onClick={handleClose} 
            color="primary" 
            variant='outlined'
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Please wait...' : 'No'}
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color="error" 
            sx={{ backgroundColor: '#D3323A' }}
            disabled={isLoggingOut}
            startIcon={isLoggingOut ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isLoggingOut ? 'Logging out...' : 'Yes'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default LogoutDialog;