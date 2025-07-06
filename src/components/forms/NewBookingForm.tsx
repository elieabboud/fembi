import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import {
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Box,
  CircularProgress,
  Backdrop,
  LinearProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TimeSelector from './TimeSelector';
import Followers from './Followers';
import { CreateAppointmentRequest } from '../../types/CreateAppointmentRequest';
import { bookingService } from '../../services/bookingService';
import { LoanDetails } from '../../../src/types/loanDetails';
import { BookingService, TimeSlot } from '../../types/service';
import { useAuth } from '../../context/AuthContext';
import { calendarBooking } from '../../types/calendarBooking';
import { mapCalendarBookingToFormData } from '../../services/bookingFormUtils';
import { toLocalISOString } from '../../utils/general';
import { TimezoneService } from '../../services/timezoneUtils';
import { EmailRequestDTO, FileRequestDTO } from '../../types/email';
import { AvailabilityService, AvailabilitySettings, DateRange } from '../../services/availabilityService';
import EnhancedFollowers from './EnhancedFollowers';
import { ICSGeneratorService } from '../../services/icsGeneratorService';
import AdminOverride from './AdminOverride';

type BookingFormProps = {
  onClose: () => void;
  onSuccess?: (bookingData: CreateAppointmentRequest, response: any) => void;
  initialData?: calendarBooking;
  isEditMode?: boolean;
  isViewMode?: boolean;
  setLoading?: (loading: boolean) => void;
}

interface FollowerWithType {
  email: string;
  type: string;
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreateBookingForm: React.FC<BookingFormProps> = ({ 
  onClose, 
  onSuccess, 
  initialData, 
  isEditMode = false,
  isViewMode = false,
  setLoading 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAdmin, user } = useAuth();
  
  // Loading states for different operations
  const [loadingStates, setLoadingStates] = useState({
    loanDetails: false,
    services: false,
    timeSlots: false,
    followers: false,
    submitting: false,
    initializing: false,
    sendingEmail: false
  });
  
  // NEW: Availability constraint states
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  // NEW: Admin Override states
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [overrideSlot, setOverrideSlot] = useState<TimeSlot | null>(null);
  
  const [services, setServices] = useState<BookingService[]>([]);
  const [fetchedFollowers, setFetchedFollowers] = useState<string[]>([]);
  const [addedFollowers, setAddedFollowers] = useState<string[]>([]);
  const [combinedFollowers, setCombinedFollowers] = useState<string[]>([]);
  const [showLoanDetails, setShowLoanDetails] = useState<boolean>(false);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>();
  const [selectedService, setSelectedService] = useState<BookingService>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState<string>("");

  const [loanDetailsFollowers, setLoanDetailsFollowers] = useState<FollowerWithType[]>([]);
  const [selectedLoanFollowers, setSelectedLoanFollowers] = useState<FollowerWithType[]>([]);
  const [notes, setNotes] = useState<string>('');
  
  // NEW: State to track if loan details have been loaded and validated
  const [isLoanDetailsValidated, setIsLoanDetailsValidated] = useState<boolean>(false);

  const [initialSelectedDate, setInitialSelectedDate] = useState<Date | null>(null);
  
  const [bookingData, setBookingData] = useState<CreateAppointmentRequest>(
  {
    ServiceId: "",
    ServiceName: "",
    ServicePrice: 0,
    EncompassDetails: {
      EncompassLoanId: "",
      LoanCloser: "",
      loanCloserEmail: "",
      LoanOfficer: "",
      loanOfficerEmail: "",
      dpa: ""
    },
    BorrowerInformation: {
      FirstName: "",
      LastName: "",
      Email: "",
      PhoneNumber: "",
      Address: {
        Street: "",
        City: "",
        State: "",
        ZipCode: "",
      },
    },
    DateTimeInfo: {
      SelectedDate: "",
      SelectedTime: "",
      FromDate: "",
      ToDate: "",
    },
    Followers: "",
    Duration: "PT1H",
    PreBuffer: "PT0S",
    PostBuffer: "PT30M",
    PriceType: "notSet",
    StaffMemberIds: [],
    LoanDetails: {
      notes: "",
      loanType: "",
      loanPurpose: ""
    }
  });

  const editMode = isEditMode || !!initialData;
  const readOnlyMode = isViewMode;

  // Helper function to update loading states
  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // NEW: Admin Override Handlers
  const handleOverrideSlot = useCallback((slot: TimeSlot) => {
    console.log('🔧 Admin override slot created:', slot);
    setOverrideSlot(slot);
    setSelectedSlot(slot);
    setIsOverrideMode(true);
    
    // Clear regular time slots since we're using override
    setTimeSlots([]);
  }, []);

  const handleCancelOverride = useCallback(() => {
    console.log('❌ Admin override cancelled');
    setIsOverrideMode(false);
    setOverrideSlot(null);
    setSelectedSlot(null);
    
    // Refetch regular time slots if we have a date and service
    if (selectedDate && bookingData.ServiceId && !readOnlyMode) {
      fetchAvailableTimeSlots();
    }
  }, [selectedDate, bookingData.ServiceId, readOnlyMode]);

const parseFollowersWithTypes = (followers: string[]): FollowerWithType[] => {
  return followers.map(follower => {
    if (follower.includes('#')) {
      const [type, email] = follower.split('#');
      
      let groupedType = type;
      const lowerType = type.toLowerCase();
      if (/^seller\d*$/.test(lowerType)) {
            groupedType = 'SELLER';
      } 
      return { type: groupedType, email };
    }
    return { type: 'Other', email: follower };
  });
};

  // Check if any loading is in progress
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  // Get the title based on mode
  const getFormTitle = () => {
    if (isViewMode) return 'View Appointment';
    if (editMode) return 'Edit Booking';
    return 'Schedule a New Booking';
  };

  // NEW: Function to format loan amount with commas
  const formatLoanAmount = (amount: number | undefined): string => {
    if (!amount) return '';
    return amount.toLocaleString();
  };

  // NEW: Fetch availability settings when service is selected
  const fetchAvailabilitySettings = useCallback(async (serviceId?: string) => {
    if (editMode || readOnlyMode || isOverrideMode) return; // Skip for edit mode and override mode
    
    setIsLoadingAvailability(true);
    try {
      
      const settings = await bookingService.getAvailability(serviceId);
      setAvailabilitySettings(settings);
      
      const calculatedRange = AvailabilityService.calculateDateRange(settings);
      setDateRange(calculatedRange);
      
      // 🔥 NEW: Auto-select the first available date
      if (calculatedRange.minDate) {
        setSelectedDate(calculatedRange.minDate);
      }
      
    } catch (error) {
      console.error('❌ Error fetching availability settings:', error);
      setAvailabilitySettings(null);
      setDateRange(null);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [editMode, readOnlyMode, isOverrideMode]);

  const handleLoanIdChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    if (readOnlyMode) return;
    
    const loanId = event.target.value;
    setBookingData((prev) => ({
      ...prev,
      EncompassDetails: {
        ...prev.EncompassDetails,
        EncompassLoanId: loanId,
      },
    }));
    
    if (!editMode) {
      setIsLoanDetailsValidated(false);
      setShowLoanDetails(false);
    }
  };

  // UPDATED: Handle service change with availability fetching
  const handleServiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (readOnlyMode) return;
    
    const selectedValue = event.target.value as string;
    const selectedService = services.find(s => s.displayName === selectedValue);
    if (selectedService) {
      setSelectedService(selectedService);
      setBookingData(prev => ({
        ...prev,
        ServiceName: selectedService.displayName,
        ServiceId: selectedService.id,
        ServicePrice: selectedService.defaultPrice,
      }));

      // NEW: Fetch availability settings when service is selected (but not in override mode)
      if (!editMode && !readOnlyMode && !isOverrideMode) {
        fetchAvailabilitySettings(selectedService.id);
      }
    }
  };

  const sendEmailNotifications = async (response: any) => {
  if (readOnlyMode) return;

  updateLoadingState('sendingEmail', true);
  
  try {
    const currentUserEmail = user?.email || '';

    const globalFollowers = await bookingService.getGlobalFollowers();
    
    const recipientEmails: string[] = [];
    const ccEmails: string[] = [...globalFollowers];
    const mainRecipientEmail : string[] = [];
    
    if (currentUserEmail) {
      recipientEmails.push(currentUserEmail);
      recipientEmails.push(loanDetails.loanCloserEmail);
      recipientEmails.push(loanDetails.loanOfficerEmail);
      recipientEmails.push(bookingData.BorrowerInformation.Email);
    }
    
    if (bookingData.Followers) {
      const followerEmails = bookingData.Followers
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0 && email.includes('@'));
      recipientEmails.push(...followerEmails);
    }
    
    const uniqueEmails = Array.from(new Set(recipientEmails));
    
    if (uniqueEmails.length === 0) {
      return;
    }
    
    const appointmentDate = new Date(bookingData.DateTimeInfo.SelectedDate).toLocaleDateString();
    const appointmentTime = bookingData.DateTimeInfo.SelectedTime;
    const formattedTime = new Date(`2000-01-01T${appointmentTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const borrowerName = `${bookingData.BorrowerInformation.FirstName} ${bookingData.BorrowerInformation.LastName}`.trim();

    // 🔥 NEW: Different titles based on operation type
    let title: string;
    let headerTitle: string;
    let actionText: string;
    
    if (editMode) {
      title = "Appointment Rescheduled";
      headerTitle = "📅 Appointment Rescheduled";
      actionText = "has been rescheduled successfully";
    } else {
      title = "New Appointment Scheduled";
      headerTitle = "📊 New Appointment Scheduled";
      actionText = "has been scheduled successfully";
    }
    
    // Add admin override notice if applicable
    const overrideNotice = isOverrideMode ? 
      `<div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #856404;">⚠️ Admin Override Notice</h4>
        <p style="margin: 0;">This appointment was created using admin override privileges, bypassing standard booking rules and availability constraints.</p>
      </div>` : '';
    
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">
              ${headerTitle}
            </h2>

           

            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <p><strong>Greetings,</strong></p>
              <p>
                We are pleased to confirm your ${editMode ? 'rescheduled' : 'upcoming'} closing appointment with <strong>FEMBi Mortgage</strong>.
                This email serves as your official appointment ${editMode ? 'reschedule' : ''} confirmation.
              </p>
              <p>
                Should you have any questions or require further assistance, please do not hesitate to contact your 
                <strong>FEMBi Mortgage Loan Officer</strong>. We are here to support you throughout this process.
              </p>
              <p>
                Thank you for choosing <strong>FEMBi Mortgage</strong>. We look forward to assisting you at your closing.
              </p>

              <hr style="margin: 30px 0;">

              <p><strong>Saludos,</strong></p>
              <p>
                Nos complace confirmar su cita ${editMode ? 'reagendada' : 'próxima'} para el cierre con <strong>FEMBi Mortgage</strong>.
                Este correo electrónico constituye la confirmación oficial de su cita ${editMode ? 'reagendada' : ''}.
              </p>
              <p>
                Si tiene alguna pregunta o necesita asistencia adicional, no dude en comunicarse con su 
                <strong>Oficial de Préstamos de FEMBi Mortgage</strong>. Estamos a su disposición para asistirle durante este proceso.
              </p>
              <p>
                Gracias por confiar en <strong>FEMBi Mortgage</strong>. Esperamos poder asistirle en su cierre.
              </p>
            </div>

            <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">Appointment Details</h3>
              <p><strong>Location:</strong> ${bookingData.ServiceName}</p>
              <p><strong>Settlement Agent:</strong> First National Title Services, Inc.</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Loan ID:</strong> ${loanDetails.loanNumber}</p>
            </div>
            
            <div style="background-color: #e9ecef; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #007bff;">Borrower Information</h3>
              <p><strong>Name:</strong> ${borrowerName}</p>
              <p><strong>Address:</strong> ${bookingData.BorrowerInformation.Address.Street}, ${bookingData.BorrowerInformation.Address.City}, ${bookingData.BorrowerInformation.Address.State} ${bookingData.BorrowerInformation.Address.ZipCode}</p>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">Loan Information</h3>
              <p><strong>Loan Closer:</strong> ${loanDetails.loanCloser}</p>
              <p><strong>Loan Officer:</strong> ${loanDetails.loanOfficer}</p>
              <p><strong>Loan Type:</strong> ${loanDetails.loanType}</p>
              <p><strong>Loan Purpose:</strong> ${loanDetails.loanPurpose}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
              <p>📅 <strong>Calendar attachment included</strong> - Add this appointment to your calendar by opening the attached .ics file.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const icsContent = ICSGeneratorService.generateICSFromAppointment(bookingData);
    const icsFilename = ICSGeneratorService.generateICSFilename(bookingData);

    const emailRequest: EmailRequestDTO = {
      To: mainRecipientEmail,
      Bcc: uniqueEmails,
      Cc: ccEmails,
      Subject: `${title} - ${bookingData.ServiceName} for ${borrowerName}`,
      Body: htmlBody,
      IsHtml: true,
      Attachments: [
        {
          FileName: icsFilename,
          Extension: "ics",
          Data: Buffer.from(icsContent).toString('base64')
        }
      ]
    };

    const emailResponse = await bookingService.sendEmail(emailRequest);
    
  } catch (error) {
    console.error('❌ Error sending email notifications:', error);
    
  } finally {
    updateLoadingState('sendingEmail', false);
  }
};
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnlyMode || loadingStates.submitting) return;

    if (!editMode && !isLoanDetailsValidated && !isOverrideMode) {
      setError("Please enter a valid Loan ID and press Enter to load loan details before submitting.");
      return;
    }

    if (!bookingData.ServiceId) {
      setError("Please select a service.");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a time slot or use admin override.");
      return;
    }

    setError("");
    
    updateLoadingState('submitting', true);
    setLoading?.(true);

    try {
      let response;
      
      if (editMode) {
        const updateData = {
          id: initialData?.bookingId || '',
          selectedDate: bookingData.DateTimeInfo.SelectedDate,
          selectedTime: bookingData.DateTimeInfo.SelectedTime,
          fromDate: bookingData.DateTimeInfo.FromDate,
          toDate: bookingData.DateTimeInfo.ToDate,
          staffMemberIds: bookingData.StaffMemberIds,
          Followers: bookingData.Followers,
          notes: notes
        };
        
        response = await bookingService.updateBooking(updateData);
      } else {
        const createData = {
          ...bookingData,
          LoanDetails: {
            notes: notes,
            loanType: loanDetails?.loanType || '',
            loanPurpose: loanDetails?.loanPurpose || ''
          }
        };
        
        response = await bookingService.postBooking(createData);

        if (response && typeof response === 'object') {
          if ('Status' in response && response.Status === 0) {
            const errorMessage = response.Message || 'Failed to create booking. Please try again.';
            setError(errorMessage);
            console.error('Booking creation failed:', response);
            return;
          }
        }
          
          if ('status' in response && response.status === 0) {
            const errorMessage = response.message || response.Message || 'Failed to create booking. Please try again.';
            setError(errorMessage);
            console.error('Booking creation failed:', response);
            return;
          }
      }

      if (response) {
        await sendEmailNotifications(response);
      }

      if (onSuccess) {
        onSuccess(bookingData, response);
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} booking:`, error);
      setError(`Failed to ${editMode ? 'update' : 'create'} booking. Please try again.`);
    } finally {
      updateLoadingState('submitting', false);
      setLoading?.(false);
    }
  };

 const fetchLoanDetails = async () => {
    if (loadingStates.submitting || readOnlyMode) return;

    if (!bookingData.EncompassDetails.EncompassLoanId.trim()) {
      setError("Please enter a Loan ID.");
      return;
    }

    updateLoadingState('loanDetails', true);
    setError("");
    
    try{
      const loanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId || initialData?.encompassLoanId, true);

      if(loanDetails.notes === "Loan Id Already Used"){
         setError("Loan Id Already Used!");
         setIsLoanDetailsValidated(false);
         return;
      }
      setLoanDetails(loanDetails);
      setNotes(loanDetails.notes || '');
      
      if (loanDetails.followers && Array.isArray(loanDetails.followers) && loanDetails.followers.length > 0) {
        const followersWithTypes = parseFollowersWithTypes(loanDetails.followers);
        setLoanDetailsFollowers(followersWithTypes);
        setSelectedLoanFollowers(followersWithTypes); // Select all by default
      } else {
        setLoanDetailsFollowers([]);
        setSelectedLoanFollowers([]);
      }
      
      setBookingData((prev) => ({
        ...prev,
        EncompassDetails: {
          EncompassLoanId: loanDetails?.loanId,
          LoanCloser: loanDetails?.loanCloser,
          loanCloserEmail: loanDetails?.loanCloserEmail,
          LoanOfficer: loanDetails?.loanOfficer,
          loanOfficerEmail: loanDetails?.loanOfficerEmail,
          dpa: loanDetails?.dpa
        },
        BorrowerInformation: {
          FirstName: loanDetails.borrowerFirstName,
          LastName: loanDetails.borrowerLastName,
          Email: loanDetails.borrowerEmail,
          PhoneNumber: loanDetails.borrowerPhone,
          Address: {
            Street: loanDetails.borrowerAddress,
            City: loanDetails.borrowerCity,
            State: loanDetails.borrowerState,
            ZipCode: loanDetails.borrowerZipCode,
          },
        },
      }));

      setShowLoanDetails(true);
      setIsLoanDetailsValidated(true);
    }catch (error) {
      console.error('Error fetching Loan Details:', error);
      setError("Failed to load loan details. Please check the Loan ID and try again.");
      setIsLoanDetailsValidated(false);
    }finally{
      updateLoadingState('loanDetails', false);
    }
  };


  const handleLoanIdKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchLoanDetails();
    }
  };

  const fetchAvailableServicesData = useCallback(async () => {
    updateLoadingState('services', true);
    try {
      const response: BookingService[] = await bookingService.getAvailableServices();
      setServices(response);
      
      if (editMode && bookingData.ServiceId) {
        const matchedService = response.find(s => s.id === bookingData.ServiceId);
        if (matchedService) {
          setSelectedService(matchedService);
        }
      }
    } catch (error) {
      console.error('Error fetching available services data:', error);
      setServices([]);
    } finally {
      updateLoadingState('services', false);
    }
  }, [editMode]);

  // UPDATED: Handle both regular and override modes
  const handleDateTimeSelect = useCallback(() => {
    if (!selectedSlot || !selectedDate || readOnlyMode) return;

    // Handle override mode
    if (isOverrideMode && overrideSlot) {
      console.log('🔧 Using admin override slot for booking data');
      
      // For override mode, we already have the backend times in the slot
      const backendStartTime = overrideSlot.startTime;
      const backendEndTime = overrideSlot.endTime;
      
      // Convert to user timezone for display in form fields
      const userStartTime = TimezoneService.convertBackendTimeToLocalReliable(backendStartTime);
      const userEndTime = TimezoneService.convertBackendTimeToLocalReliable(backendEndTime);
      
      const dateStr = format(userStartTime, 'yyyy-MM-dd');
      const time24 = format(userStartTime, 'HH:mm');

      setBookingData((prev) => ({
        ...prev,
        DateTimeInfo: {
          SelectedDate: dateStr,
          SelectedTime: time24,
          FromDate: backendStartTime,
          ToDate: backendEndTime,
        },
        StaffMemberIds: [overrideSlot.staffMemberId || 'admin-override'],
      }));
      
      return;
    }

    // Regular mode handling (your existing logic)
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startTimeUser = TimezoneService.convertBackendTimeToLocalReliable(selectedSlot.startTime);
    const time24 = format(startTimeUser, 'HH:mm');

    setBookingData((prev) => ({
      ...prev,
      DateTimeInfo: {
        SelectedDate: dateStr,
        SelectedTime: time24,
        FromDate: selectedSlot.startTime,
        ToDate: selectedSlot.endTime,
      },
      StaffMemberIds: [selectedSlot.staffMemberId],
    }));
  }, [selectedSlot, selectedDate, readOnlyMode, isOverrideMode, overrideSlot]);

  // UPDATED: Apply availability filtering to time slots
  const fetchAvailableTimeSlots = useCallback(async () => {     
  if (!selectedDate || !bookingData?.ServiceId || isOverrideMode) return; // Skip if in override mode

  updateLoadingState('timeSlots', true);
  try {
   
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const backendDateString = `${year}-${month}-${day}T00:00:00`;

    // 🔥 NEW: Prepare current selected slot for filtering
    let currentSelectedSlot: { startTime: string; endTime: string } | undefined;
    
    if (editMode && bookingData.DateTimeInfo?.FromDate && bookingData.DateTimeInfo?.ToDate) {
      currentSelectedSlot = {
        startTime: bookingData.DateTimeInfo.FromDate,
        endTime: bookingData.DateTimeInfo.ToDate
      };
      
    }

    // 🔥 UPDATED: Pass current selected slot to the API call
    const response: TimeSlot[] = await bookingService.getAvailableTimeSlots(
      bookingData.ServiceId,
      backendDateString,
      editMode, // Pass edit mode flag
      currentSelectedSlot // 🔥 NEW: Pass current selected slot
    );

    // Apply availability filtering for create mode only
    let filteredSlots = response;
    
    if (!editMode && !readOnlyMode && dateRange) {
      filteredSlots = AvailabilityService.filterTimeSlots(response, selectedDate, dateRange);
    }

    setTimeSlots(filteredSlots);

    // 🔥 ENHANCED: Auto-select matching slot in edit mode
    if (editMode && bookingData.DateTimeInfo?.SelectedTime && !selectedSlot) {
      const timeToMatch = bookingData.DateTimeInfo.SelectedTime;
      
      const matchingSlot = filteredSlots.find(slot => {
        try {
          const userSlotTime = TimezoneService.convertBackendTimeToLocal(slot.startTime);
          const slotTimeFormatted = format(userSlotTime, 'HH:mm');
          return slotTimeFormatted === timeToMatch;
        } catch (error) {
          console.error('Error comparing slot time:', error);
          return false;
        }
      });
      
      if (matchingSlot) {
        setSelectedSlot(matchingSlot);
      } else {
        console.warn('⚠️ Could not find matching slot for time:', timeToMatch);
      }
    }
  } catch (error) {
    console.error('Error fetching time slots for selected service:', error);
    setTimeSlots([]);
  } finally {
    updateLoadingState('timeSlots', false);
  }
}, [selectedService, selectedDate, editMode, isViewMode, bookingData.DateTimeInfo?.SelectedTime, bookingData.ServiceId, selectedSlot, dateRange, bookingData.DateTimeInfo?.FromDate, bookingData.DateTimeInfo?.ToDate, isOverrideMode]); // 🔥 Added isOverrideMode

  const fetchAllFollowers = useCallback(async () => {
    updateLoadingState('followers', true);
    try {
      if(editMode === true && initialData?.followers !== null && initialData?.followers !== ""){
        setFetchedFollowers(initialData?.followers.split(','));
      } else {
        // Keep the original logic for regular followers
        const regularFollowersPromise = bookingService.getFollowers();
        
        const promises = [regularFollowersPromise];
        if (isAdmin) {
          promises.push(bookingService.getGlobalFollowers());
        }
        
        const results = await Promise.all(promises);
        
        let allFollowers: string[] = [];
        results.forEach(result => {
          if (Array.isArray(result)) {
            allFollowers = [...allFollowers, ...result];
          }
        });
        
        const uniqueFollowers = Array.from(new Set(allFollowers));
        setFetchedFollowers(uniqueFollowers);
      }
    } catch (error) {
      console.error('Failed to fetch followers', error);
      setFetchedFollowers([]);
    } finally {
      updateLoadingState('followers', false);
    }
  }, [isAdmin, editMode, initialData]);


  const handleToggleLoanFollower = (follower: FollowerWithType) => {
  if (readOnlyMode) return;
  
  setSelectedLoanFollowers(prev => {
    const isSelected = prev.find(f => f.email === follower.email);
    if (isSelected) {
      // Remove from selected
      return prev.filter(f => f.email !== follower.email);
    } else {
      // Add to selected
      return [...prev, follower];
    }
  });
};

 const handleAddFollower = (newFollower: string) => {
    if (readOnlyMode) return;
    
    const cleanedFollower = newFollower.trim();
    
    if (!emailRegex.test(cleanedFollower)) {
      return;
    }
    
    const allExistingFollowers = [
      ...fetchedFollowers, 
      ...selectedLoanFollowers.map(slf => slf.email), 
      ...addedFollowers
    ];
    
    if (!allExistingFollowers.includes(cleanedFollower)) {
      setAddedFollowers(prev => [...prev, cleanedFollower]);
    }
  };

 useEffect(() => {
  const initializeEditMode = async () => {
    if (editMode && initialData) {
      updateLoadingState('initializing', true);
              
      const formattedData = mapCalendarBookingToFormData(initialData as any);

      try {
        const loanDetails = await bookingService.getLoanDetails(bookingData.EncompassDetails.EncompassLoanId || initialData?.encompassLoanId);
        setLoanDetails(loanDetails);
        setShowLoanDetails(true);
        setIsLoanDetailsValidated(true);
        
        setNotes(initialData.loanData?.notes || loanDetails.notes || '');
        if (loanDetails.followers && Array.isArray(loanDetails.followers) && loanDetails.followers.length > 0) {
          const followersWithTypes = parseFollowersWithTypes(loanDetails.followers);
          setLoanDetailsFollowers(followersWithTypes);
          
          if (initialData.followers) {
            const existingFollowerEmails = initialData.followers.split(',').map(email => email.trim()).filter(email => email.length > 0);
            
            const selectedFromLoan = followersWithTypes.filter(lf => 
              existingFollowerEmails.includes(lf.email)
            );
            
            const systemAndCustomFollowers = existingFollowerEmails.filter(email => 
              !followersWithTypes.find(lf => lf.email === email)
            );

            setSelectedLoanFollowers(selectedFromLoan);
            setFetchedFollowers(systemAndCustomFollowers);
            setAddedFollowers([]);
            
          } else {
            setSelectedLoanFollowers([]);
            setFetchedFollowers([]);
            setAddedFollowers([]);
          }
        } else {
          setLoanDetailsFollowers([]);
          setSelectedLoanFollowers([]);
          
          if (formattedData.Followers) {
            const existingFollowerEmails = formattedData.Followers.split(',').map(email => email.trim()).filter(email => email.length > 0);
            setFetchedFollowers(existingFollowerEmails);
            setAddedFollowers([]);
          } else {
            setFetchedFollowers([]);
            setAddedFollowers([]);
          }
        }
        
        // Set the booking data with loan details
        setBookingData((prev) => ({
          ...formattedData,
          BorrowerInformation: {
            FirstName: loanDetails.borrowerFirstName,
            LastName: loanDetails.borrowerLastName,
            Email: loanDetails.borrowerEmail,
            PhoneNumber: loanDetails.borrowerPhone,
            Address: {
              Street: loanDetails.borrowerAddress,
              City: loanDetails.borrowerCity,
              State: loanDetails.borrowerState,
              ZipCode: loanDetails.borrowerZipCode,
            },
          },
          EncompassDetails: {
            EncompassLoanId: loanDetails?.loanId,
            LoanCloser: loanDetails?.loanCloser,
            loanCloserEmail: loanDetails?.loanCloserEmail,
            LoanOfficer: loanDetails?.loanOfficer,
            loanOfficerEmail: loanDetails?.loanOfficerEmail,
            dpa: loanDetails?.dpa
          },
        }));

        // Set the selected date from formatted data
        if (formattedData.DateTimeInfo?.SelectedDate) {
          const dateStr = formattedData.DateTimeInfo.SelectedDate;            
          if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-').map(Number);
            const correctDate = new Date(year, month - 1, day);
            setSelectedDate(correctDate);
            setInitialSelectedDate(correctDate);
          } else {
            setSelectedDate(new Date());
          }
        }

        // 🔥 REMOVED: Don't set fetchedFollowers from formattedData.Followers here
        // This is now handled above in the loan followers logic

      } catch (error) {
        console.error('Error initializing edit mode:', error);
        // On error, still try to set basic followers if available
        if (formattedData.Followers) {
          const followerArray = formattedData.Followers.split(',').map(email => email.trim()).filter(email => email.length > 0);
          setFetchedFollowers(followerArray);
          setSelectedLoanFollowers([]);
          setAddedFollowers([]);
        }
      } finally {
        updateLoadingState('initializing', false);
      }
    }
  };

  initializeEditMode();
}, [editMode, initialData]);

 useEffect(() => {
    fetchAvailableServicesData();
    fetchAllFollowers(); 
    
  }, [fetchAvailableServicesData, fetchAllFollowers]);

  useEffect(() => {
    if (!editMode && loanDetails) {
      fetchAllFollowers();
    }
  }, [loanDetails, editMode, fetchAllFollowers]);

 useEffect(() => {
    // Combine all types: regular (read-only) + selected loan followers + manually added
    const allFollowers = [
      ...fetchedFollowers,                                    // Regular system followers (read-only)
      ...selectedLoanFollowers.map(slf => slf.email),       // Selected loan details followers (extract emails)
      ...addedFollowers                                       // Manually added followers
    ];
    
    const uniqueFollowers = Array.from(new Set(allFollowers));
    const followersString = uniqueFollowers.join(',');
    
    setBookingData(prev => ({
      ...prev,
      Followers: followersString,
    }));
    
  }, [fetchedFollowers, selectedLoanFollowers, addedFollowers]);

  useEffect(() => {
    if (!readOnlyMode && selectedDate && bookingData.ServiceId && !isOverrideMode) {
      fetchAvailableTimeSlots();
    }
  }, [selectedService, selectedDate, readOnlyMode, isOverrideMode, fetchAvailableTimeSlots]);

  useEffect(() => {
    if (!readOnlyMode) {
      handleDateTimeSelect();
    }
  }, [selectedSlot, selectedDate, handleDateTimeSelect, readOnlyMode, isOverrideMode, overrideSlot]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'absolute',
          backdropFilter: 'blur(3px)',
        }}
        open={loadingStates.submitting || loadingStates.initializing}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6">
            {loadingStates.submitting ? (editMode ? 'Updating booking...' : 'Creating booking...') : 
            loadingStates.initializing ? 'Loading booking details...' : 
            loadingStates.sendingEmail ? 'Sending email notifications...' : 'Processing...'}
          </Typography>
        </Box>
      </Backdrop>

      {isAnyLoading && !loadingStates.submitting && !loadingStates.initializing && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10 }}>
          <LinearProgress />
        </Box>
      )}

      <Grid
      container 
      spacing={2} 
      padding={2}
      sx={{
        width: '100%',
        margin: 0,
        borderRadius: '10px',
        color: 'gray',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        position: 'relative',
      }}
      >
        <Grid item xs={12} sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Typography sx={{fontSize: '30px', fontWeight: 'bold', color: 'black'}}>
              {getFormTitle()}
            </Typography>
            <CloseIcon sx={{float: 'right', color: 'gray', cursor: 'pointer'}} onClick={onClose} />
        </Grid>

        <Box sx={{ width: '100%', padding: 2 }}>
          <Grid item xs={12}>
            <Typography variant="h6">Client Details</Typography>
            <Grid sx={{display: 'flex', gap: '4px', mt: '10px', maxHeight: '56px'}}>
              <TextField
                fullWidth
                label="Encompass Loan ID"
                variant='outlined'
                required
                value={bookingData.EncompassDetails.EncompassLoanId || ''}
                onChange={handleLoanIdChange}
                onKeyDown={!editMode && !readOnlyMode ? handleLoanIdKeyDown : undefined}
                InputProps={{
                  readOnly: editMode || readOnlyMode,
                }}
                helperText={!editMode && !readOnlyMode ? "Press Enter after entering Loan ID" : ""}
              />
              {!editMode && !readOnlyMode && (
                <Button 
                  disabled={!bookingData.EncompassDetails.EncompassLoanId || loadingStates.loanDetails} 
                  variant="contained" 
                  onClick={() => fetchLoanDetails()}
                  sx={{ minWidth: 120 }}
                >
                  {loadingStates.loanDetails ? <CircularProgress size={24} color="inherit" /> : 'Enter'}
                </Button>
              )}
             
            </Grid>
             {error.length > 0 && !readOnlyMode && (
              <Typography color="error" variant="caption" sx={{ margin: 2, display: 'block' }}>
                {error}
              </Typography>
              )}
          </Grid>
        </Box>

        {loadingStates.loanDetails && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary">Loading loan details...</Typography>
            </Box>
          </Grid>
        )}

        {showLoanDetails && (
        <Box sx={{ width: '100%', padding: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Borrower Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                variant='outlined'
                value={bookingData.BorrowerInformation.FirstName}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                variant='outlined'
                value={bookingData.BorrowerInformation.LastName || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                variant='outlined'
                value={bookingData.BorrowerInformation.Email || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone Number"
                variant='outlined'
                value={bookingData.BorrowerInformation.PhoneNumber || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                variant='outlined'
                value={bookingData.BorrowerInformation.Address.Street || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="City"
                variant='outlined'
                value={bookingData.BorrowerInformation.Address.City || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
              fullWidth
              label="State"
              variant='outlined'
              value={bookingData.BorrowerInformation.Address.State || ''}
              InputProps={{
                  readOnly: true,
                }}/>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Zip Code"
                variant='outlined'
                value={bookingData.BorrowerInformation.Address.ZipCode || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Loan Details</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Loan Number"
                variant='outlined'
                value={loanDetails?.loanNumber || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Loan Type"
                variant="outlined"    
                value={loanDetails?.loanType || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Loan Amount"
                variant='outlined'
                InputProps={{
                  readOnly: true,
                }}
                value={formatLoanAmount(loanDetails?.loanAmount)}/>
            </Grid>
            <Grid item xs={6}>
            <TextField
              fullWidth
              value={loanDetails?.loanCloser || ''}
              label="Loan Closer"
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"/>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Loan Purpose"
                variant="outlined"    
                value={loanDetails?.loanPurpose || ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DPA Program"
                InputProps={{
                  readOnly: true,
                }}
                variant='outlined'
                value={loanDetails?.dpa || ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                variant="outlined"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                InputProps={{
                  readOnly: readOnlyMode || isEditMode,
                }}
                placeholder={readOnlyMode ? "No notes available" : "Add any additional notes for this appointment..."}
                helperText={readOnlyMode ? "" : "Optional notes that will be saved with this appointment"}
              />
            </Grid>
          </Grid>
        </Box>
      )}

        <Grid item xs={12} sx={{padding: '16px'}}>
          <Typography variant="h6">Appointment Details</Typography>
          <TextField
            fullWidth
            value={bookingData.ServiceName || ''}
            required
            onChange={handleServiceChange}
            select={!editMode && !readOnlyMode}
            label="Location"
            variant="outlined"    
            InputProps={{
              readOnly: editMode || readOnlyMode,
              endAdornment: loadingStates.services ? <CircularProgress size={20} /> : null,
            }}
            sx={{mt: '10px'}}
          >
          {!readOnlyMode && (Array.isArray(services) ? services : []).map((service) => (
            <MenuItem key={service.id} value={service.displayName}>
              {service.displayName}
            </MenuItem>
          ))}
          </TextField>
        </Grid>

        {isLoadingAvailability && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary">Loading availability settings...</Typography>
            </Box>
          </Grid>
        )}

        <Grid item xs={12} sx={{padding: '16px'}}>
          <StaticDatePicker
            disabled={(!selectedService && !editMode) || readOnlyMode || isLoadingAvailability}
            value={selectedDate}
            onChange={(date: Date | null) => !readOnlyMode && setSelectedDate(date)}
            orientation={isMobile ? 'portrait' : 'landscape'}
            slotProps={{
              actionBar: { actions: [] }
            }}
            readOnly={readOnlyMode}
            // NEW: Apply availability constraints for create mode only (not in override mode)
            minDate={!editMode && !readOnlyMode && dateRange && !isOverrideMode ? dateRange.minDate : undefined}
            maxDate={!editMode && !readOnlyMode && dateRange && !isOverrideMode ? dateRange.maxDate : undefined}
            shouldDisableDate={(date) => {
              // For create mode, apply availability constraints (but not in override mode)
              if (!editMode && !readOnlyMode && !isOverrideMode) {
                // Require service selection first
                if (!selectedService) {
                  return true;
                }
                
                // If we have dateRange constraints, apply them
                if (dateRange) {
                  const shouldDisable = AvailabilityService.shouldDisableDate(date, dateRange);
                  if (shouldDisable) {
                    return true;
                  }
                }
                
                return false;
              }
              
              if (editMode) {
                // Always allow the currently selected date
                if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
                  return false;
                }
                
                // If we have a selected date, disable dates before it
                if (initialSelectedDate) {
                  const initialDateOnly = new Date(initialSelectedDate.getFullYear(), initialSelectedDate.getMonth(), initialSelectedDate.getDate());
                  const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  return dateToCheck < initialDateOnly;
                }
                
                // Fallback: disable past dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateToCheck = new Date(date);
                dateToCheck.setHours(0, 0, 0, 0);
                return dateToCheck < today;
              }
              
              // Default: don't disable (for override mode)
              return false;
            }}
            // Keep disablePast for create mode only (not override mode)
            disablePast={!editMode && !readOnlyMode && !isOverrideMode}
          />
          
          {/* Show message when no service is selected */}
          {!editMode && !readOnlyMode && !selectedService && !isOverrideMode && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="grey.700">
                Please select a service first to see available dates.
              </Typography>
            </Box>
          )}
          
          {/* Show message when service is selected but availability is loading */}
          {!editMode && !readOnlyMode && selectedService && isLoadingAvailability && !isOverrideMode && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="grey.700">
                Loading availability for selected service...
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Admin Override Section */}
        {!readOnlyMode && (
          <Grid item xs={12} sx={{ padding: '16px' }}>
            <AdminOverride
              isAdmin={isAdmin}
              isEditMode={editMode}
              selectedDate={selectedDate}
              onOverrideSlot={handleOverrideSlot}
              onCancelOverride={handleCancelOverride}
              disabled={loadingStates.submitting || loadingStates.initializing}
            />
          </Grid>
        )}

        {/* Show override confirmation when in override mode */}
        {isOverrideMode && overrideSlot && (
          <Grid item xs={12} sx={{ padding: '16px' }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Admin Override Active
              </Typography>
              <Typography variant="body2">
                Custom time slot: {overrideSlot.displayText}
              </Typography>
              <Button
                size="small"
                onClick={handleCancelOverride}
                sx={{ mt: 1 }}
                variant="outlined"
                color="warning"
              >
                Cancel Override
              </Button>
            </Alert>
          </Grid>
        )}

        <Grid container sx={{display: 'flex', flexDirection: 'column', width: '100%', padding: '16px'}}>
          {/* Time Selector - Only show when NOT in override mode */}
          {(timeSlots.length > 0 || selectedSlot || (editMode && selectedDate)) && !isOverrideMode && (
            <TimeSelector
              timeSlots={timeSlots}
              selectedSlot={selectedSlot}
              onSelect={!readOnlyMode ? setSelectedSlot : () => {}}
              loading={loadingStates.timeSlots}
              readOnly={readOnlyMode}
              editMode={editMode}
              originalSlot={editMode && initialData ? {
                startTime: initialData.start?.dateTime || '',
                endTime: initialData.end?.dateTime || '',
                displayText: '',
                staffMemberId: initialData.staffMemberIds?.[0] || ''
              } : null}
            />
          )}
          
          <EnhancedFollowers
            editMode={editMode || readOnlyMode}
            regularFollowers={fetchedFollowers}              
            loanDetailsFollowers={loanDetailsFollowers}      
            selectedLoanFollowers={selectedLoanFollowers}    
            addedFollowers={addedFollowers}                  
            onToggleLoanFollower={handleToggleLoanFollower}  
            onAddFollower={handleAddFollower}                
            onRemoveAddedFollower={(followerToRemove) => {   
              if (!readOnlyMode) {
                setAddedFollowers(prev => prev.filter(f => f !== followerToRemove));
              }
            }}
            loading={loadingStates.followers}
          />
          {error.length > 0 && !readOnlyMode && (
            <Typography color="error" variant="caption" sx={{ margin: 2, display: 'block' }}>
              {error}
            </Typography>
          )}

          {!readOnlyMode && (
            <Grid sx={{display: 'flex', gap: '1rem'}}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onClose}
                  disabled={loadingStates.submitting}
                  sx={{
                    backgroundColor: '#D3323A',
                  }}
                >
                  Cancel
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isAnyLoading || (!editMode && !isLoanDetailsValidated && !isOverrideMode)}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{
                    position: 'relative',
                  }}
                >
                  {loadingStates.submitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      {editMode ? 'Updating...' : 'Scheduling...'}
                    </Box>
                  ) : (
                    editMode ? 'Update' : 'Schedule'
                  )}
                </Button>
              </Grid>
            </Grid>
          )}

          {readOnlyMode && (
            <Grid sx={{display: 'flex', justifyContent: 'center', mt: '16px'}}>
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  minWidth: 150,
                }}
              >
                Close
              </Button>
            </Grid>
          )}
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default CreateBookingForm;