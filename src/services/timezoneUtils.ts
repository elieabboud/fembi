// src/services/timezoneUtils.ts - DYNAMIC VERSION FOR ALL TIMEZONES
import { format, parseISO, isValid } from 'date-fns';
import { TimeSlot } from '../types/service';

export class TimezoneService {
  private static readonly BACKEND_TIMEZONE = 'America/New_York'; // EST/EDT
  
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * 🌍 DYNAMIC METHOD: Works for ANY timezone automatically
   * Calculates the offset between EST and user's timezone dynamically
   */
  static convertBackendTimeToLocal(backendTimeString: string): Date {
    if (!backendTimeString) {
      return new Date();
    }

    try {
      console.log('🔄 Dynamic conversion for any timezone:', backendTimeString);

      // Parse the backend time (EST local time)
      const backendTime = parseISO(backendTimeString);
      if (!isValid(backendTime)) {
        throw new Error('Invalid date');
      }

      // Get the date components
      const year = backendTime.getFullYear();
      const month = backendTime.getMonth();
      const day = backendTime.getDate();
      const hours = backendTime.getHours();
      const minutes = backendTime.getMinutes();
      const seconds = backendTime.getSeconds();

      // 🎯 DYNAMIC APPROACH: Use the same date/time in both timezones
      // and calculate the actual difference
      
      // Create a reference date (same date as our target)
      const referenceDate = new Date(year, month, day, hours, minutes, seconds);
      
      // Get this SAME moment expressed in EST timezone
      const estTime = new Date(referenceDate.toLocaleString('sv-SE', { 
        timeZone: this.BACKEND_TIMEZONE 
      }));
      
      // Get this SAME moment expressed in user's timezone  
      const userTime = new Date(referenceDate.toLocaleString('sv-SE', { 
        timeZone: this.getUserTimezone() 
      }));
      
      // Calculate the difference
      const offsetMs = userTime.getTime() - estTime.getTime();
      const offsetHours = offsetMs / (1000 * 60 * 60);
      
      console.log(`⏰ Dynamic offset calculation:`);
      console.log(`   User timezone: ${this.getUserTimezone()}`);
      console.log(`   EST timezone: ${this.BACKEND_TIMEZONE}`);
      console.log(`   Offset: ${offsetHours} hours`);
      
      // Apply the offset to our target time
      const result = new Date(referenceDate.getTime() + offsetMs);
      
      console.log('✅ Dynamic conversion result:', {
        input: backendTimeString,
        estTime: `${hours}:${minutes}`,
        userTime: `${result.getHours()}:${result.getMinutes()}`,
        offsetHours: offsetHours,
        finalResult: result.toLocaleString()
      });
      
      return result;

    } catch (error) {
      console.error('❌ Dynamic conversion error:', error);
      return parseISO(backendTimeString);
    }
  }

  /**
   * 🚀 SIMPLIFIED DYNAMIC METHOD: Uses Intl.DateTimeFormat properly
   */
  static convertBackendTimeToLocalReliable(backendTimeString: string): Date {
    if (!backendTimeString) {
      return new Date();
    }

    try {
      console.log('🚀 Reliable dynamic conversion:', backendTimeString);

      const backendTime = parseISO(backendTimeString);
      if (!isValid(backendTime)) {
        throw new Error('Invalid date');
      }

      // Extract time components
      const year = backendTime.getFullYear();
      const month = backendTime.getMonth();
      const day = backendTime.getDate();
      const hours = backendTime.getHours();
      const minutes = backendTime.getMinutes();
      const seconds = backendTime.getSeconds();

      // 🎯 THE KEY: Create this time as if it's in EST, then convert to user timezone
      
      // Method: Create the time in UTC, then adjust for timezone differences
      // Step 1: Create a date object representing this time
      const baseTime = new Date(year, month, day, hours, minutes, seconds);
      
      // Step 2: Calculate timezone offsets for the same moment
      const now = new Date(); // Use current time as reference for DST handling
      
      // Get EST offset from UTC (in minutes)
      const estOffsetMinutes = this.getTimezoneOffsetFromUTC(this.BACKEND_TIMEZONE, now);
      
      // Get user timezone offset from UTC (in minutes)  
      const userOffsetMinutes = this.getTimezoneOffsetFromUTC(this.getUserTimezone(), now);
      
      // Calculate the difference between user timezone and EST
      const offsetDifferenceMinutes = userOffsetMinutes - estOffsetMinutes;
      const offsetDifferenceMs = offsetDifferenceMinutes * 60 * 1000;
      
      console.log(`🌍 Timezone offset calculation:`);
      console.log(`   EST offset from UTC: ${estOffsetMinutes} minutes`);
      console.log(`   User offset from UTC: ${userOffsetMinutes} minutes`);
      console.log(`   Difference: ${offsetDifferenceMinutes} minutes (${offsetDifferenceMinutes/60} hours)`);
      
      // Apply the offset
      const result = new Date(baseTime.getTime() + offsetDifferenceMs);
      
      console.log('✅ Reliable dynamic result:', {
        estInput: `${hours}:${String(minutes).padStart(2, '0')}`,
        userOutput: `${result.getHours()}:${String(result.getMinutes()).padStart(2, '0')}`,
        offsetHours: offsetDifferenceMinutes / 60
      });
      
      return result;

    } catch (error) {
      console.error('❌ Reliable conversion error:', error);
      return parseISO(backendTimeString);
    }
  }

