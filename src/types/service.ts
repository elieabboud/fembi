export interface BookingService {
  id: string;
  displayName: string;
  defaultDuration: string;
  defaultPrice: number;
  defaultPriceType: string;
  description: string;
  languageTag: string;
  isHiddenFromCustomers: boolean;
  notes: string;
  preBuffer: string;
  postBuffer: string;
  staffMemberIds: string[];
  isLocationOnline: boolean;
  smsNotificationsEnabled: boolean;
  isAnonymousJoinEnabled: boolean;
  webUrl: string;
  schedulingPolicy: SchedulingPolicy;
  defaultLocation: ServiceLocation;
  defaultReminders: any[];
}

  
  export interface SchedulingPolicy {
    TimeSlotInterval: string;
    MinimumLeadTime: string;
    MaximumAdvance: string;
    SendConfirmationsToOwner: boolean;
    AllowStaffSelection: boolean;
  }
  
  export interface ServiceLocation {
    DisplayName: string;
    LocationEmailAddress: string;
    LocationUri: string;
    LocationType: string;
    UniqueId: string;
    UniqueIdType: string;
    Address: ServiceAddress;
    Coordinates: ServiceCoordinates;
  }
  
  export interface ServiceAddress {
    Street: string;
    City: string;
    State: string;
    CountryOrRegion: string;
    PostalCode: string;
  }
  
  export interface ServiceCoordinates {
    Altitude?: number;
    Latitude?: number;
    Longitude?: number;
    Accuracy?: number;
    AltitudeAccuracy?: number;
  }

  export interface TimeSlot {
    startTime: string;     // ISO 8601 format
    endTime: string;       // ISO 8601 format
    displayText: string;
    staffMemberId: string;
  }
  
  