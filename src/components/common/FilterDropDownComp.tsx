import React, { useCallback } from 'react';
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
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  id,
  label,
  options,
  multiSelect = false,
  value,
  onChange
}) => {
  
  const getDisplayValue = () => {
    if (multiSelect) {
      if (Array.isArray(value)) {
        return value;
      } else if (value && value !== '') {
        return [value];
      } else {
        return [];
      }
    } else {
      if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : '';
      } else {
        return value || '';
      }
    }
  };

  const displayValue = getDisplayValue();

  const handleChange = useCallback((event: SelectChangeEvent<string | string[]>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const newValue = event.target.value;


    if (multiSelect) {
      const currentArray = Array.isArray(value) ? value : (value ? [value] : []);
      const newArray = Array.isArray(newValue) ? newValue : (newValue ? [newValue] : []);
      
      if (JSON.stringify(currentArray.sort()) !== JSON.stringify(newArray.sort())) {
        onChange(newArray);
      }
    } else {
      const currentSingle = Array.isArray(value) ? (value.length > 0 ? value[0] : '') : (value || '');
      const newSingle = Array.isArray(newValue) ? (newValue.length > 0 ? newValue[0] : '') : (newValue || '');
      
      if (currentSingle !== newSingle) {
        onChange(newSingle);
      }
    }
  }, [value, onChange, multiSelect, label]);

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 200,
        width: 'auto',
      },
    },
    disableScrollLock: true,
    autoFocus: false,
  };

  return (
    <FormControl
      sx={{ 
        flexGrow: 1,
        width: '120px',
      }}
      size="small"
    >
      <InputLabel id={`${id}-label`} sx={{ fontSize: {sm: 12, md: 14} }}>
        {label}
      </InputLabel>
      
      {multiSelect ? (
        <Select
          variant='outlined'
          labelId={`${id}-label`}
          id={id}
          multiple
          value={displayValue as string[]}
          sx={{ 
            fontSize: 14, 
            height: 40,
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              padding: '8px 14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }
          }}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          MenuProps={menuProps}
          onClose={(event) => {
            event?.stopPropagation?.();
          }}
          renderValue={(selected) => (
            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",
                gap: 0.5,
                overflow: "hidden",
                width: "100%",
              }}
            >
              {(selected as string[]).length === 0 ? (
                <Box sx={{ color: "text.secondary", fontStyle: "italic" }}>
                  None selected
                </Box>
              ) : (selected as string[]).length === 1 ? (
                <Chip
                  label={
                    options.find(
                      (opt) => opt.id.toString() === (selected as string[])[0]
                    )?.label || (selected as string[])[0]
                  }
                  size="small"
                  sx={{
                    maxWidth: "100%",
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "120px",
                    },
                  }}
                />
              ) : (
                <Chip
                  label={`${(selected as string[]).length} selected`}
                  size="small"
                  color="primary"
                  sx={{
                    backgroundColor: "primary.main",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              )}
            </Box>
          )}
        >
          {options.map((option) => (
            <MenuItem 
              key={option.id} 
              value={option.id.toString()}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox 
                checked={(displayValue as string[]).includes(option.id.toString())} 
              />
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
        </Select>
      ) : (
        <Select
          labelId={`${id}-label`}
          id={id}
          value={displayValue as string}
          sx={{ fontSize: 14, height: 40 }}
          onChange={handleChange}
          label={label}
          MenuProps={menuProps}
          onClose={(event) => {
            event?.stopPropagation?.();
          }}
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem 
              key={option.id} 
              value={option.id.toString()}
              onClick={(e) => e.stopPropagation()}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  );
};

export default FilterDropdown;