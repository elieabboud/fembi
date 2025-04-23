import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  useTheme,
  Avatar,
  Stack,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  ShoppingBag as BagIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
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
  ResponsiveContainer 
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { bookingService } from '../services/bookingService';

// Sample data structure for the dashboard
interface DashboardStats {
  weeklyClosings: {
    amount: number;
    change: number;
  };
  weeklyCount: {
    count: number;
    change: number;
  };
  monthlyClosings: {
    amount: number;
    change: number;
  };
  monthlyCount: {
    count: number;
    change: number;
  };
  closingsByAgent: {
    agent: string;
    percentage: number;
    color: string;
  }[];
  closingsByMonth: {
    month: string;
    teamA: number;
    teamB: number;
  }[];
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);


  const dynamicWrapperStyle = {
    right: isMobile ? '-25%' : '-30%',
    top: -20,
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch this from your API
        // For demo, we'll just use sample data
        const sampleData: DashboardStats = {
          weeklyClosings: {
            amount: 714000,
            change: 2.6,
          },
          weeklyCount: {
            count: 135,
            change: -0.1,
          },
          monthlyClosings: {
            amount: 1720000,
            change: 2.8,
          },
          monthlyCount: {
            count: 581,
            change: 3.6,
          },
          closingsByAgent: [
            { agent: 'Agent 1', percentage: 43.8, color: '#2e7d32' },
            { agent: 'Agent 2', percentage: 30.9, color: '#ffc107' },
            { agent: 'Agent 3', percentage: 18.8, color: '#1976d2' },
            { agent: 'Agent 4', percentage: 6.5, color: '#D3323A' },
          ],
          closingsByMonth: [
            { month: 'Jan', teamA: 40, teamB: 50 },
            { month: 'Feb', teamA: 30, teamB: 70 },
            { month: 'Mar', teamA: 20, teamB: 45 },
            { month: 'Apr', teamA: 35, teamB: 65 },
            { month: 'May', teamA: 65, teamB: 40 },
            { month: 'Jun', teamA: 65, teamB: 35 },
            { month: 'Jul', teamA: 35, teamB: 25 },
            { month: 'Aug', teamA: 55, teamB: 70 },
            { month: 'Sep', teamA: 25, teamB: 25 },
          ],
        };
        setStats(sampleData);
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
        <Typography variant="h6">Loading dashboard data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Weekly Closings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '180px', borderRadius: '20px', boxShadow:'none' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#2e7d32' }}>
            <Box 
            sx={{
              display: 'flex', 
              alignItems: 'start', 
              justifyContent: 'space-between',
              height: '100%',
            }}>
              <Box
              sx={{
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'start',
              justifyContent: 'space-between',
              height: '100%',
              }}>
                  <BagIcon sx={{ color: '#2e7d32', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{mb: 1}}>
                      Weekly Closings
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                    USD {(stats.weeklyClosings.amount / 1000).toFixed(0)}k
                  </Typography>
              </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stats.weeklyClosings.change >= 0 ? (
                    <Chip
                      icon={<TrendingUpIcon style={{color: '#2e7d32'}} />}
                      label={`+${stats.weeklyClosings.change}%`}
                      size="small"
                      sx={{ color: '#2e7d32', bgcolor:'transparent' }}
                    />
                  ) : (
                    <Chip
                      icon={<TrendingDownIcon style={{color: '#2e7d32'}} />}
                      label={`${stats.weeklyClosings.change}%`}
                      size="small"
                      sx={{ color: '#d32f2f', bgcolor:'transparent' }}
                    />
                  )}
                </Box>
            </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Count */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8eaf6', height: '180px', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#3f51b5' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                    height: '100%',
                  }}
                >
                  <PeopleIcon sx={{ color: '#3f51b5', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Weekly Count
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {stats.weeklyCount.count}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', }}>
                  {stats.weeklyCount.change >= 0 ? (
                    <Chip
                      icon={<TrendingUpIcon style={{color: '#3f51b5'}} />}
                      label={`+${stats.weeklyCount.change}%`}
                      size="small"
                      sx={{ color: '#3f51b5', bgcolor:'transparent' }}
                    />
                  ) : (
                    <Chip
                      icon={<TrendingDownIcon style={{color: '#3f51b5'}}/>}
                      label={`${stats.weeklyCount.change}%`}
                      size="small"
                      sx={{ color: '#d32f2f', bgcolor:'transparent' }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>


        {/* Monthly Closings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff8e1', height: '180px', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ff8f00' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                    height: '100%',
                  }}
                >
                  <MoneyIcon sx={{ color: '#ff8f00', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Monthly Closings
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                    USD {(stats.monthlyClosings.amount / 1000).toFixed(0)}k
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stats.monthlyClosings.change >= 0 ? (
                    <Chip
                      icon={<TrendingUpIcon style={{color: '#ff8f00'}}/>}
                      label={`+${stats.monthlyClosings.change}%`}
                      size="small"
                      sx={{ bgcolor:'transparent', color: '#ff8f00' }}
                    />
                  ) : (
                    <Chip
                      icon={<TrendingDownIcon style={{color: '#ff8f00'}}/>}
                      label={`${stats.monthlyClosings.change}%`}
                      size="small"
                      sx={{ bgcolor:'transparent', color: '#d32f2f' }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>


        {/* Monthly Count */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffebee', height: '180px', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#c62828' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                    height: '100%',
                  }}
                >
                  <ChartIcon sx={{ color: '#c62828', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Monthly Count
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {stats.monthlyCount.count}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stats.monthlyCount.change >= 0 ? (
                    <Chip
                      icon={<TrendingUpIcon style={{color: '#c62828'}}/>}
                      label={`+${stats.monthlyCount.change}%`}
                      size="small"
                      sx={{ bgcolor:'transparent', color: '#c62828' }}
                    />
                  ) : (
                    <Chip
                      icon={<TrendingDownIcon style={{color: '#c62828'}}/>}
                      label={`${stats.monthlyCount.change}%`}
                      size="small"
                      sx={{ bgcolor:'transparent', color: '#d32f2f' }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Closings per Agent - Pie Chart */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6"  sx={{ fontWeight: 'bold' }} gutterBottom>
              Closings per Agent
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={stats.closingsByAgent}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={140}
                  fill="#8884d8"
                  dataKey="percentage"
                  nameKey="agent"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {stats.closingsByAgent.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`}/>
                <Legend/> 
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Closings by Month - Bar Chart */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6"  sx={{ fontWeight: 'bold' }} gutterBottom>
              Closings
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              (+43%) than last year
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.closingsByMonth}>
                <Legend   verticalAlign="top" // or "bottom" or "middle"
                align="center" // or "left" or "right"
                wrapperStyle={dynamicWrapperStyle}/>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="teamA" name="Team A" fill="#2e7d32" />
                <Bar dataKey="teamB" name="Team B" fill="#ff8f00" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Active Agents */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Loan Officer
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            avatar={<Avatar>S</Avatar>}
            label="Sandra Lopez"
            onDelete={() => {}}
            sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}
          />
          <Chip
            avatar={<Avatar>U</Avatar>}
            label="User User"
            onDelete={() => {}}
            sx={{ bgcolor: 'grey.400' }}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default Dashboard;