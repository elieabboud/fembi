export interface Contact {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    company: string;
    role: string;
    status: 'Active' | 'Pending' | 'Banned' | 'Rejected';
  }