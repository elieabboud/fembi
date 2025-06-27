import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import { TimezoneService } from '../../services/timezoneUtils';

interface TimezoneDisplayProps {
  variant?: 'chip' | 'text' | 'tooltip';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  backendTime?: string; // Optional: show converted time
}

const TimezoneDisplay: React.FC<TimezoneDisplayProps> = ({
  variant = 'chip',
  size = 'small',
  showIcon = true,
  backendTime
}) => {
  const userTimezone = TimezoneService.getUserTimezoneDisplay();
  const shouldShow = TimezoneService.shouldShowTimezoneWarning();

  if (!shouldShow) {
    return null; // Don't show if user is already in EST
  }

  const content = (
    <>
      {showIcon && <TimeIcon sx={{ fontSize: size === 'small' ? 16 : 20, mr: 0.5 }} />}
      {userTimezone}
    </>
  );

  const tooltipContent = (
    <Box>
      <Typography variant="body2">
        <strong>Your Timezone:</strong> {userTimezone}
      </Typography>
      <Typography variant="body2">
        All times are automatically converted from Eastern Time.
      </Typography>
      {backendTime && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Local Time:</strong> {TimezoneService.formatTimeForUser(backendTime, 'h:mm a')}
        </Typography>
      )}
    </Box>
  );

  if (variant === 'chip') {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Chip
          icon={showIcon ? <TimeIcon /> : undefined}
          label={userTimezone}
          size={size}
          variant="outlined"
          color="info"
          sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
        />
      </Tooltip>
    );
  }

  if (variant === 'text') {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'help',
            fontSize: size === 'small' ? '0.75rem' : '0.875rem'
          }}
        >
          {content}
        </Typography>
      </Tooltip>
    );
  }

  if (variant === 'tooltip') {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'help',
            color: 'info.main'
          }}
        >
          {content}
        </Box>
      </Tooltip>
    );
  }

  return null;
};

export default TimezoneDisplay;