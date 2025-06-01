import { CreateAppointmentRequest } from '../types/CreateAppointmentRequest';
import { TimezoneService } from './timezoneUtils';

export interface ICSEventData {
  startDate: string; // UTC format for ICS: YYYYMMDDTHHMMSSZ
  endDate: string;   // UTC format for ICS: YYYYMMDDTHHMMSSZ
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
  static convertToUTCFormat(date: Date): string {
    try {
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Get UTC components directly
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
      
    } catch (error) {
      console.error('Error converting date to UTC format:', error);
      // Fallback to current time
      const now = new Date();
      return this.convertToUTCFormat(now);
    }
  }

  /**
   * 🔥 FIXED: Convert backend EST/EDT time to UTC for ICS using existing TimezoneService
   */
  static convertBackendTimeToUTC(backendDateTime: string): string {
    try {
      console.log('🔥 Converting backend time to UTC:', backendDateTime);
      
      // Parse the backend time (this is in EST/EDT)
      const backendDate = new Date(backendDateTime);
      
      if (isNaN(backendDate.getTime())) {
        throw new Error('Invalid backend date');
      }
      
      // 🎯 KEY FIX: The backend time is LOCAL EST/EDT time, not UTC
      // We need to treat it as EST/EDT and convert to UTC
      
      // Extract the time components as they appear (EST/EDT local time)
      const year = backendDate.getFullYear();
      const month = backendDate.getMonth();
      const day = backendDate.getDate();
      const hours = backendDate.getHours();
      const minutes = backendDate.getMinutes();
      const seconds = backendDate.getSeconds();
      
      console.log('🔥 Extracted components:', { year, month, day, hours, minutes, seconds });
      
      // Create a date representing this time in EST/EDT timezone
      // We'll use Intl.DateTimeFormat to properly handle this
      
      // Method 1: Create the time as if it's in EST, then get UTC equivalent
      const estTimeString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      console.log('🔥 EST time string:', estTimeString);
      
      // Use TimezoneService approach: create the time in EST timezone
      const now = new Date();
      
      // Get current EST offset from UTC (accounts for DST automatically)
      const estFormatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Get what "now" looks like in EST
      const nowInEST = estFormatter.format(now);
      const nowInUTC = now.toISOString().substring(0, 19);
      
      console.log('🔥 Now in EST:', nowInEST);
      console.log('🔥 Now in UTC:', nowInUTC);
      
      // Calculate the offset for the current time
      const estDate = new Date(nowInEST);
      const utcDate = new Date(nowInUTC);
      const offsetMs = utcDate.getTime() - estDate.getTime();
      
      console.log('🔥 Calculated offset (ms):', offsetMs);
      console.log('🔥 Calculated offset (hours):', offsetMs / (1000 * 60 * 60));
      
      // Apply this offset to our target time
      const targetEST = new Date(estTimeString);
      const targetUTC = new Date(targetEST.getTime() + offsetMs);
      
      console.log('🔥 Target EST:', targetEST);
      console.log('🔥 Target UTC:', targetUTC);
      
      const result = this.convertToUTCFormat(targetUTC);
      console.log('🔥 Final ICS format:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error converting backend time to UTC:', error);
      return this.convertToUTCFormat(new Date());
    }
  }

