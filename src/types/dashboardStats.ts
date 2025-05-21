export interface dashboardStats {
  summaryMetrics: {
    totalClosings: number;
    currentMonthClosings: number;
    previousMonthClosings: number;
    monthlyGrowth: number;
  };

  monthlyClosingsPie: Array<{
    month: string;
    closings: number;
    color: string;
  }>;

  closingsByAgentPie: Array<{
    agent: string;
    closings: number;
    color: string;
  }>;

  closingsByServiceBar: Array<{
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
