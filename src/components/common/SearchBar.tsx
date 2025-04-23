import React from 'react';
import { InputBase, Paper, IconButton, useTheme, Chip, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch
}) => {
  const theme = useTheme();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <Paper
      component="form"
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        borderRadius: 1,
        height: 70,
        bgcolor: theme.palette.secondary.main,
      }}
      elevation={0}
      onSubmit={(e) => e.preventDefault()}
    >
      <IconButton sx={{ p: '10px' }} aria-label="search">
        <SearchIcon style={{color: 'white'}} />
      </IconButton>
      <InputBase
        sx={{
          ml: 1,
          flex: 1,
          fontSize: 20,
          '& .MuiInputBase-input': {
            color: 'white',
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'white',
            opacity: 1,
          },
        }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        inputProps={{ 'aria-label': 'search' }}
      />
    </Paper>
  );
};

export default SearchBar;