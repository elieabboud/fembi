export interface dashboardStats {
  summaryMetrics: {
    totalClosings: number;
    currentMonthClosings: number;
    previousMonthClosings: number;
    monthlyGrowth: number;
    // New summary metrics
    totalCancellations: number;
    currentMonthCancellations: number;
    totalReschedules: number;
    currentMonthReschedules: number;
  };

  monthlyClosingsPie: Array<{
    month: string;
    closings: number;
    color: string;
  }>;

  closingsByAgentPie: Array<{
    agentFirstName: string;
    agentLastName: string;
    closings: number;
    color: string;
  }>;

  closingsByServiceBar: Array<{
    month: string;
    [serviceId: string]: number | string;
  }>;

  monthlyCancellationsPie: Array<{
    month: string;
    cancellations: number;
    color: string;
  }>;

  cancellationsByServiceBar: Array<{
    month: string;
    [serviceId: string]: number | string;
  }>;

  monthlyReschedulesPie: Array<{
    month: string;
    reschedules: number;
    color: string;
  }>;

  reschedulesByServiceBar: Array<{
    month: string;
    [serviceId: string]: number | string;
  }>;

  serviceNames: string[];
  agentMonthlyPerformance: Array<{
    month: string;
    [agent: string]: number | string;
  }>;
  agents: string[];
}
