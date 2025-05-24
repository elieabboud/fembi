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
import { format } from 'date-fns';

export const bookingService = {

  //get calendar data
  async getCalendarData(start: string, end: string): Promise<calendarBooking[]> {
    console.log('📅 Getting calendar data:', { start, end });
    
    const response = await api.get('/api/Application/v1/GetCalendarData', {
      params: {
        startDateTime: start,
        endDateTime: end
      },
    });
    
    console.log('📅 Raw calendar data received:', response.data?.length, 'bookings');
    
    // Backend returns times in EST/EDT - no conversion needed here
    // Conversion happens in UI components when displaying
    return response.data || [];
  },

  async getIsAdminUser() {
    const response = await api.get('/api/Application/v1/GetIsUserAdmin', {});
    return response.data;
  },

  //get available time slots
  async getAvailableTimeSlots(serviceId: string, selectedDateTime: string): Promise<TimeSlot[]> {
    console.log('🕐 Getting time slots for:', { serviceId, selectedDateTime });
    
    // selectedDateTime should be in user's local time format (YYYY-MM-DD)
    // We need to send it as EST to the backend
    
    // Parse the date and convert to EST for the backend
    const userDate = new Date(selectedDateTime);
    
    // Create EST date by converting user date to backend timezone
    const estDateTimeISO = TimezoneService.convertLocalTimeToBackend(userDate);
    const estDate = new Date(estDateTimeISO);
    const estDateString = format(estDate, 'yyyy-MM-dd');
    
    console.log('🕐 Converted date for backend:', estDateString);
    
    const response = await api.get('/api/Application/v1/GetAvailableTimeSlots', {
      params: {
        serviceId,
        selectedDateTime: `${estDateString}T00:00:00` // Send as EST midnight
      }
    });
  
    console.log('🕐 Time slots received:', response.data?.length, 'slots');
    
    // Backend returns time slots in EST/EDT
    // They will be converted to user timezone in the TimeSelector component
    return response.data || [];
  },
  
  //get available services
  async getAvailableServices(): Promise<BookingService[]> {
    const response = await api.get('/api/Application/v1/GetAvailableServices');
    const services = response.data.value;
    console.log('🔧 Available services:', services?.length);
    return services || [];
  },

  //get loan details
  async getLoanDetails(loanId: string): Promise<LoanDetails>{
    console.log('🏠 Getting loan details for:', loanId);
    
    const response = await api.get('/api/Encompass/v1/GetLoanDetails', {
      params: {
        loanId: loanId
      },
    });
    
    console.log('🏠 Loan details received for:', response.data?.loanId);
    return response.data;
  },

  //create appointment
  async postBooking(appointmentData: CreateAppointmentRequest): Promise<void> {
    console.log('📝 Creating appointment with data:', appointmentData);
    
    // Convert date/time fields from user timezone to backend timezone (EST/EDT)
    const backendAppointmentData = {
      ...appointmentData,
      DateTimeInfo: {
        ...appointmentData.DateTimeInfo,
        // Convert the FromDate and ToDate from user timezone to EST
        FromDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.FromDate)),
        ToDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.ToDate)),
        // SelectedDate and SelectedTime should be kept as display values
      }
    };

    console.log('📝 Sending to backend:', {
      originalFromDate: appointmentData.DateTimeInfo.FromDate,
      convertedFromDate: backendAppointmentData.DateTimeInfo.FromDate,
      originalToDate: appointmentData.DateTimeInfo.ToDate,
      convertedToDate: backendAppointmentData.DateTimeInfo.ToDate,
    });

    const response = await api.post('/api/Application/v1/CreateAppointment', backendAppointmentData);
    console.log('📝 Appointment created successfully');
    return response.data;
  },

  //delete appointment
  async deleteBooking(appointmentId: string): Promise<void> {
    console.log('🗑️ Deleting appointment:', appointmentId);
    
    const response = await api.delete('/api/Application/v1/DeleteAppointment', {
      params: { appointmentId }
    });
    
    console.log('🗑️ Appointment deleted successfully');
    return response.data;
  },

  //update appointment
  updateBooking: async (updateData: UpdateBookingRequest) => {    
    console.log('✏️ Updating appointment:', updateData);
    
    // Convert times from user timezone to backend timezone (EST/EDT)
    const backendUpdateData = {
      ...updateData,
      fromDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.fromDate)),
      toDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.toDate)),
    };

    console.log('✏️ Sending update to backend:', {
      original: updateData,
      converted: backendUpdateData
    });
    
    const response = await api.post(`/api/Application/v1/UpdateAppointment?appointmentId=${backendUpdateData.id}`, {
      DateTimeInfo: {
        SelectedDate: backendUpdateData.selectedDate,
        SelectedTime: backendUpdateData.selectedTime,
        FromDate: backendUpdateData.fromDate,
        ToDate: backendUpdateData.toDate,
      }
    });

    console.log('✏️ Appointment updated successfully');
    
    return {
      success: true,
      message: 'Booking updated successfully',
      data: backendUpdateData
    };
  },

  //get followers
  async getFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetFollowers');
    console.log('👥 Followers retrieved:', response.data?.length);
    return response.data || [];
  },

  //set followers
  async setFollowers(followers: string[]): Promise<void> {
    console.log('👥 Setting followers:', followers.length);
    const query = encodeURIComponent(followers.join(','));
    await api.post(`/api/Application/v1/SetFollowers?followers=${query}`);
  },

  async updateFollowers(newFollowers: string[]) {
    try {
      const existingFollowers = await this.getFollowers();
      const allFollowers = Array.from(new Set([...existingFollowers, ...newFollowers]));
  
      const query = encodeURIComponent(allFollowers.join(','));
      const response = await api.post(`/api/Application/v1/SetFollowers?followers=${query}`);
      
      console.log('👥 Followers updated:', allFollowers.length);
    } catch (error) {
      console.error('Error updating followers:', error);
    }
  },

  // GET global followers
  async getGlobalFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetGlobalFollowers');
    console.log('🌐 Global followers retrieved:', response.data?.length);
    return response.data || [];
  },

  // SET global followers
  async setGlobalFollowers(followers: string[]): Promise<void> {
    console.log('🌐 Setting global followers:', followers.length);
    const query = encodeURIComponent(followers.join(','));
    await api.post(`/api/Application/v1/SetGlobalFollowers?followers=${query}`);
  },

  // update global followers
  async updateGlobalFollowers(newFollowers: string[]) {
    try {
      const existing = await this.getGlobalFollowers();
      const all = Array.from(new Set([...existing, ...newFollowers]));
      await this.setGlobalFollowers(all);
      console.log('🌐 Global followers updated:', all.length);
    } catch (error) {
      console.error('Failed to update global followers:', error);
    }
  },

  //get users from DB
  async getUsers(getRequestDTO: GetRequestDTO): Promise<GetResponseDTO> {
    const response = await api.post('/api/Databases/v1/Get', getRequestDTO);
    console.log('👤 Users retrieved:', response.data?.result?.length);
    return response.data;
  },

  async sendEmail(request: EmailRequestDTO): Promise<EmailResponseDTO> {
    console.log('📧 Sending email to:', request.To);
    const response = await api.post('/api/Application/v1/SendEmail', request);
    console.log('📧 Email sent successfully');
    return response.data;
  },
}