import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Box,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';

interface FilterOption {
  id: string | number;
  label: string;
}

interface FilterDropdownProps {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  minWidth?: number | string;
  maxWidth?: number | string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  id,
  label,
  options,
  multiSelect = false,
  value,
  onChange,
  minWidth = 120,
  maxWidth = 140,
}) => {
  const handleChange = (event: SelectChangeEvent<typeof value>) => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  return (
    <FormControl 
      sx={{ 
        minWidth: minWidth, 
        maxWidth: maxWidth,
        flexGrow: 1,
        fontSize: 16,
        backgroundColor: '#F5F7F8'
      }}
      size="small"
    >
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      {multiSelect ? (
        <Select
          labelId={`${id}-label`}
          id={id}
          multiple
          value={value as string[]}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((selectedId) => {
                const option = options.find(opt => opt.id.toString() === selectedId);
                return (
                  <Chip 
                    key={selectedId} 
                    label={option ? option.label : selectedId} 
                    size="small" 
                  />
                );
              })}
            </Box>
          )}
        >
          {options.map((option) => (
            <MenuItem key={option.id} value={option.id.toString()}>
              <Checkbox checked={(value as string[]).indexOf(option.id.toString()) > -1} />
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
        </Select>
      ) : (
        <Select
          labelId={`${id}-label`}
          id={id}
          value={value as string}
          onChange={handleChange}
          label={label}
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.id} value={option.id.toString()}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  );
};

export default FilterDropdown;