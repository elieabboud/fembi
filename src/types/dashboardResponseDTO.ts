export interface dashboardResponseDTO {
  getClosingsPerMonth: {
    totalClosings: string;
    totalMeetingsPerMonth: {
      month: string;
      numberOfMeetings: string;
    }[];
  };
  getClosingsPerOwner: {
    totalClosings: string;
    totalClosingsPerOwner: {
      ownerName: string;
      numberOfMeetings: string;
    }[];
  };
  getClosingsByServiceAndMonth: {
    totalClosings: string;
    totalMeetingsByService: {
      serviceId: string;
      totalMeetingsByMonth: {
        month: string;
        numberOfMeetings: string;
      }[];
    }[];
  };
}