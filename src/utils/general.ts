import { dashboardResponseDTO } from "../types/dashboardResponseDTO";
import { dashboardStats } from "../types/dashboardStats";

export function toLocalISOString(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return (
    date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds())
  );
}

export const mapApiResponseToDashboardStats = (apiResponse: dashboardResponseDTO): dashboardStats => {
  const colors = ['#2e7d32', '#ffc107', '#1976d2', '#d32f2f', '#9c27b0', '#ff5722'];

  // Monthly closings pie chart data
  const monthlyClosingsPie = apiResponse.getClosingsPerMonth.totalMeetingsPerMonth.map((item, i) => ({
    month: item.month,
    closings: parseInt(item.numberOfMeetings),
    color: colors[i % colors.length],
  }));

  // Closings by owner pie chart data
  const closingsByAgentPie = apiResponse.getClosingsPerOwner.totalClosingsPerOwner.map((owner, i) => ({
    agent: owner.ownerName,
    closings: parseInt(owner.numberOfMeetings),
    color: colors[i % colors.length],
  }));

  // Closings by service bar chart data
  const serviceNames = apiResponse.getClosingsByServiceAndMonth.totalMeetingsByService.map(s => s.serviceId);

  // Collect all unique months from services data
  const monthSet = new Set<string>();
  apiResponse.getClosingsByServiceAndMonth.totalMeetingsByService.forEach(service => {
    service.totalMeetingsByMonth.forEach(monthData => {
      monthSet.add(monthData.month);
    });
  });
  const monthsSorted = Array.from(monthSet).sort((a, b) => new Date(a + "-01").getTime() - new Date(b + "-01").getTime());

  // Build bar chart data: one entry per month, keys per serviceId with closings count
  const closingsByServiceBar: { month: string; [serviceId: string]: number | string }[] = monthsSorted.map(month => {
    const entry: { month: string; [serviceId: string]: number | string } = { month };
    serviceNames.forEach(serviceId => {
      const serviceData = apiResponse.getClosingsByServiceAndMonth.totalMeetingsByService.find(s => s.serviceId === serviceId);
      const monthData = serviceData?.totalMeetingsByMonth.find(m => m.month === month);
      entry[serviceId] = monthData ? parseInt(monthData.numberOfMeetings) : 0;
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

  // Prepare agent monthly performance: 
  // NOTE: If you don't have monthly closings per agent, this will just be zeros.
  // You should replace this with real data when available.
  const agents = apiResponse.getClosingsPerOwner.totalClosingsPerOwner.map(owner => owner.ownerName);
  const agentMonthlyPerformance: { month: string; [agent: string]: number | string }[] = monthsSorted.map(month => {
    const entry: { month: string; [agent: string]: number | string } = { month };
    agents.forEach(agent => {
      // No data for agent per month provided, set 0 or implement real logic here
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
    serviceNames,
    agentMonthlyPerformance,
    agents,
  };
};
