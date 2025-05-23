import React, { useState, useMemo } from 'react';
import { Box, Button, Typography, Grid, CircularProgress, Alert, Chip } from '@mui/material';
import { TimeSlot } from '../../types/service';
import { TimezoneService } from '../../services/timezoneUtils';

interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  onSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
  loading?: boolean;
  readOnly?: boolean;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  timeSlots, 
  onSelect, 
  selectedSlot, 
  loading = false,
  readOnly = false 
}) => {
  // Convert time slots to user's timezone
  const convertedTimeSlots = useMemo(() => {
    return timeSlots.map(slot => TimezoneService.convertTimeSlotToLocal(slot));
  }, [timeSlots]);

  // Convert selected slot to user's timezone
  const convertedSelectedSlot = useMemo(() => {
    if (!selectedSlot) return null;
    return TimezoneService.convertTimeSlotToLocal(selectedSlot);
  }, [selectedSlot]);

  const showTimezoneWarning = TimezoneService.shouldShowTimezoneWarning();
  const userTimezone = TimezoneService.getUserTimezoneDisplay();

  return (
    <Box sx={{justifySelf: 'start', p: '16px' }}>
      <Typography variant="h6" gutterBottom>
        {readOnly ? 'Selected Time' : 'Select Time'}
      </Typography>

      {/* Timezone Warning */}
      {showTimezoneWarning && !readOnly && (
        <Alert 
          severity="info" 
          sx={{ mb: 2, fontSize: '0.875rem' }}
          action={
            <Chip 
              label={userTimezone} 
              size="small" 
              variant="outlined" 
              color="info"
            />
          }
        >
          Times are shown in your local timezone. All appointments will be automatically coordinated.
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', height: 'auto', my: 2 }}>
          <CircularProgress size={20} thickness={4} sx={{ my: 1 }} />
        </Box>
      )}
      
      {readOnly && convertedSelectedSlot ? (
        // Show only the selected time slot in read-only mode
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="medium"
            disabled
            sx={{
              textTransform: 'none',
              borderRadius: '24px',
              backgroundColor: 'primary.main',
              color: 'common.white',
              minWidth: 120,
              '&.Mui-disabled': {
                backgroundColor: 'primary.main',
                color: 'common.white',
                opacity: 1,
              }
            }}
          >
            {convertedSelectedSlot.displayText}
          </Button>
          {showTimezoneWarning && (
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              {userTimezone}
            </Typography>
          )}
        </Box>
      ) : !readOnly ? (
        // Show all time slots for selection in edit mode
        <Grid container spacing={2}>
          {convertedTimeSlots.map((slot, index) => {
            // Find the original slot for comparison
            const originalSlot = timeSlots[index];
            const isSelected = selectedSlot?.startTime === originalSlot?.startTime;
            
            return (
              <Grid item xs={4} key={slot.startTime}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => onSelect(originalSlot)} // Pass the original slot back
                  sx={{
                    textTransform: 'none',
                    borderRadius: '24px',
                    backgroundColor: isSelected ? 'primary.main' : 'grey.400',
                    color: isSelected ? 'common.white' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isSelected ? 'primary.dark' : 'grey.500',
                    },
                  }}
                >
                  {slot.displayText}
                </Button>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Fallback for read-only mode without selected slot
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No time slot selected
        </Typography>
      )}

      {/* Show timezone info for selected time in read-only mode */}
      {readOnly && convertedSelectedSlot && showTimezoneWarning && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Local Time:</strong> {convertedSelectedSlot.displayText}<br/>
            <strong>Your Timezone:</strong> {userTimezone}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TimeSelector;