import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

import { dashboardStats } from '../types/dashboardStats';
import { dashboardResponseDTO } from '../types/dashboardResponseDTO';
import { mapApiResponseToDashboardStats } from '../utils/general';
import { dashboardService } from '../services/dashboardService';
import { bookingService } from '../services/bookingService';
import { User } from '../types/userModel';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<dashboardStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const agents = (await bookingService.getUsers({ tableName: 'user' })).result as unknown as User[];
        const services = (await bookingService.getAvailableServices());
        const apiResponse: dashboardResponseDTO = await dashboardService.getDashboardData();
        const mappedStats = mapApiResponseToDashboardStats(apiResponse, agents, services);
        setStats(mappedStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon, 
    color = 'primary',
    subtitle 
  }: {
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    subtitle?: string;
  }) => (
    <Card 
      sx={{ 
        height: '100%',
        border: `1px solid ${alpha(theme.palette.grey[300], 0.12)}`,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: alpha(theme.palette.primary.main, 0.25),
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {change !== undefined && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                {changeType === 'increase' ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: changeType === 'increase' ? 'success.main' : 'error.main',
                    fontWeight: 600 
                  }}
                >
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  than last month
                </Typography>
              </Stack>
            )}
          </Box>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(theme.palette[color].main, 0.08),
              color: theme.palette[color].main,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  const ChartCard = ({ 
    title, 
    children, 
    action 
  }: { 
    title: string; 
    children: React.ReactNode; 
    action?: React.ReactNode;
  }) => (
    <Card 
      sx={{ 
        border: `1px solid ${alpha(theme.palette.grey[300], 0.12)}`,
        boxShadow: 'none',
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );

  const AgentCard = ({ firstName, lastName, closings, color }: { firstName: string; lastName: string; closings: number; color: string }) => (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1 }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: color, fontSize: '0.875rem' }}>
        {firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {firstName + ' ' + lastName}
        </Typography>
      </Box>
      <Chip 
        label={closings} 
        size="small" 
        sx={{ 
          minWidth: 40,
          bgcolor: alpha(color, 0.12),
          color: color,
          fontWeight: 600 
        }} 
      />
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor business performance and analytics through data insights.
        </Typography>
      </Box>

      {/* Metrics Cards - Using Real API Data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Closings"
            value={stats.summaryMetrics.totalClosings}
            icon={<EventIcon />}
            color="primary"
            subtitle="This year's closings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Current Month"
            value={stats.summaryMetrics.currentMonthClosings}
            icon={<TrendingUpIcon />}
            color="success"
            subtitle="This month's closings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Previous Month"
            value={stats.summaryMetrics.previousMonthClosings}
            icon={<MoneyIcon />}
            color="warning"
            subtitle="Last month's closings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monthly Growth"
            value={`${stats.summaryMetrics.monthlyGrowth.toFixed(1)}%`}
            change={stats.summaryMetrics.monthlyGrowth}
            changeType={stats.summaryMetrics.monthlyGrowth >= 0 ? 'increase' : 'decrease'}
            icon={<PeopleIcon />}
            color={stats.summaryMetrics.monthlyGrowth >= 0 ? 'success' : 'error'}
          />
        </Grid>
      </Grid>

      {/* Charts Row - Using Real API Data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Closings by Agent - Real Data */}
        <Grid item xs={12} md={4}>
          <ChartCard 
            title="Closings per officer"
          >
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.closingsByAgentPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="closings"
                    nameKey="agentFirstName"
                  >
                    {stats.closingsByAgentPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {stats.closingsByAgentPie.slice(0, 4).map((agent, index) => (
                <AgentCard 
                  key={index}
                  firstName ={agent.agentFirstName}
                  lastName ={agent.agentLastName}
                  closings={agent.closings} 
                  color={agent.color}
                />
              ))}
            </Stack>
          </ChartCard>
        </Grid>

        {/* Monthly Closings Trend - Real Data */}
        <Grid item xs={12} md={8}>
          <ChartCard 
            title="Monthly Closings Trend"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${stats.summaryMetrics.monthlyGrowth >= 0 ? '(+' : '('}${stats.summaryMetrics.monthlyGrowth.toFixed(1)}%) than last month`} 
                  size="small" 
                  color={stats.summaryMetrics.monthlyGrowth >= 0 ? 'success' : 'error'} 
                  variant="outlined" 
                />
              </Box>
            }
          >
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyClosingsPie}>
                  <defs>
                    <linearGradient id="colorClosings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.grey[300], 0.5)} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${alpha(theme.palette.grey[300], 0.12)}`,
                      borderRadius: 8,
                      boxShadow: theme.shadows[4],
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="closings" 
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorClosings)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Service Performance Bar Chart - Real Data */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ChartCard 
            title="Team Performance Comparison (Closings by Service)"
          >
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.closingsByServiceBar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.grey[300], 0.5)} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${alpha(theme.palette.grey[300], 0.12)}`,
                      borderRadius: 8,
                      boxShadow: theme.shadows[4],
                    }}
                  />
                  <Legend />
                  {stats.serviceNames.map((serviceId, index) => (
                    <Bar
                      key={serviceId}
                      dataKey={serviceId}
                      name={serviceId}
                      fill={['#2e7d32', '#ffc107', '#1976d2', '#d32f2f', '#9c27b0', '#ff5722'][index % 6]}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;