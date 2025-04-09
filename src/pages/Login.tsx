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
    <Container component="main" maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Grid container sx={{ height: '80vh' }}>
        {/* Left side - Image */}
        <Grid item xs={12} md={6} sx={{ 
          display: { xs: 'none', md: 'flex' },
          backgroundImage: 'url(https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2796&q=80)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '8px 0 0 8px',
        }} />
        
        {/* Right side - Login form */}
        <Grid item xs={12} md={6} component={Paper} elevation={6} square 
          sx={{ borderRadius: { xs: '8px', md: '0 8px 8px 0' } }}
        >
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img src={logoImg} alt="FNTIS Logo" style={{ width: '200px', marginBottom: '16px' }} />
            <Typography component="h1" variant="h5" sx={{ mb: 4 }}>
              WELCOME TO FNTIS BOOKING
            </Typography>
            
            <Box component="form" onSubmit={handleStandardLogin} sx={{ width: '100%', mt: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Login</Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Company Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={localLoading}
              >
                {localLoading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Box>
            
            <Divider sx={{ width: '100%', my: 3 }}>or</Divider>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MicrosoftIcon />}
              onClick={handleMicrosoftLogin}
              sx={{ mt: 1, mb: 2 }}
            >
              Log in using Microsoft
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login;