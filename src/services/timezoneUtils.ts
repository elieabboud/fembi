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
      // Parse the backend time assuming it's in EST
      const date = parseISO(backendTime);
      
      // Create a new date that represents the same moment in time
      // but we need to adjust for the timezone difference
      const estOffset = this.getTimezoneOffset(this.BACKEND_TIMEZONE);
      const localOffset = this.getTimezoneOffset(this.getUserTimezone());
      
      // Calculate the difference and adjust
      const offsetDifference = (localOffset - estOffset) * 60 * 1000;
      
      return new Date(date.getTime() + offsetDifference);
    } catch (error) {
      console.error('Error converting backend time to local:', error);
      return new Date();
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
      const userTz = this.getUserTimezone();
      const estOffset = this.getTimezoneOffset(this.BACKEND_TIMEZONE);
      const localOffset = this.getTimezoneOffset(userTz);
      
      // Calculate the difference and adjust
      const offsetDifference = (estOffset - localOffset) * 60 * 1000;
      const adjustedTime = new Date(localTime.getTime() + offsetDifference);
      
      return adjustedTime.toISOString();
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
      // Convert backend time to user's local time first, then format
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
      // Convert backend time to user's local time first, then format
      const userDate = this.convertBackendTimeToLocal(backendTime);
      return format(userDate, formatString);
    } catch (error) {
      console.error('Error formatting date for user:', error);
      return format(parseISO(backendTime), formatString);
    }
  }

  /**
   * Get timezone offset in minutes
   * @param timezone - IANA timezone string
   * @returns offset in minutes
   */
  private static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (utc.getTime() - targetTime.getTime()) / (1000 * 60);
  }

  /**
   * Convert TimeSlot start/end times to user's timezone
   * @param timeSlot - TimeSlot object with backend times
   * @returns TimeSlot with times converted to user's timezone
   */
  static convertTimeSlotToLocal(timeSlot: any): any {
    const convertedStartTime = this.convertBackendTimeToLocal(timeSlot.startTime);
    const convertedEndTime = this.convertBackendTimeToLocal(timeSlot.endTime);
    
    return {
      ...timeSlot,
      startTime: convertedStartTime.toISOString(),
      endTime: convertedEndTime.toISOString(),
      displayText: format(convertedStartTime, 'h:mm a') + 
                   ' - ' + 
                   format(convertedEndTime, 'h:mm a')
    };
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
}