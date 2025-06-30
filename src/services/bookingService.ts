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
import Followers from '../components/forms/Followers';

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


  async sendCancellationEmail(appointmentId: string, appointmentData: any): Promise<void> {
  try {
    const globalFollowers = await this.getGlobalFollowers();
    
    const recipientEmails: string[] = [];
    const ccEmails: string[] = [...globalFollowers];
    
    // Add key stakeholders to recipients
    if (appointmentData.loanDetails?.loanCloserEmail) {
      recipientEmails.push(appointmentData.loanDetails.loanCloserEmail);
    }
    if (appointmentData.loanDetails?.loanOfficerEmail) {
      recipientEmails.push(appointmentData.loanDetails.loanOfficerEmail);
    }
    if (appointmentData.customerEmailAddress) {
      recipientEmails.push(appointmentData.customerEmailAddress);
    }
    
    // Add followers if they exist
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
    
    const appointmentDate = appointmentData.start?.dateTime 
      ? new Date(appointmentData.start.dateTime).toLocaleDateString()
      : 'N/A';
    const appointmentTime = appointmentData.start?.dateTime
      ? new Date(appointmentData.start.dateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : 'N/A';
    
    const borrowerName = appointmentData.customerName || 
      `${appointmentData.loanData?.borrowerFirstName || ''} ${appointmentData.loanData?.borrowerLastName || ''}`.trim() ||
      'N/A';
    
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
                We regret to inform you that your closing appointment with <strong>First National Mortgage</strong> has been cancelled.
                This email serves as your official cancellation notification.
              </p>
              <p>
                If you need to reschedule or have any questions about this cancellation, please contact your 
                <strong>First National Mortgage Loan Officer</strong> immediately.
              </p>
              <p>
                We apologize for any inconvenience this may cause and are ready to assist you in rescheduling at your earliest convenience.
              </p>

              <hr style="margin: 30px 0;">

              <p><strong>Saludos,</strong></p>
              <p>
                Lamentamos informarle que su cita de cierre con <strong>First National Mortgage</strong> ha sido cancelada.
                Este correo electrónico constituye su notificación oficial de cancelación.
              </p>
              <p>
                Si necesita reprogramar o tiene alguna pregunta sobre esta cancelación, comuníquese con su 
                <strong>Oficial de Préstamos de First National Mortgage</strong> inmediatamente.
              </p>
              <p>
                Nos disculpamos por cualquier inconveniente que esto pueda causar y estamos listos para ayudarle a reprogramar lo antes posible.
              </p>
            </div>

            <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #6c757d;">Cancelled Appointment Details</h3>
              <p><strong>Location:</strong> ${appointmentData.serviceName || 'N/A'}</p>
              <p><strong>Original Date:</strong> ${appointmentDate}</p>
              <p><strong>Original Time:</strong> ${appointmentTime}</p>
              <p><strong>Loan ID:</strong> ${appointmentData.loanData?.loanNumber || appointmentData.encompassLoanId || 'N/A'}</p>
              <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="background-color: #e9ecef; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #007bff;">Borrower Information</h3>
              <p><strong>Name:</strong> ${borrowerName}</p>
              ${appointmentData.loanData?.borrowerAddress ? `
                <p><strong>Address:</strong> ${appointmentData.loanData.borrowerAddress}, ${appointmentData.loanData.borrowerCity || ''}, ${appointmentData.loanData.borrowerState || ''} ${appointmentData.loanData.borrowerZipCode || ''}</p>
              ` : ''}
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
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; text-align: center;">
              <p><strong>📞 Need Help?</strong></p>
              <p>Contact your First National Mortgage team for immediate assistance with rescheduling.</p>
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