import React, { useMemo } from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { calendarBooking } from '../../types/calendarBooking';
import { getColorByServiceLocation } from '../../services/bookingsUtils';

interface LegendItem {
  serviceName: string;
  color: string;
  count: number;
}

interface BookingColorLegendProps {
  bookings: calendarBooking[];
  variant?: 'compact' | 'full';
  orientation?: 'horizontal' | 'vertical';
  showCounts?: boolean;
  maxItems?: number;
}

const BookingColorLegend: React.FC<BookingColorLegendProps> = ({
  bookings,
  variant = 'compact',
  orientation = 'horizontal',
  showCounts = false,
  maxItems = 8
}) => {
  const isCompact = variant === 'compact';
  const isHorizontal = orientation === 'horizontal';

  const legendItems = useMemo(() => {
    const serviceMap = new Map<string, { color: string; count: number }>();
    
    bookings.forEach(booking => {
      const serviceName = booking.serviceName || 'Unknown Service';
      const color = getColorByServiceLocation(serviceName);
      
      if (serviceMap.has(serviceName)) {
        serviceMap.get(serviceName)!.count++;
      } else {
        serviceMap.set(serviceName, { color, count: 1 });
      }
    });

    const items: LegendItem[] = Array.from(serviceMap.entries())
      .map(([serviceName, { color, count }]) => ({
        serviceName,
        color,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, maxItems);

    return items;
  }, [bookings, maxItems]);

  if (legendItems.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: isCompact ? 1.5 : 2,
        backgroundColor: ' #eeeeee',
        borderRadius: 2,
        width: '100%'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: isCompact ? 0.5 : 1 }}>
        <Typography
          variant={isCompact ? 'caption' : 'subtitle2'}
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: isCompact ? '0.75rem' : '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Locations
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          gap: isCompact ? 1 : 1.5,
          flexWrap: isHorizontal ? 'wrap' : 'nowrap',
          alignItems: isHorizontal ? 'center' : 'flex-start',
          justifyContent: isHorizontal ? 'flex-start' : 'flex-start',
          width: '100%'
        }}
      >
        {legendItems.map((item) => (
          <Box
            key={item.serviceName}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: isCompact ? 12 : 16,
                height: isCompact ? 12 : 16,
                borderRadius: '50%',
                backgroundColor: item.color,
                flexShrink: 0,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            />

            <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
              <Typography
                variant={isCompact ? 'caption' : 'body2'}
                sx={{
                  fontWeight: 500,
                  color: 'text.primary',
                  fontSize: isCompact ? '0.65rem' : '0.75rem',
                  lineHeight: 1.2,
                  flex: 1
                }}
              >
                {item.serviceName}
              </Typography>
              
              {showCounts && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: isCompact ? '0.65rem' : '0.7rem',
                    fontWeight: 400,
                    backgroundColor: 'action.hover',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    lineHeight: 1
                  }}
                >
                  {item.count}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default BookingColorLegend;