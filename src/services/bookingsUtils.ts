import { BookingStatus, calendarBooking } from "../types/calendarBooking";

export function determineBookingStatus(booking: calendarBooking): BookingStatus {
if (!booking.start?.dateTime || !booking.end?.dateTime) {
    return 'upcoming';
}

const now = new Date();
const startTime = new Date(booking.start.dateTime);
const endTime = new Date(booking.end.dateTime);

if (now < startTime) {
    return 'upcoming';
} else if (now >= startTime && now <= endTime) {
    return 'inProgress';
} else {
    return 'completed';
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

// 🔥 FIXED: Status-based color assignment instead of random
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

// Keep the old random function for backward compatibility if needed
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

// 🔥 FIXED: Use status-based colors instead of random colors
export function addColorToBooking(booking: calendarBooking): calendarBooking {
    if (!booking) {
        console.error('addColorToBooking called with null/undefined booking');
        return booking;
    }

    // Ensure the booking has a status (it should already have one from addStatusToBooking)
    const status = booking.status || determineBookingStatus(booking);
    const color = getColorByServiceLocation(booking.serviceName);


    return {
        ...booking,
        status,
        color
    };
}