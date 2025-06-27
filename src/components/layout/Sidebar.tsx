// src/components/Layout/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as BookingsIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PieChartIcon from '@mui/icons-material/PieChart';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import LogoutDialog from '../forms/LogoutDialog';

const drawerWidth = 350;

const Logo = styled('img')({
  width: '180px',
  margin: '20px auto',
  display: 'block',
});

const ProfileSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginTop: 'auto',
}));

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface SidebarItem {
  text: string;
  icon?: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open = true, onClose }) => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const menuItems: SidebarItem[] = [
    { text: 'My Calendar', icon: <CalendarTodayIcon />, path: '/calendar' },
    { text: 'Bookings', icon: <BookingsIcon />, path: '/bookings' },
    { text: 'Dashboard', icon: <PieChartIcon />, path: '/dashboard', adminOnly: true },
    { text: 'Settings', icon: <SettingsIcon />, path: '/profile' },
  ];

  const handleMenuItemClick = () => {
    onClose();
  };

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  // 🔥 FIXED: Proper async logout handler
  const logUserOut = async () => {
    try {
      setLogoutOpen(false);
      await logout();
      
    } catch (error) {
      window.location.href = '/login';
    }
  };

  const handleLogoutClose = () => {
    setLogoutOpen(false);
  };

  const drawerContent = (
    <>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Logo src={logo} alt="First National Title & Insurance Services" />
        <Typography variant="body2" color="text.secondary">
          First National Title & Insurance Services, Inc.
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => {
          if (item.adminOnly && !isAdmin) {
            return null;
          }
          return (
            <ListItem key={item.text}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={handleMenuItemClick}
                selected={location.pathname === item.path}
              >
                <ListItemIcon style={{ color: 'black' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
        <ListItem key="logout">
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon style={{ color: 'black' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
      <ProfileSection sx={{ bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', width: '100%' }}>
          <Avatar
            src={user?.profilePicture}
            alt={user?.fullName}
            sx={{ width: 64, height: 64, mb: 1, border: '2px solid #D3323A' }}
          />
          <Box sx={{ ml: 2, textAlign: 'left' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.fullName || 'Sandra Lopez'}
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary', textDecoration: 'none' }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </ProfileSection>

      {/* 🔥 FIXED: Logout Dialog with proper async handling */}
      <LogoutDialog
        open={logoutOpen}
        onClose={handleLogoutClose}
        onConfirm={logUserOut}
      />
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;