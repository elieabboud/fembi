// BookingBackend DTOs converted to TypeScript interfaces

import { LoanDetails } from "./loanDetails";

export type BookingStatus = 'upcoming' | 'inProgress' | 'completed' | 'canceled';

export interface DateTimeInfo {
  dateTime?: string;
  timeZone?: string;
}

export interface calendarBooking {
  encompassLoanId: string;
  ownerId: string;
  loanData: LoanDetails;
  bookingId: string;
  customerTimeZone: string;
  customerName: string;
  customerEmailAddress: string;
  customerPhone: string;
  customerNotes: string;
  smsNotificationsEnabled: boolean;
  isCustomerAllowedToManageBooking: boolean;
  isLocationOnline: boolean;
  optOutOfCustomerEmail: boolean;
  postBuffer: string; // "PT10M" format
  preBuffer: string; // "PT5M" format
  price: number;
  priceType: string; // "fixedPrice"
  reminders: BookingReminderRequest[];
  serviceId: string;
  serviceName: string;
  serviceNotes: string;
  staffMemberIds: string[];
  maximumAttendeesCount?: number;
  filledAttendeesCount?: number;
  customers: BookingCustomerInfoRequest[];
  start: DateTimeInfo;
  end: DateTimeInfo;
  serviceLocation: LocationRequest;
  status?: BookingStatus;
  color?: string;
}

export interface BookingReminderRequest {
  message: string;
  offset: string; // "P1D" or "PT1H" format
  recipients: string; // "allAttendees", "customer", "staff"
}

export interface BookingCustomerInfoRequest {
  customerId: string;
  name: string;
  emailAddress: string;
  phone: string;
  notes: string;
  location: LocationRequest;
  timeZone: string;
  customQuestionAnswers: BookingQuestionAnswerRequest[];
}

export interface LocationRequest {
  displayName: string;
  address: AddressRequest;
}

export interface AddressRequest {
  street: string;
  city: string;
  state: string;
  countryOrRegion: string;
  postalCode: string;
}

export interface BookingQuestionAnswerRequest {
  questionId: string;
  question: string;
  answerInputType: string;
  answerOptions: string[];
  isRequired: boolean;
  answer: string;
  selectedOptions: string[];
}