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

export const getRandomColor = (id?: string | number): string => {
  const colors = [
    '#4285F4', // Blue
    '#EA4335', // Red
    '#FBBC05', // Yellow
    '#34A853', // Green
    '#8E24AA', // Purple
    '#33B679', // Teal
    '#039BE5', // Light Blue
    '#616161', // Gray
    '#0B8043', // Dark Green
    '#3F51B5', // Indigo
  ];

  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
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

    const color = getRandomColor();

    return {
        ...booking,
        color
    };
}