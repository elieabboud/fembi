import { BookingStatus, calendarBooking } from "../types/calendarBooking";
import { TimezoneService } from "./timezoneUtils";

export function determineBookingStatus(booking: calendarBooking): BookingStatus {
  if (!booking.start?.dateTime || !booking.end?.dateTime) {
    return 'upcoming';
  }

  try {
    const now = new Date();
    
    // Convert backend times (EST/EDT) to user's local timezone for comparison
    const startTimeUser = TimezoneService.convertBackendTimeToLocalReliable(booking.start.dateTime);
    const endTimeUser = TimezoneService.convertBackendTimeToLocalReliable(booking.end.dateTime);

    // Compare using user's local times
    if (now < startTimeUser) {
      return 'upcoming';
    } else if (now >= startTimeUser && now <= endTimeUser) {
      return 'inProgress';
    } else {
      return 'completed';
    }
  } catch (error) {
    console.error('Error determining booking status:', error, booking);
    // Fallback to treating as upcoming if there's an error
    return 'upcoming';
  }
}

export function addStatusToBookings(bookings: calendarBooking[]): calendarBooking[] {
  if (!Array.isArray(bookings)) {
    console.error('addStatusToBookings called with non-array:', bookings);
    return [];
  }

  return bookings.map(booking => addStatusToBooking(booking));
}

export function addStatusToBooking(booking: calendarBooking): calendarBooking {
  if (!booking) {
    console.error('addStatusToBooking called with null/undefined booking');
    return booking;
  }

  const status = determineBookingStatus(booking);

  return {
    ...booking,
    status
  };
}

export const getColorByStatus = (status?: BookingStatus): string => {
  switch (status) {
    case 'completed':
      return '#2196F3'; // Blue for past/completed appointments
    case 'upcoming':
      return '#F44336'; // Red for upcoming appointments
    case 'inProgress':
      return '#FF9800'; // Orange for in-progress appointments
    case 'canceled':
      return '#9E9E9E'; // Gray for canceled appointments
    default:
      return '#2196F3'; // Default to blue
  }
};

export const getColorByServiceLocation = (serviceLocation: string): string => {
  if(!serviceLocation) return 'transparent';
  const colors = [
    '#4285F4', // Blue
    '#EA4335', // Red
    '#34A853', // Green
    '#8E24AA', // Purple
    '#33B679', // Teal
    '#039BE5', // Light Blue
    '#0B8043', // Dark Green
    '#3F51B5', // Indigo
  ];

  if (serviceLocation?.length === 0) return colors[0];
  var hash = 0;
  for (var i = 0; i < serviceLocation?.length; i++) {
    var charCode = serviceLocation?.charCodeAt(i);
    hash += charCode;
  }
  
  return colors[(hash) % colors.length];
};

export function addColorToBookings(bookings: calendarBooking[]): calendarBooking[] {
  if (!Array.isArray(bookings)) {
    console.error('addColorToBookings called with non-array:', bookings);
    return [];
  }

  return bookings.map(booking => addColorToBooking(booking));
}

export function addColorToBooking(booking: calendarBooking): calendarBooking {
  if (!booking) {
    console.error('addColorToBooking called with null/undefined booking');
    return booking;
  }

  const status = booking.status || determineBookingStatus(booking);
  const color = getColorByServiceLocation(booking.serviceName);

  return {
    ...booking,
    status,
    color
  };
}