  /**
   * 🚀 ALTERNATIVE APPROACH: Use a more reliable method
   */
  static convertBackendTimeToUTCReliable(backendDateTime: string): string {
    try {
      console.log('🚀 Reliable conversion for:', backendDateTime);
      
      const backendDate = new Date(backendDateTime);
      if (isNaN(backendDate.getTime())) {
        throw new Error('Invalid backend date');
      }
      
      // Extract components
      const year = backendDate.getFullYear();
      const month = backendDate.getMonth();
      const day = backendDate.getDate();
      const hours = backendDate.getHours();
      const minutes = backendDate.getMinutes();
      const seconds = backendDate.getSeconds();
      
      // 🎯 Create a date that represents this exact time in EST/EDT
      // For a given date, determine if it's in EST (-5) or EDT (-4)
      
      // Create a date in the middle of the target date to check DST
      const checkDate = new Date(year, month, day, 12, 0, 0); // Noon on target date
      
      // Check if this date is in DST in Eastern timezone
      const january = new Date(year, 0, 1); // January 1st
      const july = new Date(year, 6, 1);    // July 1st
      
      // Get timezone offsets for winter and summer
      const winterOffset = this.getTimezoneOffset('America/New_York', january);
      const summerOffset = this.getTimezoneOffset('America/New_York', july);
      const currentOffset = this.getTimezoneOffset('America/New_York', checkDate);
      
      console.log('🚀 Winter offset:', winterOffset);
      console.log('🚀 Summer offset:', summerOffset);
      console.log('🚀 Current offset:', currentOffset);
      
      // Determine if we're in DST
      const isDST = currentOffset === summerOffset;
      const offsetHours = isDST ? 4 : 5; // EDT = UTC-4, EST = UTC-5
      
      console.log('🚀 Is DST:', isDST);
      console.log('🚀 Offset hours:', offsetHours);
      
      // Create UTC date by adding the offset
      const localEST = new Date(year, month, day, hours, minutes, seconds);
      const utcDate = new Date(localEST.getTime() + (offsetHours * 60 * 60 * 1000));
      
      console.log('🚀 Local EST:', localEST);
      console.log('🚀 UTC result:', utcDate);
      
      const result = this.convertToUTCFormat(utcDate);
      console.log('🚀 Final format:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Reliable conversion error:', error);
      return this.convertToUTCFormat(new Date());
    }
  }

  /**
   * Helper to get timezone offset from UTC in hours
   */
  private static getTimezoneOffset(timezone: string, date: Date): number {
    try {
      const utcDate = new Date(date.toISOString().substring(0, 19) + 'Z');
      
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const tzTimeString = formatter.format(utcDate);
      const tzDate = new Date(tzTimeString);
      
      const offsetMs = tzDate.getTime() - utcDate.getTime();
      return offsetMs / (1000 * 60 * 60);
      
    } catch (error) {
      console.error('Error getting timezone offset:', error);
      return 0;
    }
  }

