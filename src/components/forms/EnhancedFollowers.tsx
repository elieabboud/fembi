// src/components/forms/EnhancedFollowers.tsx - Fixed version
import React, { useState, useCallback } from 'react';
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
  AccordionDetails,
  Button
} from '@mui/material';
import { Add as AddIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import BorrowerSelection from './BorrowerSelection';
import { BorrowersDTO } from '../../types/loanDetails';

interface FollowerWithType {
  email: string;
  type: string;
}

type EnhancedFollowersProps = {
  editMode?: boolean;
  regularFollowers: string[]; 
  loanDetailsFollowers: FollowerWithType[];
  selectedLoanFollowers: FollowerWithType[]; 
  addedFollowers: string[]; 
  borrowers?: BorrowersDTO[];  
  selectedBorrowerEmails: string[]; 
  onToggleLoanFollower: (follower: FollowerWithType) => void;
  onAddFollower: (follower: string) => void;
  onRemoveAddedFollower: (follower: string) => void;
  onBorrowerSelectionChange: (selectedEmails: string[]) => void;
  loading?: boolean;
}

const groupFollowersByTypeWithSmartGrouping = (followers: FollowerWithType[]): { [key: string]: FollowerWithType[] } => {
  const grouped = followers.reduce((acc, follower) => {
    let groupKey = follower.type || 'Other';
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(follower);
    return acc;
  }, {} as { [key: string]: FollowerWithType[] });

  return grouped;
};

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
    'BORROWERS': '#4CAF50',
    'System': '#2196F3',
    'Custom': '#FF5722',
    'default': '#2196F3'     
  };
  
  return colorMap[type] || colorMap['default'];
};

