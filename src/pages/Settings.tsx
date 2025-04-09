import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import ConfirmDialog from '../components/common/ConfirmDialog';

interface TabPanelProps {
  value: number;
  index: number;
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => {
  return (
    <div role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    calendarSync: true,
    reminderAlerts: true,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleToggleChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
  };

  const handleDeleteAccount = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    // Handle account deletion logic here
    setConfirmDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Paper elevation={0} sx={{ mt: 3, borderRadius: 1 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="General" />
          <Tab label="Notifications" />
          <Tab label="Security" />
          <Tab label="Account" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <TextField
                fullWidth
                label="Company Name"
                defaultValue="First National Title & Insurance"
                margin="normal"
              />
              <TextField
                fullWidth
                label="Address"
                defaultValue="123 Business Ave, Suite 100"
                margin="normal"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    defaultValue="Springfield"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="State"
                    defaultValue="FL"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    defaultValue="33412"
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Phone Number"
                defaultValue="(555) 555-5555"
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                defaultValue="info@firstnational.com"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                System Preferences
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Default Calendar View"
                    secondary="Choose between month, week, or day view"
                  />
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    defaultValue="month"
                    sx={{ width: 120 }}
                  >
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                  </TextField>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Time Format"
                    secondary="Choose between 12-hour or 24-hour format"
                  />
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    defaultValue="12h"
                    sx={{ width: 120 }}
                  >
                    <option value="12h">12-hour</option>
                    <option value="24h">24-hour</option>
                  </TextField>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Default Language"
                    secondary="Set your preferred language"
                  />
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    defaultValue="en"
                    sx={{ width: 120 }}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </TextField>
                </ListItem>
              </List>
              <Button variant="contained" sx={{ mt: 2 }}>
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive booking confirmations and updates via email"
              />
              <Switch
                edge="end"
                checked={notificationSettings.emailNotifications}
                onChange={() => handleToggleChange('emailNotifications')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="SMS Notifications"
                secondary="Receive booking alerts via text message"
              />
              <Switch
                edge="end"
                checked={notificationSettings.smsNotifications}
                onChange={() => handleToggleChange('smsNotifications')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Calendar Sync"
                secondary="Automatically sync bookings with your calendar"
              />
              <Switch
                edge="end"
                checked={notificationSettings.calendarSync}
                onChange={() => handleToggleChange('calendarSync')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Reminder Alerts"
                secondary="Receive reminders before scheduled bookings"
              />
              <Switch
                edge="end"
                checked={notificationSettings.reminderAlerts}
                onChange={() => handleToggleChange('reminderAlerts')}
              />
            </ListItem>
          </List>
          <Button variant="contained" sx={{ mt: 2 }}>
            Save Notification Settings
          </Button>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Change Password
              </Typography>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                margin="normal"
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                margin="normal"
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                margin="normal"
              />
              <Button variant="contained" sx={{ mt: 2 }}>
                Update Password
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add an extra layer of security to your account with two-factor authentication.
              </Typography>
              <Button variant="outlined">
                Enable Two-Factor Authentication
              </Button>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Session Management
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Review and manage your active sessions.
                </Typography>
                <Button variant="outlined">
                  View Active Sessions
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Account Settings */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Account Type"
                secondary="Administrator"
              />
              <Button variant="outlined" size="small">
                Upgrade
              </Button>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Account Status"
                secondary="Active"
              />
              <Button variant="outlined" size="small" color="warning">
                Deactivate
              </Button>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Data Export"
                secondary="Download all your data in a CSV format"
              />
              <Button variant="outlined" size="small">
                Export
              </Button>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Delete Account"
                secondary="Permanently delete your account and all data"
              />
              <Button 
                variant="outlined" 
                size="small" 
                color="error"
                onClick={handleDeleteAccount}
              >
                Delete
              </Button>
            </ListItem>
          </List>
        </TabPanel>
      </Paper>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialogOpen(false)}
        confirmColor="error"
      />
    </Box>
  );
};

export default Settings;