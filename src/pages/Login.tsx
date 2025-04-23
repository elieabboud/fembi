import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Grid,
  darken,
} from '@mui/material';
import { Microsoft as MicrosoftIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

const Login: React.FC = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleMicrosoftLogin = async () => {
    try {
      await login();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // This would normally call your backend API
    setLocalLoading(true);
    setTimeout(() => {
      setLocalLoading(false);
      // For demo purposes, we'll just use Microsoft login anyway
      handleMicrosoftLogin();
    }, 1000);
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
      <Grid container  sx={{ height: '100%' }}>
        {/* Left side - Image */}
        <Grid item xs={12} md={6} sx={{ 
          display: { xs: 'none', md: 'flex' },
          backgroundImage: 'url(https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2796&q=80)',
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
            <Typography component="h1" variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>
              WELCOME TO FEMBI BOOKING
            </Typography>
            
            <Box component="form" onSubmit={handleStandardLogin} sx={{ width: '100%', mt: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Login</Typography>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Company Email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused': {
                        borderColor: 'red', // Change this to your desired color
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Password</Typography>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  padding: '10px 20px',
                  backgroundColor: '#D3323A',
                  '&:hover': {
                    backgroundColor: darken('#D3323A', 0.2), // Darken the color by 20%
                  },
                  color: 'white',
                }}
                disabled={localLoading}
              >
                {localLoading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Box>
            
            <Divider sx={{ width: '100%', my: 3 }}> or </Divider>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MicrosoftIcon />}
              onClick={handleMicrosoftLogin}
              sx={{ 
                mt: 1, 
                mb: 2 ,
                padding: '10px 20px',  }}
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