export interface PaginationRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
  filters?: {
    status?: string[];
    serviceLocation?: string;
    loanOfficers?: string[];
    dateRange?: {
      startDate?: string;
      endDate?: string;
    };
  };
}

export interface PaginationResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResponse;
}