import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: 'Completed' | 'Scheduled' | 'Cancelled' | 'Active' | 'Pending' | 'Banned' | 'Rejected';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  // Map status to colors and variants
  const getStatusProps = () => {
    switch (status) {
      case 'Completed':
        return { bgcolor: '#4caf50', color: '#fff' };
      case 'Scheduled':
        return { bgcolor: '#1a3c75', color: '#fff' };
      case 'Cancelled':
        return { bgcolor: '#f44336', color: '#fff' };
      case 'Active':
        return { bgcolor: '#4caf50', color: '#fff' };
      case 'Pending':
        return { bgcolor: '#ff9800', color: '#fff' };
      case 'Banned':
        return { bgcolor: '#f44336', color: '#fff' };
      case 'Rejected':
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
        ...getStatusProps(),
      }}
      {...props}
    />
  );
};

export default StatusBadge;