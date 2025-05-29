import React, { FC, SyntheticEvent } from 'react';
import { Box, Autocomplete, TextField, Chip, Avatar } from '@mui/material';
import { User } from '../../types/userModel';

interface LoanAgentsInputProps {
  agents: User[];
  selectedAgents: User[];
  onChange: (newSelectedAgents: User[]) => void;
  label?: string;
}

const LoanAgentsInput: FC<LoanAgentsInputProps> = ({
  agents,
  selectedAgents,
  onChange,
  label = "Loan Officers"
}) => {

  const handleAgentsChange = (_event: SyntheticEvent, newValue: User[]) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ flex: 1, width: '100%' }}>
      <Autocomplete
        multiple
        options={agents}
        value={selectedAgents}
        onChange={handleAgentsChange}
        getOptionLabel={(option) => `${option.first_name} ${option.last_name}` || option.email || ''}
        isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
        disableCloseOnSelect
        renderTags={(value: User[], getTagProps) =>
          value.map((option: User, index: number) => {
            const tagProps = getTagProps({ index });
            const { key, ...otherProps } = tagProps;
            return (
              <Chip
                key={key}
                label={`${option.first_name} ${option.last_name}` || option.email}
                variant="outlined"
                avatar={
                  option.profile_picture ? 
                    <Avatar src={option.profile_picture} sx={{ width: 24, height: 24 }} /> : 
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {(option.first_name?.[0] || '') + (option.last_name?.[0] || '')}
                    </Avatar>
                }
                {...otherProps}
              />
            );
          })
        }
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props;
          
          return (
            <Box 
              component="li" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }} 
              key={key}
              {...otherProps}
            >
              {option.profile_picture ? (
                <Avatar src={option.profile_picture} sx={{ width: 32, height: 32 }} />
              ) : (
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                  {(option.first_name?.[0] || '') + (option.last_name?.[0] || '')}
                </Avatar>
              )}
              <Box sx={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 500 }}>
                  {option.first_name} {option.last_name}
                </div>
                <div style={{ color: 'gray', fontSize: '0.8rem' }}>
                  {option.email}
                </div>
              </Box>
              {selected && (
                <Box sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  ✓
                </Box>
              )}
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={label}
            placeholder={selectedAgents.length === 0 ? "Select loan officers to filter calendar" : "Add or remove officers"}
            helperText={`${selectedAgents.length} of ${agents.length} officers selected`}
          />
        )}
        ChipProps={{
          size: "medium",
          variant: "outlined"
        }}
        sx={{
          '& .MuiAutocomplete-tag': {
            margin: '2px',
          },
          '& .MuiAutocomplete-inputRoot': {
            paddingTop: '8px',
            paddingBottom: '8px',
          }
        }}
      />
    </Box>
  );
};

export default LoanAgentsInput;