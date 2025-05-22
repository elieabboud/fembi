import { calendarBooking } from '../types/calendarBooking';
import { toLocalISOString } from '../utils/general';
import { Column } from './exportToExcel';

export class EmailService {
  
  /**
   * Option 1: Create EML file (Best for Outlook/Thunderbird)
   * Opens directly in user's default email client
   */
  static createEMLFile(bookings: calendarBooking[], columns: Column[], recipientEmail?: string) {
    const subject = `Bookings Report - ${bookings.length} items (${new Date().toLocaleDateString()})`;
    const htmlBody = this.generateHTMLTable(bookings, columns);
    const textBody = this.generatePlainTextTable(bookings, columns);
    
    const emlContent = `To: ${recipientEmail || ''}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary123"

--boundary123
Content-Type: text/plain; charset=utf-8

${textBody}

--boundary123
Content-Type: text/html; charset=utf-8

${htmlBody}

--boundary123--`;

    // Create and download EML file
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings-report-${toLocalISOString(new Date()).split('T')[0]}.eml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Option 2: Open default email client with mailto (Limited by URL length)
   * Good for simple cases
   */
  static openDefaultEmailClient(bookings: calendarBooking[], columns: Column[], recipientEmail?: string) {
    const subject = `Bookings Report - ${bookings.length} items`;
    const body = this.generatePlainTextTable(bookings, columns);
    
    // URL encode the content
    const mailtoUrl = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Check URL length limit (most browsers limit to ~2000 characters)
    if (mailtoUrl.length > 2000) {
      alert('Too much data for email link. Please use the EML file option instead.');
      return false;
    }
    
    window.location.href = mailtoUrl;
    return true;
  }

  /**
   * Option 3: Copy formatted data to clipboard
   * User can paste into any email client
   */
  static async copyToClipboard(bookings: calendarBooking[], columns: Column[]) {
    const htmlTable = this.generateHTMLTable(bookings, columns);
    const plainText = this.generatePlainTextTable(bookings, columns);
    
    try {
      // Try to copy both HTML and plain text to clipboard
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlTable], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
      return true;
    } catch (error) {
      // Fallback to plain text only
      try {
        await navigator.clipboard.writeText(plainText);
        return true;
      } catch (fallbackError) {
        console.error('Failed to copy to clipboard:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Generate HTML table for email body
   */
  private static generateHTMLTable(bookings: calendarBooking[], columns: Column[]): string {
    const tableRows = bookings.map(booking => {
      const cells = columns.map(column => {
        let value = this.getCellValue(booking, column);
        return `<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${value}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const headerCells = columns.map(column => 
      `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">${column.label}</th>`
    ).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .header { margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Bookings Report</h2>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>Total Records: ${bookings.length}</p>
  </div>
  
  <table>
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div style="margin-top: 20px; font-size: 12px; color: #666;">
    <p>This report was generated from the FEMBI Bookings System.</p>
  </div>
</body>
</html>`;
  }

  /**
   * Generate plain text table for email body
   */
  private static generatePlainTextTable(bookings: calendarBooking[], columns: Column[]): string {
    const separator = '-'.repeat(80);
    const header = `BOOKINGS REPORT
Generated: ${new Date().toLocaleString()}
Total Records: ${bookings.length}

${separator}`;

    const tableData = bookings.map((booking, index) => {
      const bookingData = columns.map(column => {
        const value = this.getCellValue(booking, column);
        return `${column.label}: ${value}`;
      }).join('\n');
      
      return `Record ${index + 1}:
${bookingData}
${separator}`;
    }).join('\n\n');

    return `${header}\n\n${tableData}`;
  }

  /**
   * Extract cell value based on column configuration
   */
  private static getCellValue(booking: calendarBooking, column: Column): string {
    const id = column.id as string;
    let value: any;
    
    if (id === 'loanData' && column.label === 'Borrower') {
      if (booking.loanData) {
        value = `${booking.loanData.borrowerFirstName || ''} ${booking.loanData.borrowerLastName || ''}`.trim();
      } else {
        value = booking.customerName;
      }
    } else if (id === 'loanData' && column.label === 'Loan Closer') {
      value = booking.loanData?.loanOfficer;
    } else if (id === 'loanData' && column.label === 'Loan Officer') {
      value = booking.loanData?.loanOfficer;
    } else if (id === 'loanData' && column.label === 'DPA Program') {
      value = booking.loanData?.loanType;
    } else if (id === 'start' && column.label === 'Closing Date') {
      if (booking.start?.dateTime) {
        const date = new Date(booking.start.dateTime);
        value = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } else if (id === 'start' && column.label === 'Closing Time') {
      if (booking.start?.dateTime) {
        const date = new Date(booking.start.dateTime);
        value = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
    } else if (id === 'serviceLocation') {
      value = booking.serviceLocation?.displayName;
    } else if (id === 'status') {
      if (booking.status) {
        value = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
      }
    } else {
      value = booking[id as keyof calendarBooking];
    }
    
    return value || '-';
  }
}