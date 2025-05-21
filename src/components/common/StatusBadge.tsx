import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { BookingStatus } from '../../types/calendarBooking';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: BookingStatus | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  // Map status to colors and variants
  const getStatusProps = () => {
    switch (status) {
      case 'completed':
        return { bgcolor: '#008000', color: '#fff' };
      case 'upcoming':
        return { bgcolor: '#D3323A', color: '#fff' };
      case 'Cancelled':
        return { bgcolor: '#f44336', color: '#fff' };
      case 'inProgress':
        return { bgcolor: '#4caf50', color: '#fff' };
      case 'canceled':
        return { bgcolor: '#9e9e9e', color: '#fff' };
      default:
        return { bgcolor: '#e0e0e0', color: 'text.primary' };
    }
  };

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 'medium',
        padding: '4px 8px',
        width: '100%',
        height: '30px',
        borderRadius: '10px',
        ...getStatusProps(),
      }}
      {...props}
    />
  );
};

export default StatusBadge;