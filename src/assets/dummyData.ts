import { calendarBooking } from "../types/calendarBooking";

export const dummyData : calendarBooking[] = [
  {
    "encompassLoanId": "ENC00000",
    "LoanCloser": "Alice Closer",
    "LoanOfficer": "Alice Officer",
    "dpa": "Assistance Program",
    "ownerId": "owner-0",
    "loanData": {
      "loanId": "LN-0000",
      "borrowerFirstName": "Alice",
      "borrowerLastName": "Smith",
      "borrowerEmail": "alice@example.com",
      "borrowerPhone": "5550000000",
      "borrowerAddress": "0 Main St",
      "borrowerCity": "Phoenix",
      "borrowerState": "IL",
      "borrowerZipCode": "10000",
      "loanNumber": "LOAN-0000",
      "loanType": "Conventional",
      "loanAmount": 250000,
      "loanOfficer": "Alice Officer",
      "notes": "Loan notes here",
      "loanCloser": "Alice Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0000",
    "customerTimeZone": "America/New_York",
    "customerName": "Alice Smith",
    "customerEmailAddress": "alice@example.com",
    "customerPhone": "5550000000",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": false,
    "isCustomerAllowedToManageBooking": true,
    "isLocationOnline": false,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 100,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-000",
    "serviceName": "Mortgage Planning",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-001"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-000",
        "name": "Alice Smith",
        "emailAddress": "alice@example.com",
        "phone": "5550000000",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "0 Main St",
            "city": "New York",
            "state": "AZ",
            "countryOrRegion": "USA",
            "postalCode": "10000"
          }
        },
        "timeZone": "America/New_York",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2025-05-01T09:00:00",
      "timeZone": "America/New_York"
    },
    "end": {
      "dateTime": "2025-05-01T10:00:00",
      "timeZone": "America/New_York"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "0 Main St",
        "city": "New York",
        "state": "AZ",
        "countryOrRegion": "USA",
        "postalCode": "10000"
      }
    },
    "status": "completed",
    "color": "#3366cc"
  },
  {
    "encompassLoanId": "ENC00001",
    "LoanCloser": "Bob Closer",
    "LoanOfficer": "Bob Officer",
    "dpa": "Assistance Program",
    "ownerId": "owner-1",
    "loanData": {
      "loanId": "LN-0001",
      "borrowerFirstName": "Bob",
      "borrowerLastName": "Smith",
      "borrowerEmail": "bob@example.com",
      "borrowerPhone": "5550000001",
      "borrowerAddress": "1 Main St",
      "borrowerCity": "Phoenix",
      "borrowerState": "IL",
      "borrowerZipCode": "10001",
      "loanNumber": "LOAN-0001",
      "loanType": "Conventional",
      "loanAmount": 260000,
      "loanOfficer": "Bob Officer",
      "notes": "Loan notes here",
      "loanCloser": "Bob Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0001",
    "customerTimeZone": "America/New_York",
    "customerName": "Bob Smith",
    "customerEmailAddress": "bob@example.com",
    "customerPhone": "5550000001",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": true,
    "isCustomerAllowedToManageBooking": false,
    "isLocationOnline": true,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 105,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-001",
    "serviceName": "Loan Consultation",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-002"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-001",
        "name": "Bob Smith",
        "emailAddress": "bob@example.com",
        "phone": "5550000001",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "1 Main St",
            "city": "New York",
            "state": "NY",
            "countryOrRegion": "USA",
            "postalCode": "10001"
          }
        },
        "timeZone": "America/New_York",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2026-06-02T10:00:00",
      "timeZone": "America/New_York"
    },
    "end": {
      "dateTime": "2025-06-01T11:00:00",
      "timeZone": "America/New_York"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "1 Main St",
        "city": "New York",
        "state": "NY",
        "countryOrRegion": "USA",
        "postalCode": "10001"
      }
    },
    "status": "canceled",
    "color": "#3366cc"
  },
  {
    "encompassLoanId": "ENC00002",
    "LoanCloser": "Charlie Closer",
    "LoanOfficer": "Charlie Officer",
    "dpa": "Assistance Program",
    "ownerId": "owner-2",
    "loanData": {
      "loanId": "LN-0002",
      "borrowerFirstName": "Charlie",
      "borrowerLastName": "Smith",
      "borrowerEmail": "charlie@example.com",
      "borrowerPhone": "5550000002",
      "borrowerAddress": "2 Main St",
      "borrowerCity": "Chicago",
      "borrowerState": "NY",
      "borrowerZipCode": "10002",
      "loanNumber": "LOAN-0002",
      "loanType": "Conventional",
      "loanAmount": 270000,
      "loanOfficer": "Charlie Officer",
      "notes": "Loan notes here",
      "loanCloser": "Charlie Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0002",
    "customerTimeZone": "America/Los_Angeles",
    "customerName": "Charlie Smith",
    "customerEmailAddress": "charlie@example.com",
    "customerPhone": "5550000002",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": false,
    "isCustomerAllowedToManageBooking": true,
    "isLocationOnline": false,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 110,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-002",
    "serviceName": "Loan Corporation",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-003"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-002",
        "name": "Charlie Smith",
        "emailAddress": "charlie@example.com",
        "phone": "5550000002",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "2 Main St",
            "city": "Houston",
            "state": "CA",
            "countryOrRegion": "USA",
            "postalCode": "10002"
          }
        },
        "timeZone": "Asia/Beirut",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2025-06-03T03:00:00",
      "timeZone": "Asia/Beirut"
    },
    "end": {
      "dateTime": "2025-06-03T04:00:00",
      "timeZone": "Asia/Beirut"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "2 Main St",
        "city": "Houston",
        "state": "CA",
        "countryOrRegion": "USA",
        "postalCode": "10002"
      }
    },
    "status": "completed",
    "color": "#3366cc"
  },
  {
    "encompassLoanId": "ENC00003",
    "LoanCloser": "Diana Closer",
    "LoanOfficer": "Dima Officer",
    "dpa": "Assistance Program",
    "ownerId": "owner-3",
    "loanData": {
      "loanId": "LN-0003",
      "borrowerFirstName": "Diana",
      "borrowerLastName": "Smith",
      "borrowerEmail": "diana@example.com",
      "borrowerPhone": "5550000003",
      "borrowerAddress": "3 Main St",
      "borrowerCity": "New York",
      "borrowerState": "AZ",
      "borrowerZipCode": "10003",
      "loanNumber": "LOAN-0003",
      "loanType": "Conventional",
      "loanAmount": 280000,
      "loanOfficer": "Diana Officer",
      "notes": "Loan notes here",
      "loanCloser": "Diana Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0003",
    "customerTimeZone": "America/New_York",
    "customerName": "Diana Smith",
    "customerEmailAddress": "diana@example.com",
    "customerPhone": "5550000003",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": true,
    "isCustomerAllowedToManageBooking": false,
    "isLocationOnline": true,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 115,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-003",
    "serviceName": "Mortgage Planning",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-003"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-003",
        "name": "Diana Smith",
        "emailAddress": "diana@example.com",
        "phone": "5550000003",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "3 Main St",
            "city": "Los Angeles",
            "state": "CA",
            "countryOrRegion": "USA",
            "postalCode": "10003"
          }
        },
        "timeZone": "America/New_York",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2025-06-04T12:00:00",
      "timeZone": "America/New_York"
    },
    "end": {
      "dateTime": "2025-06-01T13:00:00",
      "timeZone": "America/New_York"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "3 Main St",
        "city": "Los Angeles",
        "state": "CA",
        "countryOrRegion": "USA",
        "postalCode": "10003"
      }
    },
    "status": "upcoming",
    "color": "#3366cc"
  },
  {
    "encompassLoanId": "ENC00004",
    "LoanCloser": "Evan Closer",
    "LoanOfficer": "Chris Officer",
    "dpa": "Assistance Program for Investment",
    "ownerId": "owner-4",
    "loanData": {
      "loanId": "LN-0004",
      "borrowerFirstName": "Evan",
      "borrowerLastName": "Smith",
      "borrowerEmail": "evan@example.com",
      "borrowerPhone": "5550000004",
      "borrowerAddress": "4 Main St",
      "borrowerCity": "Houston",
      "borrowerState": "CA",
      "borrowerZipCode": "10004",
      "loanNumber": "LOAN-0004",
      "loanType": "Conventional",
      "loanAmount": 290000,
      "loanOfficer": "Evan Officer",
      "notes": "Loan notes here",
      "loanCloser": "Evan Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0004",
    "customerTimeZone": "America/Los_Angeles",
    "customerName": "Evan Smith",
    "customerEmailAddress": "evan@example.com",
    "customerPhone": "5550000004",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": false,
    "isCustomerAllowedToManageBooking": true,
    "isLocationOnline": false,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 120,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-004",
    "serviceName": "Loan Consultation",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-002"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-004",
        "name": "Evan Smith",
        "emailAddress": "evan@example.com",
        "phone": "5550000004",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "4 Main St",
            "city": "Phoenix",
            "state": "NY",
            "countryOrRegion": "USA",
            "postalCode": "10004"
          }
        },
        "timeZone": "America/Los_Angeles",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2025-06-05T13:00:00",
      "timeZone": "America/Los_Angeles"
    },
    "end": {
      "dateTime": "2025-06-01T14:00:00",
      "timeZone": "America/Los_Angeles"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "4 Main St",
        "city": "Phoenix",
        "state": "NY",
        "countryOrRegion": "USA",
        "postalCode": "10004"
      }
    },
    "status": "inProgress",
    "color": "#3366cc"
  },
  {
    "encompassLoanId": "ENC00005",
    "LoanCloser": "Fiona Closer",
    "LoanOfficer": "Fiona Officer",
    "dpa": "Assistance Program",
    "ownerId": "owner-5",
    "loanData": {
      "loanId": "LN-0005",
      "borrowerFirstName": "Fiona",
      "borrowerLastName": "Smith",
      "borrowerEmail": "fiona@example.com",
      "borrowerPhone": "5550000005",
      "borrowerAddress": "5 Main St",
      "borrowerCity": "Houston",
      "borrowerState": "IL",
      "borrowerZipCode": "10005",
      "loanNumber": "LOAN-0005",
      "loanType": "Conventional",
      "loanAmount": 300000,
      "loanOfficer": "Fiona Officer",
      "notes": "Loan notes here",
      "loanCloser": "Fiona Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0005",
    "customerTimeZone": "America/Los_Angeles",
    "customerName": "Fiona Smith",
    "customerEmailAddress": "fiona@example.com",
    "customerPhone": "5550000005",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": true,
    "isCustomerAllowedToManageBooking": false,
    "isLocationOnline": true,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 125,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-005",
    "serviceName": "Mortgage Planning",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-001"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-005",
        "name": "Fiona Smith",
        "emailAddress": "fiona@example.com",
        "phone": "5550000005",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "5 Main St",
            "city": "Phoenix",
            "state": "AZ",
            "countryOrRegion": "USA",
            "postalCode": "10005"
          }
        },
        "timeZone": "America/Los_Angeles",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2025-06-06T14:00:00",
      "timeZone": "America/Los_Angeles"
    },
    "end": {
      "dateTime": "2025-06-01T15:00:00",
      "timeZone": "America/Los_Angeles"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "5 Main St",
        "city": "Phoenix",
        "state": "AZ",
        "countryOrRegion": "USA",
        "postalCode": "10005"
      }
    },
    "status": "completed",
    "color": "#3366cc"
  },
  {
    "encompassLoanId": "ENC00006",
    "LoanCloser": "George Closer",
    "LoanOfficer": "George Officer",
    "dpa": "Assistance Program",
    "ownerId": "owner-6",
    "loanData": {
      "loanId": "LN-0006",
      "borrowerFirstName": "George",
      "borrowerLastName": "Smith",
      "borrowerEmail": "george@example.com",
      "borrowerPhone": "5550000006",
      "borrowerAddress": "6 Main St",
      "borrowerCity": "Los Angeles",
      "borrowerState": "TX",
      "borrowerZipCode": "10006",
      "loanNumber": "LOAN-0006",
      "loanType": "Conventional",
      "loanAmount": 310000,
      "loanOfficer": "George Officer",
      "notes": "Loan notes here",
      "loanCloser": "George Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0006",
    "customerTimeZone": "America/Los_Angeles",
    "customerName": "George Smith",
    "customerEmailAddress": "george@example.com",
    "customerPhone": "5550000006",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": false,
    "isCustomerAllowedToManageBooking": true,
    "isLocationOnline": false,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 130,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-006",
    "serviceName": "Refinancing Session",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-001"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-006",
        "name": "George Smith",
        "emailAddress": "george@example.com",
        "phone": "5550000006",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "6 Main St",
            "city": "Houston",
            "state": "TX",
            "countryOrRegion": "USA",
            "postalCode": "10006"
          }
        },
        "timeZone": "America/Los_Angeles",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2025-06-07T15:00:00",
      "timeZone": "America/Los_Angeles"
    },
    "end": {
      "dateTime": "2025-06-01T16:00:00",
      "timeZone": "America/Los_Angeles"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "6 Main St",
        "city": "Houston",
        "state": "TX",
        "countryOrRegion": "USA",
        "postalCode": "10006"
      }
    },
    "status": "completed",
    "color": "#3366cc"
  },
  {
    "encompassLoanId": "ENC00007",
    "LoanCloser": "Hannah Closer",
    "LoanOfficer": "Hannah Officer",
    "dpa": "Assistance Program",
    "ownerId": "owner-7",
    "loanData": {
      "loanId": "LN-0007",
      "borrowerFirstName": "Hannah",
      "borrowerLastName": "Smith",
      "borrowerEmail": "hannah@example.com",
      "borrowerPhone": "5550000007",
      "borrowerAddress": "7 Main St",
      "borrowerCity": "Houston",
      "borrowerState": "NY",
      "borrowerZipCode": "10007",
      "loanNumber": "LOAN-0007",
      "loanType": "Conventional",
      "loanAmount": 320000,
      "loanOfficer": "Hannah Officer",
      "notes": "Loan notes here",
      "loanCloser": "Hannah Closer",
      "dpa": "Assistance Program"
    },
    "bookingId": "BK-0007",
    "customerTimeZone": "America/Chicago",
    "customerName": "Hannah Smith",
    "customerEmailAddress": "hannah@example.com",
    "customerPhone": "5550000007",
    "customerNotes": "No specific notes",
    "smsNotificationsEnabled": true,
    "isCustomerAllowedToManageBooking": false,
    "isLocationOnline": true,
    "optOutOfCustomerEmail": false,
    "postBuffer": "PT10M",
    "preBuffer": "PT5M",
    "price": 135,
    "priceType": "fixedPrice",
    "reminders": [
      {
        "message": "Reminder 1 day before",
        "offset": "P1D",
        "recipients": "customer"
      }
    ],
    "serviceId": "SRV-007",
    "serviceName": "Mortgage Planning",
    "serviceNotes": "Some service notes",
    "staffMemberIds": [
      "staff-001"
    ],
    "maximumAttendeesCount": 1,
    "filledAttendeesCount": 1,
    "customers": [
      {
        "customerId": "CUST-007",
        "name": "Hannah Smith",
        "emailAddress": "hannah@example.com",
        "phone": "5550000007",
        "notes": "",
        "location": {
          "displayName": "Office",
          "address": {
            "street": "7 Main St",
            "city": "Houston",
            "state": "TX",
            "countryOrRegion": "USA",
            "postalCode": "10007"
          }
        },
        "timeZone": "America/Chicago",
        "customQuestionAnswers": []
      }
    ],
    "start": {
      "dateTime": "2025-06-08T16:00:00",
      "timeZone": "America/Chicago"
    },
    "end": {
      "dateTime": "2025-06-01T17:00:00",
      "timeZone": "America/Chicago"
    },
    "serviceLocation": {
      "displayName": "Main Office",
      "address": {
        "street": "7 Main St",
        "city": "Houston",
        "state": "TX",
        "countryOrRegion": "USA",
        "postalCode": "10007"
      }
    },
    "status": "inProgress",
    "color": "#3366cc"
  }
]