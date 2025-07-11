import { useState, useEffect } from 'react';
import { Booking, BookingFormData } from '@/shared/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface UseBookingsOptions {
  status?: string;
  userId?: string;
  professionalId?: string;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, options.status, options.userId, options.professionalId]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:users!customer_id(*),
          professional:professionals(*,
            user:users(*)
          ),
          service:services(*)
        `);

      // Filter based on user role
      if (user.role === 'customer') {
        query = query.eq('customer_id', user.id);
      } else if (user.role === 'professional') {
        query = query.eq('professional_id', user.id);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.userId) {
        query = query.eq('customer_id', options.userId);
      }

      if (options.professionalId) {
        query = query.eq('professional_id', options.professionalId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: BookingFormData) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          customer_id: user.id,
          status: 'pending'
        }])
        .select(`
          *,
          customer:users!customer_id(*),
          professional:professionals(*,
            user:users(*)
          ),
          service:services(*)
        `)
        .single();

      if (error) throw error;
      
      setBookings(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating booking');
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, status } : booking
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating booking');
    }
  };

  const cancelBooking = async (id: string) => {
    return updateBookingStatus(id, 'cancelled');
  };

  const confirmBooking = async (id: string) => {
    return updateBookingStatus(id, 'confirmed');
  };

  const completeBooking = async (id: string) => {
    return updateBookingStatus(id, 'completed');
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    confirmBooking,
    completeBooking
  };
} 