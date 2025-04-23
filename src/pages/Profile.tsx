import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { stringify } from 'querystring';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePicture || null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Sandra Lopez',
    email: user?.email || 'sandra.lopez@fntis.com',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    // followers: stringify(user?.followers || 0),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update logic
    console.log('Updated profile:', formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{fontSize: '36px', fontWeight:'bold'}}>
        Profile
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box sx={{display: 'flex',flexDirection: 'column', justifyContent: 'space-between', alignItems: 'start', flexGrow: 1}}>
            {/* Profile photo */}
            <Box  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', width:{xs: 'auto'}, justifyContent:'center' }}>
              <Box sx={{ display: 'flex', flexDirection:{xs: 'column', md: 'row'}, alignItems: 'center', width: '100%', justifyContent:'center', mb:{xs: 2, md: 0} }}>
                <Avatar
                  src={profileImage || ''}
                  alt={formData.fullName}
                  sx={{ width: 200, height: 200, mb: 2, border: '4px solid #1A3674' }}
                />
                <Box sx={{display: 'flex', flexDirection: 'column', ml: 2}}>
                  <Button
                    component="label"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 1, height: '50px', width: '200px' }}
                  >
                    Change
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="error"
                    sx={{ mt: 1, height: '50px',  width: '200px' }}
                    onClick={() => setProfileImage(null)}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
              <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '12px', maxWidth: '400px' }}>
                A profile picture helps other users recognize you, and lets you know when you're signed into your account.
              </Typography>
              </Box>
            </Box>
          {/* Profile Form */}
            <Box width={'100%'}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection:{xs: 'column', md:'row'}, gap: 2 }}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Email"
                      variant='filled'
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      InputProps={{
                        readOnly: true,
                        sx: {
                          userSelect: 'none',
                          pointerEvents: 'none',
                          },
                      }}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Full Name"
                      variant='filled'
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      InputProps={{
                        readOnly: true,
                        sx: {
                          userSelect: 'none',
                          pointerEvents: 'none',
                          },
                      }}
                    />
                  </Box>
                </Grid>
            </Box>
          </Box>

          <Divider/>

          <Box sx={{ display: 'flex', flexDirection:{xs: 'column', md:'row'}, justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, width: '100%' }}>
  
            {/* Left Part */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ flex: 1, maxWidth: {xs: '100%', md:'50%'} }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Old Password"
                    variant="filled"
                    name="oldPassword"
                    type="password"
                    value={formData.oldPassword}
                    onChange={handleChange}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="New Password"
                    variant="filled"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Confirm Password"
                    variant="filled"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" fullWidth>
                    Update
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Right Part */}
            <Box sx={{ flex: 1, width:'100%', maxWidth: {xs: '100%', md:'50%'} }}>
              <Grid container>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Followers"
                  variant="filled"
                  name="followers"
                  type="text"
                  // value={}
                  onChange={handleChange}
                />
              </Grid>
            </Box>

          </Box>

        </Box>
      </Paper>
    </Box>
  );
};

export default Profile;