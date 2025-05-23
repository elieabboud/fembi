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
      priority: 2
    },
    { 
      id: 'serviceLocation',
      label: 'Closing Location',
      format: (value, row) => {
        if (!value || !value.displayName) return '-';
        return value.displayName;
      },
      priority: 3
    },
    { 
      id: 'loanData',
      // customer
      label: 'Borrower',
      format: (value, row) => {
        if (!value) return row.customerName || '-';
        return `${value.borrowerFirstName || ''} ${value.borrowerLastName || ''}`.trim() || row.customerName || '-';
      },
      priority: 4
    },
    { 
      id: 'loanData',
      // todo Loan CLoser
      label: 'Loan Closer',
      format: (value, row) => {
        if (!value || !value.loanOfficer) return '-';
        return value.loanOfficer;
      },
      priority: 5
    },
    { 
      id: 'loanData',
      // loan officer
      label: 'Loan Officer',
      format: (value, row) => {
        if (!value || !value.loanOfficer) return '-';
        return value.loanOfficer;
      },
      priority: 6
    },
    { 
      id: 'loanData',
      // todo dpa program does not exist in the data
      label: 'DPA Program',
      format: (value, row) => {
        if (!value || !value.loanType) return '-';
        return value.loanType;
      },
      priority: 7
    },
    { 
      id: 'status',
      label: 'Status',
      format: (value: BookingStatus | undefined) => {
        if (!value) return '-';
      },
      priority: 8
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
      
      if (id === 'loanData' && col.label === 'Borrower') {
        if (row.loanData) {
          value = `${row.loanData.borrowerFirstName || ''} ${row.loanData.borrowerLastName || ''}`.trim();
        } else {
          value = row.customerName;
        }
      } else if (id === 'loanData' && col.label === 'Loan Closer') {
        value = row.loanData?.loanOfficer;
      } else if (id === 'loanData' && col.label === 'Loan Officer') {
        value = row.loanData?.loanOfficer;
      } else if (id === 'loanData' && col.label === 'DPA Program') {
        value = row.loanData?.loanType;
      } else if (id === 'start' && col.label === 'Closing Date') {
        if (row.start?.dateTime) {
          // Use timezone conversion for Excel export
          value = TimezoneService.formatDateForUser(row.start.dateTime, 'MMMM d, yyyy');
        }
      } else if (id === 'start' && col.label === 'Closing Time') {
        if (row.start?.dateTime) {
          // Use timezone conversion for Excel export
          value = TimezoneService.formatTimeForUser(row.start.dateTime, 'h:mm a');
        }
      } else if (id === 'serviceLocation') {
        value = row.serviceLocation?.displayName;
      } else if (id === 'status') {
        if (row.status) {
          value = row.status.charAt(0).toUpperCase() + row.status.slice(1);
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