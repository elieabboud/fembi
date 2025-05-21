import React, { useState } from 'react';
import { Box, Typography, Chip, TextField, CircularProgress } from '@mui/material';

type FollowersProps = {
  editMode? : boolean;
  fetchedFollowers: string[]; // Read-only followers from API
  addedFollowers: string[];   // User-added followers that can be removed
  onAddFollower: (follower: string) => void;
  onRemoveFollower: (follower: string) => void;
  loading?: boolean;
}

const Followers: React.FC<FollowersProps> = ({
  fetchedFollowers,
  addedFollowers,
  onAddFollower,
  onRemoveFollower,
  editMode = false,
  loading = false
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddFollower = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newFollower = inputValue.trim();
      
      // Check if the follower is already in either list
      if (!fetchedFollowers.includes(newFollower) && !addedFollowers.includes(newFollower)) {
        onAddFollower(newFollower);
      }
      
      setInputValue(''); // Clear input regardless
    }
  };

  return (
    <Box sx={{ p: '16px', justifySelf: 'start' }}>
      <Typography variant="h6" gutterBottom>
        Followers
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'start', height: 'auto' }}>
          <CircularProgress size={20} thickness={4} sx={{ my: 1 }} />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        {/* Display read-only followers (from API) */}
        {!loading && fetchedFollowers.map((email) => (
          <Chip
            size="small"
            key={`fetched-${email}`}
            label={email}
            sx={{
              textTransform: 'none',
              borderRadius: '16px',
              backgroundColor: 'grey.300', // Different color for read-only
              color: 'text.primary',
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
              backgroundColor: 'primary.light', // Different color for added followers
              color: 'common.white',
            }}
          />
        ))}
      </Box>

      {!editMode && (<TextField
        variant="outlined"
        label="Add follower"
        placeholder="Type and press Enter"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleAddFollower}
        fullWidth
        sx={{mt: '10px'}}
      />)}
    </Box>
  );
};

export default Followers;