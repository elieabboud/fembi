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
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* Profile Image */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              src={profileImage || ''}
              alt={formData.fullName}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              A profile picture helps other users recognize you, and lets you know when you're signed into your account.
            </Typography>
            <Button
              component="label"
              variant="contained"
              sx={{ mt: 1 }}
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
              color="error"
              sx={{ mt: 1 }}
              onClick={() => setProfileImage(null)}
            >
              Remove
            </Button>
          </Box>

          {/* Profile Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Personal Information</Typography>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Change Password</Typography>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Old Password"
                  name="oldPassword"
                  type="password"
                  value={formData.oldPassword}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  Update
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Profile;