import React, { FC, SyntheticEvent, useState, useEffect } from 'react';
import { Box, Autocomplete, TextField, Chip, Avatar } from '@mui/material';
import { User } from '../../types/userModel';

interface LoanAgentsInputProps {
  agents: User[];
  onChange?: (newSelectedAgents: User[]) => void;
  setAgents?: (agents: User[]) => Promise<void>;
  label?: string;
  initialSelectedAgents?: User[];
}

const LoanAgentsInput: FC<LoanAgentsInputProps> = ({
  agents,
  onChange,
  setAgents,
  label = "Loan Agents"
}) => {
  // Initialize selectedAgents with all agents
  const [selectedAgents, setSelectedAgents] = useState<User[]>(agents);

  // Update onChange when selectedAgents changes
  useEffect(() => {
    if (onChange && selectedAgents.length > 0) {
      onChange(selectedAgents);
    }
  }, [selectedAgents]);

  const updateAgentsBackend = async (newSelectedAgents: User[]) => {
    if (!setAgents) return;
    try {
      await setAgents(newSelectedAgents);
      if (onChange) onChange(newSelectedAgents);
    } catch (error) {
      console.error('Failed to update agents:', error);
    }
  };

  const handleAgentsChange = (_event: SyntheticEvent, newValue: User[]) => {
    setSelectedAgents(newValue);
    if (onChange) onChange(newValue);
    
    // If there's a backend update function, call it
    if (setAgents) {
      updateAgentsBackend(newValue);
    }
  };

  return (
    
    <Box sx={{ flex: 1, width: '100%' }}>
      <Autocomplete
        multiple
        options={agents}
        value={selectedAgents}
        onChange={handleAgentsChange}
        getOptionLabel={(option) => option.email || ''}
        isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
        renderTags={(value: User[], getTagProps) =>
          value.map((option: User, index: number) => {
            const tagProps = getTagProps({ index });
            const { key, ...otherProps } = tagProps;
            return (
              <Chip
                key={key}
                label={option.first_name || option.email}
                variant="outlined"
                // avatar={option.profilePicture ? <Avatar src={option.profilePicture} /> : undefined}
                {...otherProps}
              />
            );
          })
        }
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          
          return (
            <Box 
              component="li" 
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }} 
              key={key}
              {...otherProps}
            >
              <span>{option.first_name}</span>
              <span style={{ color: 'gray', marginLeft: 'auto', fontSize: '0.8rem' }}>{option.email}</span>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={label}
            placeholder="Select loan agents"
          />
        )}
      />
    </Box>
    
  );

};

export default LoanAgentsInput;