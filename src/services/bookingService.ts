import { EmailRequestDTO, EmailResponseDTO } from './../types/email';
import { GetRequestDTO, GetResponseDTO } from './../types/users_table';
import { TimeSlot } from './../types/service';
import api from './api';
import { calendarBooking } from '../types/calendarBooking';
import { LoanDetails } from '../types/loanDetails';
import { CreateAppointmentRequest } from '../types/CreateAppointmentRequest';
import { BookingService } from '../types/service';

export const bookingService = {

  //get calendar data
  async getCalendarData( start: string, end: string): Promise<calendarBooking[]> {
    const response = await api.get('/api/Application/v1/GetCalendarData', {
      params: {
        startDateTime: start,
        endDateTime: end
      },
    });
    return response.data;
  },

  //get available time slots
  async getAvailableTimeSlots(serviceId: string, selectedDateTime: string): Promise<TimeSlot[]> {
    const response = await api.get('/api/Application/v1/GetAvailableTimeSlots', {
      params: {
        serviceId,
        selectedDateTime
      }
    });
  
    return response.data;
  },
  
  //get available services
  async getAvailableServices(): Promise<BookingService[]> {
    const response = await api.get('/api/Application/v1/GetAvailableServices');
    return response.data;
  },

  //get loan details
  async getLoanDetails(loanId : string): Promise<LoanDetails>{
    const response = await api.get('/api/Encompass/v1/GetLoanDetails', {
      params: {
        loanId: loanId
      },
    });
    console.log(response);
    return response.data;
  },

  //create appointment
  async postBooking (appointmentData : CreateAppointmentRequest) : Promise<void> {
    const response = await api.post('/api/Application/v1/CreateAppointment', appointmentData);
    console.log(response);
    return response.data;
  },

  //create appointment
  async deleteBooking(appointmentId: string): Promise<void> {
    const response = await api.delete('/api/Application/v1/DeleteAppointment', {
      params: { appointmentId }
    });
    return response.data;
  },

  //get followers
  async getFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetFollowers');
    return response.data;
  },

  //set followers
  async setFollowers(followers: string[]): Promise<void> {
    const query = encodeURIComponent(followers.join(','));
    await api.post(`/api/Application/v1/SetFollowers?followers=${query}`);
  },

  async updateFollowers (newFollowers: string[]) {
    try {
      const existingFollowers = await this.getFollowers();
      const allFollowers = Array.from(new Set([...existingFollowers, ...newFollowers]));
  
      const query = encodeURIComponent(allFollowers.join(','));
      const response = await api.post(`/api/Application/v1/SetFollowers?followers=${query}`);
      
      console.log('Followers updated:', response.data);
    } catch (error) {
      console.error('Error updating followers:', error);
    }
  },

  // GET global followers
  async getGlobalFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetGlobalFollowers');
    return response.data;
  },

  // SET global followers
  async setGlobalFollowers(followers: string[]): Promise<void> {
    const query = encodeURIComponent(followers.join(','));
    await api.post(`/api/Application/v1/SetGlobalFollowers?followers=${query}`);
  },

  // update global followers
  async updateGlobalFollowers (newFollowers: string[]) {
    try {
      const existing = await this.getGlobalFollowers();
      const all = Array.from(new Set([...existing, ...newFollowers]));
      await this.setGlobalFollowers(all);
      console.log('Global followers updated.');
    } catch (error) {
      console.error('Failed to update global followers:', error);
    }
  },

  //get users from DB
  async getUsers(getRequestDTO: GetRequestDTO): Promise<GetResponseDTO> {
    const response = await api.get('/api/Databases/v1/Get');
    return response.data;
  },

  async sendEmail(request: EmailRequestDTO): Promise<EmailResponseDTO> {
    const response = await api.post('/api/Application/v1/SendEmail', request);
    return response.data;
  },
}

