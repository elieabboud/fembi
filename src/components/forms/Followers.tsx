import React, { useState } from 'react';
import { Box, Typography, Chip, TextField, CircularProgress, Alert } from '@mui/material';

type FollowersProps = {
  editMode? : boolean;
  fetchedFollowers: string[]; // Read-only followers from API or loan details
  addedFollowers: string[];   // User-added followers that can be removed
  onAddFollower: (follower: string) => void;
  onRemoveFollower: (follower: string) => void;
  loading?: boolean;
  showLoanDetailsInfo?: boolean; // New prop to show if these are from loan details
}

const Followers: React.FC<FollowersProps> = ({
  fetchedFollowers,
  addedFollowers,
  onAddFollower,
  onRemoveFollower,
  editMode = false,
  loading = false,
  showLoanDetailsInfo = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [followersError, setFollowersError] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAddFollower = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newFollower = inputValue.trim();

      if (!emailRegex.test(newFollower)) {
        setFollowersError(true);
        return;
      }

      if (!fetchedFollowers.includes(newFollower) && !addedFollowers.includes(newFollower)) {
        onAddFollower(newFollower);
      }

      setFollowersError(false);
      setInputValue('');
    }
  };

  // Check if we have loan details followers (more than just regular system followers)
  const hasLoanDetailsFollowers = fetchedFollowers.length > 0;

  return (
    <Box sx={{py: '16px', justifySelf: 'start' }}>
      <Typography variant="h6" gutterBottom>
        Followers
      </Typography>

      {/* Show info about loan details followers */}
      {hasLoanDetailsFollowers && !editMode && (
        <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
          📧 Followers from loan details have been automatically loaded and selected. 
          You can remove any you don't need or add additional email addresses.
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'start', height: 'auto' }}>
          <CircularProgress size={20} thickness={4} sx={{ my: 1 }} />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        {/* Display followers from loan details/API (initially selected, can be removed) */}
        {!loading && fetchedFollowers.map((email) => (
          <Chip
            size="small"
            key={`fetched-${email}`}
            label={email}
            onDelete={!editMode ? () => onRemoveFollower(email) : undefined}
            sx={{
              textTransform: 'none',
              borderRadius: '16px',
              backgroundColor: 'primary.main', // Primary color for loan details followers
              color: 'common.white',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  color: 'common.white',
                },
              },
            }}
          />
        ))}
        
        {/* Display user-added followers (can be removed) */}
        {addedFollowers.map((email) => (
          <Chip
            size="small"
            key={`added-${email}`}
            label={email}
            onDelete={() => onRemoveFollower(email)}
            sx={{
              textTransform: 'none',
              borderRadius: '16px',
              backgroundColor: 'secondary.light', // Different color for manually added followers
              color: 'common.white',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  color: 'common.white',
                },
              },
            }}
          />
        ))}
      </Box>

      {followersError && (
        <Box sx={{ display: 'flex', justifyContent: 'start', height: 'auto', color: 'red' }}>
          Please enter a valid email address.
        </Box>
      )}

      {!editMode && (
        <TextField
          variant="outlined"
          label="Add additional follower"
          placeholder="Type email and press Enter"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddFollower}
          fullWidth
          sx={{mt: '10px'}}
          helperText={
            hasLoanDetailsFollowers 
              ? "Loan details followers are automatically selected above. Add any additional emails here."
              : "Add follower email addresses who should receive notifications."
          }
        />
      )}

      {/* Show count */}
      {(fetchedFollowers.length > 0 || addedFollowers.length > 0) && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Total followers: {fetchedFollowers.length + addedFollowers.length}
          {fetchedFollowers.length > 0 && ` (${fetchedFollowers.length} from loan details)`}
          {addedFollowers.length > 0 && ` (${addedFollowers.length} manually added)`}
        </Typography>
      )}
    </Box>
  );
};

export default Followers;