// src/services/timezoneUtils.ts
import { format, parseISO } from 'date-fns';

export class TimezoneService {
  // Backend timezone (Eastern Standard Time)
  private static readonly BACKEND_TIMEZONE = 'America/New_York';
  
  // Get user's local timezone
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Convert backend time (EST) to user's local timezone
   * @param backendTime - ISO string from backend in EST
   * @returns Date object in user's local timezone
   */
  static convertBackendTimeToLocal(backendTime: string): Date {
    if (!backendTime) return new Date();
    
    try {
      // Parse the backend time
      const backendDate = parseISO(backendTime);
      
      // Calculate timezone offsets dynamically
      const offsetDifference = this.calculateTimezoneOffsetDifference();
      
      // Apply the offset difference
      const userTime = new Date(backendDate.getTime() + offsetDifference);
      
      return userTime;
    } catch (error) {
      console.error('Error converting backend time to local:', error);
      return parseISO(backendTime);
    }
  }

  /**
   * Convert user's local time to backend timezone (EST)
   * @param localTime - Date in user's local timezone
   * @returns ISO string for backend in EST
   */
  static convertLocalTimeToBackend(localTime: Date): string {
    if (!localTime) return new Date().toISOString();
    
    try {
      // Calculate timezone offsets dynamically and reverse the conversion
      const offsetDifference = this.calculateTimezoneOffsetDifference();
      
      // Apply the reverse offset
      const estTime = new Date(localTime.getTime() - offsetDifference);
      
      return estTime.toISOString();
    } catch (error) {
      console.error('Error converting local time to backend:', error);
      return localTime.toISOString();
    }
  }

  /**
   * Format time for display in user's timezone
   * @param backendTime - ISO string from backend
   * @param formatString - format string for date-fns
   * @returns formatted string in user's timezone
   */
  static formatTimeForUser(backendTime: string, formatString: string = 'h:mm a'): string {
    if (!backendTime) return '';
    
    try {
      // Convert backend time to user's timezone first, then format
      const userDate = this.convertBackendTimeToLocal(backendTime);
      return format(userDate, formatString);
    } catch (error) {
      console.error('Error formatting time for user:', error);
      return format(parseISO(backendTime), formatString);
    }
  }

  /**
   * Format date for display in user's timezone
   * @param backendTime - ISO string from backend
   * @param formatString - format string for date-fns
   * @returns formatted string in user's timezone
   */
  static formatDateForUser(backendTime: string, formatString: string = 'yyyy-MM-dd'): string {
    if (!backendTime) return '';
    
    try {
      // Convert backend time to user's timezone first, then format
      const userDate = this.convertBackendTimeToLocal(backendTime);
      return format(userDate, formatString);
    } catch (error) {
      console.error('Error formatting date for user:', error);
      return format(parseISO(backendTime), formatString);
    }
  }

  /**
   * Calculate the timezone offset difference between user's timezone and backend timezone
   * @returns offset difference in milliseconds
   */
  private static calculateTimezoneOffsetDifference(): number {
    try {
      // Create a reference date (current time)
      const now = new Date();
      
      // Get the time in EST timezone
      const estTime = new Date(now.toLocaleString('en-US', {
        timeZone: this.BACKEND_TIMEZONE
      }));
      
      // Get the time in user's timezone
      const userTime = new Date(now.toLocaleString('en-US', {
        timeZone: this.getUserTimezone()
      }));
      
      // Calculate the difference in milliseconds
      const offsetDifference = userTime.getTime() - estTime.getTime();
      
      console.log('Timezone offset calculation:');
      console.log('- EST time:', estTime);
      console.log('- User time:', userTime);
      console.log('- Offset difference (ms):', offsetDifference);
      console.log('- Offset difference (hours):', offsetDifference / (1000 * 60 * 60));
      
      return offsetDifference;
    } catch (error) {
      console.error('Error calculating timezone offset:', error);
      return 0;
    }
  }

  /**
   * Convert TimeSlot start/end times to user's timezone
   * @param timeSlot - TimeSlot object with backend times
   * @returns TimeSlot with times converted to user's timezone
   */
  static convertTimeSlotToLocal(timeSlot: any): any {
    try {
      console.log('Converting time slot:', timeSlot);
      
      // Convert backend times to user's timezone
      const userStartDate = this.convertBackendTimeToLocal(timeSlot.startTime);
      const userEndDate = this.convertBackendTimeToLocal(timeSlot.endTime);
      
      console.log('Original start:', timeSlot.startTime);
      console.log('Converted start:', userStartDate);
      console.log('Formatted start:', format(userStartDate, 'h:mm a'));
      
      return {
        ...timeSlot,
        startTime: userStartDate.toISOString(),
        endTime: userEndDate.toISOString(),
        displayText: format(userStartDate, 'h:mm a') + 
                     ' - ' + 
                     format(userEndDate, 'h:mm a')
      };
    } catch (error) {
      console.error('Error converting time slot:', error);
      return timeSlot;
    }
  }

  /**
   * Create a date in user's timezone for date picker
   * @param dateString - date string (YYYY-MM-DD)
   * @param timeString - time string (HH:mm)
   * @returns Date object in user's timezone
   */
  static createLocalDateTime(dateString: string, timeString: string): Date {
    const dateTimeString = `${dateString}T${timeString}:00`;
    
    try {
      // Create date in user's timezone
      const date = parseISO(dateTimeString);
      return date;
    } catch (error) {
      console.error('Error creating local date time:', error);
      return new Date();
    }
  }

  /**
   * Get user's timezone display name
   * @returns human-readable timezone name
   */
  static getUserTimezoneDisplay(): string {
    const timezone = this.getUserTimezone();
    const now = new Date();
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'long'
      });
      
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
      
      return timeZoneName || timezone;
    } catch (error) {
      return timezone;
    }
  }

  /**
   * Check if times need timezone warning
   * @returns boolean indicating if user is in different timezone than EST
   */
  static shouldShowTimezoneWarning(): boolean {
    const userTz = this.getUserTimezone();
    return userTz !== this.BACKEND_TIMEZONE;
  }

  /**
   * Debug method to test timezone conversion
   * @param testTime - time to test (e.g., "2025-01-15T09:00:00")
   */
  static debugTimezoneConversion(testTime: string): void {
    console.log('=== Timezone Conversion Debug ===');
    console.log('Input (Backend EST):', testTime);
    console.log('User Timezone:', this.getUserTimezone());
    console.log('Backend Timezone:', this.BACKEND_TIMEZONE);
    
    // Test the dynamic conversion approach
    const backendDate = parseISO(testTime);
    console.log('Parsed backend date:', backendDate);
    
    const offsetDifference = this.calculateTimezoneOffsetDifference();
    console.log('Calculated offset difference (hours):', offsetDifference / (1000 * 60 * 60));
    
    const userTime = this.convertBackendTimeToLocal(testTime);
    console.log('Converted to User Time:', userTime);
    console.log('Formatted for User:', this.formatTimeForUser(testTime, 'h:mm a'));
    
    const backToBackend = this.convertLocalTimeToBackend(userTime);
    console.log('Back to Backend:', backToBackend);
    console.log('==================================');
  }
}