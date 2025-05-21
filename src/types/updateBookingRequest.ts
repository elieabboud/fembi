export interface UpdateBookingRequest {
  id: string;
  selectedDate: string;
  selectedTime: string;
  fromDate: string;
  toDate: string;
  staffMemberIds: string[];
}