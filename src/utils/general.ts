import { dashboardResponseDTO } from "../types/dashboardResponseDTO";
import { dashboardStats } from "../types/dashboardStats";
import { TimezoneService } from "../services/timezoneUtils";
import { User } from "../types/userModel";
import { BookingService } from "../types/service";

// Helper function to safely parse numbers
const safeParseInt = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to safely get agent data
const getAgentData = (agentsList: User[], ownerName: string) => {
  if (!agentsList || !Array.isArray(agentsList)) {
    return { firstName: 'Unknown', lastName: 'Agent' };
  }
  
  const agent = agentsList.find(agent => agent?.microsoft_id === ownerName);
    return {
      firstName: agent?.first_name || 'Unknown',
      lastName: agent?.last_name || 'Agent'
    };
  };

// Helper function to safely get service name
const getServiceName = (servicesList: BookingService[], serviceId: string): string => {
  if (!servicesList || !Array.isArray(servicesList)) {
      return serviceId || 'Unknown Service';
    }
    
    const service = servicesList.find(service => service?.id === serviceId);
    return service?.displayName || serviceId || 'Unknown Service';
};

// Updated to handle timezone conversion
export function toLocalISOString(date: Date): string {
  try {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + 'T' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds())
    );
  } catch (error) {
    console.error('Error in toLocalISOString:', error);
    return new Date().toISOString();
  }
}

// New function to convert user's local date/time to backend timezone for API calls
export function toBackendISOString(date: Date): string {
  try {
    return TimezoneService.convertLocalTimeToBackend(date);
  } catch (error) {
    console.error('Error in toBackendISOString:', error);
    return date.toISOString();
  }
}

// New function to convert backend time to user's local time
export function fromBackendISOString(isoString: string): Date {
  try {
    return TimezoneService.convertBackendTimeToLocal(isoString);
  } catch (error) {
    console.error('Error in fromBackendISOString:', error);
    return new Date();
  }
}

// Format time for display in user's timezone
export function formatTimeForDisplay(backendTime: string, formatString: string = 'h:mm a'): string {
  try {
    return TimezoneService.formatTimeForUser(backendTime, formatString);
  } catch (error) {
    console.error('Error in formatTimeForDisplay:', error);
    return 'N/A';
  }
}

// Format date for display in user's timezone
export function formatDateForDisplay(backendTime: string, formatString: string = 'MMM d, yyyy'): string {
  try {
    return TimezoneService.formatDateForUser(backendTime, formatString);
  } catch (error) {
    console.error('Error in formatDateForDisplay:', error);
    return 'N/A';
  }
}

export const mapApiResponseToDashboardStats = (apiResponse: dashboardResponseDTO, agentsList: User[], servicesList: BookingService[]): dashboardStats => {
  const colors = ['#2e7d32', '#ffc107', '#1976d2', '#d32f2f', '#9c27b0', '#ff5722'];

  // Monthly closings pie chart data
  const monthlyClosingsPie = apiResponse.getClosingsPerMonth.totalMeetingsPerMonth.map((item, i) => ({
    month: item.month,
    closings: parseInt(item.numberOfMeetings),
    color: colors[i % colors.length],
  }));

  // Closings by owner pie chart data
  const closingsByAgentPie = apiResponse.getClosingsPerOwner.totalClosingsPerOwner.map((owner, i) => ({
    agentFirstName: agentsList.find(agent => agent.microsoft_id === owner.ownerName)?.first_name || 'Unknown',
    agentLastName: agentsList.find(agent => agent.microsoft_id === owner.ownerName)?.last_name || 'Agent',
    closings: parseInt(owner.numberOfMeetings),
    color: colors[i % colors.length],
  }));

  const totalMeetingsByService = apiResponse.getClosingsByServiceAndMonth.totalMeetingsByService.map(item => {
    const service = servicesList.find(service => service.id === item.serviceId);
    const serviceName = service?.displayName || item.serviceId || 'Unknown Service';
    return {
      ...item,
      serviceId: item.serviceId,
      serviceName: serviceName,
      totalMeetingsByMonth: item.totalMeetingsByMonth || []
    };
  });

  const serviceNames = totalMeetingsByService.map(s => s.serviceName);
 
  // Collect all unique months from services data
  const monthSet = new Set<string>();
  totalMeetingsByService.forEach(service => {
    service.totalMeetingsByMonth.forEach(monthData => {
      monthSet.add(monthData.month);
    });
  });
  const monthsSorted = Array.from(monthSet).sort((a, b) => new Date(a + "-01").getTime() - new Date(b + "-01").getTime());

  const closingsByServiceBar: { month: string; [serviceName: string]: number | string }[] = monthsSorted.map(month => {
    const entry: { month: string; [serviceName: string]: number | string } = { month };
    serviceNames.forEach(serviceName => {
      const serviceData = totalMeetingsByService.find(s => s.serviceName === serviceName);
      const monthData = serviceData?.totalMeetingsByMonth.find(m => m.month === month);
      entry[serviceName] = monthData ? parseInt(monthData.numberOfMeetings) : 0;
    });
    return entry;
  });

  // Summary metrics
  const totalClosings = parseInt(apiResponse.getClosingsPerMonth.totalClosings);
  const currentMonthClosings = monthlyClosingsPie.length > 0 ? monthlyClosingsPie[monthlyClosingsPie.length - 1].closings : 0;
  const previousMonthClosings = monthlyClosingsPie.length > 1 ? monthlyClosingsPie[monthlyClosingsPie.length - 2].closings : 0;
  const monthlyGrowth = previousMonthClosings > 0
    ? ((currentMonthClosings - previousMonthClosings) / previousMonthClosings) * 100
    : 0;

  // Prepare agent monthly performance
  const agents = apiResponse.getClosingsPerOwner.totalClosingsPerOwner.map(owner => owner.ownerName);
  const agentMonthlyPerformance: { month: string; [agent: string]: number | string }[] = monthsSorted.map(month => {
    const entry: { month: string; [agent: string]: number | string } = { month };
    agents.forEach(agent => {
      entry[agent] = 0;
    });
    return entry;
  });

  return {
    summaryMetrics: {
      totalClosings,
      currentMonthClosings,
      previousMonthClosings,
      monthlyGrowth,
    },
    monthlyClosingsPie,
    closingsByAgentPie,
    closingsByServiceBar,
    serviceNames, // This will now contain readable names
    agentMonthlyPerformance,
    agents,
  };
};