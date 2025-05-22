import React, { useState } from 'react';
import { Box, Button, Typography, Grid, CircularProgress } from '@mui/material';
import { TimeSlot } from '../../types/service';

interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  onSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
  loading?: boolean;
  readOnly?: boolean; // New prop for read-only mode
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  timeSlots, 
  onSelect, 
  selectedSlot, 
  loading = false,
  readOnly = false 
}) => {
  return (
    <Box sx={{justifySelf: 'start', p: '16px' }}>
      <Typography variant="h6" gutterBottom>
        {readOnly ? 'Selected Time' : 'Select Time'}
      </Typography>
      {loading && (
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', height: 'auto', my: 2 }}>
          <CircularProgress size={20} thickness={4} sx={{ my: 1 }} />
        </Box>
      )}
      
      {readOnly && selectedSlot ? (
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
            {selectedSlot.displayText}
          </Button>
        </Box>
      ) : !readOnly ? (
        // Show all time slots for selection in edit mode
        <Grid container spacing={2}>
          {timeSlots.map((slot) => {
            const isSelected = selectedSlot?.startTime === slot.startTime;
            return (
              <Grid item xs={4} key={slot.startTime}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => onSelect(slot)}
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
    </Box>
  );
};

export default TimeSelector;