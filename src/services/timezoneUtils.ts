// src/services/timezoneUtils.ts
import { format, parseISO, isValid } from 'date-fns';

export class TimezoneService {
  // Backend timezone (Eastern Time)
  private static readonly BACKEND_TIMEZONE = 'America/New_York';
  
  // Get user's local timezone
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Convert backend time (EST/EDT) to user's local timezone
   * Backend sends times that represent EST/EDT local time
   * We need to interpret them as EST and show them in user's timezone
   */
  static convertBackendTimeToLocal(backendTime: string): Date {
    if (!backendTime) {
      console.warn('Empty backendTime provided to convertBackendTimeToLocal');
      return new Date();
    }
    
    try {
      // Parse the ISO string
      const parsedDate = parseISO(backendTime);
      
      if (!isValid(parsedDate)) {
        console.error('Invalid date provided:', backendTime);
        return new Date();
      }

      // The backend time represents a moment in EST/EDT timezone
      // We need to treat the time components as EST and convert to user timezone
      
      // Extract the time components (these represent EST time)
      const year = parsedDate.getUTCFullYear();
      const month = parsedDate.getUTCMonth();
      const day = parsedDate.getUTCDate();
      const hours = parsedDate.getUTCHours();
      const minutes = parsedDate.getUTCMinutes();
      const seconds = parsedDate.getUTCSeconds();
      
      // Method 1: Use the date components to create a proper EST date
      // Create date string in ISO format
      const estDateTimeString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Parse this as a local date (will be in user's timezone)
      const localDate = new Date(estDateTimeString);
      
      // Now calculate the offset between EST and user timezone
      const offsetDiff = this.getTimezoneOffsetDifference();
      
      // Apply the offset to convert from EST to user timezone
      const userDate = new Date(localDate.getTime() + offsetDiff);
      
      return userDate;
      
    } catch (error) {
      console.error('Error converting backend time to local:', error, 'Input:', backendTime);
      return parseISO(backendTime);
    }
  }

  /**
   * Convert user's local time to backend timezone (EST/EDT)
   */
  static convertLocalTimeToBackend(localTime: Date): string {
    if (!localTime || !isValid(localTime)) {
      console.warn('Invalid localTime provided to convertLocalTimeToBackend');
      return new Date().toISOString();
    }
    
    try {
      // Calculate the offset between user timezone and EST
      const offsetDiff = this.getTimezoneOffsetDifference();
      
      // Convert user time to EST
      const estTime = new Date(localTime.getTime() - offsetDiff);
      
      return estTime.toISOString();
      
    } catch (error) {
      console.error('Error converting local time to backend:', error);
      return localTime.toISOString();
    }
  }

  /**
   * Calculate the timezone offset difference between user timezone and EST
   * Returns the difference in milliseconds
   */
  private static getTimezoneOffsetDifference(): number {
    try {
      // Use a reference date to calculate the offset
      const referenceDate = new Date();
      
      // Get the same moment in both timezones
      const userTime = new Date(referenceDate.toLocaleString('sv-SE', { 
        timeZone: this.getUserTimezone() 
      }));
      
      const estTime = new Date(referenceDate.toLocaleString('sv-SE', { 
        timeZone: this.BACKEND_TIMEZONE 
      }));
      
      // Calculate the difference
      const offsetMs = userTime.getTime() - estTime.getTime();
      
      console.log('Timezone offset calculation:');
      console.log('- User timezone:', this.getUserTimezone());
      console.log('- EST time for reference:', estTime);
      console.log('- User time for reference:', userTime);
      console.log('- Offset (ms):', offsetMs);
      console.log('- Offset (hours):', offsetMs / (1000 * 60 * 60));
      
      return offsetMs;
    } catch (error) {
      console.error('Error calculating timezone offset:', error);
      return 0;
    }
  }

  /**
   * Format time for display in user's timezone
   */
  static formatTimeForUser(backendTime: string, formatString: string = 'h:mm a'): string {
    if (!backendTime) return '';
    
    try {
      // Convert backend time to user's timezone
      const userDate = this.convertBackendTimeToLocal(backendTime);
      
      if (!isValid(userDate)) {
        console.error('Invalid converted date for formatting:', backendTime);
        return '';
      }

      // Format the converted time
      if (formatString === 'h:mm a') {
        return new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(userDate);
      }
      
      if (formatString === 'HH:mm') {
        return new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(userDate);
      }
      
      // For other formats, use date-fns
      return format(userDate, formatString);
      
    } catch (error) {
      console.error('Error formatting time for user:', error);
      return '';
    }
  }

  /**
   * Format date for display in user's timezone
   */
  static formatDateForUser(backendTime: string, formatString: string = 'yyyy-MM-dd'): string {
    if (!backendTime) return '';
    
    try {
      // Convert backend time to user's timezone
      const userDate = this.convertBackendTimeToLocal(backendTime);
      
      if (!isValid(userDate)) {
        console.error('Invalid converted date for formatting:', backendTime);
        return '';
      }

      // Format the converted date
      if (formatString === 'yyyy-MM-dd') {
        return new Intl.DateTimeFormat('en-CA').format(userDate);
      }
      
      if (formatString === 'MMMM d, yyyy') {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(userDate);
      }
      
      // For other formats, use date-fns
      return format(userDate, formatString);
      
    } catch (error) {
      console.error('Error formatting date for user:', error);
      return '';
    }
  }

  /**
   * Convert TimeSlot start/end times from EST to user's timezone
   */
  static convertTimeSlotToLocal(timeSlot: any): any {
    try {
      // Convert both start and end times from EST to user's timezone
      const startDateUser = this.convertBackendTimeToLocal(timeSlot.startTime);
      const endDateUser = this.convertBackendTimeToLocal(timeSlot.endTime);
      
      if (!isValid(startDateUser) || !isValid(endDateUser)) {
        console.error('Invalid time slot dates after conversion:', timeSlot);
        return timeSlot;
      }

      console.log('Time slot conversion:');
      console.log('- Original start (EST):', timeSlot.startTime);
      console.log('- Converted start (User):', startDateUser);
      console.log('- Original end (EST):', timeSlot.endTime);
      console.log('- Converted end (User):', endDateUser);

      // Format the times for display in user's timezone
      const startFormatted = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(startDateUser);
      
      const endFormatted = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(endDateUser);
      
      return {
        ...timeSlot,
        displayText: `${startFormatted} - ${endFormatted}`,
        // Keep original times for backend communication
        originalStartTime: timeSlot.startTime,
        originalEndTime: timeSlot.endTime,
        // Add user timezone versions for debugging
        userStartTime: startDateUser.toISOString(),
        userEndTime: endDateUser.toISOString()
      };
    } catch (error) {
      console.error('Error converting time slot:', error);
      return timeSlot;
    }
  }

  /**
   * Create a backend datetime from user input
   */
  static createBackendDateTime(dateString: string, timeString: string): string {
    try {
      // Create a date in user's timezone
      const dateTimeString = `${dateString}T${timeString}:00`;
      const userDate = parseISO(dateTimeString);
      
      if (!isValid(userDate)) {
        console.error('Invalid date/time combination:', dateString, timeString);
        return new Date().toISOString();
      }

      // Convert to backend timezone (EST)
      return this.convertLocalTimeToBackend(userDate);
    } catch (error) {
      console.error('Error creating backend date time:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Get user's timezone display name
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
   * Check if timezone warning should be shown
   */
  static shouldShowTimezoneWarning(): boolean {
    const userTz = this.getUserTimezone();
    return userTz !== this.BACKEND_TIMEZONE;
  }

  /**
   * Parse a backend time for form inputs (converted to user's timezone)
   */
  static parseBackendTimeForForm(backendTime: string): Date {
    try {
      // Convert EST backend time to user's timezone for form display
      return this.convertBackendTimeToLocal(backendTime);
    } catch (error) {
      console.error('Error parsing backend time for form:', error);
      return new Date();
    }
  }

  /**
   * Debug method to test timezone conversion
   */
  static debugTimezoneConversion(testTime: string): void {
    console.log('=== Timezone Conversion Debug ===');
    console.log('Input (Backend EST/EDT):', testTime);
    console.log('User Timezone:', this.getUserTimezone());
    console.log('Backend Timezone:', this.BACKEND_TIMEZONE);
    console.log('Timezone offset (ms):', this.getTimezoneOffsetDifference());
    console.log('Timezone offset (hours):', this.getTimezoneOffsetDifference() / (1000 * 60 * 60));
    
    const userTime = this.convertBackendTimeToLocal(testTime);
    console.log('Converted to User Time:', userTime);
    console.log('User sees time as:', userTime.toLocaleString());
    console.log('Formatted for User (time):', this.formatTimeForUser(testTime, 'h:mm a'));
    console.log('Formatted for User (date):', this.formatDateForUser(testTime, 'MMMM d, yyyy'));
    
    const backToBackend = this.convertLocalTimeToBackend(userTime);
    console.log('Back to Backend:', backToBackend);
    console.log('Round trip check:', testTime === backToBackend ? 'PASS' : 'FAIL');
    console.log('==================================');
  }
}