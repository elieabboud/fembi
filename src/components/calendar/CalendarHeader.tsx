import React from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import PrevIcon from '@mui/icons-material/ChevronLeft';
import NextIcon from '@mui/icons-material/ChevronRight';
import { format } from 'date-fns';
import CalendarViewSelector, { CalendarViewType } from './CalendarViewSelector';

interface CalendarHeaderProps {
    currentDate: Date;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onViewChange: (view: CalendarViewType) => void;
    currentView: CalendarViewType; // Pass the current view
  }

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ 
    currentDate,
    onPrev,
    onNext,
    onToday,
    onViewChange,
    currentView,
 }) => {


  const getDateFormat = () => {
    switch (currentView) {
      case 'month':
        return 'MMM yyyy';
      case 'week':
        return 'MMM d, yyyy';
      case 'day':
        return 'EEEE, MMM d, yyyy'; 
      case 'agenda':
        return 'MMM yyyy';
      default:
        return 'MMM yyyy';
    }
  };


  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: { xs: 1, md: 0 },
      my: { xs: 2, md: 4 },
      py: { xs: 1, md: 2 },
      borderTop: '1px solid rgba(0, 0, 0, 0.12)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    }}>
        <Box>
            <CalendarViewSelector
            view={currentView}
            onViewChange={onViewChange} // Pass the onViewChange handler
            />
        </Box>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'flex-start', md: 'center' },
        mb: 0,
        width: '100%',
      }}>
        <IconButton onClick={onPrev}>
          <PrevIcon />
        </IconButton>
        <Typography variant="h6" sx={{
          mx: { xs: 0, md: 2 },
          fontWeight: 'bold',
          width: { xs: '100%', md: 'auto' },
          fontSize: { xs: '12px', md: '20px' },
        }}>
          {format(currentDate, getDateFormat())}
        </Typography>
        <IconButton onClick={onNext}>
          <NextIcon />
        </IconButton>
      </Box>

      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}>
        <Button
          variant="contained"
          onClick={onToday}
          sx={{ width: '100%', height: 40, fontSize: 16, fontWeight: 'bold' }}
        >
          Today
        </Button>
      </Box>
    </Box>
  );
};

export default CalendarHeader;
