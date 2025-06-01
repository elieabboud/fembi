export interface LoanDetails {
    loanId: string;
    borrowerFirstName: string;
    borrowerLastName: string;
    borrowerEmail: string;
    borrowerPhone: string;
    borrowerAddress: string;
    borrowerCity: string;
    borrowerState: string;
    borrowerZipCode: string;
    loanNumber: string;
    loanType: string;
    loanAmount: number;
    loanOfficer: string;
    loanOfficerEmail?: string;
    notes: string;
    loanCloser: string;
    loanCloserEmail?: string;
    dpa: string;
    followers: string[];
  }
  