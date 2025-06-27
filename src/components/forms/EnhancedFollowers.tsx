import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  TextField, 
  CircularProgress, 
  Alert,
  Divider,
  Autocomplete,
  Paper
} from '@mui/material';

// New interface for followers with types
interface FollowerWithType {
  email: string;
  type: string;
}

type EnhancedFollowersProps = {
  editMode?: boolean;
  regularFollowers: string[];        // Read-only system followers (grey, no delete)
  loanDetailsFollowers: FollowerWithType[];    // Available loan details followers with types
  selectedLoanFollowers: FollowerWithType[];   // Selected loan details followers with types
  addedFollowers: string[];          // User-added followers (removable)
  onToggleLoanFollower: (follower: FollowerWithType) => void;
  onAddFollower: (follower: string) => void;
  onRemoveAddedFollower: (follower: string) => void;
  loading?: boolean;
}

// Color mapping for different follower types
const getTypeColor = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    'LoanOfficer': '#1976d2',      // Blue
    'LoanCloser': '#388e3c',       // Green
    'Processor': '#f57c00',        // Orange
    'Manager': '#7b1fa2',          // Purple
    'Underwriter': '#d32f2f',      // Red
    'Assistant': '#455a64',        // Blue Grey
    'default': '#616161'           // Grey
  };
  
  return colorMap[type] || colorMap['default'];
};

// Group followers by type
const groupFollowersByType = (followers: FollowerWithType[]): { [key: string]: FollowerWithType[] } => {
  return followers.reduce((acc, follower) => {
    const type = follower.type || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(follower);
    return acc;
  }, {} as { [key: string]: FollowerWithType[] });
};

