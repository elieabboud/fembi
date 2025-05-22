import { calendarBooking } from "../types/calendarBooking";
import { CreateAppointmentRequest } from "../types/CreateAppointmentRequest";
import { toLocalISOString } from "../utils/general";

// Add this function to your component
export const mapCalendarBookingToFormData = (calendarBooking: calendarBooking): CreateAppointmentRequest => {
  // Extract date and time from start DateTimeInfo
  let selectedDate = "";
  let selectedTime = "";
  if (calendarBooking.start && calendarBooking.start.dateTime) {
    const startDate = new Date(calendarBooking.start.dateTime);
    selectedDate = toLocalISOString(startDate).split('T')[0]; // YYYY-MM-DD
    selectedTime = toLocalISOString(startDate).substr(11, 5); // HH:mm
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
    
    // Date and time information
    DateTimeInfo: {
      SelectedDate: selectedDate,
      SelectedTime: selectedTime,
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
};