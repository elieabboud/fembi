export interface Booking {
  id: string;
  date: string; 
  time: string;  
  location: string;  
  borrower: string;
  loanCloser: string;
  loanOfficer: string;
  dpaProgram: string;
  status: 'Scheduled' | 'Completed';
}