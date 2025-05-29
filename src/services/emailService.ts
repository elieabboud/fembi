import { calendarBooking } from '../types/calendarBooking';
import { EmailRequestDTO } from '../types/email';
import { toLocalISOString } from '../utils/general';
import { bookingService } from './bookingService';
import { Column } from './exportToExcel';
import { TimezoneService } from './timezoneUtils';

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

  static async sendEmailWithRecipient(bookings: calendarBooking[], columns: Column[], recipientEmail?: string){
    const subject = `Bookings Report - ${bookings.length} items`;
    const body = this.generatePlainTextTable(bookings, columns);

    try {
      const emailRequest: EmailRequestDTO = {
        To: [recipientEmail],
        Subject: subject,
        Body: body,
        IsHtml: false,
      };

      const response = await bookingService.sendEmail(emailRequest);

      if (response.Success) {
        alert('Email sent successfully!');
      }
    } catch (error) {
      console.error(error);
    }
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
    const userTimezone = TimezoneService.getUserTimezoneDisplay();
    
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
    .timezone-info { background-color: #e3f2fd; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Bookings Report</h2>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>Total Records: ${bookings.length}</p>
  </div>
  
  <div class="timezone-info">
    <strong>📍 Timezone Information:</strong><br>
    All times are displayed in: <strong>${userTimezone}</strong><br>
    <em>Times have been automatically converted from Eastern Time (EST/EDT)</em>
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
    <p>Times automatically converted to ${userTimezone}</p>
  </div>
</body>
</html>`;
  }

  /**
   * Generate plain text table for email body
   */
  private static generatePlainTextTable(bookings: calendarBooking[], columns: Column[]): string {
    const userTimezone = TimezoneService.getUserTimezoneDisplay();
    const separator = '-'.repeat(80);
    const header = `BOOKINGS REPORT
    Generated: ${new Date().toLocaleString()}
    Total Records: ${bookings.length}

    TIMEZONE INFORMATION:
    All times displayed in: ${userTimezone}
    (Automatically converted from Eastern Time)

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

    return `${header}\n\n${tableData}

Note: All times have been converted to your local timezone (${userTimezone}) from Eastern Time.`;
  }

  /**
   * Extract cell value based on column configuration
   */
  private static getCellValue(booking: calendarBooking, column: Column): string {
    const id = column.id as string;
    let value: any;
    
    if (id === 'customerName' && column.label === 'Borrower') {
      if (booking.loanData) {
        const fullName = `${booking.loanData.borrowerFirstName || ''} ${booking.loanData.borrowerLastName || ''}`.trim();
        value = fullName || booking.customerName;
      } else {
        value = booking.customerName;
      }
    } else if (id === 'LoanCloser' && column.label === 'Loan Closer') {
      value = booking.loanData?.loanCloser || booking.LoanCloser;
    } else if (id === 'LoanOfficer' && column.label === 'Loan Officer') {
      value = booking.loanData?.loanOfficer || booking.LoanOfficer;
    } else if (id === 'dpa' && column.label === 'DPA Program') {
      value = booking.loanData?.dpa || booking.loanData?.loanType || booking.dpa;
    } else if (id === 'start' && column.label === 'Closing Date') {
      if (booking.start?.dateTime) {
        value = TimezoneService.formatDateForUser(booking.start.dateTime, 'MMMM d, yyyy');
      }
    } else if (id === 'start' && column.label === 'Closing Time') {
      if (booking.start?.dateTime) {
        value = TimezoneService.formatTimeForUser(booking.start.dateTime, 'h:mm a');
      }
    } else if (id === 'serviceName' && column.label === 'Service Location') {
      value = booking.serviceName;
    } else if (id === 'status') {
      if (booking.status) {
        switch (booking.status) {
          case 'upcoming': value = 'Upcoming'; break;
          case 'inProgress': value = 'In Progress'; break;
          case 'completed': value = 'Completed'; break;
          case 'canceled': value = 'Canceled'; break;
          // default: value = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
        }
      }
    } else {
      value = booking[id as keyof calendarBooking];
    }
    
    return value || '-';
  }
}