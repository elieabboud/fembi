import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TablePagination,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => React.ReactNode;
}

interface AppTableProps {
  columns: Column[];
  rows: any[];
  selectable?: boolean;
  onRowClick?: (row: any) => void;
  onEditClick?: (row: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  showActions?: boolean;
  onActionClick?: (row: any) => void;
}

const AppTable: React.FC<AppTableProps> = ({
  columns,
  rows,
  selectable = false,
  onRowClick,
  onEditClick,
  onSelectionChange,
  showActions = false,
  onActionClick,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((row) => row.id);
      setSelected(newSelected);
      if (onSelectionChange) {
        onSelectionChange(rows);
      }
    } else {
      setSelected([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectClick = (event: React.MouseEvent<HTMLTableCellElement>, id: string) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter((selectedId) => selectedId !== id);
    }

    setSelected(newSelected);
    if (onSelectionChange) {
      const selectedRows = rows.filter((row) => newSelected.includes(row.id));
      onSelectionChange(selectedRows);
    }
  };

  const isSelected = (id: string) => selected.includes(id);

  return (
    <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 1 }}>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < rows.length}
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              {(showActions || onEditClick) && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                const isItemSelected = isSelected(row.id);

                return (
                  <TableRow
                    hover
                    onClick={() => handleClick(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleSelectClick(event, row.id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format ? column.format(value) : value}
                        </TableCell>
                      );
                    })}
                    {(showActions || onEditClick) && (
                      <TableCell align="right">
                        <Box>
                          {onEditClick && (
                            <Tooltip title="Edit">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditClick(row);
                                }}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {showActions && (
                            <Tooltip title="More actions">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onActionClick) onActionClick(row);
                                }}
                                size="small"
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );