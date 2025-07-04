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
    const htmlBody = this.generateHTMLTableForEmail(bookings, columns);
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
    const subject = `Bookings Report - ${bookings.length} items (${new Date().toLocaleDateString()})`;
    const htmlBody = this.generateHTMLTableForEmail(bookings, columns);

    try {
      const emailRequest: EmailRequestDTO = {
        To: [recipientEmail || ''],
        Subject: subject,
        Body: htmlBody,
        IsHtml: true, // This ensures the HTML table is rendered properly
      };

      const response = await bookingService.sendEmail(emailRequest);

    } catch (error) {
      console.error('❌ Error sending email:', error);
      alert('Error sending email. Please check your connection and try again.');
    }
  }

  /**
   * Option 3: Copy formatted data to clipboard
   * User can paste into any email client
   */
  static async copyToClipboard(bookings: calendarBooking[], columns: Column[]) {
    const htmlTable = this.generateHTMLTableForEmail(bookings, columns);
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


 private static generateHTMLTableForEmail(bookings: calendarBooking[], columns: Column[]): string {
  const userTimezone = TimezoneService.getUserTimezoneDisplay();

  const tableRows = bookings.map((booking, index) => {
    const rowBgColor = index % 2 === 0 ? '#fafafa' : '#ffffff';
    const cells = columns.map(column => {
      let value = this.getCellValue(booking, column);
      if (column.label === 'Status') {
        const colorMap: any = {
          'Upcoming': '#e53935',
          'In Progress': '#fb8c00',
          'Completed': '#1e88e5',
          'Default': '#9e9e9e'
        };
        const bgColor = colorMap[value] || colorMap['Default'];
        return `<td style="border:1px solid #e0e0e0; padding:14px; text-align:center; font-size:14px;"><span style="background:${bgColor};color:white;padding:6px 14px;border-radius:20px;display:inline-block;min-width:90px;font-weight:600;">${value}</span></td>`;
      }
      return `<td style="border:1px solid #e0e0e0; padding:14px; font-size:14px; vertical-align:top;">${value}</td>`;
    }).join('');
    return `<tr style="background-color:${rowBgColor};">${cells}</tr>`;
  }).join('');

  const headerCells = columns.map(column => 
    `<th style="border:1px solid #e0e0e0; padding:16px; background:#1976d2; color:white; font-weight:600; font-size:15px; text-align:left;">${column.label}</th>`
  ).join('');
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f8;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin:0; background:#fff;">
            <tr>
              <td style="background-color: #1976d2; color:white; padding:30px; text-align:center;">
                <h1 style="margin:0; color:white;">📊 FNTIS Bookings Report</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px; background:#e3f2fd; border-bottom:1px solid #ddd;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="text-align:center; padding: 0 10px;">
                      <div style="font-size:28px; font-weight:bold; color:#1976d2;">${bookings.length}</div>
                      <div>Total Records</div>
                    </td>
                    <td align="center" style="text-align:center; padding: 0 10px;">
                      <div style="font-size:28px; font-weight:bold; color:#1976d2;">${bookings.filter(b => b.status === 'upcoming').length}</div>
                      <div>Upcoming</div>
                    </td>
                    <td align="center" style="text-align:center; padding: 0 10px;">
                      <div style="font-size:28px; font-weight:bold; color:#1976d2;">${bookings.filter(b => b.status === 'inProgress').length}</div>
                      <div>In Progress</div>
                    </td>
                    <td align="center" style="text-align:center; padding: 0 10px;">
                      <div style="font-size:28px; font-weight:bold; color:#1976d2;">${bookings.filter(b => b.status === 'completed').length}</div>
                      <div>Completed</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="width:100%;">
                <table style="width: 100%; border-collapse:collapse;" cellpadding="5" cellspacing="0" border="0">
                  <thead>
                    <tr>
                      ${headerCells}
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="text-align:center; padding:20px; color:#777; font-size:14px;">
                Report generated in timezone: ${userTimezone}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}



  /**
   * Generate plain text table for email body - Enhanced formatting
   */
  private static generatePlainTextTable(bookings: calendarBooking[], columns: Column[]): string {
    const userTimezone = TimezoneService.getUserTimezoneDisplay();
    const separator = '='.repeat(100);
    const lineSeparator = '-'.repeat(100);
    
    const header = `
${separator}
📊 FNTIS BOOKINGS REPORT - FULL PAGE VIEW
${separator}

📅 Generated: ${new Date().toLocaleString()}
📊 Total Records: ${bookings.length}
📍 Timezone: ${userTimezone} (converted from Eastern Time)

📈 Summary Statistics:
   • Upcoming Appointments: ${bookings.filter(b => b.status === 'upcoming').length}
   • In Progress: ${bookings.filter(b => b.status === 'inProgress').length}  
   • Completed: ${bookings.filter(b => b.status === 'completed').length}
   • Other Status: ${bookings.filter(b => !['upcoming', 'inProgress', 'completed'].includes(b.status || '')).length}

${separator}
DETAILED BOOKING RECORDS
${separator}`;

    const tableData = bookings.map((booking, index) => {
      const bookingData = columns.map(column => {
        const value = this.getCellValue(booking, column);
        return `${column.label}: ${value}`;
      }).join('\n   ');
      
      return `
📋 Record ${index + 1} of ${bookings.length}:
   ${bookingData}
${lineSeparator}`;
    }).join('');

    const footer = `
${separator}
📧 FNTIS BOOKING MANAGEMENT SYSTEM
${separator}
🌍 All times converted to your timezone: ${userTimezone}
📞 For support, contact your system administrator
🏢 First National Title & Insurance Services, Inc.
${separator}`;

    return `${header}${tableData}${footer}`;
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
    }else if (id === 'LoanPurpose' && column.label === 'Loan Purpose') {
      value = booking.loanData?.loanPurpose;
    }
    else if (id === 'LoanCloser' && column.label === 'Loan Closer') {
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
          default: value = booking.status;
        }
      }
    } else {
      value = booking[id as keyof calendarBooking];
    }
    
    return value || '-';
  }
}