import { EmailRequestDTO, EmailResponseDTO } from './../types/email';
import { GetRequestDTO, GetResponseDTO } from './../types/users_table';
import { TimeSlot } from './../types/service';
import api from './api';
import { calendarBooking } from '../types/calendarBooking';
import { LoanDetails } from '../types/loanDetails';
import { CreateAppointmentRequest } from '../types/CreateAppointmentRequest';
import { BookingService } from '../types/service';
import { UpdateBookingRequest } from '../types/updateBookingRequest';
import { TimezoneService } from './timezoneUtils';

export const bookingService = {

  //get calendar data
  async getCalendarData(start: string, end: string): Promise<calendarBooking[]> {
    // The start and end dates are already converted to backend timezone in formatDateForApi
    const response = await api.get('/api/Application/v1/GetCalendarData', {
      params: {
        startDateTime: start,
        endDateTime: end
      },
    });
    
    // Note: The backend returns times in EST, they will be converted to user timezone in the UI components
    return response.data;
  },

  async getIsAdminUser() {
    const response = await api.get('/api/Application/v1/GetIsUserAdmin', {});
    return response.data;
  },

  //get available time slots
  async getAvailableTimeSlots(serviceId: string, selectedDateTime: string): Promise<TimeSlot[]> {
    // Convert the selected date from user's timezone to backend timezone
    const backendDateTime = TimezoneService.convertLocalTimeToBackend(new Date(selectedDateTime));
    
    const response = await api.get('/api/Application/v1/GetAvailableTimeSlots', {
      params: {
        serviceId,
        selectedDateTime: backendDateTime
      }
    });
  
    // The response contains time slots in backend timezone (EST)
    // They will be converted to user timezone in the TimeSelector component
    return response.data;
  },
  
  //get available services
  async getAvailableServices(): Promise<BookingService[]> {
    const response = await api.get('/api/Application/v1/GetAvailableServices');
    const services = response.data.value;
    return services;
  },

  //get loan details
  async getLoanDetails(loanId: string): Promise<LoanDetails>{
    const response = await api.get('/api/Encompass/v1/GetLoanDetails', {
      params: {
        loanId: loanId
      },
    });
    console.log(response);
    return response.data;
  },

  //create appointment
  async postBooking(appointmentData: CreateAppointmentRequest): Promise<void> {
    // Convert date/time fields from user timezone to backend timezone
    const backendAppointmentData = {
      ...appointmentData,
      DateTimeInfo: {
        ...appointmentData.DateTimeInfo,
        FromDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.FromDate)),
        ToDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.ToDate)),
        // SelectedDate and SelectedTime can remain as is since they're used for display
      }
    };

    const response = await api.post('/api/Application/v1/CreateAppointment', backendAppointmentData);
    console.log(response);
    return response.data;
  },

  //delete appointment
  async deleteBooking(appointmentId: string): Promise<void> {
    const response = await api.delete('/api/Application/v1/DeleteAppointment', {
      params: { appointmentId }
    });
    return response.data;
  },

  //update appointment
  updateBooking: async (updateData: UpdateBookingRequest) => {    
    // Convert times from user timezone to backend timezone
    const backendUpdateData = {
      ...updateData,
      fromDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.fromDate)),
      toDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.toDate)),
    };

    // Simulate delay for testing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`
      Booking Update Details (converted to backend timezone):
      ---------------------
      Booking ID: ${backendUpdateData.id}
      Selected Date: ${backendUpdateData.selectedDate}
      Selected Time: ${backendUpdateData.selectedTime}
      From Date: ${backendUpdateData.fromDate}
      To Date: ${backendUpdateData.toDate}
      Staff Member IDs: ${backendUpdateData.staffMemberIds.join(', ')}
    `);
    
    return {
      success: true,
      message: 'Booking updated successfully',
      data: backendUpdateData
    };
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

  async updateFollowers(newFollowers: string[]) {
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
  async updateGlobalFollowers(newFollowers: string[]) {
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
    const response = await api.post('/api/Databases/v1/Get', getRequestDTO);
    return response.data;
  },

  async sendEmail(request: EmailRequestDTO): Promise<EmailResponseDTO> {
    const response = await api.post('/api/Application/v1/SendEmail', request);
    return response.data;
  },
}