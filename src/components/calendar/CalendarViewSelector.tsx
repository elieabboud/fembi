import React from 'react';
import { FormControl, Select, MenuItem, Box, SelectChangeEvent } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarViewSelectorProps {
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const CalendarViewSelector: React.FC<CalendarViewSelectorProps> = ({ view, onViewChange }) => {
  const handleViewChange = (event: SelectChangeEvent<string>) => {
    const newView = event.target.value as CalendarViewType; // Type assertion here
    onViewChange(newView);
  };

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 160,
        width: 'auto',
      },
      sx: {
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
      }
    },
    anchorOrigin: {
      vertical: 'bottom' as const,
      horizontal: 'left' as const,
    },
    transformOrigin: {
      vertical: 'top' as const,
      horizontal: 'left' as const,
    },
    variant: 'menu' as const,
  };

  return (
    <FormControl size="small"
      sx={{
        minWidth: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: { xs: '100%', md: 'auto' },
      }}>
      <Box sx={{ alignItems: 'center', display: 'flex' }}>
        <Select
          value={view}
          onChange={handleViewChange}
          displayEmpty
          variant="outlined"
          aria-label="calendar view"
          IconComponent={KeyboardArrowDownIcon}
          MenuProps={menuProps}
          sx={{
            paddingRight: 3,
            fontWeight: 'bold',
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            },
            border: 'none',
            boxShadow: 'none',
            outline: 'none'
          }}
        >
          <MenuItem value="month">Month</MenuItem>
          <MenuItem value="week">Week</MenuItem>
          <MenuItem value="day">Day</MenuItem>
          <MenuItem value="agenda">Agenda</MenuItem>
        </Select>
      </Box>
    </FormControl>
  );
};

export default CalendarViewSelector;
