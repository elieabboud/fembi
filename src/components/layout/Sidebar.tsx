// src/components/Layout/Sidebar.jsx
import React from 'react';
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
  Contacts as ContactsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const drawerWidth = 250;

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

const Sidebar = ({ open = true, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: 'Calendar', icon: <CalendarIcon />, path: '/calendar' },
    { text: 'Bookings', icon: <BookingsIcon />, path: '/bookings' },
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Contacts', icon: <ContactsIcon />, path: '/contacts' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawerContent = (
    <>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Logo src={logo} alt="First National Title & Insurance Services" />
        <Typography variant="body2" color="text.secondary">
          First National Title & Insurance Services, Inc.
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <ProfileSection>
        <Avatar 
          src={user?.profilePicture} 
          alt={user?.fullName}
          sx={{ width: 64, height: 64, mb: 1 }}
        />
        <Typography variant="subtitle1" fontWeight="bold">
          {user?.fullName || 'Sandra Lopez'}
        </Typography>
        <Box sx={{ display: 'flex', mt: 1 }}>
          <Typography variant="body2" component={Link} to="/profile" sx={{ mr: 2, color: 'text.secondary', textDecoration: 'none' }}>
            View Profile
          </Typography>
          •
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary', cursor: 'pointer' }} onClick={logout}>
            Logout
          </Typography>
        </Box>
      </ProfileSection>
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