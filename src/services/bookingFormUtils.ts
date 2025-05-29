import { calendarBooking } from "../types/calendarBooking";
import { CreateAppointmentRequest } from "../types/CreateAppointmentRequest";
import { TimezoneService } from "./timezoneUtils";
import { parseISO, format } from "date-fns";

// 🔥 FIXED: Updated function to handle timezone conversion properly
export const mapCalendarBookingToFormData = (calendarBooking: calendarBooking): CreateAppointmentRequest => {
  
  // Convert backend times to user's local timezone for form display
  let selectedDate = "";
  let selectedTime = "";
  
  if (calendarBooking.start && calendarBooking.start.dateTime) {
    try {
      
      // Use TimezoneService to format date and time in user's timezone for form display
      selectedDate = TimezoneService.formatDateForUser(calendarBooking.start.dateTime, 'yyyy-MM-dd');
      selectedTime = TimezoneService.formatTimeForUser(calendarBooking.start.dateTime, 'HH:mm');
    
    } catch (error) {
      console.error('❌ Error converting times for form:', error);
      // Fallback to current date/time
      const now = new Date();
      selectedDate = format(now, 'yyyy-MM-dd');
      selectedTime = format(now, 'HH:mm');
    }
  }

  const formData: CreateAppointmentRequest = {   
    // Service information
    ServiceId: calendarBooking.serviceId || "",
    ServiceName: calendarBooking.serviceName || "",
    ServicePrice: calendarBooking.price || 0,
    
    // Encompass loan info
    EncompassDetails: {
      EncompassLoanId: calendarBooking.encompassLoanId || "",
      LoanCloser: calendarBooking.LoanCloser || "",
      LoanOfficer: calendarBooking.LoanOfficer || "",
      dpa: calendarBooking.dpa || ""
    },
    
    // Borrower information from customer data
    BorrowerInformation: {
      FirstName: calendarBooking.customerName?.split(' ')[0] || "",
      LastName: calendarBooking.customerName?.split(' ').slice(1).join(' ') || "",
      Email: calendarBooking.customerEmailAddress || "",
      PhoneNumber: calendarBooking.customerPhone || "",
      Address: {
        Street: calendarBooking.serviceLocation?.address?.street || "",
        City: calendarBooking.serviceLocation?.address?.city || "",
        State: calendarBooking.serviceLocation?.address?.state || "",
        ZipCode: calendarBooking.serviceLocation?.address?.postalCode || "",
      },
    },
    
    // Date and time information (converted to user's timezone for form display)
    DateTimeInfo: {
      SelectedDate: selectedDate,
      SelectedTime: selectedTime,
      // Keep original backend times for API communication
      FromDate: calendarBooking.start?.dateTime || "",
      ToDate: calendarBooking.end?.dateTime || "",
    },
    
    // Additional booking details
    Followers: "", // This might not be available in calendarBooking
    Duration: "PT1H", // Default duration, adjust if you can calculate from start/end
    PreBuffer: calendarBooking.preBuffer || "PT0S",
    PostBuffer: calendarBooking.postBuffer || "PT30M",
    PriceType: calendarBooking.priceType || "notSet",
    StaffMemberIds: calendarBooking.staffMemberIds || [],
  };

  return formData;
};