import React, { useEffect } from 'react';
import { FormControl, Select, MenuItem, Box, SelectChangeEvent, InputLabel } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarViewSelectorProps {
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const CalendarViewSelector: React.FC<CalendarViewSelectorProps> = ({ view, onViewChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleViewChange = (event: SelectChangeEvent<string>) => {
    const newView = event.target.value as CalendarViewType;
    onViewChange(newView);
  };

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 200,
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
    disablePortal: true,
    disableScrollLock: false,
  };

  return (
    <FormControl 
      fullWidth
      variant="outlined"
    >
      <Select
        value={view}
        onChange={handleViewChange}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        displayEmpty
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
    </FormControl>
  );
};

export default CalendarViewSelector;