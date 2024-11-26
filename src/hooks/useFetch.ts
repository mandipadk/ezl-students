import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface FetchState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface FetchConfig {
  enabled?: boolean;
  refetchInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
  retryCount?: number;
}

const DEFAULT_CONFIG: Required<FetchConfig> = {
  enabled: true,
  refetchInterval: 2 * 60 * 1000, // 2 minutes
  onError: (error: Error) => toast.error(error.message),
  onSuccess: () => {},
  retryCount: 3,
};

export function useFetch<T>(
  fetchFn: () => Promise<T[]>,
  config: FetchConfig = {}
) {
  const [state, setState] = useState<FetchState<T>>({
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  });

  const { enabled, refetchInterval, onError, onSuccess, retryCount } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const fetchWithRetry = async (
    attempt: number = 0,
    showLoading: boolean = true
  ): Promise<T[]> => {
    try {
      const data = await fetchFn();
      return data;
    } catch (error) {
      if (attempt < retryCount) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1, showLoading);
      }
      throw error;
    }
  };

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled) return;

    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const data = await fetchWithRetry(0, showLoading);
      setState({
        data,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      });
      onSuccess(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      onError(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [fetchFn, enabled, onError, onSuccess, retryCount]);

  useEffect(() => {
    if (enabled) {
      fetchData();
      const interval = setInterval(() => fetchData(false), refetchInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, fetchData, refetchInterval]);

  const refresh = () => fetchData(true);

  return {
    ...state,
    refresh,
    isStale: state.lastFetched ? Date.now() - state.lastFetched > refetchInterval : true,
  };
} 