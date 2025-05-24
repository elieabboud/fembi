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
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        borderRadius: 1,
        border: 'solid #D3D3D3 0.5px',
        color: 'black'
      }}
      elevation={0}
      onSubmit={(e) => e.preventDefault()}
    >
      <IconButton sx={{ pr: 1 }} aria-label="search">
        <SearchIcon style={{color: 'black'}} />
      </IconButton>
      <InputBase
        sx={{
          fontSize: 14,
          '& .MuiOutlinedInput-root': {
            height: 40,
          },
          '& .MuiInputBase-input': {
            color: 'black',
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'gray',
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