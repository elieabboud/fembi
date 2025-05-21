import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
} from '@mui/material';
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
} from 'recharts';

import { dashboardStats } from '../types/dashboardStats';
import { dashboardResponseDTO } from '../types/dashboardResponseDTO';
import { mapApiResponseToDashboardStats } from '../utils/general';
import { dashboardService } from '../services/dashboardService';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<dashboardStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiResponse: dashboardResponseDTO = await dashboardService.getDashboardData();
        const mappedStats = mapApiResponseToDashboardStats(apiResponse);
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

  // Helper for monthly growth color and symbol
  const growthColor = stats.summaryMetrics.monthlyGrowth >= 0 ? '#2e7d32' : '#d32f2f';
  const growthSign = stats.summaryMetrics.monthlyGrowth >= 0 ? '+' : '';

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Sales Dashboard
      </Typography>

      {/* Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: '#fafafa',
              borderRadius: '8px',
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Closings
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.summaryMetrics.totalClosings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              bgcolor: '#fafafa',
              borderRadius: '8px',
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Current Month
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.summaryMetrics.currentMonthClosings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          item
          xs={12}
          sm={4}
        >
          <Card
            sx={{
              bgcolor: stats.summaryMetrics.monthlyGrowth >= 0 ? '#e8f5e9' : '#ffebee',
              borderRadius: '8px',
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Monthly Growth
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  color: growthColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {growthSign}
                {stats.summaryMetrics.monthlyGrowth.toFixed(1)}%
                <Box
                  component="span"
                  sx={{
                    fontSize: '1.25rem',
                    color: growthColor,
                  }}
                >
                  {growthSign === '+' ? '↗' : '↘'}
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 1: Monthly Closings Pie and Closings by Agent Pie */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#fafafa', boxShadow: 'none', borderRadius: '8px' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Monthly Closings Summary
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.monthlyClosingsPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="closings"
                  nameKey="month"
                  label={({ month, closings }) => `${month}: ${closings}`}
                >
                  {stats.monthlyClosingsPie.map((entry, index) => (
                    <Cell key={`cell-month-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#fafafa', boxShadow: 'none', borderRadius: '8px' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Closings by Agent
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.closingsByAgentPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="closings"
                  nameKey="agent"
                  label={({ agent, closings }) => `${agent}: ${closings}`}
                >
                  {stats.closingsByAgentPie.map((entry, index) => (
                    <Cell key={`cell-agent-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 2: Closings by Service Bar Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#fafafa', boxShadow: 'none', borderRadius: '8px' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Team Performance Comparison (Closings by Service)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.closingsByServiceBar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {stats.serviceNames.map((serviceId, index) => (
                  <Bar
                    key={serviceId}
                    dataKey={serviceId}
                    name={serviceId}
                    fill={['#2e7d32', '#ffc107', '#1976d2', '#d32f2f', '#9c27b0', '#ff5722'][index % 6]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 3: New Recommended Charts */}
      <Grid container spacing={3}>
        {/* Monthly Closings Line Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#fafafa', boxShadow: 'none', borderRadius: '8px' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Monthly Closings Trend
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.monthlyClosingsPie.map(({ month, closings }) => ({ month, closings }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="closings" stroke="#1976d2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Agent Performance Over Time Line Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: '#fafafa', boxShadow: 'none', borderRadius: '8px' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Agent Performance Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.agentMonthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                {stats.agents.map((agent, idx) => (
                  <Line
                    key={agent}
                    dataKey={agent}
                    name={agent}
                    stroke={['#2e7d32', '#ffc107', '#1976d2', '#d32f2f', '#9c27b0', '#ff5722'][idx % 6]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
