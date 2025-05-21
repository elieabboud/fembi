import React, { FC, SyntheticEvent, useState, useEffect } from 'react';
import { Box, Autocomplete, TextField, Chip } from '@mui/material';
import { bookingService } from '../../services/bookingService';

interface FollowersInputProps {
  followers: string[];
  onChange?: (newFollowers: string[]) => void;
  options?: string[];
  getFollowers?: () => Promise<string[]>;
  setFollowers?: (followers: string[]) => Promise<void>;
  label?: string;
}

const FollowersInput: FC<FollowersInputProps> = ({
  followers,
  onChange,
  options = [],
  getFollowers,
  setFollowers,
  label = "Followers"
}) => {
  const [internalFollowers, setInternalFollowers] = useState<string[]>(followers);

  useEffect(() => {
    if (getFollowers) {
      getFollowers().then(setInternalFollowers).catch(console.error);
    } else {
      setInternalFollowers(followers);
    }
  }, [followers, getFollowers]);

  const updateFollowersBackend = async (newFollowers: string[]) => {
    if (!setFollowers) return;
    try {
      await setFollowers(newFollowers);
      if (onChange) onChange(newFollowers);
    } catch (error) {
      console.error('Failed to update followers:', error);
    }
  };

  const handleFollowersChange = (_event: SyntheticEvent, newValue: string[]) => {
    setInternalFollowers(newValue);
    updateFollowersBackend(newValue);
  };

  return (
    <Box sx={{ flex: 1, width: '100%' }}>
      <Autocomplete
        multiple
        freeSolo
        options={options}
        value={internalFollowers}
        onChange={handleFollowersChange}
        renderTags={(value: string[], getTagProps) =>
          value.map((option: string, index: number) => {
            const tagProps = getTagProps({ index });
            const { key, ...otherProps } = tagProps;
            return <Chip key={key} label={option} variant="outlined" {...otherProps} />;
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="filled"
            label={label}
            placeholder="Type a name and press Enter"
          />
        )}
      />
    </Box>
  );
};

export default FollowersInput;
