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
  getCancelsPerMonth: {
    totalCancels: string;
    totalCancelsPerMonth: {
      month: string;
      numberOfCancels: string;
    }[];
  };
  getCancelsByServiceAndMonth: {
    totalCancels: string;
    totalCancelsByService: {
      serviceId: string;
      totalCancelsByMonth: {
        month: string;
        numberOfCancels: string;
      }[];
    }[];
  };
  getReschedulePerMonth: {
    totalReschedules: string;
    totalReschedulesPerMonth: {
      month: string;
      numberOfReschedules: string;
    }[];
  };
  getReschedulesByServiceAndMonth: {
    totalReschedules: string;
    totalReschedulesByService: {
      serviceId: string;
      totalReschedulesByMonth: {
        month: string;
        numberOfReschedules: string;
      }[];
    }[];
  };
}