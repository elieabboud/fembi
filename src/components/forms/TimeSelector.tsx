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
  editMode?: boolean; // 🔥 NEW: Add edit mode prop
  originalSlot?: TimeSlot | null; // 🔥 NEW: Track original slot
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  timeSlots, 
  onSelect, 
  selectedSlot, 
  loading = false,
  readOnly = false,
  editMode = false, // 🔥 NEW
  originalSlot = null // 🔥 NEW
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

  // 🔥 NEW: Convert original slot for display
  const originalSlotDisplay = useMemo(() => {
    if (!originalSlot) {
      return null;
    }
    const converted = TimezoneService.convertTimeSlotToLocal(originalSlot);
    return converted;
  }, [originalSlot]);

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
        {readOnly ? 'Selected Time' : editMode ? 'Update Time' : 'Select Time'}
      </Typography>

      {/* 🔥 NEW: Show info about original slot in edit mode */}
      {editMode && originalSlotDisplay && !readOnly && (
        <Alert 
          severity="info" 
          sx={{ mb: 2, fontSize: '0.875rem' }}
        >
          <strong>Current appointment:</strong> {originalSlotDisplay.displayText}
          <br />
          <em>Select a new time slot to reschedule, or keep the current time.</em>
        </Alert>
      )}

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
            { readOnly? "Loading selected time..." : "Loading available times..." }
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
        /* Edit/Create mode - show all available time slots */
        <Grid container spacing={2}>
          {convertedTimeSlots.map((convertedSlot, index) => {
            // Check if this slot is selected by comparing with original slot
            const originalSlotAtIndex = timeSlots[index];
            const isSelected = selectedSlot && 
              selectedSlot.startTime === originalSlotAtIndex.startTime && 
              selectedSlot.staffMemberId === originalSlotAtIndex.staffMemberId;
            
            // 🔥 NEW: Check if this is the original slot in edit mode
            const isOriginalSlot = !editMode && originalSlot && 
              originalSlotAtIndex.startTime === originalSlot.startTime &&
              originalSlotAtIndex.endTime === originalSlot.endTime &&
              originalSlotAtIndex.staffMemberId === originalSlot.staffMemberId;
            
            return (
              <Grid item xs={4} key={`${originalSlotAtIndex.startTime}-${originalSlotAtIndex.staffMemberId}`}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => handleSlotSelection(index)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '24px',
                    backgroundColor: isSelected 
                      ? 'primary.main' 
                      : isOriginalSlot 
                        ? 'warning.light' // 🔥 NEW: Different color for original slot
                        : 'grey.400',
                    color: isSelected || isOriginalSlot ? 'common.white' : 'text.primary',
                    border: isOriginalSlot ? '2px solid #ff9800' : 'none', // 🔥 NEW: Border for original
                    position: 'relative',
                    minHeight: '48px', // Ensure enough space for text
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: isSelected 
                        ? 'primary.dark' 
                        : isOriginalSlot 
                          ? 'warning.main'
                          : 'grey.500',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                    {convertedSlot.displayText}
                  </Typography>
                  
                  {/* 🔥 NEW: Add indicator for original slot */}
                  {isOriginalSlot && !isSelected && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        opacity: 0.9,
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}
                    >
                      Current
                    </Typography>
                  )}
                  
                  {/* Show "Selected" indicator for currently selected slot */}
                  {isSelected && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        opacity: 0.9,
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}
                    >
                      Selected
                    </Typography>
                  )}
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
      ) : readOnly && !selectedSlotDisplay && !loading ? (
        /* Read-only mode without selected slot */
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No time slot selected
        </Typography>
      ) : null}

    </Box>
  );
};

export default TimeSelector;