import api from './api';
import { Booking } from '../types/booking';

export const bookingService = {
  // Get all bookings
  async getBookings(): Promise<Booking[]> {
    const response = await api.get('/bookings');
    return response.data;
  },
  
  // Get booking by ID
  async getBookingById(id: string): Promise<Booking> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  
  // Create new booking
  async createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const response = await api.post('/bookings', booking);
    return response.data;
  },
  
  // Update booking
  async updateBooking(id: string, booking: Partial<Booking>): Promise<Booking> {
    const response = await api.put(`/bookings/${id}`, booking);
    return response.data;
  },
  
  // Delete booking
  async deleteBooking(id: string): Promise<void> {
    await api.delete(`/bookings/${id}`);
  },
  
  // Get booking statistics
  async getBookingStats() {
    const response = await api.get('/bookings/stats');
    return response.data;
  }
};
