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
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Add as AddIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

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

// Function to group followers by type with smart grouping
const groupFollowersByTypeWithSmartGrouping = (followers: FollowerWithType[]): { [key: string]: FollowerWithType[] } => {
  const grouped = followers.reduce((acc, follower) => {
    let groupKey = follower.type || 'Other';
    
    // Smart grouping for similar types - MORE AGGRESSIVE GROUPING
    if (groupKey.toLowerCase().includes('sell')) {
      // Group ALL seller-related types under "SELLERS"
      groupKey = 'SELLERS';
    } else if (groupKey.toLowerCase().includes('buy')) {
      // Group all buyer-related types under "BUYERS"
      groupKey = 'BUYERS';
    } else if (groupKey.toLowerCase().includes('loan')) {
      // Group all loan-related types under their specific category
      if (groupKey.toLowerCase().includes('officer')) {
        groupKey = 'LOAN_OFFICERS';
      } else if (groupKey.toLowerCase().includes('closer')) {
        groupKey = 'LOAN_CLOSERS';
      } else {
        groupKey = 'LOAN_TEAM';
      }
    } else if (groupKey.toLowerCase().includes('process')) {
      groupKey = 'PROCESSORS';
    } else if (groupKey.toLowerCase().includes('manager') || groupKey.toLowerCase().includes('supervisor')) {
      groupKey = 'MANAGEMENT';
    } else if (groupKey.toLowerCase().includes('underwriter')) {
      groupKey = 'UNDERWRITERS';
    } else if (groupKey.toLowerCase().includes('assistant')) {
      groupKey = 'ASSISTANTS';
    } else if (groupKey.toLowerCase().includes('attorney') || groupKey.toLowerCase().includes('legal')) {
      groupKey = 'ATTORNEYS';
    } else if (groupKey.toLowerCase().includes('agent')) {
      groupKey = 'AGENTS';
    } else if (groupKey.toLowerCase().includes('coborrower') || groupKey.toLowerCase().includes('co-borrower')) {
      groupKey = 'CO_BORROWERS';
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(follower);
    return acc;
  }, {} as { [key: string]: FollowerWithType[] });

  return grouped;
};

// Color mapping for different follower types
const getTypeColor = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    'SELLERS': '#2196F3',             // Orange for all sellers
    'BUYERS': '#2196F3',              // Green for buyers
    'AGENTS': '#2196F3',              // Purple for agents
    'ATTORNEYS': '#2196F3',           // Brown for attorneys
    'CO_BORROWERS': '#2196F3',        // Blue Grey for co-borrowers
    'LOAN_OFFICERS': '#2196F3',       // Blue
    'LOAN_CLOSERS': '#2196F3',        // Green
    'LOAN_TEAM': '#2196F3',           // Light Blue
    'PROCESSORS': '#2196F3',          // Orange
    'MANAGEMENT': '#2196F3',          // Purple
    'UNDERWRITERS': '#2196F3',        // Red
    'ASSISTANTS': '#2196F3',          // Blue Grey
    'default': '#2196F3'              // Grey
  };
  
  return colorMap[type] || colorMap['default'];
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
  const [showAddInput, setShowAddInput] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Group selected loan followers by type with smart grouping
  const groupedSelectedFollowers = groupFollowersByTypeWithSmartGrouping(selectedLoanFollowers);
  
  // For create mode: Group available followers for selection
  const groupedAvailableFollowers = groupFollowersByTypeWithSmartGrouping(loanDetailsFollowers);

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

  const handleAddCustomFollower = () => {
    if (inputValue && emailRegex.test(inputValue.trim())) {
      const allExisting = [
        ...regularFollowers, 
        ...selectedLoanFollowers.map(slf => slf.email), 
        ...addedFollowers
      ];
      if (!allExisting.includes(inputValue.trim())) {
        onAddFollower(inputValue.trim());
        setInputValue('');
        setShowAddInput(false);
        setFollowersError(false);
      }
    } else {
      setFollowersError(true);
    }
  };

  const totalFollowers = regularFollowers.length + selectedLoanFollowers.length + addedFollowers.length;

  const renderFollowerChip = (follower: FollowerWithType | string, groupType?: string, isRemovable: boolean = true) => {
    const email = typeof follower === 'string' ? follower : follower.email;
    const type = typeof follower === 'string' ? 'Custom' : (groupType || follower.type);
    const color = getTypeColor(type);
    
    return (
      <Chip
        key={email}
        size="small"
        label={email}
        onDelete={!editMode && isRemovable ? () => {
          if (typeof follower === 'string') {
            onRemoveAddedFollower(follower);
          } else {
            onToggleLoanFollower(follower);
          }
        } : undefined}
        sx={{
          fontSize: '0.7rem',
          height: '24px',
          backgroundColor: color,
          color: 'white',
          borderRadius: '12px',
          mr: 0.5,
          mb: 0.5,
          '& .MuiChip-deleteIcon': {
            color: 'rgba(255, 255, 255, 0.8)',
            width: '14px',
            height: '14px',
            '&:hover': {
              color: 'white',
            },
          },
        }}
      />
    );
  };

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
          {/* Edit Mode: Show only selected followers grouped by type */}
          {editMode && (
            <Box sx={{ mb: 2 }}>
              {/* System Followers - Compact Display */}
              {regularFollowers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 'bold', color: '#1976d2' }}>
                    System Followers ({regularFollowers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {regularFollowers.map((email) => (
                      <Chip
                        key={`regular-${email}`}
                        size="small"
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

              {/* Selected Loan Followers Grouped by Type - Compact Display */}
              {Object.keys(groupedSelectedFollowers).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {Object.entries(groupedSelectedFollowers).map(([type, followers]) => (
                    <Box key={type} sx={{ mb: 1.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 1, 
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: getTypeColor(type),
                        }}
                      >
                        {type.replace(/_/g, ' ')} ({followers.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                        {followers.map((follower) => renderFollowerChip(follower, type, false))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Manually Added Followers - Compact Display */}
              {addedFollowers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: '#2196F3',
                    }}
                  >
                    Custom ({addedFollowers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                    {addedFollowers.map((email) => renderFollowerChip(email, 'Custom', false))}
                  </Box>
                </Box>
              )}

              {/* Summary */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Total followers: {totalFollowers}
              </Typography>
            </Box>
          )}

          {/* Create Mode: Show management interface */}
          {!editMode && (
            <>
              {/* Regular System Followers - Compact */}
              {regularFollowers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    System Followers ({regularFollowers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {regularFollowers.map((email) => (
                      <Chip
                        key={`regular-${email}`}
                        size="small"
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

              {/* Loan Details Followers Grouped by Type - Compact */}
              {Object.keys(groupedSelectedFollowers).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {Object.entries(groupedSelectedFollowers).map(([type, followers]) => (
                    <Box key={type} sx={{ mb: 1.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 1, 
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: getTypeColor(type),
                        }}
                      >
                        {type.replace(/_/g, ' ')} ({followers.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                        {followers.map((follower) => renderFollowerChip(follower, type, true))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Manually Added Followers - Compact */}
              {addedFollowers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: '#2196F3',
                    }}
                  >
                    Custom ({addedFollowers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                    {addedFollowers.map((email) => renderFollowerChip(email, 'Custom', true))}
                  </Box>
                </Box>
              )}

              {/* Available Followers Selection (Grouped in Accordions) */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2, fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Available Team Members
                </Typography>
                
                {Object.entries(groupedAvailableFollowers).map(([type, followers]) => {
                  const availableInType = followers.filter(lf => 
                    !selectedLoanFollowers.find(slf => slf.email === lf.email)
                  );
                  
                  if (availableInType.length === 0) return null;
                  
                  return (
                    <Accordion key={type} sx={{ mb: 1, boxShadow: 1 }}>
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                          backgroundColor: getTypeColor(type),
                          color: 'white',
                          minHeight: '48px',
                          '& .MuiAccordionSummary-content': { margin: '8px 0' },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {type.replace(/_/g, ' ')} ({availableInType.length} available)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ backgroundColor: '#f5f5f5', p: 2 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {availableInType.map((follower) => (
                            <Chip
                              key={follower.email}
                              size="small"
                              label={follower.email}
                              onClick={() => onToggleLoanFollower(follower)}
                              variant="outlined"
                              sx={{
                                fontSize: '0.7rem',
                                height: '28px',
                                borderColor: getTypeColor(type),
                                color: getTypeColor(type),
                                '&:hover': {
                                  backgroundColor: getTypeColor(type),
                                  color: 'white',
                                },
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>

              {/* Add Custom Follower */}
              <Box sx={{ mb: 2 }}>
                {!showAddInput ? (
                  <Paper 
                    onClick={() => setShowAddInput(true)}
                    sx={{ 
                      p: 2, 
                      border: '2px dashed #ccc', 
                      cursor: 'pointer', 
                      '&:hover': { borderColor: '#1976d2' } 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <AddIcon color="primary" />
                      <Typography color="primary" variant="body2">
                        Add Custom Follower
                      </Typography>
                    </Box>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                      autoFocus
                      size="small"
                      label="Email Address"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setFollowersError(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCustomFollower();
                        } else if (e.key === 'Escape') {
                          setShowAddInput(false);
                          setInputValue('');
                          setFollowersError(false);
                        }
                      }}
                      error={followersError}
                      helperText={followersError ? "Please enter a valid email address" : "Press Enter to add, Escape to cancel"}
                      sx={{ flex: 1 }}
                    />
                    <IconButton 
                      onClick={handleAddCustomFollower}
                      color="primary"
                      sx={{ mb: followersError ? 2.5 : 0 }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Summary */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Total followers: {totalFollowers}
                {selectedLoanFollowers.length > 0 && ` (${selectedLoanFollowers.length} from team)`}
                {addedFollowers.length > 0 && ` (${addedFollowers.length} custom)`}
              </Typography>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default EnhancedFollowers;