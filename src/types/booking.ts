export interface Booking {
  id: string;
  closingDate: string;
  closingLocation: string;
  propertyAddress: string;
  borrower: string;
  loanCloser: string;
  loanOfficer: string;
  lender: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}