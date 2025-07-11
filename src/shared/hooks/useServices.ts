import { useState, useEffect } from 'react';
import { Service, ApiResponse, PaginatedResponse } from '@/shared/types';
import { supabase } from '@/lib/supabase';

interface UseServicesOptions {
  category?: string;
  professionalId?: string;
  search?: string;
  limit?: number;
}

export function useServices(options: UseServicesOptions = {}) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [options.category, options.professionalId, options.search]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('services')
        .select(`
          *,
          professional:professionals(
            *,
            user:users(*)
          )
        `)
        .eq('is_active', true);

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.professionalId) {
        query = query.eq('professional_id', options.professionalId);
      }

      if (options.search) {
        query = query.or(
          `title.ilike.%${options.search}%,description.ilike.%${options.search}%`
        );
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching services');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating service');
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => prev.map(service => 
        service.id === id ? { ...service, ...data } : service
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating service');
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setServices(prev => prev.filter(service => service.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting service');
    }
  };

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    createService,
    updateService,
    deleteService
  };
} 