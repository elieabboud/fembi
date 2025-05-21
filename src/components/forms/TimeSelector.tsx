import React, { useState } from 'react';
import { Box, Button, Typography, Grid } from '@mui/material';
import { TimeSlot } from '../../types/service';

interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  onSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ timeSlots, onSelect, selectedSlot }) => {
  return (
    <Box sx={{ maxWidth: 360, justifySelf: 'start', p: '16px' }}>
      <Typography variant="h6" gutterBottom>
        Select Time
      </Typography>
      <Grid container spacing={2}>
        {timeSlots.map((slot) => {
          const isSelected = selectedSlot?.StartTime === slot.StartTime;
          return (
            <Grid item xs={4} key={slot.StartTime}>
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
                {slot.DisplayText}
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default TimeSelector;