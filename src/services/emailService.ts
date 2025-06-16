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

  /**
   * Generate HTML table specifically optimized for email clients
   */
  private static generateHTMLTableForEmail(bookings: calendarBooking[], columns: Column[]): string {
    const userTimezone = TimezoneService.getUserTimezoneDisplay();
    
    // Generate table rows with inline styles
    const tableRows = bookings.map((booking, index) => {
      const rowBgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      
      const cells = columns.map(column => {
        let value = this.getCellValue(booking, column);
        
        // Special styling for status column
        if (column.label === 'Status') {
          let statusBadge = '';
          switch (value) {
            case 'Upcoming':
              statusBadge = `<span style="background-color: #d32f2f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${value}</span>`;
              break;
            case 'In Progress':
              statusBadge = `<span style="background-color: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${value}</span>`;
              break;
            case 'Completed':
              statusBadge = `<span style="background-color: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${value}</span>`;
              break;
            default:
              statusBadge = `<span style="background-color: #9e9e9e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${value}</span>`;
          }
          return `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-family: Arial, sans-serif;">${statusBadge}</td>`;
        }
        
        return `<td style="border: 1px solid #ddd; padding: 8px; font-family: Arial, sans-serif; font-size: 13px;">${value}</td>`;
      }).join('');
      
      return `<tr style="background-color: ${rowBgColor};">${cells}</tr>`;
    }).join('');

    // Generate header cells
    const headerCells = columns.map(column => 
      `<th style="border: 1px solid #ddd; padding: 10px 8px; background-color: #1976d2; color: white; font-weight: bold; font-size: 13px; font-family: Arial, sans-serif; text-align: left;">${column.label}</th>`
    ).join('');

    // Create email-optimized HTML
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bookings Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="800" style="background-color: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1976d2; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold; color: white;">📊 Bookings Report</h1>
              <p style="margin: 5px 0; font-size: 16px; color: white;">Generated on: ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              
              <!-- Stats -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
                <tr>
                  <td width="33%" style="text-align: center; color: white;">
                    <div style="font-size: 24px; font-weight: bold;">${bookings.length}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Total Records</div>
                  </td>
                  <td width="33%" style="text-align: center; color: white;">
                    <div style="font-size: 24px; font-weight: bold;">${bookings.filter(b => b.status === 'upcoming').length}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Upcoming</div>
                  </td>
                  <td width="33%" style="text-align: center; color: white;">
                    <div style="font-size: 24px; font-weight: bold;">${bookings.filter(b => b.status === 'completed').length}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Completed</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              
              <!-- Timezone Info -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #e3f2fd; border: 1px solid #1976d2; border-radius: 4px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #1976d2;">
                      <strong>🌍 Timezone Information:</strong><br>
                      All times are displayed in: <strong>${userTimezone}</strong><br>
                      <em>Times have been automatically converted from Eastern Time (EST/EDT)</em>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Data Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                  <tr>${headerCells}</tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #ddd;">
              <p style="margin: 5px 0; font-size: 14px; color: #666;">
                <strong>📅 Generated by FEMBi Bookings System</strong>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                All times automatically converted to your timezone: <strong>${userTimezone}</strong>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                For questions about this report, please contact your system administrator.
              </p>
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
    const separator = '='.repeat(80);
    const lineSeparator = '-'.repeat(80);
    
    const header = `
${separator}
📊 BOOKINGS REPORT
${separator}

📅 Generated: ${new Date().toLocaleString()}
📊 Total Records: ${bookings.length}
📍 Timezone: ${userTimezone} (converted from Eastern Time)

📈 Summary:
   • Upcoming: ${bookings.filter(b => b.status === 'upcoming').length}
   • In Progress: ${bookings.filter(b => b.status === 'inProgress').length}  
   • Completed: ${bookings.filter(b => b.status === 'completed').length}

${separator}`;

    const tableData = bookings.map((booking, index) => {
      const bookingData = columns.map(column => {
        const value = this.getCellValue(booking, column);
        return `${column.label}: ${value}`;
      }).join('\n   ');
      
      return `
📋 Record ${index + 1}:
   ${bookingData}
${lineSeparator}`;
    }).join('');

    const footer = `
${separator}
📧 Generated by FEMBi Bookings System
🌍 All times converted to your timezone: ${userTimezone}
📞 For support, contact your system administrator
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
          default: value = booking.status;
        }
      }
    } else {
      value = booking[id as keyof calendarBooking];
    }
    
    return value || '-';
  }
}