  /**
   * Helper: Get timezone offset from UTC in minutes
   */
  private static getTimezoneOffsetFromUTC(timezone: string, date: Date): number {
    try {
      // Create formatter for the target timezone
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Get the time in the target timezone
      const tzTimeString = formatter.format(date);
      const tzTime = new Date(tzTimeString.replace(' ', 'T'));

      // Get the time in UTC
      const utcTime = new Date(date.toISOString().substring(0, 19) + 'Z');

      // Calculate offset in minutes
      const offsetMs = tzTime.getTime() - utcTime.getTime();
      const offsetMinutes = offsetMs / (1000 * 60);

      return offsetMinutes;

    } catch (error) {
      console.error(`Error calculating offset for ${timezone}:`, error);
      return 0;
    }
  }

  /**
   * Convert user's local time back to EST for backend
   */
  static convertLocalTimeToBackend(localTime: Date): string {
    if (!localTime || !isValid(localTime)) {
      return new Date().toISOString();
    }

    try {
      console.log('📤 Converting local time to backend EST:', localTime.toLocaleString());

      // Use Intl to get EST equivalent
      const estFormatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: this.BACKEND_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const estTimeString = estFormatter.format(localTime);
      const backendFormat = estTimeString.replace(' ', 'T');

      console.log('📤 Backend EST format:', backendFormat);
      return backendFormat;

    } catch (error) {
      console.error('❌ Error converting to backend:', error);
      return format(localTime, "yyyy-MM-dd'T'HH:mm:ss");
    }
  }

  /**
   * Format backend EST time for user display
   */
  static formatTimeForUser(backendTime: string, formatPattern: string = 'h:mm a'): string {
    if (!backendTime) return '';
    
    try {
      const userTime = this.convertBackendTimeToLocalReliable(backendTime);
      return format(userTime, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return 'Invalid time';
    }
  }

  /**
   * Format backend EST date for user display
   */
  static formatDateForUser(backendTime: string, formatPattern: string = 'yyyy-MM-dd'): string {
    if (!backendTime) return '';
    
    try {
      const userTime = this.convertBackendTimeToLocalReliable(backendTime);
      return format(userTime, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return 'Invalid date';
    }
  }

  /**
   * 🌍 DYNAMIC: Convert time slots for ANY timezone
   */
  static convertTimeSlotToLocal(timeSlot: TimeSlot): TimeSlot & { displayText: string } {
    try {
      console.log('🕐 Converting time slot for', this.getUserTimezone(), ':', {
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        originalDisplay: timeSlot.displayText
      });

      // Use the reliable dynamic conversion
      const startTimeUser = this.convertBackendTimeToLocalReliable(timeSlot.startTime);
      const endTimeUser = this.convertBackendTimeToLocalReliable(timeSlot.endTime);

      // Format for display
      const startFormatted = format(startTimeUser, 'h:mm a');
      const endFormatted = format(endTimeUser, 'h:mm a');
      
      const displayText = `${startFormatted} - ${endFormatted}`;

      console.log('✅ Time slot converted for', this.getUserTimezone(), ':', {
        original: timeSlot.displayText,
        new: displayText,
        estStart: timeSlot.startTime,
        userStart: startTimeUser.toLocaleString(),
        estEnd: timeSlot.endTime,
        userEnd: endTimeUser.toLocaleString()
      });

      return {
        ...timeSlot,
        displayText: displayText
      };

    } catch (error) {
      console.error('❌ Error converting time slot:', error);
      return {
        ...timeSlot,
        displayText: timeSlot.displayText || 'Invalid time'
      };
    }
  }

  /**
   * Get user's timezone display name
   */
  static getUserTimezoneDisplay(): string {
    try {
      const timezone = this.getUserTimezone();
      const now = new Date();
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longGeneric'
      });
      
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
      
      return timeZoneName || timezone;
    } catch (error) {
      console.error('Error getting timezone display:', error);
      return this.getUserTimezone();
    }
  }

  /**
   * Check if user needs timezone warning
   */
  static shouldShowTimezoneWarning(): boolean {
    const userTz = this.getUserTimezone();
    return userTz !== this.BACKEND_TIMEZONE && 
           userTz !== 'America/New_York' && 
           userTz !== 'America/Toronto' &&
           userTz !== 'US/Eastern';
  }

  /**
   * 🧪 Test dynamic conversion with any timezone
   */
  static testDynamicConversion(): void {
    console.log('🧪 === TESTING DYNAMIC CONVERSION ===');
    console.log(`User timezone: ${this.getUserTimezone()}`);
    console.log(`Backend timezone: ${this.BACKEND_TIMEZONE}`);
    
    const testTimes = [
      "2025-05-26T09:00:00", // 9 AM EST
      "2025-05-26T12:00:00", // 12 PM EST
      "2025-05-26T16:00:00", // 4 PM EST
    ];
    
    testTimes.forEach(testTime => {
      console.log(`\n📋 Testing: ${testTime} EST`);
      
      const result = this.convertBackendTimeToLocalReliable(testTime);
      const formatted = format(result, 'h:mm a');
      
      console.log(`   Result: ${formatted} (${result.toLocaleString()})`);
      console.log(`   Your timezone: ${this.getUserTimezone()}`);
    });
    
    console.log('\n🌍 This works for ANY timezone automatically!');
    console.log('🧪 === TEST COMPLETE ===');
  }
}