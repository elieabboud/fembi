import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, TextField } from '@mui/material';
import { bookingService } from '../../services/bookingService';

type FollowersProps = {
  followers: string[];
  onChange?: (followers: string[]) => void;
}

const Followers: React.FC<FollowersProps> = ({followers, onChange}) => 
  {
  const [internalFollowers, setInternalFollowers] = useState<string[]>(followers);
  const [inputValue, setInputValue] = useState('');

  const handleAddFollower = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newFollower = inputValue.trim();
      if (!followers.includes(newFollower)) {
        const updated = [...internalFollowers, newFollower];
        setInternalFollowers(updated);
        onChange?.(updated);
      }
      setInputValue('');
    }
  };

  useEffect(() => {
    setInternalFollowers(followers);
  }, [followers]);

  return (
    <Box sx={{ maxWidth: 360, p: '16px', justifySelf: 'start' }}>
      <Typography variant="h6" gutterBottom>
        Followers
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        {internalFollowers.map((email) => (
          <Chip
            size="small"
            key={email}
            label={email}
            sx={{
              textTransform: 'none',
              borderRadius: '16px',
              backgroundColor: 'grey.400',
              color: 'common.white',
            }}
          />
        ))}
      </Box>

      <TextField
        variant="filled"
        label="Add follower"
        placeholder="Type and press Enter"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleAddFollower}
        fullWidth
      />
    </Box>
  );
};

export default Followers;
