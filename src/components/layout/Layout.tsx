// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Typography, Container } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar'; 
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // If not authenticated, don't render the layout
  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <Box sx={{ display: 'flex', height:'100vh'}}>
      {/* Sidebar */}
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />

      {/* Main content */}
      <Box
        component="main"
        className='main-content'
      >
        {/* Mobile app bar */}
        <AppBar
          position="fixed"
          sx={{
            display: { xs: 'block', sm: 'none' },
            width: { sm: `calc(100% - 250px)` },
            ml: { sm: `250px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              FNTIS Booking
            </Typography>
          </Toolbar>
        </AppBar>
        
        {/* Toolbar spacer for mobile */}
        <Toolbar sx={{ display: { xs: 'block', sm: 'none' } }} />
        
        {/* Page content */}
        <Container 
        maxWidth={false} 
        className='main-container'>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;