const EnhancedFollowers: React.FC<EnhancedFollowersProps> = ({
  regularFollowers,
  loanDetailsFollowers,
  selectedLoanFollowers,
  addedFollowers,
  onToggleLoanFollower,
  onAddFollower,
  onRemoveAddedFollower,
  editMode = false,
  loading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [followersError, setFollowersError] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Group selected loan followers by type
  const groupedSelectedFollowers = groupFollowersByType(selectedLoanFollowers);
  const groupedAvailableFollowers = groupFollowersByType(loanDetailsFollowers);

  const handleFollowerSelection = (event: any, newValue: string[]) => {
    newValue.forEach(follower => {
      // Check if this is a loan details follower
      const loanFollower = loanDetailsFollowers.find(lf => lf.email === follower);
      if (loanFollower) {
        // Toggle loan follower
        if (!selectedLoanFollowers.find(slf => slf.email === follower)) {
          onToggleLoanFollower(loanFollower);
        }
      } else {
        // Add as manual follower if it's a new email
        if (emailRegex.test(follower)) {
          const allExisting = [
            ...regularFollowers, 
            ...selectedLoanFollowers.map(slf => slf.email), 
            ...addedFollowers
          ];
          if (!allExisting.includes(follower)) {
            onAddFollower(follower);
          }
        }
      }
    });
  };

  const handleFollowerRemoval = (followerToRemove: string | FollowerWithType) => {
    if (typeof followerToRemove === 'string') {
      // Remove manual follower
      onRemoveAddedFollower(followerToRemove);
    } else {
      // Remove loan follower
      onToggleLoanFollower(followerToRemove);
    }
  };

  // Combine all available options for the dropdown
  const availableOptions = [
    ...loanDetailsFollowers
      .filter(lf => !selectedLoanFollowers.find(slf => slf.email === lf.email))
      .map(lf => lf.email)
  ];

  const totalFollowers = regularFollowers.length + selectedLoanFollowers.length + addedFollowers.length;

  return (
    <Box sx={{ py: '16px', justifySelf: 'start' }}>
      <Typography variant="h6" gutterBottom>
        Followers
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'start', height: 'auto', mb: 2 }}>
          <CircularProgress size={20} thickness={4} sx={{ my: 1 }} />
        </Box>
      )}

      {!loading && (
        <>
          {/* Regular System Followers */}
          {regularFollowers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem' }}>
                System Followers
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {regularFollowers.map((email) => (
                  <Chip
                    size="small"
                    key={`regular-${email}`}
                    label={email}
                    sx={{
                      fontSize: '0.7rem',
                      height: '24px',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      borderRadius: '12px',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Loan Details Followers Grouped by Type */}
          {Object.keys(groupedSelectedFollowers).length > 0 && (
            <Box sx={{ mb: 2 }}>
              {Object.entries(groupedSelectedFollowers).map(([type, followers]) => (
                <Box key={type} sx={{ mb: 1.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#1976d2',
                    }}
                  >
                    {type} ({followers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                    {followers.map((follower) => (
                      <Chip
                        size="small"
                        key={`selected-loan-${follower.email}`}
                        label={follower.email}
                        onDelete={!editMode ? () => onToggleLoanFollower(follower) : undefined}
                        sx={{
                          fontSize: '0.7rem',
                          height: '24px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          borderRadius: '12px',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 255, 255, 0.8)',
                            width: '16px',
                            height: '16px',
                            '&:hover': {
                              color: 'white',
                            },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Manually Added Followers */}
          {addedFollowers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#1976d2',
                }}
              >
                Additional ({addedFollowers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                {addedFollowers.map((email) => (
                  <Chip
                    size="small"
                    key={`added-${email}`}
                    label={email}
                    onDelete={!editMode ? () => onRemoveAddedFollower(email) : undefined}
                    sx={{
                      fontSize: '0.7rem',
                      height: '24px',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      borderRadius: '12px',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        width: '16px',
                        height: '16px',
                        '&:hover': {
                          color: 'white',
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Add Followers Input */}
          {!editMode && (
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                freeSolo
                options={loanDetailsFollowers
                  .filter(lf => !selectedLoanFollowers.find(slf => slf.email === lf.email))
                  .map(lf => lf.email)}
                value={[]}
               onChange={(event, newValue, reason) => {
                // Only process additions, not removals or other reasons
                if (reason !== 'selectOption' && reason !== 'createOption') return;
                
                // Get only the newly added item (last item in the array)
                const newItem = newValue[newValue.length - 1];
                
                if (typeof newItem === 'string') {
                  const loanFollower = loanDetailsFollowers.find(lf => lf.email === newItem);
                  if (loanFollower) {
                    if (!selectedLoanFollowers.find(slf => slf.email === newItem)) {
                      onToggleLoanFollower(loanFollower);
                    }
                  } else {
                    if (emailRegex.test(newItem)) {
                      const allExisting = [
                        ...regularFollowers, 
                        ...selectedLoanFollowers.map(slf => slf.email), 
                        ...addedFollowers
                      ];
                      if (!allExisting.includes(newItem)) {
                        onAddFollower(newItem);
                      }
                    }
                  }
                }
                }}
                renderTags={() => null}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Add follower"
                    placeholder="Type email or select..."
                    size="small"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '0.875rem',
                      },
                    }}
                    // onKeyDown={(e) => {
                    //   if (e.key === 'Enter') {
                    //     const inputValue = (e.target as HTMLInputElement).value;
                    //     if (inputValue && emailRegex.test(inputValue.trim())) {
                    //       onAddFollower(inputValue.trim());
                    //       (e.target as HTMLInputElement).value = '';
                    //     }
                    //   }
                    // }}
                  />
                )}
                renderOption={(props, option) => {
                  const loanFollower = loanDetailsFollowers.find(lf => lf.email === option);
                  return (
                    <Box component="li" {...props}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {option}
                      </Typography>
                      {loanFollower && (
                        <Chip 
                          size="small" 
                          label={loanFollower.type}
                          sx={{ 
                            ml: 'auto', 
                            fontSize: '0.7rem',
                            height: '20px',
                            backgroundColor: '#1976d2',
                            color: 'white'
                          }}
                        />
                      )}
                    </Box>
                  );
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default EnhancedFollowers;