  /**
   * 🔥 FINAL FIX: Direct timezone conversion using proper date construction
   */
  static convertBackendTimeToUTCSimple(backendDateTime: string): string {
    try {
      console.log('🔥 Converting backend Eastern time to UTC:', backendDateTime);
      
      // Extract components from backend time
      const dateStr = backendDateTime.substring(0, 10); // "2025-06-10"
      const timeStr = backendDateTime.substring(11, 19); // "12:00:00"
      
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes, seconds] = timeStr.split(':').map(Number);
      
      console.log('🔥 Parsed components:', { year, month, day, hours, minutes, seconds });
      
      // 🎯 KEY FIX: Create the time with explicit Eastern timezone
      // Method: Use Date constructor with timezone-aware string
      
      // Check if date is in EDT (Daylight Saving Time) or EST
      const testDate = new Date(year, month - 1, day);
      const isDST = this.isDaylightSavingTime(testDate);
      const offsetString = isDST ? '-04:00' : '-05:00'; // EDT or EST
      
      console.log('🔥 Is DST (EDT):', isDST);
      console.log('🔥 Using timezone offset:', offsetString);
      
      // Create the complete date string with timezone
      const easternDateString = `${dateStr}T${timeStr}${offsetString}`;
      console.log('🔥 Complete Eastern date string:', easternDateString);
      
      // Parse as Eastern time and JavaScript will convert to UTC
      const easternDate = new Date(easternDateString);
      console.log('🔥 Parsed date object:', easternDate);
      console.log('🔥 UTC equivalent:', easternDate.toISOString());
      
      // 🔥 VERIFICATION: Convert back to Eastern to verify
      const backToEastern = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(easternDate);
      
      console.log('🔥 VERIFICATION - Back to Eastern:', backToEastern);
      console.log('🔥 VERIFICATION - Should match input:', `${dateStr} ${timeStr}`);
      
      // 🔥 LEBANON TIME VERIFICATION: Show what this looks like in Lebanon (GMT+3)
      const lebanonTime = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Beirut', // Lebanon timezone
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(easternDate);
      
      console.log('🔥 LEBANON TIME VERIFICATION:', lebanonTime);
      console.log('🔥 LEBANON TIME - Should be around 7:00 PM for 12:00 PM Eastern');
      
      return this.convertToUTCFormat(easternDate);
      
    } catch (error) {
      console.error('❌ Conversion error:', error);
      return this.convertToUTCFormat(new Date());
    }
  }

  /**
   * Check if a date is in Daylight Saving Time for Eastern timezone
   */
  private static isDaylightSavingTime(date: Date): boolean {
    try {
      // DST in Eastern timezone typically runs from 2nd Sunday in March to 1st Sunday in November
      const year = date.getFullYear();
      
      // Find 2nd Sunday in March
      const march = new Date(year, 2, 1); // March 1st
      const firstSundayMarch = new Date(year, 2, 1 + (7 - march.getDay()) % 7);
      const secondSundayMarch = new Date(firstSundayMarch.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Find 1st Sunday in November  
      const november = new Date(year, 10, 1); // November 1st
      const firstSundayNovember = new Date(year, 10, 1 + (7 - november.getDay()) % 7);
      
      // Check if date is between DST start and end
      return date >= secondSundayMarch && date < firstSundayNovember;
      
    } catch (error) {
      console.error('Error checking DST:', error);
      return false;
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
   * 🔥 UPDATED: Generate ICS file content from appointment data
   */
  static generateICSFromAppointment(appointmentData: CreateAppointmentRequest): string {
    const borrowerName = `${appointmentData.BorrowerInformation.FirstName} ${appointmentData.BorrowerInformation.LastName}`.trim();
    
    // 🔥 FIXED: Use the simplest, most reliable conversion method
    let startTimeUTC: string;
    let endTimeUTC: string;
    
    if (appointmentData.DateTimeInfo.FromDate && appointmentData.DateTimeInfo.ToDate) {
      // Use backend dates (already in EST/EDT timezone)
      console.log('🔥 Using backend FromDate/ToDate:', appointmentData.DateTimeInfo.FromDate, appointmentData.DateTimeInfo.ToDate);
      
      startTimeUTC = this.convertBackendTimeToUTCSimple(appointmentData.DateTimeInfo.FromDate);
      endTimeUTC = this.convertBackendTimeToUTCSimple(appointmentData.DateTimeInfo.ToDate);
    } else {
      // Construct from selected date and time
      console.log('🔥 Constructing from SelectedDate/SelectedTime:', appointmentData.DateTimeInfo.SelectedDate, appointmentData.DateTimeInfo.SelectedTime);
      
      const selectedDate = appointmentData.DateTimeInfo.SelectedDate;
      const selectedTime = appointmentData.DateTimeInfo.SelectedTime;
      
      // Create start time
      const startDateTime = `${selectedDate}T${selectedTime}:00`;
      startTimeUTC = this.convertBackendTimeToUTCSimple(startDateTime);
      
      // Create end time (default to 1 hour later)
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endHours = hours + 1; // Add 1 hour
      const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      const endDateTime = `${selectedDate}T${endTime}`;
      endTimeUTC = this.convertBackendTimeToUTCSimple(endDateTime);
    }
    
    console.log('🔥 Final UTC times for ICS:', { startTimeUTC, endTimeUTC });
    
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
      `Time: ${appointmentTime} Eastern Time`,
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
      `DTSTAMP:${this.convertToUTCFormat(new Date())}`,
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
    
    return `Appointment-${borrowerName}-${date}.ics`;
  }
}