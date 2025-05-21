import { calendarBooking } from "../types/calendarBooking";
import { LoanDetails } from "../types/loanDetails";

const defaultData: LoanDetails = {
  loanId: 'LN123456',
  borrowerFirstName: 'John',
  borrowerLastName: 'Doe',
  borrowerEmail: 'john.doe@example.com',
  borrowerPhone: '555-123-4567',
  borrowerAddress: '123 Main St',
  borrowerCity: 'Atlanta',
  borrowerState: 'GA',
  borrowerZipCode: '30301',
  loanNumber: '789456123',
  loanType: 'Conventional',
  loanAmount: 250000,
  loanOfficer: 'Jane Smith',
  notes: 'First-time homebuyer, pre-approved.'
};

const defaultData2: LoanDetails = {
  loanId: 'LN123456',
  borrowerFirstName: 'John',
  borrowerLastName: 'Doe',
  borrowerEmail: 'john.doe@example.com',
  borrowerPhone: '555-123-4567',
  borrowerAddress: '123 Main St',
  borrowerCity: 'Atlanta',
  borrowerState: 'GA',
  borrowerZipCode: '30301',
  loanNumber: '789456123',
  loanType: 'Conventional',
  loanAmount: 250000,
  loanOfficer: 'Carol Harvey',
  notes: 'First-time homebuyer, pre-approved.'
};
  
