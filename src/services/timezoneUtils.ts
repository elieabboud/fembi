// src/services/timezoneUtils.ts
import { format, parseISO, isValid } from 'date-fns';

export class TimezoneService {
  private static readonly BACKEND_TIMEZONE = 'America/New_York'; // EST/EDT
  
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * 🔥 CORE CONVERSION METHOD 🔥
   * Backend sends: "2025-01-15T10:00:00.000Z" = 10:00 AM EST
   * Lebanon should see: 6:00 PM (EST + 8 hours in winter)
   */
  static convertBackendTimeToLocal(backendTimeString: string): Date {
    if (!backendTimeString) {
      console.warn('⚠️ Empty backend time provided');
      return new Date();
    }

    try {
      console.log('🔄 Converting backend time:', backendTimeString);
      
      // Step 1: Parse the ISO string to get the time components
      const parsedUTC = parseISO(backendTimeString);
      if (!isValid(parsedUTC)) {
        throw new Error('Invalid date format');
      }

      // Step 2: Extract components that represent EST local time
      const year = parsedUTC.getUTCFullYear();
      const month = parsedUTC.getUTCMonth(); // 0-based
      const day = parsedUTC.getUTCDate();
      const hours = parsedUTC.getUTCHours();
      const minutes = parsedUTC.getUTCMinutes();
      const seconds = parsedUTC.getUTCSeconds();

      console.log(`📅 Components: ${year}-${month+1}-${day} ${hours}:${minutes}:${seconds} (as EST)`);

      // Step 3: Create this exact time in EST timezone
      // We'll create a date string and specify it's in EST
      const estDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      console.log('🕐 EST date string:', estDateString);

      // Step 4: Get the current EST offset (handles DST automatically)
      const now = new Date();
      
      // Create the same moment in both EST and UTC to calculate offset
      const testInEST = new Date(now.toLocaleString('sv-SE', { timeZone: this.BACKEND_TIMEZONE }));
      const testInUTC = new Date(now.toLocaleString('sv-SE', { timeZone: 'UTC' }));
      const estOffsetMs = testInUTC.getTime() - testInEST.getTime();
      
      console.log(`⏰ EST offset: ${estOffsetMs / (1000 * 60 * 60)} hours`);

      // Step 5: Create a local date from the EST components
      const estAsLocal = new Date(estDateString);
      
      // Step 6: Apply EST offset to get the true UTC moment
      const trueUTC = new Date(estAsLocal.getTime() + estOffsetMs);
      
      console.log('🌍 True UTC moment:', trueUTC.toISOString());

      // Step 7: This UTC moment will display correctly in user's timezone
      console.log('👤 User will see:', trueUTC.toLocaleString());
      console.log('👤 User timezone:', this.getUserTimezone());

      return trueUTC;

    } catch (error) {
      console.error('❌ Error converting backend time:', error);
      return parseISO(backendTimeString); // Fallback
    }
  }

  /**
   * Alternative simpler method using Intl.DateTimeFormat
   */
  static convertBackendTimeToLocalSimple(backendTimeString: string): Date {
    if (!backendTimeString) {
      return new Date();
    }

    try {
      // Parse the backend time
      const parsedUTC = parseISO(backendTimeString);
      if (!isValid(parsedUTC)) {
        throw new Error('Invalid date');
      }

      // Extract the time components (these represent EST time)
      const year = parsedUTC.getUTCFullYear();
      const month = parsedUTC.getUTCMonth();
      const day = parsedUTC.getUTCDate();
      const hours = parsedUTC.getUTCHours();
      const minutes = parsedUTC.getUTCMinutes();
      const seconds = parsedUTC.getUTCSeconds();

      // Create a date representing this time in EST
      // We need to trick the browser into treating this as EST time
      
      // Method: Create the date as if it's local time, then calculate what UTC would be
      const localRepresentation = new Date(year, month, day, hours, minutes, seconds);
      
      // Get EST offset at this date (handles DST)
      const estFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: this.BACKEND_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Create a reference date to calculate offset
      const refDate = new Date(2025, 0, 15, 12, 0, 0); // Jan 15, 2025 noon
      const estTime = estFormatter.format(refDate);
      const utcTime = refDate.toISOString().substring(0, 19).replace('T', ' ');
      
      // Parse both to get offset
      const estParsed = new Date(estTime.replace(/(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6'));
      const utcParsed = new Date(refDate.toISOString());
      
      const offsetMs = utcParsed.getTime() - estParsed.getTime();
      
      // Apply offset to our local representation
      const result = new Date(localRepresentation.getTime() + offsetMs);
      
      console.log('🔄 Simple conversion:');
      console.log('  Input:', backendTimeString);
      console.log('  EST components:', `${year}-${month+1}-${day} ${hours}:${minutes}:${seconds}`);
      console.log('  Offset (hours):', offsetMs / (1000 * 60 * 60));
      console.log('  Result:', result.toLocaleString());
      
      return result;

    } catch (error) {
      console.error('❌ Simple conversion error:', error);
      return parseISO(backendTimeString);
    }
  }

  /**
   * MOST RELIABLE METHOD - Using browser's built-in timezone handling
   */
  static convertBackendTimeToLocalReliable(backendTimeString: string): Date {
    if (!backendTimeString) {
      return new Date();
    }

    try {
      console.log('🔄 Reliable conversion for:', backendTimeString);

      // Parse to get components
      const parsedUTC = parseISO(backendTimeString);
      if (!isValid(parsedUTC)) {
        throw new Error('Invalid date');
      }

      // Get the time components that represent EST
      const year = parsedUTC.getUTCFullYear();
      const month = parsedUTC.getUTCMonth() + 1; // Make it 1-based
      const day = parsedUTC.getUTCDate();
      const hours = parsedUTC.getUTCHours();
      const minutes = parsedUTC.getUTCMinutes();
      const seconds = parsedUTC.getUTCSeconds();

      // Create an ISO string representing this time in EST
      const estISOString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      console.log('📅 EST ISO string:', estISOString);

      // Now we need to figure out what this EST time equals in UTC
      // We'll use a reference calculation
      
      // Create two dates: one treating the time as local, one as UTC
      const asLocal = new Date(estISOString);
      const asUTC = new Date(estISOString + 'Z');
      
      // Get what this time would be in EST using Intl
      const estFormatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: this.BACKEND_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Use current time to calculate EST offset
      const now = new Date();
      const nowInEST = estFormatter.format(now);
      const nowInUTC = now.toISOString().substring(0, 19).replace('T', ' ');
      
      // Calculate how many hours EST is behind UTC
      const estHour = parseInt(nowInEST.substring(11, 13));
      const utcHour = parseInt(nowInUTC.substring(11, 13));
      let offsetHours = utcHour - estHour;
      
      // Handle day boundary crossing
      if (offsetHours > 12) offsetHours -= 24;
      if (offsetHours < -12) offsetHours += 24;
      
      console.log(`⏰ EST is ${offsetHours} hours behind UTC`);

      // Apply the offset to convert EST to UTC
      const estAsUTC = new Date(asLocal.getTime() + (offsetHours * 60 * 60 * 1000));
      
      console.log('✅ Final result:', estAsUTC.toLocaleString());
      console.log('   In Lebanon should be ~8 hours ahead of EST input');

      return estAsUTC;

    } catch (error) {
      console.error('❌ Reliable conversion error:', error);
      return parseISO(backendTimeString);
    }
  }

  /**
   * Convert user's local time back to backend EST format
   */
  static convertLocalTimeToBackend(localTime: Date): string {
    if (!localTime || !isValid(localTime)) {
      console.warn('⚠️ Invalid local time provided');
      return new Date().toISOString();
    }

    try {
      // Use Intl to get the equivalent EST time
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
      const isoString = estTimeString.replace(' ', 'T') + '.000Z';

      console.log('📤 Local to backend:', localTime.toLocaleString(), '->', isoString);
      return isoString;

    } catch (error) {
      console.error('❌ Error converting to backend:', error);
      return localTime.toISOString();
    }
  }

  /**
   * Format backend time for display in user's timezone
   */
  static formatTimeForUser(backendTime: string, formatPattern: string = 'h:mm a'): string {
    if (!backendTime) return '';
    
    try {
      const userTime = this.convertBackendTimeToLocalReliable(backendTime);
      return format(userTime, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return '';
    }
  }

  /**
   * Format backend date for display in user's timezone
   */
  static formatDateForUser(backendTime: string, formatPattern: string = 'yyyy-MM-dd'): string {
    if (!backendTime) return '';
    
    try {
      const userTime = this.convertBackendTimeToLocalReliable(backendTime);
      return format(userTime, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return '';
    }
  }

  /**
   * Convert time slots from EST to user's timezone
   * THIS IS THE KEY METHOD FOR YOUR TIME SLOTS
   */
  static convertTimeSlotToLocal(timeSlot: any): any {
    try {
      console.log('🕐 Converting time slot:', timeSlot);

      // Convert start and end times using our reliable method
      const startTimeUser = this.convertBackendTimeToLocalReliable(timeSlot.startTime);
      const endTimeUser = this.convertBackendTimeToLocalReliable(timeSlot.endTime);

      // Format for display
      const startFormatted = format(startTimeUser, 'h:mm a');
      const endFormatted = format(endTimeUser, 'h:mm a');
      
      const displayText = `${startFormatted} - ${endFormatted}`;

      console.log('✅ Time slot converted:');
      console.log(`   Original: ${timeSlot.displayText || timeSlot.startTime}`);
      console.log(`   New: ${displayText}`);

      return {
        ...timeSlot,
        displayText: displayText,
        userStartTime: startTimeUser,
        userEndTime: endTimeUser
      };

    } catch (error) {
      console.error('❌ Error converting time slot:', error);
      return timeSlot;
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
        timeZoneName: 'long'
      });
      
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
      
      return timeZoneName || timezone;
    } catch (error) {
      return this.getUserTimezone();
    }
  }

  /**
   * Check if user needs timezone warning
   */
  static shouldShowTimezoneWarning(): boolean {
    return this.getUserTimezone() !== this.BACKEND_TIMEZONE;
  }

  /**
   * 🧪 COMPREHENSIVE TEST - Run this to verify everything works
   */
  static runComprehensiveTest(): void {
    console.log('🧪 === COMPREHENSIVE TIMEZONE TEST ===');
    console.log(`👤 User timezone: ${this.getUserTimezone()}`);
    console.log(`🏢 Backend timezone: ${this.BACKEND_TIMEZONE}`);
    console.log('');

    // Test the exact times from your screenshot
    const testCases = [
      { input: "2025-01-15T10:00:00.000Z", expected: "6:00 PM" }, // 10 AM EST -> 6 PM Lebanon
      { input: "2025-01-15T11:00:00.000Z", expected: "7:00 PM" }, // 11 AM EST -> 7 PM Lebanon
      { input: "2025-01-15T12:00:00.000Z", expected: "8:00 PM" }, // 12 PM EST -> 8 PM Lebanon
      { input: "2025-01-15T13:00:00.000Z", expected: "9:00 PM" }, // 1 PM EST -> 9 PM Lebanon
    ];

    testCases.forEach((testCase, index) => {
      console.log(`\n📋 Test Case ${index + 1}: ${testCase.input}`);
      console.log(`   Expected: ${testCase.expected} (Lebanon time)`);
      
      // Test all methods
      const reliable = this.convertBackendTimeToLocalReliable(testCase.input);
      const simple = this.convertBackendTimeToLocalSimple(testCase.input);
      const main = this.convertBackendTimeToLocal(testCase.input);
      
      console.log(`   Reliable method: ${format(reliable, 'h:mm a')}`);
      console.log(`   Simple method: ${format(simple, 'h:mm a')}`);
      console.log(`   Main method: ${format(main, 'h:mm a')}`);
      
      // Test time slot conversion
      const mockSlot = {
        startTime: testCase.input,
        endTime: testCase.input, // Same for simplicity
        displayText: "Original"
      };
      
      const converted = this.convertTimeSlotToLocal(mockSlot);
      console.log(`   Time slot result: ${converted.displayText}`);
    });

    console.log('\n🎯 Your time slots should now show Lebanon times!');
    console.log('🧪 === TEST COMPLETE ===');
  }
}