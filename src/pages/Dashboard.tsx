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
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  EventRepeat as RescheduleIcon,
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
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<dashboardStats | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = async (isRetry: boolean = false) => {
    try {
      if (isRetry) {
        setError(null);
      } else {
        setLoading(true);
      }

      let agents: User[] = [];
      let services: any[] = [];
      let apiResponse: dashboardResponseDTO | null = null;

      try {
        const agentsResponse = await bookingService.getUsers({ tableName: 'user' });
        agents = (agentsResponse?.result as unknown as User[]) || [];
      } catch (agentsError) {
        console.warn('⚠️ Failed to load agents:', agentsError);
      }

      try {
        services = await bookingService.getAvailableServices();
      } catch (servicesError) {
        console.warn('⚠️ Failed to load services:', servicesError);
      }

      try {
        apiResponse = await dashboardService.getDashboardData();
        console.log('Dashboard data loaded:', apiResponse);
      } catch (dashboardError) {
        console.warn('⚠️ Failed to load dashboard data:', dashboardError);
        throw new Error('Unable to load dashboard data. Please try again.');
      }

      const mappedStats = mapApiResponseToDashboardStats(apiResponse, agents, services);
      setStats(mappedStats);
      setError(null);
      
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      setStats({
        summaryMetrics: {
          totalClosings: 0,
          currentMonthClosings: 0,
          previousMonthClosings: 0,
          monthlyGrowth: 0,
          totalCancellations: 0,
          currentMonthCancellations: 0,
          totalReschedules: 0,
          currentMonthReschedules: 0,
        },
        monthlyClosingsPie: [],
        monthlyCancellationsPie: [],
        monthlyReschedulesPie: [],
        closingsByAgentPie: [],
        closingsByServiceBar: [],
        cancellationsByServiceBar: [],
        reschedulesByServiceBar: [],
        serviceNames: [],
        agentMonthlyPerformance: [],
        agents: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchData(true);
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="h6">Loading dashboard data...</Typography>
          {retryCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              Retry attempt {retryCount}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  const showErrorAlert = error && !loading;

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon, 
    color = 'primary',
    subtitle,
    isError = false
  }: {
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    subtitle?: string;
    isError?: boolean;
  }) => (
    <Card 
      sx={{ 
        height: '100%',
        border: `1px solid ${alpha(theme.palette.grey[300], 0.12)}`,
        boxShadow: 'none',
        opacity: isError ? 0.7 : 1,
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
            {change !== undefined && !isError && (
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
            {isError && (
              <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                Data unavailable
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(theme.palette[isError ? 'error' : color].main, 0.08),
              color: theme.palette[isError ? 'error' : color].main,
            }}
          >
            {isError ? <WarningIcon /> : icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  const ChartCard = ({ 
    title, 
    children, 
    action,
    isEmpty = false
  }: { 
    title: string; 
    children: React.ReactNode; 
    action?: React.ReactNode;
    isEmpty?: boolean;
  }) => (
    <Card 
      sx={{ 
        border: `1px solid ${alpha(theme.palette.grey[300], 0.12)}`,
        boxShadow: 'none',
        height: '100%',
        opacity: isEmpty ? 0.7 : 1,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {action}
            {showErrorAlert && (
              <IconButton onClick={handleRetry} color="primary" size="small">
                <RefreshIcon />
              </IconButton>
            )}
          </Box>
        </Stack>
        {isEmpty ? (
          <Box sx={{ 
            height: 300, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <WarningIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No data available
            </Typography>
          </Box>
        ) : (
          children
        )}
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

  const safeStats = stats || {
    summaryMetrics: { 
      totalClosings: 0, 
      currentMonthClosings: 0, 
      previousMonthClosings: 0, 
      monthlyGrowth: 0,
      totalCancellations: 0,
      currentMonthCancellations: 0,
      totalReschedules: 0,
      currentMonthReschedules: 0,
    },
    monthlyClosingsPie: [],
    monthlyCancellationsPie: [],
    monthlyReschedulesPie: [],
    closingsByAgentPie: [],
    closingsByServiceBar: [],
    cancellationsByServiceBar: [],
    reschedulesByServiceBar: [],
    serviceNames: [],
    agentMonthlyPerformance: [],
    agents: [],
  };

  const hasData = safeStats.summaryMetrics.totalClosings > 0 || 
                  safeStats.monthlyClosingsPie.length > 0 || 
                  safeStats.closingsByAgentPie.length > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor business performance and analytics through data insights.
        </Typography>
        
        {showErrorAlert && (
          <Alert 
            severity="warning" 
            sx={{ mt: 2 }}
            action={
              <IconButton size="small" onClick={handleRetry} color="inherit">
                <RefreshIcon />
              </IconButton>
            }
          >
            <Typography variant="body2">
              <strong>Data Loading Issue:</strong> {error}
            </Typography>
            <Typography variant="caption" display="block">
              Showing available data. Click refresh to retry.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Enhanced Metrics Cards - Now with 6 cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Total Closings"
            value={safeStats.summaryMetrics.totalClosings}
            icon={<EventIcon />}
            color="primary"
            subtitle="This year's closings"
            isError={!hasData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Current Month"
            value={safeStats.summaryMetrics.currentMonthClosings}
            icon={<TrendingUpIcon />}
            color="success"
            subtitle="This month's closings"
            isError={!hasData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Monthly Growth"
            value={`${safeStats.summaryMetrics.monthlyGrowth.toFixed(1)}%`}
            change={safeStats.summaryMetrics.monthlyGrowth}
            changeType={safeStats.summaryMetrics.monthlyGrowth >= 0 ? 'increase' : 'decrease'}
            icon={<PeopleIcon />}
            color={safeStats.summaryMetrics.monthlyGrowth >= 0 ? 'success' : 'error'}
            isError={!hasData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Total Cancellations"
            value={safeStats.summaryMetrics.totalCancellations}
            icon={<CancelIcon />}
            color="error"
            subtitle="All-time cancellations"
            isError={!hasData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="This Month Cancelled"
            value={safeStats.summaryMetrics.currentMonthCancellations}
            icon={<CancelIcon />}
            color="warning"
            subtitle="Current month cancellations"
            isError={!hasData}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Total Reschedules"
            value={safeStats.summaryMetrics.totalReschedules}
            icon={<RescheduleIcon />}
            color="secondary"
            subtitle="All-time reschedules"
            isError={!hasData}
          />
        </Grid>
      </Grid>

      {/* First Row of Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Closings by Agent */}
        <Grid item xs={12} md={4}>
          <ChartCard 
            title="Closings per officer"
            isEmpty={safeStats.closingsByAgentPie.length === 0}
          >
            {safeStats.closingsByAgentPie.length > 0 ? (
              <>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={safeStats.closingsByAgentPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="closings"
                        nameKey="agentFirstName"
                      >
                        {safeStats.closingsByAgentPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {safeStats.closingsByAgentPie.slice(0, 4).map((agent, index) => (
                    <AgentCard 
                      key={index}
                      firstName={agent.agentFirstName}
                      lastName={agent.agentLastName}
                      closings={agent.closings} 
                      color={agent.color}
                    />
                  ))}
                </Stack>
              </>
            ) : null}
          </ChartCard>
        </Grid>

        {/* Monthly Closings Trend */}
        <Grid item xs={12} md={8}>
          <ChartCard 
            title="Monthly Closings Trend"
            isEmpty={safeStats.monthlyClosingsPie.length === 0}
            action={
              safeStats.monthlyClosingsPie.length > 0 ? (
                <Chip 
                  label={`${safeStats.summaryMetrics.monthlyGrowth >= 0 ? '(+' : '('}${safeStats.summaryMetrics.monthlyGrowth.toFixed(1)}%) than last month`} 
                  size="small" 
                  color={safeStats.summaryMetrics.monthlyGrowth >= 0 ? 'success' : 'error'} 
                  variant="outlined" 
                />
              ) : undefined
            }
          >
            {safeStats.monthlyClosingsPie.length > 0 ? (
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeStats.monthlyClosingsPie}>
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
            ) : null}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Second Row - New Cancellations and Reschedules Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Cancellations Trend */}
        <Grid item xs={12} md={6}>
          <ChartCard 
            title="Monthly Cancellations Trend"
            isEmpty={safeStats.monthlyCancellationsPie.length === 0}
          >
            {safeStats.monthlyCancellationsPie.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeStats.monthlyCancellationsPie}>
                    <defs>
                      <linearGradient id="colorCancellations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0}/>
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
                      dataKey="cancellations" 
                      stroke={theme.palette.error.main}
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCancellations)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : null}
          </ChartCard>
        </Grid>

        {/* Monthly Reschedules Trend */}
        <Grid item xs={12} md={6}>
          <ChartCard 
            title="Monthly Reschedules Trend"
            isEmpty={safeStats.monthlyReschedulesPie.length === 0}
          >
            {safeStats.monthlyReschedulesPie.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeStats.monthlyReschedulesPie}>
                    <defs>
                      <linearGradient id="colorReschedules" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
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
                      dataKey="reschedules" 
                      stroke={theme.palette.secondary.main}
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorReschedules)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : null}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Third Row - Service Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <ChartCard 
            title="Team Performance Comparison (Closings by Service)"
            isEmpty={safeStats.closingsByServiceBar.length === 0 || safeStats.serviceNames.length === 0}
          >
            {safeStats.closingsByServiceBar.length > 0 && safeStats.serviceNames.length > 0 ? (
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeStats.closingsByServiceBar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                   {safeStats.serviceNames.map((serviceName, index) => (
                      <Bar
                        key={serviceName}
                        dataKey={serviceName}
                        name={serviceName}
                        fill={['#2e7d32', '#ffc107', '#1976d2', '#d32f2f', '#9c27b0', '#ff5722'][index % 6]}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : null}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Fourth Row - Cancellations and Reschedules by Service */}
      <Grid container spacing={3}>
        {/* Cancellations by Service */}
        <Grid item xs={12} md={6}>
          <ChartCard 
            title="Cancellations by Service"
            isEmpty={safeStats.cancellationsByServiceBar.length === 0 || safeStats.serviceNames.length === 0}
          >
            {safeStats.cancellationsByServiceBar.length > 0 && safeStats.serviceNames.length > 0 ? (
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeStats.cancellationsByServiceBar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                   {safeStats.serviceNames.map((serviceName, index) => (
                      <Bar
                        key={serviceName}
                        dataKey={serviceName}
                        name={serviceName}
                        fill={['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'][index % 6]}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : null}
          </ChartCard>
        </Grid>

        {/* Reschedules by Service */}
        <Grid item xs={12} md={6}>
          <ChartCard 
            title="Reschedules by Service"
            isEmpty={safeStats.reschedulesByServiceBar.length === 0 || safeStats.serviceNames.length === 0}
          >
            {safeStats.reschedulesByServiceBar.length > 0 && safeStats.serviceNames.length > 0 ? (
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeStats.reschedulesByServiceBar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                   {safeStats.serviceNames.map((serviceName, index) => (
                      <Bar
                        key={serviceName}
                        dataKey={serviceName}
                        name={serviceName}
                        fill={['#ff9800', '#ff5722', '#795548', '#607d8b', '#009688', '#4caf50'][index % 6]}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : null}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Footer info when no data */}
      {!hasData && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              No Dashboard Data Available
            </Typography>
            <Typography variant="body2">
              The dashboard will populate with data once bookings and closings are recorded in the system.
              {error && ' There may also be a temporary connectivity issue.'}
            </Typography>
            {error && (
              <Box sx={{ mt: 2 }}>
                <button 
                  onClick={handleRetry}
                  style={{
                    background: theme.palette.primary.main,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Retry Loading Data
                </button>
              </Box>
            )}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;