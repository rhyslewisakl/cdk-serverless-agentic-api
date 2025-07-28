/**
 * Loading state context for managing global loading states
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

export interface LoadingState {
  id: string;
  message?: string;
  progress?: number;
  cancellable?: boolean;
  onCancel?: () => void;
}

interface LoadingContextType {
  isLoading: boolean;
  loadingStates: LoadingState[];
  startLoading: (id: string, message?: string, options?: Partial<LoadingState>) => void;
  stopLoading: (id: string) => void;
  updateLoading: (id: string, updates: Partial<LoadingState>) => void;
  clearAllLoading: () => void;
  getLoadingState: (id: string) => LoadingState | undefined;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
  showGlobalBackdrop?: boolean;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ 
  children, 
  showGlobalBackdrop = true 
}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);

  const startLoading = useCallback((
    id: string, 
    message?: string, 
    options?: Partial<LoadingState>
  ) => {
    setLoadingStates(prev => {
      // Remove existing state with same ID
      const filtered = prev.filter(state => state.id !== id);
      
      // Add new loading state
      const newState: LoadingState = {
        id,
        message,
        ...options,
      };
      
      return [...filtered, newState];
    });
  }, []);

  const stopLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id));
  }, []);

  const updateLoading = useCallback((id: string, updates: Partial<LoadingState>) => {
    setLoadingStates(prev => 
      prev.map(state => 
        state.id === id ? { ...state, ...updates } : state
      )
    );
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates([]);
  }, []);

  const getLoadingState = useCallback((id: string) => {
    return loadingStates.find(state => state.id === id);
  }, [loadingStates]);

  const isLoading = loadingStates.length > 0;
  const primaryLoadingState = loadingStates[loadingStates.length - 1]; // Most recent

  const contextValue: LoadingContextType = {
    isLoading,
    loadingStates,
    startLoading,
    stopLoading,
    updateLoading,
    clearAllLoading,
    getLoadingState,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      
      {/* Global loading backdrop */}
      {showGlobalBackdrop && isLoading && primaryLoadingState && (
        <Backdrop
          sx={{
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            flexDirection: 'column',
            gap: 2,
          }}
          open={true}
        >
          <CircularProgress 
            color="inherit" 
            size={60}
            variant={primaryLoadingState.progress !== undefined ? 'determinate' : 'indeterminate'}
            value={primaryLoadingState.progress}
          />
          
          {primaryLoadingState.message && (
            <Typography variant="h6" component="div">
              {primaryLoadingState.message}
            </Typography>
          )}
          
          {primaryLoadingState.progress !== undefined && (
            <Typography variant="body2" component="div">
              {Math.round(primaryLoadingState.progress)}%
            </Typography>
          )}
          
          {primaryLoadingState.cancellable && primaryLoadingState.onCancel && (
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="body2" 
                component="button"
                onClick={primaryLoadingState.onCancel}
                sx={{
                  background: 'none',
                  border: '1px solid currentColor',
                  color: 'inherit',
                  padding: '8px 16px',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Cancel
              </Typography>
            </Box>
          )}
        </Backdrop>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

/**
 * Hook for managing a specific loading state
 */
export const useLoadingState = (id: string) => {
  const { startLoading, stopLoading, updateLoading, getLoadingState } = useLoading();
  
  const start = useCallback((message?: string, options?: Partial<LoadingState>) => {
    startLoading(id, message, options);
  }, [id, startLoading]);
  
  const stop = useCallback(() => {
    stopLoading(id);
  }, [id, stopLoading]);
  
  const update = useCallback((updates: Partial<LoadingState>) => {
    updateLoading(id, updates);
  }, [id, updateLoading]);
  
  const state = getLoadingState(id);
  
  return {
    isLoading: !!state,
    state,
    start,
    stop,
    update,
  };
};

/**
 * Hook for wrapping async operations with loading states
 */
export const useAsyncOperation = <T extends any[], R>(
  id: string,
  operation: (...args: T) => Promise<R>,
  options?: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    showToast?: boolean;
  }
) => {
  const { start, stop } = useLoadingState(id);
  
  // Note: Toast integration would be handled at the component level to avoid circular dependencies
  
  const execute = useCallback(async (...args: T): Promise<R> => {
    try {
      start(options?.loadingMessage);
      const result = await operation(...args);
      
      // Note: Success/error messages would be handled at the component level
      return result;
    } catch (error) {
      // Note: Error handling would be done at the component level
      throw error;
    } finally {
      stop();
    }
  }, [operation, start, stop, options]);
  
  return execute;
};

export default LoadingContext;