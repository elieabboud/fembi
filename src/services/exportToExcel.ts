import React from 'react';
import { calendarBooking, DateTimeInfo, BookingStatus } from "../types/calendarBooking";
import * as XLSX from 'xlsx';
import { TimezoneService } from './timezoneUtils';

export interface Column<T = calendarBooking> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => React.ReactNode;
  hideOnMobile?: boolean;
  priority?: number;
  comparator?: (a: T, b: T) => number;
}

export const createBookingColumns = (): Column[] => {
  const columns: Column[] = [
    { 
      id: 'start',
      label: 'Closing Date',
      format: (value: DateTimeInfo | null | undefined, row) => {
        if (!value || !value.dateTime) return '-';
        // Convert backend time to user's timezone for display
        return TimezoneService.formatDateForUser(value.dateTime, 'MMMM d, yyyy');
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const dateA = a.start?.dateTime;
        const dateB = b.start?.dateTime;
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        return timeA - timeB;
      },
      priority: 1
    },
    { 
      id: 'start',
      label: 'Closing Time',
      format: (value: DateTimeInfo | null | undefined, row) => {
        if (!value || !value.dateTime) return '-';
        // Convert backend time to user's timezone for display
        return TimezoneService.formatTimeForUser(value.dateTime, 'h:mm a');
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const dateA = a.start?.dateTime;
        const dateB = b.start?.dateTime;
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        return timeA - timeB;
      },
      priority: 2
    },
    { 
      id: 'serviceName',
      label: 'Service Location',
      format: (value, row) => {
        if (!value || !row.serviceName) return '-';
        return row.serviceName;
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const serviceA = a.serviceName || '';
        const serviceB = b.serviceName || '';
        
        // Case-insensitive string comparison
        return serviceA.toLowerCase().localeCompare(serviceB.toLowerCase());
      },
      priority: 3
    },
    { 
      id: 'customerName',
      label: 'Borrower',
      format: (value, row) => {
        if (row?.loanData) {
          const fullName = `${row.loanData.borrowerFirstName || ''} ${row.loanData.borrowerLastName || ''}`.trim();
          return fullName || row.customerName || '-';
        }
        return value || '-';
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const borrowerA = a.loanData 
          ? `${a.loanData.borrowerFirstName || ''} ${a.loanData.borrowerLastName || ''}`.trim()
          : a.customerName || '';
        
        const borrowerB = b.loanData 
          ? `${b.loanData.borrowerFirstName || ''} ${b.loanData.borrowerLastName || ''}`.trim()
          : b.customerName || '';
        
        return borrowerA.toLowerCase().localeCompare(borrowerB.toLowerCase());
      },
      priority: 4
    },
    { 
      id: 'LoanCloser',
      label: 'Loan Closer',
      format: (value, row) => {
        return row?.loanData?.loanCloser || row?.LoanCloser || value || '-';
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const closerA = a.loanData?.loanCloser || a.LoanCloser || '';
        const closerB = b.loanData?.loanCloser || b.LoanCloser || '';
        
        return closerA.toLowerCase().localeCompare(closerB.toLowerCase());
      },
      priority: 5
    },
    { 
      id: 'LoanOfficer',
      label: 'Loan Officer',
      format: (value, row) => {
        return row?.loanData?.loanOfficer || row?.LoanOfficer || value || '-';
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const officerA = a.loanData?.loanOfficer || a.LoanOfficer || '';
        const officerB = b.loanData?.loanOfficer || b.LoanOfficer || '';
        
        return officerA.toLowerCase().localeCompare(officerB.toLowerCase());
      },
      priority: 6
    },
    { 
      id: 'LoanPurpose',
      label: 'Loan Purpose',
      format: (value, row) => {
        if (row?.loanData) {
          return row.loanData.loanPurpose || '-';
        }
        return value || '-';
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const purposeA = a.loanData?.loanPurpose || '';
        const purposeB = b.loanData?.loanPurpose || '';
        
        return purposeA.toLowerCase().localeCompare(purposeB.toLowerCase());
      },
      priority: 7
    },
    { 
      id: 'dpa',
      label: 'DPA Program',
      format: (value, row) => {
        return row?.loanData?.dpa || row?.loanData?.loanType || row?.dpa || value || '-';
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const dpaA = a.loanData?.dpa || a.loanData?.loanType || a.dpa || '';
        const dpaB = b.loanData?.dpa || b.loanData?.loanType || b.dpa || '';
        
        return dpaA.toLowerCase().localeCompare(dpaB.toLowerCase());
      },
      priority: 8
    },
    { 
      id: 'status',
      label: 'Status',
      format: (value: BookingStatus | undefined) => {
        if (!value) return '-';
        
        switch (value) {
          case 'upcoming': return 'Upcoming';
          case 'inProgress': return 'In Progress';
          case 'completed': return 'Completed';
          case 'canceled': return 'Canceled';
          default: return value;
        }
      },
      comparator: (a: calendarBooking, b: calendarBooking) => {
        const statusA = a.status || '';
        const statusB = b.status || '';
        
        const statusOrder: Record<string, number> = {
          'inProgress': 1,
          'upcoming': 2,
          'completed': 3,
          'canceled': 4,
          '': 5
        };
        
        const priorityA = statusOrder[statusA] || 5;
        const priorityB = statusOrder[statusB] || 5;
        
        return priorityA - priorityB;
      },
      priority: 9
    }
  ];

  return columns;
};

