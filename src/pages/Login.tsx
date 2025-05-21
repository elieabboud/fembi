import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Microsoft as MicrosoftIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import image from '../assets/login.png';

const Login: React.FC = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleMicrosoftLogin = async () => {
    try {
      // This will redirect to Microsoft login page, no popup
      await login();
      // Note: The following code won't execute immediately due to the redirect
      // The redirect handling is now done in AuthContext useEffect
    } catch (error) {
      console.error('Login redirect failed:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Grid container sx={{ height: '100%' }}>
        {/* Left side - Image */}
        <Grid item xs={12} md={6} sx={{ 
          display: { xs: 'none', md: 'flex' },
          backgroundImage: `url(${image})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        
        {/* Right side - Login form */}
        <Grid item xs={12} md={6} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 8
            }}
          >
            <img src={logoImg} alt="FNTIS Logo" style={{ width: '200px', marginBottom: '16px' }} />
            <Typography component="h1" variant="h5" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
              welcome to fembi bookings
            </Typography>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MicrosoftIcon />}
              onClick={handleMicrosoftLogin}
              sx={{ 
                mt: '100px',
                padding: '10px 20px',
              }}
            >
              Log in using Microsoft
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;