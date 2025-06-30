import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { TimeSlot } from '../../types/service';
import { TimezoneService } from '../../services/timezoneUtils';
import { format } from 'date-fns';

interface AdminOverrideProps {
  isAdmin: boolean;
  isEditMode: boolean;
  selectedDate: Date | null;
  onOverrideSlot: (slot: TimeSlot) => void;
  onCancelOverride: () => void;
  disabled?: boolean;
}

const AdminOverride: React.FC<AdminOverrideProps> = ({
  isAdmin,
  isEditMode,
  selectedDate,
  onOverrideSlot,
  onCancelOverride,
  disabled = false
}) => {
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [fromDateTime, setFromDateTime] = useState<Date | null>(null);
  const [toDateTime, setToDateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string>('');

  // Don't show for non-admins
  if (!isAdmin) {
    return null;
  }

  const handleOverrideToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsOverrideMode(checked);
    setError('');
    
    if (checked) {
      // Set default times if we have a selected date
      if (selectedDate) {
        const defaultStart = new Date(selectedDate);
        defaultStart.setHours(9, 0, 0, 0); // 9:00 AM
        
        const defaultEnd = new Date(selectedDate);
        defaultEnd.setHours(10, 0, 0, 0); // 10:00 AM
        
        setFromDateTime(defaultStart);
        setToDateTime(defaultEnd);
      } else {
        // If no date selected, use today
        const today = new Date();
        const defaultStart = new Date(today);
        defaultStart.setHours(9, 0, 0, 0);
        
        const defaultEnd = new Date(today);
        defaultEnd.setHours(10, 0, 0, 0);
        
        setFromDateTime(defaultStart);
        setToDateTime(defaultEnd);
      }
    } else {
      // Cancel override
      setFromDateTime(null);
      setToDateTime(null);
      onCancelOverride();
    }
  };

  const handleApplyOverride = () => {
    if (!fromDateTime || !toDateTime) {
      setError('Please select both start and end times');
      return;
    }

    if (fromDateTime >= toDateTime) {
      setError('End time must be after start time');
      return;
    }

    // Check if the duration is reasonable (at least 15 minutes, max 8 hours)
    const durationMs = toDateTime.getTime() - fromDateTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    if (durationMinutes < 15) {
      setError('Appointment duration must be at least 15 minutes');
      return;
    }
    
    if (durationMinutes > 480) { // 8 hours
      setError('Appointment duration cannot exceed 8 hours');
      return;
    }

    try {
      // Convert user's local times to backend EST format
      const backendStartTime = TimezoneService.convertLocalTimeToBackend(fromDateTime);
      const backendEndTime = TimezoneService.convertLocalTimeToBackend(toDateTime);

      // Create a custom TimeSlot object
      const customSlot: TimeSlot = {
        startTime: backendStartTime,
        endTime: backendEndTime,
        displayText: `${format(fromDateTime, 'h:mm a')} - ${format(toDateTime, 'h:mm a')} (Admin Override)`,
        staffMemberId: 'admin-override' // Special identifier for admin overrides
      };

      setError('');
      onOverrideSlot(customSlot);
      
    } catch (conversionError) {
      console.error('Error converting override times:', conversionError);
      setError('Error processing the selected times. Please try again.');
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Checkbox Toggle */}
      <FormControlLabel
        control={
          <Checkbox
            checked={isOverrideMode}
            onChange={handleOverrideToggle}
            disabled={disabled}
            sx={{
              color: '#ff9800',
              '&.Mui-checked': {
                color: '#ff9800',
              },
            }}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminIcon sx={{ color: '#ff9800', fontSize: 20 }} />
            <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#f57c00' }}>
              Admin Override (Bypass all booking rules)
            </Typography>
          </Box>
        }
        sx={{ mb: isOverrideMode ? 2 : 0 }}
      />

      {/* Override Content - Only show when checked */}
      {isOverrideMode && (
        <Box>
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              <strong>Admin Override Active:</strong> This will bypass all availability rules, 
              minimum lead times, and service restrictions. Use with caution.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Start Date & Time"
                value={fromDateTime}
                onChange={(newValue) => {
                  setFromDateTime(newValue);
                  setError('');
                }}
                disabled={disabled}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Select when the appointment starts',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="End Date & Time"
                value={toDateTime}
                onChange={(newValue) => {
                  setToDateTime(newValue);
                  setError('');
                }}
                disabled={disabled}
                minDateTime={fromDateTime || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Select when the appointment ends',
                  },
                }}
              />
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}

            {fromDateTime && toDateTime && !error && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Preview:</strong> {format(fromDateTime, 'EEEE, MMMM d, yyyy')} from{' '}
                    {format(fromDateTime, 'h:mm a')} to {format(toDateTime, 'h:mm a')}
                    <br />
                    <strong>Duration:</strong> {Math.round((toDateTime.getTime() - fromDateTime.getTime()) / (1000 * 60))} minutes
                    <br />
                    <strong>Timezone:</strong> {TimezoneService.getUserTimezoneDisplay()}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsOverrideMode(false);
                    setFromDateTime(null);
                    setToDateTime(null);
                    setError('');
                    onCancelOverride();
                  }}
                  disabled={disabled}
                  sx={{ borderColor: '#ff9800', color: '#ff9800' }}
                >
                  Cancel Override
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ScheduleIcon />}
                  onClick={handleApplyOverride}
                  disabled={disabled || !fromDateTime || !toDateTime}
                  sx={{
                    bgcolor: '#ff9800',
                    '&:hover': { bgcolor: '#f57c00' },
                  }}
                >
                  Apply Override
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AdminOverride;