export const bookingData: calendarBooking[] = [
  {
    "bookingId": "1",
    "encompassLoanId": "LOAN123456",
    "ownerId": "OWNER123",
    "loanData" : defaultData2,
    "customerTimeZone": "UTC",
    "customerName": "Customer 87",
    "customerEmailAddress": "customer87@example.com",
    "customerPhone": "+15067198996",
    "customerNotes": "No special notes",
    "smsNotificationsEnabled": false,
    "isCustomerAllowedToManageBooking": false,
    "isLocationOnline": true,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 96,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1",
        "offset": "P1D",
        "recipients": "allAttendees"
      },
      {
        "message": "Reminder 2",
        "offset": "PT1H",
        "recipients": "staff"
      }
    ],
    "serviceId": "8610",
    "serviceName": "Service 10",
    "serviceNotes": "No special instructions",
    "staffMemberIds": ["191"],
    "maximumAttendeesCount": 9,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "9342",
        "name": "Customer 87",
        "emailAddress": "customer87@example.com",
        "phone": "+15067198996",
        "notes": "No special notes",
        "location": {
          "displayName": "My buildingt",
          "address": {
            "street": "123 Main St",
            "city": "Sample City",
            "state": "SC",
            "countryOrRegion": "Country",
            "postalCode": "12345"
          }
        },
        "timeZone": "UTC",
        "customQuestionAnswers": [
          {
            "questionId": "1",
            "question": "How did you hear about us?",
            "answerInputType": "text",
            "answerOptions": ["Friend", "Internet", "Advertisement"],
            "isRequired": true,
            "answer": "Internet",
            "selectedOptions": ["Internet"]
          }
        ]
      }
    ],
    "start": {
      "dateTime": "2025-05-25T19:05:00",
      "timeZone": "UTC" // Adding timeZone property to match DateTimeInfo structure
    },
    "end": {
      "dateTime": "2025-05-25T20:05:00",
      "timeZone": "UTC" // Adding timeZone property to match DateTimeInfo structure
    },
    "serviceLocation": {
      "displayName": "Beirut",
      "address": {
        "street": "123 Main St",
        "city": "Sample City",
        "state": "SC",
        "countryOrRegion": "Country",
        "postalCode": "12345"
      }
    }
  },
  {
    "bookingId": "2",
    "encompassLoanId": "LOAN789012",
    "ownerId": "OWNER456",
    "loanData" : defaultData,
    "customerTimeZone": "UTC",
    "customerName": "Customer 96",
    "customerEmailAddress": "customer96@example.com",
    "customerPhone": "+19273593284",
    "customerNotes": "No special notes",
    "smsNotificationsEnabled": true,
    "isCustomerAllowedToManageBooking": true,
    "isLocationOnline": false,
    "optOutOfCustomerEmail": true,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 188,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1",
        "offset": "P1D",
        "recipients": "customer"
      },
      {
        "message": "Reminder 2",
        "offset": "PT1H",
        "recipients": "staff"
      }
    ],
    "serviceId": "3270",
    "serviceName": "Service 3",
    "serviceNotes": "No special instructions",
    "staffMemberIds": ["259"],
    "maximumAttendeesCount": 4,
    "filledAttendeesCount": 2,
    "customers": [
      {
        "customerId": "2351",
        "name": "Customer 96",
        "emailAddress": "customer96@example.com",
        "phone": "+19273593284",
        "notes": "No special notes",
        "location": {
          "displayName": "Location Name",
          "address": {
            "street": "123 Main St",
            "city": "Sample City",
            "state": "SC",
            "countryOrRegion": "Country",
            "postalCode": "12345"
          }
        },
        "timeZone": "UTC",
        "customQuestionAnswers": [
          {
            "questionId": "1",
            "question": "How did you hear about us?",
            "answerInputType": "text",
            "answerOptions": ["Friend", "Internet", "Advertisement"],
            "isRequired": true,
            "answer": "Friend",
            "selectedOptions": ["Friend"]
          }
        ]
      }
    ],
    "start": {
      "dateTime": "2025-06-01T18:30:00",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2025-06-01T19:30:00",
      "timeZone": "UTC"
    },
    "serviceLocation": {
      "displayName": "Badaro Street",
      "address": {
        "street": "123 Main St",
        "city": "Sample City",
        "state": "SC",
        "countryOrRegion": "Country",
        "postalCode": "12345"
      }
    }
  },
  {
    "bookingId": "3",
    "encompassLoanId": "LOAN345678",
    "ownerId": "OWNER789",
    "loanData" : defaultData2,
    "customerTimeZone": "UTC",
    "customerName": "Customer 64",
    "customerEmailAddress": "customer64@example.com",
    "customerPhone": "+13014689215",
    "customerNotes": "No special notes",
    "smsNotificationsEnabled": false,
    "isCustomerAllowedToManageBooking": true,
    "isLocationOnline": true,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 389,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1",
        "offset": "P1D",
        "recipients": "allAttendees"
      },
      {
        "message": "Reminder 2",
        "offset": "PT1H",
        "recipients": "customer"
      }
    ],
    "serviceId": "7531",
    "serviceName": "Service 5",
    "serviceNotes": "No special instructions",
    "staffMemberIds": ["320"],
    "maximumAttendeesCount": 2,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "2928",
        "name": "Customer 64",
        "emailAddress": "customer64@example.com",
        "phone": "+13014689215",
        "notes": "No special notes",
        "location": {
          "displayName": "Location Name",
          "address": {
            "street": "123 Main St",
            "city": "Sample City",
            "state": "SC",
            "countryOrRegion": "Country",
            "postalCode": "12345"
          }
        },
        "timeZone": "UTC",
        "customQuestionAnswers": [
          {
            "questionId": "1",
            "question": "How did you hear about us?",
            "answerInputType": "text",
            "answerOptions": ["Friend", "Internet", "Advertisement"],
            "isRequired": true,
            "answer": "Advertisement",
            "selectedOptions": ["Advertisement"]
          }
        ]
      }
    ],
    "start": {
      "dateTime": "2025-04-05T15:15:00",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2025-04-05T16:15:00",
      "timeZone": "UTC"
    },
    "serviceLocation": {
      "displayName": "Location Name",
      "address": {
        "street": "123 Main St",
        "city": "Sample City",
        "state": "SC",
        "countryOrRegion": "Country",
        "postalCode": "12345"
      }
    }
  },
  {
    "bookingId": "4",
    "encompassLoanId": "LOAN901234",
    "ownerId": "OWNER012",
    "loanData" : defaultData,
    "customerTimeZone": "UTC",
    "customerName": "Customer 99",
    "customerEmailAddress": "customer99@example.com",
    "customerPhone": "+15943552163",
    "customerNotes": "No special notes",
    "smsNotificationsEnabled": true,
    "isCustomerAllowedToManageBooking": true,
    "isLocationOnline": true,
    "optOutOfCustomerEmail": true,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 258,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1",
        "offset": "P1D",
        "recipients": "customer"
      },
      {
        "message": "Reminder 2",
        "offset": "PT1H",
        "recipients": "allAttendees"
      }
    ],
    "serviceId": "4124",
    "serviceName": "Service 9",
    "serviceNotes": "No special instructions",
    "staffMemberIds": ["266"],
    "maximumAttendeesCount": 6,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "4092",
        "name": "Customer 99",
        "emailAddress": "customer99@example.com",
        "phone": "+15943552163",
        "notes": "No special notes",
        "location": {
          "displayName": "Location Name",
          "address": {
            "street": "123 Main St",
            "city": "Sample City",
            "state": "SC",
            "countryOrRegion": "Country",
            "postalCode": "12345"
          }
        },
        "timeZone": "UTC",
        "customQuestionAnswers": [
          {
            "questionId": "1",
            "question": "How did you hear about us?",
            "answerInputType": "text",
            "answerOptions": ["Friend", "Internet", "Advertisement"],
            "isRequired": true,
            "answer": "Internet",
            "selectedOptions": ["Internet"]
          }
        ]
      }
    ],
    "start": {
      "dateTime": "2025-05-19T19:05:00",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2025-05-19T20:05:00",
      "timeZone": "UTC"
    },
    "serviceLocation": {
      "displayName": "Location Name",
      "address": {
        "street": "123 Main St",
        "city": "Sample City",
        "state": "SC",
        "countryOrRegion": "Country",
        "postalCode": "12345"
      }
    }
  }
]