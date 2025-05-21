export interface CreateAppointmentRequest {
  ServiceId: string;
  ServiceName: string;
  ServicePrice: number;
  EncompassDetails: {
    EncompassLoanId: string;
  };
  BorrowerInformation: {
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber: string;
    Address: {
      Street: string;
      City: string;
      State: string;
      ZipCode: string;
    };
  };
  DateTimeInfo: {
    SelectedDate: string;  // ISO format
    SelectedTime: string;  // "HH:mm"
    FromDate: string;      // ISO format
    ToDate: string;        // ISO format
  };
  Followers: string;        // Comma-separated or single email
  Duration: string;         // ISO 8601 duration (e.g., "PT1H")
  PreBuffer: string;        // ISO 8601 duration
  PostBuffer: string;       // ISO 8601 duration
  PriceType: string;
  StaffMemberIds: string[];
}