const EnhancedFollowers: React.FC<EnhancedFollowersProps> = ({
  regularFollowers,
  loanDetailsFollowers,
  selectedLoanFollowers,
  addedFollowers,
  borrowers = [],
  selectedBorrowerEmails,
  onToggleLoanFollower,
  onAddFollower,
  onRemoveAddedFollower,
  onBorrowerSelectionChange,
  editMode = false,
  loading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [followersError, setFollowersError] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Create borrower followers from selected emails
  const borrowerFollowers: FollowerWithType[] = selectedBorrowerEmails.map(email => ({
    email,
    type: 'BORROWERS'
  }));

  const allFollowers = [
    ...regularFollowers.map((email): FollowerWithType => ({ email, type: 'System' })),
    ...selectedLoanFollowers,
    ...borrowerFollowers,
    ...addedFollowers.map((email): FollowerWithType => ({ email, type: 'Custom' }))
  ];

  const handleAddCustomFollower = () => {
    if (emailRegex.test(inputValue.trim())) {
      const allExisting = [
        ...regularFollowers,
        ...selectedLoanFollowers.map(f => f.email),
        ...selectedBorrowerEmails,
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

  const handleBorrowerSelectionChange = useCallback((newSelectedEmails: string[]) => {
    onBorrowerSelectionChange(newSelectedEmails);
  }, [selectedBorrowerEmails, onBorrowerSelectionChange]);

  const handleRemoveFollower = useCallback((follower: FollowerWithType) => {
    
    if (follower.type === 'Custom') {
      onRemoveAddedFollower(follower.email);
    } else if (follower.type === 'BORROWERS') {
      const newSelection = selectedBorrowerEmails.filter(email => email !== follower.email);
      onBorrowerSelectionChange(newSelection);
    } else {
      onToggleLoanFollower(follower);
    }
  }, [selectedBorrowerEmails, onBorrowerSelectionChange, onRemoveAddedFollower, onToggleLoanFollower]);

  const renderUnifiedChip = (follower: FollowerWithType) => {
    const { email, type } = follower;
    const color = getTypeColor(type);

    const isCustom = type === 'Custom';
    const isSystem = type === 'System';
    const isBorrower = type === 'BORROWERS';
    const canDelete = !isSystem;

    function toTitleCase(str: string) {
      return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
      );
    }

    // For borrowers, only show the button without the green bars
    if (isBorrower) {
      return <></>
      // return (
      //   <Box
      //     key={email}
      //     sx={{
      //       display: 'inline-flex',
      //       alignItems: 'center',
      //       mr: 0.5,
      //       mb: 0.5,
      //     }}
      //   >
      //     {/* Just show the button for borrowers */}
      //     <Button
      //       variant="outlined"
      //       size="small"
      //       onClick={() => handleRemoveFollower(follower)}
      //       sx={{
      //         borderColor: '#4CAF50',
      //         color: '#4CAF50',
      //         fontSize: '0.7rem',
      //         height: '28px',
      //         textTransform: 'none',
      //         '&:hover': {
      //           borderColor: '#388E3C',
      //           backgroundColor: 'rgba(76, 175, 80, 0.04)',
      //         },
      //       }}
      //       endIcon={<span style={{ fontSize: '12px' }}>✕</span>}
      //     >
      //       {email}
      //     </Button>
      //   </Box>
      // );
    }

    // For other followers, keep the original design
    return (
      <Box
        key={email}
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 28,
          width: '100%',
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
            minWidth: '25%',
            maxWidth: '25%',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            alignContent: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          {toTitleCase(type.replace(/_/g, ' '))}
        </Box>

        {/* Email */}
        <Box
          sx={{
            backgroundColor: color,
            color: 'white',
            fontSize: '0.7rem',
            px: 1,
            minWidth: '70%',
            maxWidth: '70%',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {email}
        </Box>

        {/* Delete Icon */}
        {canDelete ? (
          <IconButton
            size="small"
            onClick={() => handleRemoveFollower(follower)}
            sx={{
              backgroundColor: color,
              color: 'white',
              height: 28,
              minWidth: '5%',
              maxWidth: '5%',
              borderRadius: 0,
              fontSize: '15px',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </IconButton>
        ) : (
          <Box
            sx={{
              backgroundColor: color,
              color: 'white',
              height: 28,
              minWidth: '5%',
              maxWidth: '5%',
              borderRadius: 0,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🔒
          </Box>
        )}
      </Box>
    );
  };

  // Calculate available followers correctly
  const getAvailableFollowersByType = () => {
    return Object.entries(groupFollowersByTypeWithSmartGrouping(loanDetailsFollowers)).map(([type, followers]) => {
      const available = followers.filter(
        f => !selectedLoanFollowers.some(s => s.email === f.email)
      );
      return { type, available };
    }).filter(({ available }) => available.length > 0);
  };

  const availableFollowerGroups = getAvailableFollowersByType();

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Followers
      </Typography>

      {loading ? (
        <CircularProgress size={20} sx={{ my: 2 }} />
      ) : (
        <>
          {/* Always show followers if any exist */}
          {allFollowers.length > 0 && (
            <>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>
                Selected Followers
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {allFollowers.map((follower) => renderUnifiedChip(follower))}
              </Box>
            </>
          )}

          {/* Borrower Selection Component */}
          {borrowers && borrowers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>
                Borrowers List
              </Typography>
              <BorrowerSelection
                editMode={editMode}
                borrowers={borrowers}
                selectedBorrowerEmails={selectedBorrowerEmails}
                onSelectionChange={handleBorrowerSelectionChange}
              />
            </Box>
          )}

          {/* Available Followers by Group */}
          {availableFollowerGroups.length > 0 && (
            <>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>
                Available Followers
              </Typography>

              {availableFollowerGroups.map(({ type, available }) => (
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
              ))}
            </>
          )}

          {/* Add Custom Follower */}
          {editMode && <Box sx={{ my: 2 }}>
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
          </Box>}

          {/* Summary */}
          <Typography variant="caption" color="text.secondary">
            Total followers: {allFollowers.length}
            {regularFollowers.length > 0 && ` (${regularFollowers.length} system)`}
            {selectedLoanFollowers.length > 0 && ` (${selectedLoanFollowers.length} from loan)`}
            {selectedBorrowerEmails.length > 0 && ` (${selectedBorrowerEmails.length} borrowers)`}
            {addedFollowers.length > 0 && ` (${addedFollowers.length} custom)`}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default EnhancedFollowers;