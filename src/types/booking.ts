export interface Booking {
  id: string;
  date: string;           // closing date
  time: string;           // closing time
  location: string;       // property address
  borrower: string;
  loanCloser: string;
  loanOfficer: string;
  dpaProgram: string;
  status: 'Scheduled' | 'Completed';
}