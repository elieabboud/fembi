import { calendarBooking } from "../types/calendarBooking";
import { CreateAppointmentRequest } from "../types/CreateAppointmentRequest";

// Add this function to your component
export const mapCalendarBookingToFormData = (calendarBooking: calendarBooking): CreateAppointmentRequest => {
  // Extract customer info from the first customer if available
  const primaryCustomer = calendarBooking.customers && calendarBooking.customers.length > 0 
    ? calendarBooking.customers[0] 
    : null;

  // Extract date and time from start DateTimeInfo
  let selectedDate = "";
  let selectedTime = "";
  if (calendarBooking.start && calendarBooking.start.dateTime) {
    const startDate = new Date(calendarBooking.start.dateTime);
    selectedDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    selectedTime = startDate.toISOString().substr(11, 5); // HH:mm
  }

  return {   
    // Service information
    ServiceId: calendarBooking.serviceId || "",
    ServiceName: calendarBooking.serviceName || "",
    ServicePrice: calendarBooking.price || 0,
    
    // Encompass loan info
    EncompassDetails: {
      EncompassLoanId: calendarBooking.encompassLoanId || "",
    },
    
    // Borrower information from customer data
    BorrowerInformation: {
      FirstName: primaryCustomer?.name.split(' ')[0] || "",
      LastName: primaryCustomer?.name.split(' ').slice(1).join(' ') || "",
      Email: primaryCustomer?.emailAddress || calendarBooking.customerEmailAddress || "",
      PhoneNumber: primaryCustomer?.phone || calendarBooking.customerPhone || "",
      Address: {
        Street: primaryCustomer?.location?.address?.street || "",
        City: primaryCustomer?.location?.address?.city || "",
        State: primaryCustomer?.location?.address?.state || "",
        ZipCode: primaryCustomer?.location?.address?.postalCode || "",
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