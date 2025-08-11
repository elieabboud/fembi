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

export interface PaginationRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
  filters?: {
    status?: string[];
    serviceLocation?: string;
    loanOfficers?: string[];
    dateRange?: {
      startDate?: string;
      endDate?: string;
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const bookingService = {

  async getAvailability(serviceId?: string): Promise<AvailabilitySettings> {
    const params = serviceId ? { serviceId } : {};
    const response = await api.get('/api/Application/v1/GetAvailability', { params });
    
    return {
      minimumLeadTime: response.data.minimumLeadTime || "00:00:00",
      maximumAdvance: response.data.maximumAdvance || "365.00:00:00"
    };
  },

  async getCalendarData(start: string, end: string): Promise<calendarBooking[]> {
    const response = await api.get('/api/Application/v1/GetCalendarData', {
      params: {
        startDateTime: start,
        endDateTime: end
      },
    });
    
    return response.data || [];
  },

  async getPaginatedBookings(paginationRequest: PaginationRequest): Promise<PaginatedResponse<calendarBooking>> {
    const response = await api.post('/api/Application/v1/GetPaginatedBookings', paginationRequest);
    
    return {
      data: response.data.data || [],
      pagination: {
        currentPage: response.data.pagination?.currentPage || 1,
        pageSize: response.data.pagination?.pageSize || 10,
        totalItems: response.data.pagination?.totalItems || 0,
        totalPages: response.data.pagination?.totalPages || 1,
        hasNextPage: response.data.pagination?.hasNextPage || false,
        hasPreviousPage: response.data.pagination?.hasPreviousPage || false,
      }
    };
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
      
      if (selectedDateTime.includes('T')) {
        const dateOnly = selectedDateTime.split('T')[0];
        estDateString = dateOnly;
      } else {
        estDateString = selectedDateTime;
      }
          
      const response = await api.get('/api/Application/v1/GetAvailableTimeSlots', {
        params: {
          serviceId,
          selectedDateTime: `${estDateString}T00:00:00`
        }
      });
      
      let timeSlots = response.data || [];
      
      if (isEditMode && timeSlots.length > 0) {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const requestedDate = new Date(estDateString + 'T00:00:00');
        const requestedDateOnly = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate());
        
        const filteredSlots = timeSlots.filter((slot: TimeSlot) => {
          try {
            const slotStartTime = new Date(slot.startTime);
            
            if (currentSelectedSlot && 
                slot.startTime === currentSelectedSlot.startTime && 
                slot.endTime === currentSelectedSlot.endTime) {
              return true;
            }

            if (requestedDateOnly.getTime() === today.getTime()) {
              return slotStartTime > now;
            } else {
              var originalSelectedDate = JSON.parse(localStorage.getItem("selectedItem"));
              if(slot.startTime < originalSelectedDate.dateTime){
                return false;
                }
              else{
                return true;
              }
            }
            
          } catch (error) {
            console.error('❌ Error checking slot time:', error);
            return false;
          }
        });

        timeSlots = filteredSlots;
      }
      
      return timeSlots;
    },

  async getLoanDetails(loanId: string, isCreate?: boolean): Promise<LoanDetails>{    
    const response = await api.get('/api/Encompass/v1/GetLoanDetails', {
      params: {
        loanId: loanId,
        isCreate: isCreate
      },
    });
    
    return response.data;
  },

  async getAvailableServices(): Promise<BookingService[]> {
    const response = await api.get('/api/Application/v1/GetAvailableServices');
    const services = response.data.value;
    return services || [];
  },
  
  async postBooking(appointmentData: CreateAppointmentRequest): Promise<void> {
    const isEstFormat = (timeString: string) => {
      return timeString && !timeString.endsWith('Z') && !timeString.includes('+');
    };

    let backendAppointmentData = appointmentData;

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

  updateBooking: async (updateData: UpdateBookingRequest) => {    
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
      ...updateData,
      LoanDetails:{
        Notes: updateData?.notes
      },
      DateTimeInfo: {
        SelectedDate: backendUpdateData.selectedDate,
        SelectedTime: backendUpdateData.selectedTime,
        FromDate: backendUpdateData.fromDate,
        ToDate: backendUpdateData.toDate,
      },
    };

    const response = await api.post(`/api/Application/v1/UpdateAppointment?appointmentId=${backendUpdateData.id}`, requestBody);
    
    return {
      success: true,
      message: 'Booking updated successfully',
      data: backendUpdateData
    };
  },

  async deleteBooking(appointmentId: string): Promise<void> {
    const response = await api.delete('/api/Application/v1/DeleteAppointment', {
      params: { appointmentId }
    });
    
    return response.data;
  },

  async getFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetFollowers');
    return response.data || [];
  },

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

  async getGlobalFollowers(): Promise<string[]> {
    const response = await api.get('/api/Application/v1/GetGlobalFollowers');
    return response.data || [];
  },

  async setGlobalFollowers(followers: string[]): Promise<void> {
    const query = encodeURIComponent(followers.join(','));
    await api.post(`/api/Application/v1/SetGlobalFollowers?followers=${query}`);
  },

  async updateGlobalFollowers(newFollowers: string[]) {
    try {
      const existing = await this.getGlobalFollowers();
      const all = Array.from(new Set([...existing, ...newFollowers]));
      await this.setGlobalFollowers(all);
    } catch (error) {
      console.error('Failed to update global followers:', error);
    }
  },

  async getUsers(getRequestDTO: GetRequestDTO): Promise<GetResponseDTO> {
    const response = await api.post('/api/Databases/v1/Get', getRequestDTO);
    return response.data;
  },

  async sendEmail(request: EmailRequestDTO): Promise<EmailResponseDTO> {
    try{
      const response = await api.post('/api/Application/v1/SendEmail', request);
      return response.data;
    }catch(error){
      console.error('Error sending appointment notification:', error);
    }
  },

  async sendCancellationEmail(appointmentId: string, appointmentData: any): Promise<void> {
    try {
      const globalFollowers = await this.getGlobalFollowers();
      const loanDetails = await bookingService.getLoanDetails(appointmentData.loanData?.loanId || appointmentData.encompassLoanId, false);
      
      const recipientEmails: string[] = [];
      const ccEmails: string[] = [...globalFollowers];
      
      if (appointmentData.loanDetails?.loanCloserEmail) {
        recipientEmails.push(appointmentData.loanDetails.loanCloserEmail);
      }
      if (appointmentData.loanDetails?.loanOfficerEmail) {
        recipientEmails.push(appointmentData.loanDetails.loanOfficerEmail);
      }
      if (appointmentData.customerEmailAddress) {
        recipientEmails.push(appointmentData.customerEmailAddress);
      }
      
      if (appointmentData.followers) {
        const followerEmails = appointmentData.followers
          .split(',')
          .map((email: string) => email.trim())
          .filter((email: string) => email.length > 0 && email.includes('@'));
        recipientEmails.push(...followerEmails);
      }
      
      const uniqueEmails = Array.from(new Set(recipientEmails));
      
      if (uniqueEmails.length === 0) {
        console.warn('No recipients found for cancellation email');
        return;
      }
      
      let appointmentDate = 'N/A';
      let appointmentTime = 'N/A';
      
      if (appointmentData.start?.dateTime) {
        try {
          appointmentDate = TimezoneService.formatDateForUser(appointmentData.start.dateTime, 'MMMM d, yyyy');
          appointmentTime = TimezoneService.formatTimeForUser(appointmentData.start.dateTime, 'h:mm a');
        } catch (error) {
          console.error('Error formatting appointment date/time:', error);
          appointmentDate = new Date(appointmentData.start.dateTime).toLocaleDateString();
          appointmentTime = new Date(appointmentData.start.dateTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
      
      const borrowerName = appointmentData.customerName || 
        `${appointmentData.loanData?.borrowerFirstName || ''} ${appointmentData.loanData?.borrowerLastName || ''}`.trim() ||
        'N/A';
      
      const userTimezone = TimezoneService.getUserTimezoneDisplay();
      const showTimezoneInfo = TimezoneService.shouldShowTimezoneWarning();
      
      const htmlBody = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">
                ❌ Appointment Cancelled
              </h2>

              <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #d32f2f;">Important Notice</h3>
                <p style="margin: 0; font-weight: bold;">
                  Your closing appointment has been cancelled.
                </p>
              </div>

              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <p><strong>Greetings,</strong></p>
                <p>
                  We regret to inform you that your closing appointment with <strong>FEMBi Mortgage</strong> has been cancelled.
                  This email serves as your official cancellation notification.
                </p>
                <p>
                  If you need to reschedule or have any questions about this cancellation, please contact your 
                  <strong>FEMBi Mortgage Loan Officer</strong> immediately.
                </p>
                <p>
                  We apologize for any inconvenience this may cause and are ready to assist you in rescheduling at your earliest convenience.
                </p>

                <hr style="margin: 30px 0;">

                <p><strong>Saludos,</strong></p>
                <p>
                  Lamentamos informarle que su cita de cierre con <strong>FEMBi Mortgage</strong> ha sido cancelada.
                  Este correo electrónico constituye su notificación oficial de cancelación.
                </p>
                <p>
                  Si necesita reprogramar o tiene alguna pregunta sobre esta cancelación, comuníquese con su 
                  <strong>Oficial de Préstamos de FEMBi Mortgage</strong> inmediatamente.
                </p>
                <p>
                  Nos disculpamos por cualquier inconveniente que esto pueda causar y estamos listos para ayudarle a reprogramar lo antes posible.
                </p>
              </div>

              <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #6c757d;">Cancelled Appointment Details</h3>
                <p><strong>Location:</strong> ${getPhysicalAddressForService(appointmentData.serviceName) || 'N/A'}</p>
                <p><strong>Original Date:</strong> ${appointmentDate}</p>
                <p><strong>Original Time:</strong> ${appointmentTime}${showTimezoneInfo ? ` (${userTimezone})` : ' (Eastern Time)'}</p>
                <p><strong>Loan ID:</strong> ${loanDetails.loanNumber || appointmentData.encompassLoanId || 'N/A'}</p>
                <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div style="background-color: #e9ecef; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #007bff;">Borrower Information</h3>
                <p><strong>Name:</strong> ${borrowerName}</p>
                <p><strong>Address: </strong>${loanDetails?.borrowerAddress + ', ' || ''}${loanDetails?.borrowerCity + ', ' || ''}${loanDetails?.borrowerState + ' ' || ''}${loanDetails?.borrowerZipCode || ''}</p>
              </div>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #856404;">Contact Information</h3>
                <p><strong>Loan Closer:</strong> ${appointmentData.loanData?.loanCloser || appointmentData.LoanCloser || 'N/A'}</p>
                <p><strong>Loan Officer:</strong> ${appointmentData.loanData?.loanOfficer || appointmentData.LoanOfficer || 'N/A'}</p>
                ${appointmentData.loanData?.loanOfficerEmail ? `<p><strong>Loan Officer Email:</strong> ${appointmentData.loanData.loanOfficerEmail}</p>` : ''}
              </div>

              <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0c5460;">Next Steps</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Contact your loan officer to reschedule</li>
                  <li>Check your email for rescheduling options</li>
                  <li>Call our office if you need immediate assistance</li>
                </ul>
              </div>
              
              ${showTimezoneInfo ? `
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1976d2;">🌍 Timezone Information</h3>
                <p style="margin: 0; font-size: 14px;">
                  <strong>Times shown in:</strong> ${userTimezone}<br>
                  <strong>Note:</strong> All appointment times are automatically converted from Eastern Time to your local timezone.
                </p>
              </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; text-align: center;">
                <p><strong>📞 Need Help?</strong></p>
                <p>Contact your FEMBi Mortgage team for immediate assistance with rescheduling.</p>
                <p style="color: #d32f2f; font-weight: bold;">This appointment has been removed from all calendars.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailRequest: EmailRequestDTO = {
        To: [],
        Bcc: uniqueEmails,
        Cc: ccEmails,
        Subject: `Appointment Cancelled - ${appointmentData.serviceName || 'Closing'} for ${borrowerName}`,
        Body: htmlBody,
        IsHtml: true
      };

      await this.sendEmail(emailRequest);
      
    } catch (error) {
      console.error('❌ Error sending cancellation email:', error);
      throw error;
    }
  },

}

function getPhysicalAddressForService(serviceName: any) {
  switch(serviceName) {
    case "FEMBi Mortgage - San Juan":
      return "322 Ave De Diego Esq. Roosevelt Suite 201, San Juan, PR, 00920";
    case "FEMBi Mortgage - Ponce":
      return "San Rafael Industrial Park 1634 Ste 201, Ponce, PR, 00716";
  }
}