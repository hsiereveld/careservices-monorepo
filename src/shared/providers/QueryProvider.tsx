'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 60 * 1000, // 1 minute
      // Cache time - how long data stays in cache after component unmounts
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry RLS permission errors
        if (error?.code === 'PGRST116' || error?.message?.includes('permission')) {
          return false;
        }
        // Don't retry 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Background refetch settings
      refetchOnWindowFocus: false, // Don't refetch on window focus by default
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      // Global error handler for mutations
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Could add toast notifications here
      },
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export { queryClient }; 