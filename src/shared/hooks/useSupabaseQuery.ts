'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../providers';

// Generic hook for authenticated Supabase queries
export function useSupabaseQuery<T = any>(
  queryKey: string[],
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    requireAuth?: boolean;
  } = {}
) {
  const { user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await queryFn();
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: options.requireAuth ? isAuthenticated && (options.enabled ?? true) : (options.enabled ?? true),
    staleTime: options.staleTime,
  });
}

// Hook for user's own bookings
export function useUserBookings() {
  const { user } = useAuth();
  
  return useSupabaseQuery(
    ['bookings', user?.id || 'anonymous'],
    async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, short_description),
          professional:profiles!bookings_professional_id_fkey(first_name, last_name, phone)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
    },
    { requireAuth: true }
  );
}

// Hook for professional's bookings
export function useProfessionalBookings() {
  const { user } = useAuth();
  
  return useSupabaseQuery(
    ['professional-bookings', user?.id || 'anonymous'],
    async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, short_description),
          customer:profiles!bookings_customer_id_fkey(first_name, last_name, phone)
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });
    },
    { requireAuth: true }
  );
}

// Hook for professional's services
export function useProfessionalServices() {
  const { user } = useAuth();
  
  return useSupabaseQuery(
    ['professional-services', user?.id || 'anonymous'],
    async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First get service provider ID
      const { data: provider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!provider) return { data: [], error: null };
      
      return supabase
        .from('provider_services')
        .select(`
          *,
          service:services(*)
        `)
        .eq('provider_id', provider.id);
    },
    { requireAuth: true }
  );
}

// Hook for user profile
export function useUserProfile() {
  const { user } = useAuth();
  
  return useSupabaseQuery(
    ['profile', user?.id || 'anonymous'],
    async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    },
    { requireAuth: true }
  );
}

// Mutation hook for updating profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

// Hook for franchise-aware data
export function useFranchiseData<T = any>(
  queryKey: string[],
  table: string,
  franchiseId: string | null,
  select = '*'
) {
  return useSupabaseQuery(
    [...queryKey, franchiseId || 'no-franchise'],
    async () => {
      if (!franchiseId) return { data: null, error: new Error('No franchise selected') };
      
      return supabase
        .from(table)
        .select(select)
        .eq('franchise_id', franchiseId)
        .order('created_at', { ascending: false });
    },
    { enabled: !!franchiseId }
  );
}

// Real-time subscription hook
export function useSupabaseSubscription(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    const subscription = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter
      }, (payload) => {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [table] });
        
        // Custom callback
        if (callback) {
          callback(payload);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, filter, callback, queryClient]);
} 