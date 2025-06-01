import { CreateAppointmentRequest } from '../types/CreateAppointmentRequest';

export interface ICSEventData {
  startDate: string; // ISO date string or backend date
  endDate: string;   // ISO date string or backend date
  title: string;
  description: string;
  location: string;
  uid?: string;
  sequence?: number;
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
}

export class ICSGeneratorService {
  
  /**
   * Convert any date to UTC format required by ICS (YYYYMMDDTHHMMSSZ)
   */
  static convertToUTCFormat(dateString: string): string {
    try {
      // Handle different input formats
      let date: Date;
      
      if (dateString.includes('T')) {
        // ISO format or backend format
        date = new Date(dateString);
      } else {
        // Date only format
        date = new Date(dateString + 'T00:00:00');
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Convert to UTC and format for ICS
      const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      
    } catch (error) {
      console.error('Error converting date to UTC format:', error);
      // Fallback to current time
      return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }
  }

  /**
   * Convert backend EST/EDT time to UTC for ICS
   */
  static convertBackendTimeToUTC(backendDateTime: string): string {
    try {
      
      const backendDate = new Date(backendDateTime);
      
      if (isNaN(backendDate.getTime())) {
        throw new Error('Invalid backend date');
      }
      
      // Backend is in EST/EDT, we need to convert to UTC
      // EST = UTC-5, EDT = UTC-4
      const isDST = (date: Date) => {
        const jan = new Date(date.getFullYear(), 0, 1);
        const jul = new Date(date.getFullYear(), 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset()) !== date.getTimezoneOffset();
      };
      
      // Determine offset based on date
      const offsetHours = isDST(backendDate) ? 4 : 5; // EDT = UTC-4, EST = UTC-5
      
      // Convert to UTC by adding the offset
      const utcDate = new Date(backendDate.getTime() + (offsetHours * 60 * 60 * 1000));
      
      const result = utcDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      
      return result;
      
    } catch (error) {
      console.error('❌ Error converting backend time to UTC:', error);
      return this.convertToUTCFormat(backendDateTime);
    }
  }

  /**
   * Escape special characters for ICS format
   */
  static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')    // Escape backslashes
      .replace(/;/g, '\\;')      // Escape semicolons
      .replace(/,/g, '\\,')      // Escape commas
      .replace(/\n/g, '\\n')     // Escape newlines
      .replace(/\r/g, '\\r');    // Escape carriage returns
  }

  /**
   * Generate ICS file content from appointment data
   */
  static generateICSFromAppointment(appointmentData: CreateAppointmentRequest): string {
    const borrowerName = `${appointmentData.BorrowerInformation.FirstName} ${appointmentData.BorrowerInformation.LastName}`.trim();
    
    // 🔥 FIXED: Use backend dates if available, otherwise construct from selected date/time
    let startTimeUTC: string;
    let endTimeUTC: string;
    
    if (appointmentData.DateTimeInfo.FromDate && appointmentData.DateTimeInfo.ToDate) {
      // Use backend dates (already in EST/EDT timezone)
      startTimeUTC = this.convertBackendTimeToUTC(appointmentData.DateTimeInfo.FromDate);
      endTimeUTC = this.convertBackendTimeToUTC(appointmentData.DateTimeInfo.ToDate);
    } else {
      // Construct from selected date and time
      const selectedDate = appointmentData.DateTimeInfo.SelectedDate;
      const selectedTime = appointmentData.DateTimeInfo.SelectedTime;
      
      // Create start time
      const startDateTime = `${selectedDate}T${selectedTime}:00`;
      startTimeUTC = this.convertToUTCFormat(startDateTime);
      
      // Create end time (default to 1 hour later)
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));
      endTimeUTC = this.convertToUTCFormat(endDate.toISOString());
    }
    
    const eventData: ICSEventData = {
      startDate: startTimeUTC,
      endDate: endTimeUTC,
      title: `Appointment with ${borrowerName} - ${appointmentData.ServiceName}`,
      description: this.createAppointmentDescription(appointmentData, borrowerName),
      location: appointmentData.ServiceName,
      uid: `${Date.now()}-${appointmentData.EncompassDetails.EncompassLoanId}@fntis.com`,
      status: 'CONFIRMED'
    };
    
    return this.generateICS(eventData);
  }

  /**
   * Create formatted description for appointment
   */
  static createAppointmentDescription(appointmentData: CreateAppointmentRequest, borrowerName: string): string {
    const appointmentDate = new Date(appointmentData.DateTimeInfo.SelectedDate).toLocaleDateString();
    const appointmentTime = new Date(`2000-01-01T${appointmentData.DateTimeInfo.SelectedTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const description = [
      'Appointment Details:',
      `Service: ${appointmentData.ServiceName}`,
      `Date: ${appointmentDate}`,
      `Time: ${appointmentTime}`,
      `Loan ID: ${appointmentData.EncompassDetails.EncompassLoanId}`,
      '',
      'Borrower Information:',
      `Name: ${borrowerName}`,
      `Email: ${appointmentData.BorrowerInformation.Email}`,
      `Phone: ${appointmentData.BorrowerInformation.PhoneNumber}`,
      `Address: ${appointmentData.BorrowerInformation.Address.Street}, ${appointmentData.BorrowerInformation.Address.City}, ${appointmentData.BorrowerInformation.Address.State} ${appointmentData.BorrowerInformation.Address.ZipCode}`,
      '',
      'Loan Information:',
      `Loan Closer: ${appointmentData.EncompassDetails.LoanCloser}`,
      `Loan Officer: ${appointmentData.EncompassDetails.LoanOfficer}`,
      appointmentData.EncompassDetails.dpa ? `DPA Program: ${appointmentData.EncompassDetails.dpa}` : ''
    ].filter(line => line !== '').join('\\n');
    
    return this.escapeICSText(description);
  }

  /**
   * Generate complete ICS file content
   */
  static generateICS(eventData: ICSEventData): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FNTIS//NONSGML v1.0//EN',
      'METHOD:REQUEST',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${eventData.uid || Date.now() + '@fntis.com'}`,
      `DTSTART:${eventData.startDate}`,
      `DTEND:${eventData.endDate}`,
      `SUMMARY:${this.escapeICSText(eventData.title)}`,
      `DESCRIPTION:${eventData.description}`,
      `LOCATION:${this.escapeICSText(eventData.location)}`,
      `STATUS:${eventData.status || 'CONFIRMED'}`,
      `SEQUENCE:${eventData.sequence || 0}`,
      `PRIORITY:5`,
      `DTSTAMP:${this.convertToUTCFormat(new Date().toISOString())}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Appointment reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    
    // 🔥 IMPORTANT: Use \r\n for proper ICS line endings
    const icsContent = lines.join('\r\n');
    
    return icsContent;
  }

  /**
   * Generate filename for ICS attachment
   */
  static generateICSFilename(appointmentData: CreateAppointmentRequest): string {
    const borrowerName = `${appointmentData.BorrowerInformation.FirstName} ${appointmentData.BorrowerInformation.LastName}`
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, ''); // Remove special characters
    
    const date = appointmentData.DateTimeInfo.SelectedDate;
    const loanId = appointmentData.EncompassDetails.EncompassLoanId.replace(/[^a-zA-Z0-9]/g, '');
    
    return `Appointment-${borrowerName}-${date}`;
  }
}