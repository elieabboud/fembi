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

    // if (/^SELLER\d*$/.test(groupKey)) {
      
    //   groupKey = 'SELLER';
    // } else if (groupKey.toLowerCase().includes('buy')) {
    //   // Group all buyer-related types under "BUYERS"
    //   groupKey = 'BUYERS';
    // } else if (groupKey.toLowerCase().includes('loan')) {
    //   // Group all loan-related types under their specific category
    //   if (groupKey.toLowerCase().includes('officer')) {
    //     groupKey = 'LOAN_OFFICERS';
    //   } else if (groupKey.toLowerCase().includes('closer')) {
    //     groupKey = 'LOAN_CLOSERS';
    //   } else {
    //     groupKey = 'LOAN_TEAM';
    //   }
    // } else if (groupKey.toLowerCase().includes('process')) {
    //   groupKey = 'PROCESSORS';
    // } else if (groupKey.toLowerCase().includes('manager') || groupKey.toLowerCase().includes('supervisor')) {
    //   groupKey = 'MANAGEMENT';
    // } else if (groupKey.toLowerCase().includes('underwriter')) {
    //   groupKey = 'UNDERWRITERS';
    // } else if (groupKey.toLowerCase().includes('assistant')) {
    //   groupKey = 'ASSISTANTS';
    // } else if (groupKey.toLowerCase().includes('attorney') || groupKey.toLowerCase().includes('legal')) {
    //   groupKey = 'ATTORNEYS';
    // } else if (groupKey.toLowerCase().includes('agent')) {
    //   groupKey = 'AGENTS';
    // } else if (groupKey.toLowerCase().includes('coborrower') || groupKey.toLowerCase().includes('co-borrower')) {
    //   groupKey = 'CO_BORROWERS';
    // }
    
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
    'SELLERS': '#2196F3',             
    'BUYERS': '#2196F3',              
    'AGENTS': '#2196F3',              
    'ATTORNEYS': '#2196F3',           
    'CO_BORROWERS': '#2196F3',        
    'LOAN_OFFICERS': '#2196F3',     
    'LOAN_CLOSERS': '#2196F3',       
    'LOAN_TEAM': '#2196F3',       
    'PROCESSORS': '#2196F3',        
    'MANAGEMENT': '#2196F3',          
    'UNDERWRITERS': '#2196F3',       
    'ASSISTANTS': '#2196F3', 
    'default': '#2196F3'     
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

  const allFollowers = [
    ...regularFollowers.map((email): FollowerWithType => ({ email, type: 'System' })),
    ...selectedLoanFollowers,
    ...addedFollowers.map((email): FollowerWithType => ({ email, type: 'Custom' }))
  ];

  const handleAddCustomFollower = () => {
    if (emailRegex.test(inputValue.trim())) {
      const allExisting = [
        ...regularFollowers,
        ...selectedLoanFollowers.map(f => f.email),
        ...addedFollowers
      ];
      const email = inputValue.trim();
      if (!allExisting.includes(email)) {
        onAddFollower(email);
      }
      setInputValue('');
      setShowAddInput(false);
      setFollowersError(false);
    } else {
      setFollowersError(true);
    }
  };

 const renderUnifiedChip = (follower: FollowerWithType) => {
    const { email, type } = follower;
    const color = getTypeColor(type);

    const isCustom = type === 'Custom';
    const isSystem = type === 'System';
    const canDelete = !isSystem;

    return (
      <Box
        key={email}
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 28,
          borderRadius: '16px',
          overflow: 'hidden',
          mr: 0.5,
          mb: 0.5,
          boxShadow: 1,
        }}
      >
        {/* Type Label */}
        <Box
          sx={{
            backgroundColor: '#193667',
            color: 'white',
            fontSize: '0.7rem',
            px: 1,
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {type.replace(/_/g, ' ')}
        </Box>

        {/* Email */}
        <Box
          sx={{
            backgroundColor: color,
            color: 'white',
            fontSize: '0.7rem',
            px: 1,
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {email}
        </Box>

        {/* Delete Icon */}
        {canDelete && (
          <IconButton
            size="small"
            onClick={() => {
              if (isCustom) {
                onRemoveAddedFollower(email);
              } else {
                onToggleLoanFollower(follower);
              }
            }}
            sx={{
              backgroundColor: color,
              color: 'white',
              height: 28,
              width: 28,
              borderRadius: 0,
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            ✕
          </IconButton>
        )}
      </Box>
    );
  };


  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Followers
      </Typography>

      {loading ? (
        <CircularProgress size={20} sx={{ my: 2 }} />
      ) : (
        <>
          {/* Unified follower display */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {allFollowers.map((follower) => renderUnifiedChip(follower))}
          </Box>

          {/* Available Followers by Group (No Accordions) */}
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>
            Available Team Members
          </Typography>

          {Object.entries(groupFollowersByTypeWithSmartGrouping(loanDetailsFollowers)).map(([type, followers]) => {
            const available = followers.filter(
              f => !selectedLoanFollowers.some(s => s.email === f.email)
            );
            if (available.length === 0) return null;

            return (
              <Box key={type} sx={{ mb: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    color: getTypeColor(type), 
                    fontSize: '0.8rem' 
                  }}
                >
                  {type.replace(/_/g, ' ')} ({available.length} available)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {available.map(f => (
                    <Chip
                      key={f.email}
                      size="small"
                      label={f.email}
                      onClick={() => onToggleLoanFollower(f)}
                      sx={{
                        fontSize: '0.7rem',
                        height: '28px',
                        borderColor: getTypeColor(type),
                        color: getTypeColor(type),
                        '&:hover': {
                          backgroundColor: getTypeColor(type),
                          color: '#193667',
                        },
                        cursor: 'pointer',
                      }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            );
          })}

          {/* Add Custom Follower */}
          <Box sx={{ my: 2 }}>
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
                      e.stopPropagation();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAddInput(false);
                      setInputValue('');
                      setFollowersError(false);
                    }
                  }}
                  error={followersError}
                  helperText={followersError ? "Please enter a valid email address" : "Press Enter to add, Escape to cancel"}
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={handleAddCustomFollower} color="primary">
                  <AddIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Summary */}
          <Typography variant="caption" color="text.secondary">
            Total followers: {regularFollowers.length + selectedLoanFollowers.length + addedFollowers.length}
          </Typography>
        </>
      )}
    </Box>
  );
};


export default EnhancedFollowers;