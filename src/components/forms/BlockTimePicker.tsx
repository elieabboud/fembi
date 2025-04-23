import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';

interface BlockTimePickerProps {
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  availableTimes?: string[];
}

// Component for time selection
const BlockTimePicker: React.FC<BlockTimePickerProps> = ({ 
  selectedTime, 
  onTimeSelect, 
  availableTimes 
}) => {
  // If no available times are provided, use some default times
  const times = availableTimes || [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
  ];

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" gutterBottom>Select Time</Typography>
      <Grid container spacing={1}>
        {times.map((time) => (
          <Grid item xs={4} sm={3} md={2} key={time}>
            <Paper
              elevation={selectedTime === time ? 3 : 1}
              sx={{
                p: 1,
                borderRadius: 8,
                textAlign: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                maxHeight: '30px',
                bgcolor: selectedTime === time ? 'primary.light' : 'background.paper',
                color: selectedTime === time ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: selectedTime === time ? 'primary.main' : 'action.hover',
                },
                transition: 'background-color 0.3s, box-shadow 0.3s'
              }}
              onClick={() => onTimeSelect(time)}
            >
              <Typography variant="body2" sx={{fontSize: '12px'}}>{time}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BlockTimePicker;