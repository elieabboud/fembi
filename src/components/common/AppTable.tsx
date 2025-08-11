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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Column } from '../../services/exportToExcel';
import StatusBadge from './StatusBadge';
import { BookingService } from '../../types/service';
import CreateBookingForm from '../forms/NewBookingForm';
import { bookingService } from '../../services/bookingService';
import { calendarBooking } from '../../types/calendarBooking';
import { TableSortLabel } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { CreateAppointmentRequest } from '../../types/CreateAppointmentRequest';

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AppTableProps {
  columns: Column<calendarBooking>[];
  rows: any[];
  selectable?: boolean;
  availableServices: BookingService[];
  followers : string[];
  onRowClick?: (row: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  showActions?: boolean;
  onActionClick?: (row: any) => void;
  onEditSuccess?: (bookingData: CreateAppointmentRequest, response: any) => void;
  pagination?: PaginationInfo;
  onPageChange?: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  onSortChange?: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  loading?: boolean;
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
  onEditSuccess,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  loading = false
}) => {
  // Local pagination state (fallback for non-paginated usage)
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10);
  
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<calendarBooking>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showEditBooking, setShowEditBooking] = useState(false);
  const [showViewBooking, setShowViewBooking] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'view'>('edit');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof calendarBooking | string>('start');

  const isBackendPaginated = Boolean(pagination && onPageChange && onPageSizeChange);
  
  const currentPage = isBackendPaginated ? pagination!.currentPage - 1 : localPage; // Backend is 1-based, MUI is 0-based
  const currentPageSize = isBackendPaginated ? pagination!.pageSize : localRowsPerPage;
  const totalItems = isBackendPaginated ? pagination!.totalItems : rows.length;

  const getComparator = (
    order: 'asc' | 'desc',
    orderBy: keyof calendarBooking | string,
    columns: Column<calendarBooking>[]
  ): (a: calendarBooking, b: calendarBooking) => number => {
    const column = columns.find(col => col.id === orderBy);
    
    if (column && column.comparator) {
      return order === 'desc'
        ? (a, b) => -column.comparator!(a, b)
        : (a, b) => column.comparator!(a, b);
    }
    
    return order === 'desc'
      ? (a, b) => {
          const aVal = (a as any)[orderBy] || '';
          const bVal = (b as any)[orderBy] || '';
          if (bVal < aVal) return -1;
          if (bVal > aVal) return 1;
          return 0;
        }
      : (a, b) => {
          const aVal = (a as any)[orderBy] || '';
          const bVal = (b as any)[orderBy] || '';
          if (aVal < bVal) return -1;
          if (aVal > bVal) return 1;
          return 0;
        };
  };

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof calendarBooking | string) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    
    setOrder(newOrder);
    setOrderBy(property);
    
    // If backend pagination is enabled, notify parent component
    if (isBackendPaginated && onSortChange) {
      onSortChange(property as string, newOrder);
    }
  };

  const createSortHandler = (property: keyof calendarBooking | string) => (event: React.MouseEvent<unknown>) => {
    const column = columns.find(col => col.id === property);
    
    if (column && (column.comparator || isBasicSortableColumn(property as string))) {
      handleRequestSort(event, property);
    }
  };

  const isBasicSortableColumn = (columnId: string): boolean => {
    const basicSortableColumns = [
    'serviceName', 
    'customerName', 
    'price',
    'bookingId',
    'closingDate',
    'closingTime',
    'status',
    'LoanCloser',
    'LoanOfficer',
    'LoanPurpose',
    'dpa'
  ];
    return basicSortableColumns.includes(columnId);
  };

  const sortedRows = React.useMemo(() => {
    if (isBackendPaginated) {
      return rows;
    }
    
    if (!orderBy) {
      return rows;
    }
    
    return [...rows].sort(getComparator(order, orderBy, columns));
  }, [rows, order, orderBy, columns, isBackendPaginated]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    if (isBackendPaginated && onPageChange) {
      onPageChange(newPage + 1); // Convert back to 1-based for backend
    } else {
      setLocalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    
    if (isBackendPaginated && onPageSizeChange) {
      onPageSizeChange(newPageSize);
    } else {
      setLocalRowsPerPage(newPageSize);
      setLocalPage(0);
    }
  };

  const handleEditClick = (row: any) => {
    localStorage.setItem("selectedItem",JSON.stringify(row.start));
    setSelectedRow(row);
    setDialogMode('edit');
    setShowEditBooking(true);
  };

  const handleViewClick = (row: any) => {
    setSelectedRow(row);
    setDialogMode('view');
    setShowViewBooking(true);
  };

  const handleDeleteClick = (row: any) => {
    if (!row) return;
    setSelectedRow(row);
    setConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRow) return;
    setLoadingDelete(true);
    
    try {
      try {
        await bookingService.sendCancellationEmail(selectedRow.bookingId, selectedRow);
      } catch (emailError) {
        console.error('❌ Failed to send cancellation email:', emailError);
      }
      
      await bookingService.deleteBooking(selectedRow.bookingId);

    } catch (error) {
      console.error('❌ Delete operation failed:', error);
    } finally {
      setLoadingDelete(false);
      setConfirmDelete(false);
      setSelectedRow(undefined);
      window.location.reload(); 
    }
  };

  const handleCloseModal = () => {
    setShowEditBooking(false);
    setShowViewBooking(false);
  };

  // Check if appointment is upcoming (can be edited/deleted)
  const isUpcoming = (row: any) => {
    return row.status === 'upcoming';
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

  const prioritizedColumns = React.useMemo(() => {
    const columnsWithPriority = columns.map((col, index) => ({
      ...col,
      priority: col.priority !== undefined ? col.priority : index
    }));
    
    return columnsWithPriority.sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .filter(col => !col.hideOnMobile);
  }, [columns]);

  const displayedRows = isBackendPaginated 
    ? sortedRows
    : sortedRows.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage);

  // Mobile view
  const renderMobileView = () => {
    return (
      <Box sx={{ width: '100%' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        <Stack spacing={2}>
          {displayedRows.map((row) => {
            const isItemSelected = isSelected(row.bookingId);
            const canModify = isUpcoming(row);
            
            return (
              <Card 
                key={row.bookingId}
                elevation={1}
                sx={{ 
                  cursor: onRowClick ? 'pointer' : 'default',
                  bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white',
                  opacity: loading ? 0.6 : 1,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => handleViewClick(row)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    {selectable && (
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) => handleSelectClick(event, row.bookingId)}
                        disabled={loading}
                      />
                    )}
                    <Box>
                      <Tooltip title="View">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewClick(row);
                          }}
                          size="small"
                          disabled={loading}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canModify && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(row);
                              }}
                              size="small"
                              disabled={loading}
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
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  <Stack spacing={1.5}>
                    {prioritizedColumns.map((column, i) => {
                      const value = (row as any)[column.id];
                      const displayValue = column.format ? column.format(value, row) : value;
                      
                      return (
                        <Box key={`${row.bookingId}-${column.id as string}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                            {column.label}:
                          </Typography>
                          <Box sx={{ textAlign: column.align || 'left', maxWidth: '60%' }}>
                            {column.id === 'status' ? (
                              <StatusBadge status={row.status} />
                            ) : typeof displayValue === 'string' || typeof displayValue === 'number' ? (
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
          
          {!loading && displayedRows.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No bookings found
              </Typography>
            </Box>
          )}
        </Stack>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalItems}
          rowsPerPage={currentPageSize}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          disabled={loading}
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
          opacity: loading ? 0.6 : 1,
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
                    disabled={loading}
                  />
                </TableCell>
              )}
              {columns.map((column) => {
                const canSort = column.comparator || isBasicSortableColumn(column.id as string);
                
                return (
                  <TableCell
                    key={column.id as string}
                    align={column.align}
                    style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    {canSort ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={createSortHandler(column.id)}
                        disabled={loading}
                        sx={{
                          '&.MuiTableSortLabel-root': {
                            color: 'inherit',
                          },
                          '&.MuiTableSortLabel-root:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {column.label}
                        {orderBy === column.id ? (
                          <Box component="span" sx={visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      <Typography variant="inherit" sx={{ fontWeight: 'bold' }}>
                        {column.label}
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
              <TableCell align="right" style={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Loading bookings...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No bookings found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row) => {
                const isItemSelected = isSelected(row.bookingId);
                const canModify = isUpcoming(row);

                return (
                  <TableRow
                    hover
                    className="custom-row"
                    onClick={() => handleViewClick(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.bookingId}
                    selected={isItemSelected}
                    sx={{ 
                      cursor: 'default', 
                      '&:hover': { cursor: 'pointer' },
                      opacity: loading ? 0.6 : 1 
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleSelectClick(event, row.bookingId)}
                          disabled={loading}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = (row as any)[column.id];
                      return (
                        <TableCell key={`${row.bookingId}-${column.id as string}`} align={column.align} style={{ fontWeight: 'light' }}>
                          {column.id === 'status' ? (
                            <StatusBadge status={row.status} />
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
                        <Tooltip title="View">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewClick(row);
                            }}
                            size="small"
                            disabled={loading}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canModify && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(row);
                                }}
                                size="small"
                                disabled={loading}
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
                                color="error"
                                disabled={loading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalItems}
          rowsPerPage={currentPageSize}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          disabled={loading}
          showFirstButton={isBackendPaginated}
          showLastButton={isBackendPaginated}
        />
      )}

      {/* Edit Booking Dialog */}
      {showEditBooking && (
        <Dialog
          open={showEditBooking}
          onClose={() => setShowEditBooking(false)}
          fullWidth
          maxWidth="sm"
          scroll="paper"
          aria-labelledby="edit-booking-dialog-title"
        >
          <CreateBookingForm
            onSuccess={onEditSuccess || (() => {})}
            onClose={() => setShowEditBooking(false)}
            initialData={selectedRow}
            isEditMode={true}
          />
        </Dialog>
      )}

      {/* View Booking Dialog */}
      {showViewBooking && (
        <Dialog
          open={showViewBooking}
          onClose={() => setShowViewBooking(false)}
          fullWidth
          maxWidth="sm"
          scroll="paper"
          aria-labelledby="view-booking-dialog-title"
        >
          <CreateBookingForm
            onClose={() => setShowViewBooking(false)}
            initialData={selectedRow}
            isEditMode={true}
            isViewMode={true}
          />
        </Dialog>
      )}

      <Dialog open={confirmDelete} onClose={() => !loadingDelete && setConfirmDelete(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this booking?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={loadingDelete}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={loadingDelete}
            startIcon={loadingDelete ? <CircularProgress size={16} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AppTable;