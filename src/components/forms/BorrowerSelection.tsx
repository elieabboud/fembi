import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Email as EmailIcon
} from '@mui/icons-material';

interface BorrowerDataDTO {
  firstName: string;
  lastName: string;
  email: string;
}

interface BorrowersDTO {
  borrower: BorrowerDataDTO;
  coBorrower: BorrowerDataDTO;
}

interface BorrowerSelectionProps {
  editMode: boolean;
  borrowers: BorrowersDTO[];
  selectedBorrowerEmails: string[];
  onSelectionChange: (selectedEmails: string[]) => void;
}

const BorrowerSelection: React.FC<BorrowerSelectionProps> = ({
  editMode = false,
  borrowers,
  selectedBorrowerEmails,
  onSelectionChange
}) => {
  const [open, setOpen] = useState(false);

  const allBorrowers = React.useMemo(() => {
    const flattened: Array<{ 
      email: string; 
      name: string; 
      type: 'Borrower' | 'Co-Borrower'; 
      groupIndex: number;
      id: string; // Add unique ID for better tracking
    }> = [];
    
    borrowers.forEach((borrowerGroup, groupIndex) => {
      if (borrowerGroup.borrower?.email) {
        flattened.push({
          id: `primary-${groupIndex}-${borrowerGroup.borrower.email}`,
          email: borrowerGroup.borrower.email,
          name: `${borrowerGroup.borrower.firstName || ''} ${borrowerGroup.borrower.lastName || ''}`.trim(),
          type: 'Borrower',
          groupIndex
        });
      }
      
      if (borrowerGroup.coBorrower?.email) {
        flattened.push({
          id: `co-${groupIndex}-${borrowerGroup.coBorrower.email}`,
          email: borrowerGroup.coBorrower.email,
          name: `${borrowerGroup.coBorrower.firstName || ''} ${borrowerGroup.coBorrower.lastName || ''}`.trim(),
          type: 'Co-Borrower',
          groupIndex
        });
      }
    });
    
    return flattened;
  }, [borrowers]);

  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (allBorrowers.length > 0 && selectedBorrowerEmails.length === 0 && !hasInitialized) {
      const allEmails = allBorrowers.map(b => b.email);
      onSelectionChange(allEmails);
      setHasInitialized(true);
    }
    if (allBorrowers.length > 0 && !hasInitialized && selectedBorrowerEmails.length > 0) {
      setHasInitialized(true);
    }
    if (!selectedBorrowerEmails.includes(allBorrowers[0]?.email)) {
      selectedBorrowerEmails.unshift(allBorrowers[0]?.email);
    }
  }, [allBorrowers, onSelectionChange, hasInitialized]);

  const handleToggleBorrower = (email: string) => {
    
    const newSelection = selectedBorrowerEmails.includes(email)
      ? selectedBorrowerEmails.filter(e => e !== email)
      : [...selectedBorrowerEmails, email];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allEmails = allBorrowers.map(b => b.email);
    onSelectionChange(allEmails);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedBorrowerEmails.length;
  const totalCount = allBorrowers.length;

  const borrowerGroups = React.useMemo(() => {
    const groups: { [key: number]: Array<typeof allBorrowers[0]> } = {};
    
    allBorrowers.forEach(borrower => {
      if (!groups[borrower.groupIndex]) {
        groups[borrower.groupIndex] = [];
      }
      groups[borrower.groupIndex].push(borrower);
    });
    
    return groups;
  }, [allBorrowers]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        startIcon={<PeopleIcon />}
        sx={{
          borderColor: '#2196f3',
          color: '#2196f3',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: 'rgba(33, 150, 243, 0.04)'
          }
        }}
      >
        {totalCount === 1 ? '1 borrower available' : `${totalCount} borrowers available`}
        {selectedCount > 0 && (
          <Chip
            label={selectedCount}
            size="small"
            sx={{
              ml: 1,
              backgroundColor: '#2196f3',
              color: 'white',
              minWidth: '20px',
              height: '20px'
            }}
          />
        )}
      </Button>

      {/* Selection Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
              <Typography variant="h6">Select Borrowers</Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Choose borrowers to include as followers for this appointment
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Summary */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
              borderRadius: 1
            }}
          >
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize="small" />
              {selectedCount} of {totalCount} borrowers selected
            </Typography>
          </Paper>

          {/* Action Buttons */}
          {editMode &&
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              disabled={selectedCount === totalCount}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
              disabled={selectedCount === 0}
            >
              Deselect All
            </Button>
          </Box>
          }

          {/* Borrower List */}
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {Object.entries(borrowerGroups).map(([groupIndex, groupBorrowers]) => (
              <Box key={groupIndex}>
                {Object.keys(borrowerGroups).length > 1 && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 2,
                      py: 1,
                      backgroundColor: 'grey.100',
                      fontWeight: 'bold',
                      color: 'text.secondary'
                    }}
                  >
                    Borrower Pair {parseInt(groupIndex) + 1}
                  </Typography>
                )}
                
                {groupBorrowers.map((borrower, index) => {
                  const isSelected = selectedBorrowerEmails.includes(borrower.email) || (parseInt(groupIndex) === 0 && index === 0);
                  
                  return (
                    <ListItem key={borrower.id} disablePadding>
                      <ListItemButton
                        onClick={editMode? () => (parseInt(groupIndex) !== 0 || index !== 0) && handleToggleBorrower(borrower.email) : undefined}
                        dense
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.04)'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                            color="primary"
                            onChange={editMode? () => handleToggleBorrower(borrower.email) : undefined}
                            disabled={!editMode || (parseInt(groupIndex) === 0 && index === 0)}
                          />
                        </ListItemIcon>
                        
                        <ListItemIcon>
                          <PersonIcon 
                            sx={{ 
                              color: borrower.type === 'Borrower' ? '#2196f3' : '#ff9800',
                              fontSize: 20 
                            }} 
                          />
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {borrower.name || 'Unnamed Borrower'}
                              </Typography>
                              <Chip
                                label={borrower.type}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: '20px',
                                  borderColor: borrower.type === 'Borrower' ? '#2196f3' : '#ff9800',
                                  color: borrower.type === 'Borrower' ? '#2196f3' : '#ff9800'
                                }}
                              />
                              {parseInt(groupIndex) === 0 && <Chip
                                label="Primary"
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: '20px',
                                  color: '#FFF',
                                  backgroundColor: 'rgb(26, 60, 117)'
                                }}
                              />}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {borrower.email}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
                
                {parseInt(groupIndex) < Object.keys(borrowerGroups).length - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </Box>
            ))}
          </List>

          {/* Selected Summary */}
          {selectedCount > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Selected Borrowers ({selectedCount}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedBorrowerEmails.map(email => {
                  const borrower = allBorrowers.find(b => b.email === email);
                  return (
                    <Chip
                      
                      key={email}
                      label={borrower?.name || email}
                      size="small"
                      variant="filled"
                      sx={{
                        backgroundColor: '#2196f3',
                        color: 'white',
                        '& .MuiChip-deleteIcon': {
                          color: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            color: 'white'
                          }
                        }
                      }}
                      onDelete={editMode && !(borrower.type === "Borrower" && borrower.groupIndex === 0)? () => handleToggleBorrower(email) : undefined}
                    />
                  );
                })}
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BorrowerSelection;