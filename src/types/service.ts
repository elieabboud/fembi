export interface BookingService {
    Id: string;
    DisplayName: string;
    DefaultDuration: string;
    DefaultPrice: number;
    DefaultPriceType: string;
    Description: string;
    LanguageTag: string;
    IsHiddenFromCustomers: boolean;
    Notes: string;
    PreBuffer: string;
    PostBuffer: string;
    StaffMemberIds: string[];
    IsLocationOnline: boolean;
    SmsNotificationsEnabled: boolean;
    IsAnonymousJoinEnabled: boolean;
    WebUrl: string;
    SchedulingPolicy: SchedulingPolicy;
    DefaultLocation: ServiceLocation;
    DefaultReminders: any[]; // Can be typed more strictly if known
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
    StartTime: string;     // ISO 8601 format
    EndTime: string;       // ISO 8601 format
    DisplayText: string;
    StaffMemberId: string;
  }
  
  