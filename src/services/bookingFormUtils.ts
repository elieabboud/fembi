import { calendarBooking } from "../types/calendarBooking";
import { CreateAppointmentRequest } from "../types/CreateAppointmentRequest";
import { TimezoneService } from "./timezoneUtils";

// Updated function to handle timezone conversion
export const mapCalendarBookingToFormData = (calendarBooking: calendarBooking): CreateAppointmentRequest => {
  // Convert backend times to user's local timezone for form display
  let selectedDate = "";
  let selectedTime = "";
  if (calendarBooking.start && calendarBooking.start.dateTime) {
    const userStartDate = TimezoneService.convertBackendTimeToLocal(calendarBooking.start.dateTime);
    selectedDate = userStartDate.toISOString().split('T')[0]; // YYYY-MM-DD in user's timezone
    selectedTime = userStartDate.toTimeString().substr(0, 5); // HH:mm in user's timezone
  }

  return {   
    // Service information
    ServiceId: calendarBooking.serviceId || "",
    ServiceName: calendarBooking.serviceName || "",
    ServicePrice: calendarBooking.price || 0,
    
    // Encompass loan info
    EncompassDetails: {
      EncompassLoanId: calendarBooking.encompassLoanId || "",
      LoanCloser: calendarBooking.LoanCloser ||  "",
      LoanOfficer: calendarBooking.LoanOfficer ||  "",
      dpa: calendarBooking.dpa ||  ""
    },
    
    // Borrower information from customer data
    BorrowerInformation: {
      FirstName: calendarBooking.customerName.split(' ')[0] || "",
      LastName: calendarBooking.customerName.split(' ').slice(1).join(' ') || "",
      Email: calendarBooking.customerEmailAddress || "",
      PhoneNumber: calendarBooking.customerPhone || "",
      Address: {
        Street: calendarBooking.serviceLocation?.address?.street || "",
        City: calendarBooking.serviceLocation?.address?.city || "",
        State: calendarBooking.serviceLocation?.address?.state || "",
        ZipCode: calendarBooking.serviceLocation?.address?.postalCode || "",
      },
    },
    
    // Date and time information (in user's timezone for form display)
    DateTimeInfo: {
      SelectedDate: selectedDate,
      SelectedTime: selectedTime,
      FromDate: calendarBooking.start?.dateTime || "", // Keep original backend time for API
      ToDate: calendarBooking.end?.dateTime || "", // Keep original backend time for API
    },
    
    // Additional booking details
    Followers: "", // This might not be available in calendarBooking
    Duration: "PT1H", // Default duration, adjust if you can calculate from start/end
    PreBuffer: calendarBooking.preBuffer || "PT0S",
    PostBuffer: calendarBooking.postBuffer || "PT30M",
    PriceType: calendarBooking.priceType || "notSet",
    StaffMemberIds: calendarBooking.staffMemberIds || [],
  };
};