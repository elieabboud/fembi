import React, { useState } from 'react';
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
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Typography,
  Stack,
  Dialog
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Column } from '../../services/exportToExcel';
import StatusBadge from './StatusBadge';
import { BookingService } from '../../types/service';
import CreateBookingForm from '../forms/NewBookingForm';
import { bookingService } from '../../services/bookingService';
import { calendarBooking } from '../../types/calendarBooking';

interface AppTableProps {
  columns: Column[];
  rows: any[];
  selectable?: boolean;
  availableServices: BookingService[];
  followers : string[];
  onRowClick?: (row: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  showActions?: boolean;
  onActionClick?: (row: any) => void;
}

const AppTable: React.FC<AppTableProps> = ({
  columns,
  rows,
  selectable = false,
  availableServices,
  followers,
  onRowClick,
  onSelectionChange,
  showActions = false,
  onActionClick,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<calendarBooking>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showEditBooking, setShowEditBooking]= useState(false);
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleEditClick = (row: any) => {
    setSelectedRow(row);
    setShowEditBooking(true);
  };
  const handleDeleteClick = async (row: any) => {
    if(!row) return;
    setSelectedRow(row);
    const response = await bookingService.deleteBooking(selectedRow.bookingId);
  };
  const handleCloseModal = () => {
    setShowEditBooking(false);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((row) => row.bookingId);
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

  const handleSelectClick = (event: React.MouseEvent<HTMLElement>, id: string) => {
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
      const selectedRows = rows.filter((row) => newSelected.includes(row.bookingId));
      onSelectionChange(selectedRows);
    }
  };

  const isSelected = (id: string) => selected.includes(id);

  // For mobile, prioritize columns to display
  const prioritizedColumns = React.useMemo(() => {
    const columnsWithPriority = columns.map((col, index) => ({
      ...col,
      priority: col.priority !== undefined ? col.priority : index
    }));
    
    return columnsWithPriority.sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .filter(col => !col.hideOnMobile);
  }, [columns]);

  // Mobile view
  const renderMobileView = () => {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack spacing={2}>
          {rows
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row) => {
              const isItemSelected = isSelected(row.bookingId);
              
              return (
                <Card 
                  key={row.BookingId} 
                  elevation={1}
                  sx={{ 
                    cursor: onRowClick ? 'pointer' : 'default',
                    bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onClick={() => handleEditClick(row)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      {selectable && (
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleSelectClick(event, row.bookingId)}
                        />
                      )}
                        <Box>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(row);
                              }}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(row);
                              }}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                    
                    <Stack spacing={1.5}>
                      {prioritizedColumns.map((column, i) => {
                        const value = row[column.id];
                        const displayValue = column.format ? column.format(value, row) : value;
                        
                        return (
                          <Box key={column.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                              {column.label}:
                            </Typography>
                            <Box sx={{ textAlign: column.align || 'left', maxWidth: '60%' }}>
                              {typeof displayValue === 'string' || typeof displayValue === 'number' ? (
                                <Typography variant="body1" component="span">
                                  {displayValue}
                                </Typography>
                              ) : (
                                displayValue
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
        </Stack>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    );
  };

  // Desktop view
  const renderDesktopView = () => {
    return (
      <TableContainer 
        sx={{
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}
      >
        <Table stickyHeader aria-label="data table"   
          sx={{
            borderSpacing: '0 2px',
            backgroundColor: '#FAFAFA',
          }}
        >
          <TableHead>
            <TableRow className="custom-row">
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
                  key={column.label}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell align="right" style={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                const isItemSelected = isSelected(row.bookingId);

                return (
                  <TableRow
                    hover
                    className="custom-row"
                    onClick={() => handleEditClick(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.bookingId}
                    selected={isItemSelected}
                    sx={{ cursor: 'default', '&:hover': { cursor: 'pointer' } }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleSelectClick(event, row.bookingId)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.label} align={column.align} style={{ fontWeight: 'light' }}>
                          {column.id === 'status' ? (
                            <StatusBadge status={value} ></StatusBadge>
                          ) : column.format ? (
                            column.format(value, row)
                          ) : (
                            value
                          )}
                        </TableCell>
                      );
                    })}
                      <TableCell align="right">
                        <Box sx={{display: 'flex', gap: '4px'}}>
                            <Tooltip title="Edit">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(row);
                                }}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(row);
                                }}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                        </Box>
                      </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 1 }}>
      {isMobile ? renderMobileView() : renderDesktopView()}
      
      {!isMobile && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      {showEditBooking && (
      <Dialog
        open={showEditBooking}
        onClose={() => setShowEditBooking(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="booking-dialog-title"
      >
          <CreateBookingForm
            onClose={() => setShowEditBooking(false)}
            initialData={selectedRow}
            />
        </Dialog>
      )}
    </Paper>
  );
};

export default AppTable;