import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box } from '@mui/material';

type LogoutDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
          <DialogTitle sx={{ textAlign: 'left' }}>Are you sure you want to log out?</DialogTitle>
          <DialogActions sx={{ justifyContent: 'end' }}>
            <Button onClick={onClose} color="primary" variant='outlined'>
              No
            </Button>
            <Button onClick={onConfirm} variant="contained" color="error" sx={{ backgroundColor: '#D3323A'}}>
              Yes
            </Button>
          </DialogActions>
      </Box>
    </Dialog>
  );
};

export default LogoutDialog;
