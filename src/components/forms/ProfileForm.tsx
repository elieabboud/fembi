import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Avatar,
  Typography,
} from '@mui/material';
import { User } from '../../types/user';

interface ProfileFormProps {
  user: User;
  onSubmit: (userData: Partial<User & { oldPassword?: string; newPassword?: string }>) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSubmit }) => {
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.profilePicture);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear password errors when user types
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match if changing password
    if (formData.newPassword || formData.oldPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      
      if (formData.newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return;
      }
    }
    
    // Prepare data for submission
    const userData: Partial<User> = {
      fullName: formData.fullName,
      email: formData.email,
      profilePicture: profileImage,
    };
    
    // Only include password fields if they were filled
    if (formData.oldPassword && formData.newPassword) {
      onSubmit({
        ...userData,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
    } else {
      onSubmit(userData);
    }
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
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            src={profileImage || ''}
            alt={formData.fullName}
            sx={{ width: 120, height: 120, mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
            A profile picture helps other users recognize you and lets you know when you're signed in.
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
            onClick={() => setProfileImage(undefined)}
          >
            Remove
          </Button>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>Personal Information</Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Typography variant="h6" sx={{ mt: 4 }}>Change Password</Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Current Password"
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
            error={!!passwordError}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!passwordError}
            helperText={passwordError}
          />

          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained">
              Save Changes
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileForm;