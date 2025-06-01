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
    
    const params = serviceId ? { serviceId } : {};
    const response = await api.get('/api/Application/v1/GetAvailability', { params });
    
    
    return {
      minimumLeadTime: response.data.minimumLeadTime || "00:00:00",
      maximumAdvance: response.data.maximumAdvance || "365.00:00:00"
    };
  },

  //get calendar data
  async getCalendarData(start: string, end: string): Promise<calendarBooking[]> {
    
    const response = await api.get('/api/Application/v1/GetCalendarData', {
      params: {
        startDateTime: start,
        endDateTime: end
      },
    });
    
    
    // Backend returns times in EST/EDT - no conversion needed here
    // Conversion happens in UI components when displaying
    return response.data || [];
  },

  async getIsAdminUser() {
    const response = await api.get('/api/Application/v1/GetIsUserAdmin', {});
    return response.data;
  },

 async getAvailableTimeSlots(
    serviceId: string, 
    selectedDateTime: string, 
    isEditMode: boolean = false,
    currentSelectedSlot?: { startTime: string; endTime: string }
  ): Promise<TimeSlot[]> {
      
      let estDateString: string;
      
      // Check if selectedDateTime already includes time (format: YYYY-MM-DDTHH:mm:ss)
      if (selectedDateTime.includes('T')) {
        // Extract just the date part if it's already a full datetime
        const dateOnly = selectedDateTime.split('T')[0];
        estDateString = dateOnly;
      } else {
        // If it's just a date string, use it as-is
        estDateString = selectedDateTime;
      }
          
      const response = await api.get('/api/Application/v1/GetAvailableTimeSlots', {
        params: {
          serviceId,
          selectedDateTime: `${estDateString}T00:00:00` // Send as EST date
        }
      });
      
      let timeSlots = response.data || [];
      
      // 🔥 ENHANCED: Filter past time slots in edit mode with special handling for current slot
      if (isEditMode && timeSlots.length > 0) {
        const now = new Date();
        
        const filteredSlots = timeSlots.filter((slot: TimeSlot) => {
          try {
            // Parse the slot start time (backend EST time)
            const slotStartTime = new Date(slot.startTime);
            
            // 🔥 NEW: Always allow the current selected slot (even if it's in the past)
            if (currentSelectedSlot && 
                slot.startTime === currentSelectedSlot.startTime && 
                slot.endTime === currentSelectedSlot.endTime) {
              return true;
            }
            
            // Allow slots that start from the current selected slot time onwards
            if (currentSelectedSlot) {
              const currentSlotTime = new Date(currentSelectedSlot.startTime);
              const isAfterOrEqualToCurrentSlot = slotStartTime >= currentSlotTime;

              return isAfterOrEqualToCurrentSlot;
            }
            
            // Fallback: check if this slot is in the future
            const isFuture = slotStartTime > now;
            return isFuture;
            
          } catch (error) {
            console.error('❌ Error checking slot time:', error);
            return false; // Filter out slots with invalid times
          }
        });

        timeSlots = filteredSlots;
      }
      
      // Backend returns time slots in EST/EDT
      // They will be converted to user timezone in the TimeSelector component
      return timeSlots;
    },

  //get loan details
  async getLoanDetails(loanId: string): Promise<LoanDetails>{    
    const response = await api.get('/api/Encompass/v1/GetLoanDetails', {
      params: {
        loanId: loanId
      },
    });
    
    return response.data;
  },

  async getAvailableServices(): Promise<BookingService[]> {
    const response = await api.get('/api/Application/v1/GetAvailableServices');
    const services = response.data.value;
    return services || [];
  },
  
  //create appointment
 async postBooking(appointmentData: CreateAppointmentRequest): Promise<void> {
    // Check if FromDate/ToDate look like EST times (no timezone suffix)
    const isEstFormat = (timeString: string) => {
      return timeString && !timeString.endsWith('Z') && !timeString.includes('+');
    };

    let backendAppointmentData = appointmentData;

    // Only convert if the times look like user local times (with Z or timezone)
    if (!isEstFormat(appointmentData.DateTimeInfo.FromDate)) {
      
      backendAppointmentData = {
        ...appointmentData,
        DateTimeInfo: {
          ...appointmentData.DateTimeInfo,
          FromDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.FromDate)),
          ToDate: TimezoneService.convertLocalTimeToBackend(new Date(appointmentData.DateTimeInfo.ToDate)),
        }
      };
    }


    const response = await api.post('/api/Application/v1/CreateAppointment', backendAppointmentData);
    return response.data;
  },

  //update appointment - SIMPLIFIED FIX
  updateBooking: async (updateData: UpdateBookingRequest) => {    
  
  // Same logic for updates
  const isEstFormat = (timeString: string) => {
    return timeString && !timeString.endsWith('Z') && !timeString.includes('+');
  };

  let backendUpdateData = updateData;

  if (!isEstFormat(updateData.fromDate)) {
    
    backendUpdateData = {
      ...updateData,
      fromDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.fromDate)),
      toDate: TimezoneService.convertLocalTimeToBackend(new Date(updateData.toDate)),
    };
  } 

  
  const requestBody = {
    DateTimeInfo: {
      SelectedDate: backendUpdateData.selectedDate,
      SelectedTime: backendUpdateData.selectedTime,
      FromDate: backendUpdateData.fromDate,
      ToDate: backendUpdateData.toDate,
    }
  };

  // if (backendUpdateData.notes !== undefined) {
  //     requestBody.LoanDetails = {
  //       notes: backendUpdateData.notes
  //     };
  // }

  const response = await api.post(`/api/Application/v1/UpdateAppointment?appointmentId=${backendUpdateData.id}`, requestBody);

  
  
  return {
    success: true,
    message: 'Booking updated successfully',
    data: backendUpdateData
  };
},

  //delete appointment
  async deleteBooking(appointmentId: string): Promise<void> {
    
    const response = await api.delete('/api/Application/v1/DeleteAppointment', {
      params: { appointmentId }
    });
    
    return response.data;
  },


  //get followers
  async getFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetFollowers');
    return response.data || [];
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
      
    } catch (error) {
      console.error('Error updating followers:', error);
    }
  },

  // GET global followers
  async getGlobalFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetGlobalFollowers');
    return response.data || [];
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
    } catch (error) {
      console.error('Failed to update global followers:', error);
    }
  },

  //get users from DB
  async getUsers(getRequestDTO: GetRequestDTO): Promise<GetResponseDTO> {
    const response = await api.post('/api/Databases/v1/Get', getRequestDTO);
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