export const exportBookingsToExcel = (
  bookings: calendarBooking[],
  columns: Column[],
  filename: string = 'bookings_export.xlsx'
): void => {
  const header = columns.map(col => col.label);
  
  const dataRows = bookings.map(row =>
    columns.map(col => {
      const id = col.id as string;
      let value;
      
      if (id === 'customerName' && col.label === 'Borrower') {
        if (row.loanData) {
          const fullName = `${row.loanData.borrowerFirstName || ''} ${row.loanData.borrowerLastName || ''}`.trim();
          value = fullName || row.customerName || '';
        } else {
          value = row.customerName || '';
        }
        
      }
      else if (id === 'LoanPurpose' && col.label === 'Loan Purpose') {
        value = row.loanData?.loanPurpose;
      }
      else if (id === 'LoanCloser' && col.label === 'Loan Closer') {
        value = row.loanData?.loanCloser || row.LoanCloser;
      } else if (id === 'LoanOfficer' && col.label === 'Loan Officer') {
        value = row.loanData?.loanOfficer || row.LoanOfficer;
      } else if (id === 'dpa' && col.label === 'DPA Program') {
        value = row.loanData?.dpa || row.loanData?.loanType || row.dpa;
      } else if (id === 'start' && col.label === 'Closing Date') {
        if (row.start?.dateTime) {
          value = TimezoneService.formatDateForUser(row.start.dateTime, 'MMMM d, yyyy');
        }
      } else if (id === 'start' && col.label === 'Closing Time') {
        if (row.start?.dateTime) {
          value = TimezoneService.formatTimeForUser(row.start.dateTime, 'h:mm a');
        }
      } else if (id === 'serviceName' && col.label === 'Service Location') {
        value = row.serviceName;
      } else if (id === 'status') {
        if (row.status) {
          switch (row.status) {
            case 'upcoming': value = 'Upcoming'; break;
            case 'inProgress': value = 'In Progress'; break;
            case 'completed': value = 'Completed'; break;
            case 'canceled': value = 'Canceled'; break;
            // default: value = row.status.charAt(0).toUpperCase() + row.status.slice(1);
          }
        }
      } else {
        value = row[id as keyof calendarBooking];
      }
      
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      } else if (typeof value === 'object' && value !== null) {
        try {
          return JSON.stringify(value);
        } catch (e) {
          return '[Complex Object]';
        }
      }
      
      return value;
    })
  );
  
  const sheetData = [header, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

  XLSX.writeFile(wb, filename);
};