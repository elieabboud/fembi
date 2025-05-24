import React, { useCallback, useEffect, useState } from 'react';
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
import FollowersInput from '../components/profile/FollowersInput';
import { bookingService } from '../services/bookingService';

const Profile: React.FC = () => {
  const { user, isAdmin } = useAuth();
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

  const [followers, setFollowers] = useState<string[]>([]);
  const [globalFollowers, setGlobalFollowers] = useState<string[]>([]);

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

  const fetchFollowers = async () => {
    try {
      const response = await bookingService.getFollowers();
      setFollowers(response);
    } catch (error) {
      console.error('Failed to fetch followers', error);
    }
  };

  const fetchGlobalFollowers = async () => {
    try {
      const response = await bookingService.getGlobalFollowers();
      setGlobalFollowers(response);
    } catch (error) {
      console.error('Failed to fetch global followers', error);
    }
  };

  useEffect(() => {
    fetchFollowers();
    if (isAdmin) {
      fetchGlobalFollowers();
    }
  }, []);

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
              </Box>
              <Box>
              {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '12px', maxWidth: '400px' }}>
                A profile picture helps other users recognize you, and lets you know when you're signed into your account.
              </Typography> */}
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
                      variant='outlined'
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
                      variant='outlined'
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
          
          {followers && (<Box>
            <FollowersInput
              onChange={setFollowers}
              followers= {followers}
              getFollowers={bookingService.getFollowers}
              setFollowers={bookingService.setFollowers}
            />
          </Box>)}

          {isAdmin && globalFollowers && (<Box>
            <FollowersInput
              onChange={setGlobalFollowers}
              followers= {globalFollowers}
              getFollowers={bookingService.getGlobalFollowers}
              setFollowers={bookingService.setGlobalFollowers}
              label='Global Followers'
            />
          </Box>)} 
         

        </Box>
      </Paper>
    </Box>
  );
};

export default Profile;