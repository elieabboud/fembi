import { format, parseISO, isValid } from 'date-fns';
import { TimeSlot } from '../types/service';

export class TimezoneService {
  private static readonly BACKEND_TIMEZONE = 'America/New_York';
  private static readonly DISPLAY_TIMEZONE = 'America/Puerto_Rico';
  

  static getUserTimezone(): string {
    return this.DISPLAY_TIMEZONE;
  }


  static convertBackendTimeToLocal(backendTimeString: string): Date {
    if (!backendTimeString) {
      return new Date();
    }

    try {
      const backendTime = parseISO(backendTimeString);
      if (!isValid(backendTime)) {
        throw new Error('Invalid date');
      }

      const year = backendTime.getFullYear();
      const month = backendTime.getMonth();
      const day = backendTime.getDate();
      const hours = backendTime.getHours();
      const minutes = backendTime.getMinutes();
      const seconds = backendTime.getSeconds();

      const isDST = this.isDaylightSavingTime(backendTime);
      
      let prHours = hours;
      if (!isDST) {
        prHours = hours + 1;
      }

      let prDay = day;
      let prMonth = month;
      let prYear = year;
      
      if (prHours >= 24) {
        prHours = prHours - 24;
        prDay = day + 1;
        
        const daysInMonth = new Date(prYear, prMonth + 1, 0).getDate();
        if (prDay > daysInMonth) {
          prDay = 1;
          prMonth = month + 1;
          if (prMonth > 11) {
            prMonth = 0;
            prYear = year + 1;
          }
        }
      }

      const prTime = new Date(prYear, prMonth, prDay, prHours, minutes, seconds);
      
      return prTime;

    } catch (error) {
      console.error('❌ Error converting backend time to Puerto Rico time:', error);
      return parseISO(backendTimeString);
    }
  }


  static convertBackendTimeToLocalReliable(backendTimeString: string): Date {
    return this.convertBackendTimeToLocal(backendTimeString);
  }


  static convertLocalTimeToBackend(prTime: Date): string {
    if (!prTime || !isValid(prTime)) {
      return new Date().toISOString();
    }

    try {
      const year = prTime.getFullYear();
      const month = prTime.getMonth();
      const day = prTime.getDate();
      const hours = prTime.getHours();
      const minutes = prTime.getMinutes();
      const seconds = prTime.getSeconds();

      const isDST = this.isDaylightSavingTime(prTime);
      
      let backendHours = hours;
      if (!isDST) {
        backendHours = hours - 1;
      }

      let backendDay = day;
      let backendMonth = month;
      let backendYear = year;
      
      if (backendHours < 0) {
        backendHours = backendHours + 24;
        backendDay = day - 1;
        
        if (backendDay < 1) {
          backendMonth = month - 1;
          if (backendMonth < 0) {
            backendMonth = 11;
            backendYear = year - 1;
          }
          const daysInPrevMonth = new Date(backendYear, backendMonth + 1, 0).getDate();
          backendDay = daysInPrevMonth;
        }
      }

      const backendTime = new Date(backendYear, backendMonth, backendDay, backendHours, minutes, seconds);
      return format(backendTime, "yyyy-MM-dd'T'HH:mm:ss");

    } catch (error) {
      console.error('❌ Error converting Puerto Rico time to backend:', error);
      return format(prTime, "yyyy-MM-dd'T'HH:mm:ss");
    }
  }


  private static isDaylightSavingTime(date: Date): boolean {
    try {
      const year = date.getFullYear();
      
      
      const march = new Date(year, 2, 1);
      const firstSundayMarch = new Date(year, 2, 1 + (7 - march.getDay()) % 7);
      const secondSundayMarch = new Date(firstSundayMarch.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const november = new Date(year, 10, 1);
      const firstSundayNovember = new Date(year, 10, 1 + (7 - november.getDay()) % 7);
      

      return date >= secondSundayMarch && date < firstSundayNovember;
      
    } catch (error) {
      console.error('Error checking DST:', error);
      return false;
    }
  }

  static formatTimeForUser(backendTime: string, formatPattern: string = 'h:mm a'): string {
    if (!backendTime) return '';
    
    try {
      const prTime = this.convertBackendTimeToLocal(backendTime);
      return format(prTime, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting time for Puerto Rico:', error);
      return 'Invalid time';
    }
  }


  static formatDateForUser(backendTime: string, formatPattern: string = 'yyyy-MM-dd'): string {
    if (!backendTime) return '';
    
    try {
      const prTime = this.convertBackendTimeToLocal(backendTime);
      return format(prTime, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting date for Puerto Rico:', error);
      return 'Invalid date';
    }
  }


  static convertTimeSlotToLocal(timeSlot: TimeSlot): TimeSlot & { displayText: string } {
    try {
      const startTimePR = this.convertBackendTimeToLocal(timeSlot.startTime);
      const endTimePR = this.convertBackendTimeToLocal(timeSlot.endTime);

      const startFormatted = format(startTimePR, 'h:mm a');
      const endFormatted = format(endTimePR, 'h:mm a');
      
      const displayText = `${startFormatted} - ${endFormatted}`;

      return {
        ...timeSlot,
        displayText: displayText
      };

    } catch (error) {
      console.error('❌ Error converting time slot to Puerto Rico time:', error);
      return {
        ...timeSlot,
        displayText: timeSlot.displayText || 'Invalid time'
      };
    }
  }


  static getUserTimezoneDisplay(): string {
    return 'Atlantic Standard Time (AST)';
  }


  static shouldShowTimezoneWarning(): boolean {
    return false;
  }


  static formatDateForApi(prDate: Date): string {
    try {
      return this.convertLocalTimeToBackend(prDate);
    } catch (error) {
      console.error('❌ Error formatting Puerto Rico date for API:', error);
      return format(prDate, "yyyy-MM-dd'T'HH:mm:ss");
    }
  }


  static parseDateTime(dateTimeString: string): Date {
    return this.convertBackendTimeToLocal(dateTimeString);
  }


  static toDisplayDate(date: Date, formatPattern: string = 'yyyy-MM-dd'): string {
    try {
      return format(date, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting display date:', error);
      return 'Invalid date';
    }
  }


  static toDisplayTime(date: Date, formatPattern: string = 'h:mm a'): string {
    try {
      return format(date, formatPattern);
    } catch (error) {
      console.error('❌ Error formatting display time:', error);
      return 'Invalid time';
    }
  }


  static getCurrentPuertoRicoTime(): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const prTime = new Date(utc + (-4 * 3600000)); // UTC-4 for AST
    return prTime;
  }

  static isToday(date: Date): boolean {
    try {
      const today = this.getCurrentPuertoRicoTime();
      const checkDate = new Date(date);
      
      return today.getFullYear() === checkDate.getFullYear() &&
             today.getMonth() === checkDate.getMonth() &&
             today.getDate() === checkDate.getDate();
    } catch (error) {
      console.error('❌ Error checking if date is today:', error);
      return false;
    }
  }

}