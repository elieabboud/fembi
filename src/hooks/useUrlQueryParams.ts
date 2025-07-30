import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UrlQueryParams {
  loanId?: string;
}

export const useUrlQueryParams = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState<UrlQueryParams>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const params: UrlQueryParams = {};
    const loanId = searchParams.get('loanId');
    if (loanId) {
      params.loanId = loanId;
    }

    setQueryParams(params);
  }, [location.search]);

  const clearQueryParams = () => {
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.delete('loanId');
    
    const newUrl = `${location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
    
    setQueryParams({});
  };

  return {
    queryParams,
    clearQueryParams,
    hasLoanId: !!queryParams.loanId
  };
};