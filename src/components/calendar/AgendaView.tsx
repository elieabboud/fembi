import React from 'react';
import { Box, Typography, List, ListItem, Paper, Chip } from '@mui/material';
import { calendarBooking } from '../../types/calendarBooking';
import { groupEventsByDate, isToday, getFormattedDate, isAllDayEvent, formatEventTime } from '../../services/calendarUtils';

interface AgendaViewProps {
  currentDate: Date;
  events: calendarBooking[];
  onDateChange: (date: Date) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ currentDate, events, onDateChange }) => {
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', py: 2 }}>
      {sortedDates.length > 0 ? (
        sortedDates.map((dateKey) => (
          <Box key={dateKey} sx={{ mb: 3 }}>
            <Box sx={{ p: 1, bgcolor: 'rgba(224, 222, 222, 0.12)', borderRadius: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: isToday(new Date(dateKey)) ? 'bold' : 'normal',
                  color: isToday(new Date(dateKey)) ? 'primary.main' : 'text.primary',
                }}
              >
                {getFormattedDate(dateKey)}
              </Typography>
            </Box>

            {/* Event List */}
            <List sx={{ mt: 1 }}>
              {groupedEvents[dateKey].map((event) => (
                <Paper
                  elevation={1}
                  sx={{
                    mb: 1,
                    boxShadow: 0,
                    '&:hover': {
                      cursor: 'pointer',
                    },
                  }}
                >
                  <ListItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Event Time */}
                      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold', marginRight: 2, width: '150px' }}>
                        {isAllDayEvent(event) ? 'All day' : 
                        `${formatEventTime(event)}`}
                      </Typography>

                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: 100,
                        backgroundColor: event?.color,
                      }}></Box>

                      <Typography variant="body1" sx={{ fontWeight: 'medium', mx: 2 }}>
                        {event?.serviceName}
                      </Typography>
                    </Box>

                    {/* {event.location && (
                      <Box>{event.location}</Box>
                    )} */}
                  </ListItem>
                </Paper>
              ))}
            </List>
          </Box>
        ))
      ) : (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No events scheduled
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AgendaView;
