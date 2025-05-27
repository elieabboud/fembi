import api from './api';

export interface AvailabilitySettings {
  minimumLeadTime: string; // Format: "20:00:00" (HH:mm:ss)
  maximumAdvance: string;  // Format: "10.00:00:00" (DD.HH:mm:ss)
}

export interface AvailabilityResponse {
  minimumLeadTime: string;
  maximumAdvance: string;
}

export interface DateRange {
  minDate: Date;
  maxDate: Date;
  minDateTime: Date;
  maxDateTime: Date;
}

export class AvailabilityService {
  
  /**
   * Fetch availability settings from API with optional serviceId
   */
  static async getAvailability(serviceId?: string): Promise<AvailabilitySettings> {
    try {
      console.log('📅 Fetching availability settings...', serviceId ? `for serviceId: ${serviceId}` : '');
      
      const params = serviceId ? { serviceId } : {};
      const response = await api.get('/api/Application/v1/GetAvailability', { params });
      
      console.log('📅 Availability settings received:', response.data);
      
      return {
        minimumLeadTime: response.data.minimumLeadTime || "00:00:00",
        maximumAdvance: response.data.maximumAdvance || "365.00:00:00"
      };
    } catch (error) {
      console.error('❌ Error fetching availability settings:', error);
      
      // Return default values if API fails
      return {
        minimumLeadTime: "00:00:00",
        maximumAdvance: "365.00:00:00"
      };
    }
  }

  /**
   * Parse time string in HH:mm:ss format to hours
   */
  static parseTimeToHours(timeString: string): number {
    try {
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      return hours + (minutes / 60) + (seconds / 3600);
    } catch (error) {
      console.error('❌ Error parsing time string:', timeString, error);
      return 0;
    }
  }

  /**
   * Parse advance time string in DD.HH:mm:ss format to hours
   */
  static parseAdvanceToHours(advanceString: string): number {
    try {
      // Handle format like "10.00:00:00" (DD.HH:mm:ss)
      const parts = advanceString.split('.');
      
      if (parts.length === 2) {
        const days = parseInt(parts[0]);
        const timePart = parts[1]; // "00:00:00"
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        
        return (days * 24) + hours + (minutes / 60) + (seconds / 3600);
      } else {
        // Fallback: treat as regular time format
        return this.parseTimeToHours(advanceString);
      }
    } catch (error) {
      console.error('❌ Error parsing advance string:', advanceString, error);
      return 365 * 24; // Default to 365 days
    }
  }

  /**
   * Calculate the available date range based on availability settings
   */
  static calculateDateRange(settings: AvailabilitySettings): DateRange {
    const now = new Date();
    
    console.log('📅 Calculating date range from:', {
      now: now.toISOString(),
      minimumLeadTime: settings.minimumLeadTime,
      maximumAdvance: settings.maximumAdvance
    });

    // Calculate minimum lead time
    const leadTimeHours = this.parseTimeToHours(settings.minimumLeadTime);
    const minDateTime = new Date(now.getTime() + (leadTimeHours * 60 * 60 * 1000));
    
    // Calculate maximum advance time  
    const advanceHours = this.parseAdvanceToHours(settings.maximumAdvance);
    const maxDateTime = new Date(now.getTime() + (advanceHours * 60 * 60 * 1000));

    // Extract dates (set to start of day for date picker)
    const minDate = new Date(minDateTime.getFullYear(), minDateTime.getMonth(), minDateTime.getDate());
    const maxDate = new Date(maxDateTime.getFullYear(), maxDateTime.getMonth(), maxDateTime.getDate());

    const result = {
      minDate,
      maxDate,
      minDateTime,
      maxDateTime
    };

    console.log('📅 Calculated date range:', {
      leadTimeHours,
      advanceHours,
      minDate: minDate.toLocaleDateString(),
      maxDate: maxDate.toLocaleDateString(),
      minDateTime: minDateTime.toISOString(),
      maxDateTime: maxDateTime.toISOString()
    });

    return result;
  }

  /**
   * Check if a date should be disabled based on availability settings
   */
  static shouldDisableDate(date: Date, dateRange: DateRange): boolean {
    const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const isBeforeMin = dateToCheck < dateRange.minDate;
    const isAfterMax = dateToCheck > dateRange.maxDate;
    
    const shouldDisable = isBeforeMin || isAfterMax;
    
    console.log('📅 Date check:', {
      date: dateToCheck.toLocaleDateString(),
      minDate: dateRange.minDate.toLocaleDateString(),
      maxDate: dateRange.maxDate.toLocaleDateString(),
      isBeforeMin,
      isAfterMax,
      shouldDisable
    });
    
    return shouldDisable;
  }

  /**
   * Filter time slots based on availability settings
   */
  static filterTimeSlots<T extends { startTime: string; endTime: string }>(
    timeSlots: T[], 
    selectedDate: Date, 
    dateRange: DateRange
  ): T[] {
    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }

    console.log('🕐 Filtering time slots for date:', selectedDate.toLocaleDateString());
    console.log('🕐 Date range constraints:', {
      minDateTime: dateRange.minDateTime.toISOString(),
      maxDateTime: dateRange.maxDateTime.toISOString()
    });

    const filtered = timeSlots.filter(slot => {
      try {
        // Parse slot times as dates on the selected day
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);

        // Check if slot is within availability window
        const isStartValid = slotStart >= dateRange.minDateTime;
        const isEndValid = slotEnd <= dateRange.maxDateTime;
        const isValid = isStartValid && isEndValid;

        if (!isValid) {
          console.log('🕐 Filtering out slot:', {
            slot: `${slotStart.toLocaleTimeString()} - ${slotEnd.toLocaleTimeString()}`,
            reason: !isStartValid ? 'starts too early' : 'ends too late',
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            minAllowed: dateRange.minDateTime.toISOString(),
            maxAllowed: dateRange.maxDateTime.toISOString()
          });
        }

        return isValid;
      } catch (error) {
        console.error('❌ Error filtering time slot:', slot, error);
        return false;
      }
    });

    console.log(`🕐 Filtered ${timeSlots.length} slots to ${filtered.length} available slots`);
    
    return filtered;
  }

  /**
   * Check if time slot should be disabled (for display purposes)
   */
  static shouldDisableTimeSlot(
    slot: { startTime: string; endTime: string }, 
    selectedDate: Date, 
    dateRange: DateRange
  ): boolean {
    try {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);

      const isStartTooEarly = slotStart < dateRange.minDateTime;
      const isEndTooLate = slotEnd > dateRange.maxDateTime;
      
      return isStartTooEarly || isEndTooLate;
    } catch (error) {
      console.error('❌ Error checking time slot availability:', error);
      return true; // Disable on error
    }
  }
}