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

type EnhancedFollowersProps = {
  editMode?: boolean;
  regularFollowers: string[];        // Read-only system followers (grey, no delete)
  loanDetailsFollowers: string[];    // Available loan details followers (dropdown)
  selectedLoanFollowers: string[];   // Selected loan details followers
  addedFollowers: string[];          // User-added followers (removable)
  onToggleLoanFollower: (follower: string) => void;
  onAddFollower: (follower: string) => void;
  onRemoveAddedFollower: (follower: string) => void;
  loading?: boolean;
}

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

  const handleFollowerSelection = (event: any, newValue: string[]) => {
    newValue.forEach(follower => {
      // Check if this is a loan details follower
      if (loanDetailsFollowers.includes(follower)) {
        // Toggle loan follower
        if (!selectedLoanFollowers.includes(follower)) {
          onToggleLoanFollower(follower);
        }
      } else {
        // Add as manual follower if it's a new email
        if (emailRegex.test(follower)) {
          const allExisting = [...regularFollowers, ...selectedLoanFollowers, ...addedFollowers];
          if (!allExisting.includes(follower)) {
            onAddFollower(follower);
          }
        }
      }
    });
  };

  const handleFollowerRemoval = (followerToRemove: string) => {
    if (loanDetailsFollowers.includes(followerToRemove)) {
      // Remove loan follower
      onToggleLoanFollower(followerToRemove);
    } else {
      // Remove manual follower
      onRemoveAddedFollower(followerToRemove);
    }
  };

  // Combine all available options for the dropdown
  const availableOptions = [
    ...loanDetailsFollowers.filter(lf => !selectedLoanFollowers.includes(lf)), // Unselected loan followers
  ];

  // Current selected values for the autocomplete
  const currentValues = [...selectedLoanFollowers, ...addedFollowers];

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
          {/* Regular System Followers (Read-only) */}
          {regularFollowers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                System Followers (automatically included)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {regularFollowers.map((email) => (
                  <Chip
                    size="small"
                    key={`regular-${email}`}
                    label={email}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '16px',
                      backgroundColor: 'grey.300',
                      color: 'text.primary',
                      '& .MuiChip-deleteIcon': {
                        display: 'none', // No delete button for regular followers
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Loan Details Followers (Selected as chips) */}
          {loanDetailsFollowers.length > 0 && !editMode && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Loan Details Followers (select as needed)
              </Typography>
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
                📧 These followers are from the loan details. They are selected by default but you can remove any you don't need using the dropdown below.
              </Alert>
            </Box>
          )}

          {/* Show ALL selected followers as chips (loan + manual) */}
          {(selectedLoanFollowers.length > 0 || addedFollowers.length > 0) && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {/* Selected loan followers */}
                {selectedLoanFollowers.map((email) => (
                  <Chip
                    size="small"
                    key={`selected-loan-${email}`}
                    label={email}
                    onDelete={() => onToggleLoanFollower(email)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '16px',
                      backgroundColor: 'primary.main',
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
                
                {/* Manually added followers */}
                {addedFollowers.map((email) => (
                  <Chip
                    size="small"
                    key={`added-${email}`}
                    label={email}
                    onDelete={() => onRemoveAddedFollower(email)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '16px',
                      backgroundColor: 'secondary.light',
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
            </Box>
          )}

          {/* Add/Remove Followers Dropdown */}
          {!editMode && (
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                multiple
                freeSolo
                options={availableOptions}
                value={[]} // Always empty to act as "add more" field
                onChange={(event, newValue) => {
                  // Handle adding new followers
                  newValue.forEach(follower => {
                    if (typeof follower === 'string') {
                      if (loanDetailsFollowers.includes(follower)) {
                        // Add loan follower
                        if (!selectedLoanFollowers.includes(follower)) {
                          onToggleLoanFollower(follower);
                        }
                      } else {
                        // Add manual follower if valid email
                        if (emailRegex.test(follower)) {
                          const allExisting = [...regularFollowers, ...selectedLoanFollowers, ...addedFollowers];
                          if (!allExisting.includes(follower)) {
                            onAddFollower(follower);
                          }
                        }
                      }
                    }
                  });
                }}
                renderTags={() => null} // Don't show tags in the input (we show them as chips above)
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Add additional follower"
                    placeholder="Select from loan details or type new email..."
                    helperText="Select available followers from the dropdown or type a new email address"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="body2">
                        {option}
                      </Typography>
                      {loanDetailsFollowers.includes(option) && (
                        <Chip 
                          size="small" 
                          label="From Loan" 
                          sx={{ ml: 'auto', fontSize: '0.7rem' }}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}
                sx={{ width: '100%' }}
              />
            </Box>
          )}

          {/* Show selected followers in edit/view mode */}
          {editMode && (selectedLoanFollowers.length > 0 || addedFollowers.length > 0) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selected Followers
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {selectedLoanFollowers.map((email) => (
                  <Chip
                    size="small"
                    key={`edit-loan-${email}`}
                    label={email}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '16px',
                      backgroundColor: 'primary.main',
                      color: 'common.white',
                    }}
                  />
                ))}
                {addedFollowers.map((email) => (
                  <Chip
                    size="small"
                    key={`edit-added-${email}`}
                    label={email}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '16px',
                      backgroundColor: 'secondary.light',
                      color: 'common.white',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Summary */}
          {/* <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Total followers: {totalFollowers}
            {regularFollowers.length > 0 && ` • ${regularFollowers.length} system`}
            {selectedLoanFollowers.length > 0 && ` • ${selectedLoanFollowers.length} from loan`}
            {addedFollowers.length > 0 && ` • ${addedFollowers.length} additional`}
          </Typography> */}
        </>
      )}
    </Box>
  );
};

export default EnhancedFollowers;