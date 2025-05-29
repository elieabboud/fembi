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
  // 🔥 FIXED: Convert time slots ONLY once when they change
  const convertedTimeSlots = useMemo(() => {
    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }

    const converted = timeSlots.map((slot, index) => {
      const convertedSlot = TimezoneService.convertTimeSlotToLocal(slot);
      return convertedSlot;
    });
    
    return converted;
  }, [timeSlots]);

  // 🔥 FIXED: Convert selected slot for display (don't modify original)
  const selectedSlotDisplay = useMemo(() => {
    if (!selectedSlot) {
      return null;
    }
    const converted = TimezoneService.convertTimeSlotToLocal(selectedSlot);
    return converted;
  }, [selectedSlot]);

  const showTimezoneWarning = TimezoneService.shouldShowTimezoneWarning();
  const userTimezone = TimezoneService.getUserTimezoneDisplay();

  // 🔥 FIXED: Handle slot selection - pass original slot back to parent
  const handleSlotSelection = (originalSlotIndex: number) => {
    if (readOnly) return;
    
    const originalSlot = timeSlots[originalSlotIndex];
    // Pass the original slot (not converted) back to parent
    onSelect(originalSlot);
  };

  return (
    <Box sx={{ justifySelf: 'start'}}>
      <Typography variant="h6" gutterBottom>
        {readOnly ? 'Selected Time' : 'Select Time'}
      </Typography>

      {/* Timezone Warning - only show if not in EST and not read-only */}
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

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', height: 'auto', my: 2 }}>
          <CircularProgress size={20} thickness={4} sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading available times...
          </Typography>
        </Box>
      )}
      
      {/* Read-only mode - show only selected time */}
      {readOnly && selectedSlotDisplay ? (
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
            {selectedSlotDisplay.displayText}
          </Button>
          
          {/* Timezone info for read-only mode */}
          {showTimezoneWarning && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Local Time:</strong> {selectedSlotDisplay.displayText}<br/>
                <strong>Your Timezone:</strong> {userTimezone}
              </Typography>
            </Box>
          )}
        </Box>
      ) : !readOnly && !loading ? (
        /* Edit mode - show all available time slots */
        <Grid container spacing={2}>
          {convertedTimeSlots.map((convertedSlot, index) => {
            // Check if this slot is selected by comparing with original slot
            const originalSlot = timeSlots[index];
            const isSelected = selectedSlot && 
              selectedSlot.startTime === originalSlot.startTime && 
              selectedSlot.staffMemberId === originalSlot.staffMemberId;
            
            return (
              <Grid item xs={4} key={`${originalSlot.startTime}-${originalSlot.staffMemberId}`}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => handleSlotSelection(index)}
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
                  {convertedSlot.displayText}
                </Button>
              </Grid>
            );
          })}
        </Grid>
      ) : !readOnly && !loading && convertedTimeSlots.length === 0 ? (
        /* No time slots available */
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No time slots available for this date. Please select a different date.
        </Typography>
      ) : readOnly && !selectedSlotDisplay ? (
        /* Read-only mode without selected slot */
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No time slot selected
        </Typography>
      ) : null}

      {/* Debug info (remove in production) */}
      {/* {process.env.NODE_ENV === 'development' && !loading && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.75rem' }}>
          <Typography variant="caption" display="block">
            <strong>Debug:</strong> {convertedTimeSlots.length} slots converted
          </Typography>
          <Typography variant="caption" display="block">
            <strong>Selected:</strong> {selectedSlot ? selectedSlot.startTime : 'None'}
          </Typography>
          <Typography variant="caption" display="block">
            <strong>User TZ:</strong> {TimezoneService.getUserTimezone()}
          </Typography>
        </Box>
      )} */}
    </Box>
  );
};

export default TimeSelector;