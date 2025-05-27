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
import { AvailabilitySettings } from './availabilityService';

export const bookingService = {

  async getAvailability(serviceId?: string): Promise<AvailabilitySettings> {
    console.log('📅 Getting availability settings...', serviceId ? `for serviceId: ${serviceId}` : '');
    
    const params = serviceId ? { serviceId } : {};
    const response = await api.get('/api/Application/v1/GetAvailability', { params });
    
    console.log('📅 Availability settings received:', response.data);
    
    return {
      minimumLeadTime: response.data.minimumLeadTime || "00:00:00",
      maximumAdvance: response.data.maximumAdvance || "365.00:00:00"
    };
  },

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
    
    // 🔥 FIXED: For edit/view mode, the selectedDateTime is already in the correct format
    // Don't apply additional timezone conversion that shifts the date
    
    let estDateString: string;
    
    // Check if selectedDateTime already includes time (format: YYYY-MM-DDTHH:mm:ss)
    if (selectedDateTime.includes('T')) {
      // Extract just the date part if it's already a full datetime
      const dateOnly = selectedDateTime.split('T')[0];
      estDateString = dateOnly;
      console.log('🕐 Using date part directly for backend:', estDateString);
    } else {
      // If it's just a date string, use it as-is
      estDateString = selectedDateTime;
      console.log('🕐 Using date string as-is for backend:', estDateString);
    }
    
    console.log('🕐 Final date sent to backend API:', `${estDateString}T00:00:00`);
    
    const response = await api.get('/api/Application/v1/GetAvailableTimeSlots', {
      params: {
        serviceId,
        selectedDateTime: `${estDateString}T00:00:00` // Send as EST date
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
    
    // 🎯 SIMPLE FIX: The FromDate and ToDate should already be in EST format
    // from the original time slots. NO conversion needed if they come from slots!
    
    // Check if FromDate/ToDate look like EST times (no timezone suffix)
    const isEstFormat = (timeString: string) => {
      return timeString && !timeString.endsWith('Z') && !timeString.includes('+');
    };

    let backendAppointmentData = appointmentData;

    // Only convert if the times look like user local times (with Z or timezone)
    if (!isEstFormat(appointmentData.DateTimeInfo.FromDate)) {
      console.log('🔄 Converting user local times to EST...');
      
      backendAppointmentData = {
        ...appointmentData,
        DateTimeInfo: {
          ...appointmentData.DateTimeInfo,
          FromDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.FromDate)),
          ToDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.ToDate)),
        }
      };
    } else {
      console.log('🎯 Times already in EST format, using as-is');
    }

    console.log('📝 Sending to backend:', {
      originalFromDate: appointmentData.DateTimeInfo.FromDate,
      backendFromDate: backendAppointmentData.DateTimeInfo.FromDate,
      originalToDate: appointmentData.DateTimeInfo.ToDate,
      backendToDate: backendAppointmentData.DateTimeInfo.ToDate,
    });

    const response = await api.post('/api/Application/v1/CreateAppointment', backendAppointmentData);
    console.log('📝 Appointment created successfully');
    return response.data;
  },

  //update appointment - SIMPLIFIED FIX
  updateBooking: async (updateData: UpdateBookingRequest) => {    
    console.log('✏️ Updating appointment:', updateData);
    
    // Same logic for updates
    const isEstFormat = (timeString: string) => {
      return timeString && !timeString.endsWith('Z') && !timeString.includes('+');
    };

    let backendUpdateData = updateData;

    if (!isEstFormat(updateData.fromDate)) {
      console.log('🔄 Converting update times to EST...');
      
      backendUpdateData = {
        ...updateData,
        fromDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.fromDate)),
        toDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.toDate)),
      };
    } else {
      console.log('🎯 Update times already in EST format');
    }

    console.log('✏️ Sending update to backend:', {
      original: updateData,
      backend: backendUpdateData
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

  //delete appointment
  async deleteBooking(appointmentId: string): Promise<void> {
    console.log('🗑️ Deleting appointment:', appointmentId);
    
    const response = await api.delete('/api/Application/v1/DeleteAppointment', {
      params: { appointmentId }
    });
    
    console.log('🗑️ Appointment deleted successfully');
    return response.data;
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

  //send email
  async sendEmail(request: EmailRequestDTO): Promise<EmailResponseDTO> {
    try{
      const response = await api.post('/api/Application/v1/SendEmail', request);
      return response.data;
    }catch(error){
      console.error('Error sending appointment notification:', error);
    }
  },
}