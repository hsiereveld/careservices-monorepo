import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, BookingWithDetails, BookingStatus } from '../lib/supabase';
import { calculateEstimatedPrice, getPriceUnitLabel } from '../utils/bookingPriceCalculator';
import { sendEmail } from '../utils/emailService';
import { useAdmin } from '../hooks/useAdmin';
import { calculateDetailedPrices } from '../utils/priceCalculations';

export function useProviderBookings() {
  const { user } = useAuth();
  const { userRole } = useAdmin();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProviderIdAndBookings();
    }
  }, [user]);

  const fetchProviderIdAndBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // First, get the provider ID for the current user
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (providerError) {
        if (providerError.code === 'PGRST116') {
          // No provider found for this user
          setError('Je hebt nog geen service provider profiel. Maak eerst je profiel aan.');
          setLoading(false);
          return;
        }
        throw providerError;
      }

      setProviderId(providerData.id);

      // Then fetch bookings for this provider
      await fetchBookings(providerData.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchBookings = async (providerIdToUse: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings with related data including service category for commission rate
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(*, category:service_categories(commission_rate)),
          status_history:booking_status_history(*)
        `)
        .eq('provider_id', providerIdToUse)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch customer profiles separately for each booking
      const bookingsWithDetails = await Promise.all(
        (data || []).map(async (booking) => {
          try {
            // Fetch customer profile
            const { data: customerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', booking.customer_id)
              .maybeSingle();
            
            // Get the service pricing tier if needed for price calculation
            let pricingTier = null;
            if (booking.service_id) {
              const { data: pricingTiers } = await supabase
                .from('pricing_tiers')
                .select('*')
                .eq('service_id', booking.service_id)
                .order('price', { ascending: true })
                .limit(1);
                
              if (pricingTiers && pricingTiers.length > 0) {
                pricingTier = pricingTiers[0];
              }
            }
            
            // Calculate estimated price if needed
            let estimatedPrice = booking.estimated_price;
            if (pricingTier && (estimatedPrice === null || estimatedPrice === 0)) {
              estimatedPrice = calculateEstimatedPrice(
                pricingTier.price,
                pricingTier.price_unit,
                booking.booking_start_date || booking.booking_date,
                booking.booking_start_time || booking.booking_time,
                booking.booking_end_date,
                booking.booking_end_time,
                booking.duration_hours,
                booking.duration_days
              );
            }

            // Fetch commission rate override from provider_services
            const { data: providerService, error: providerServiceError } = await supabase
              .from('provider_services')
              .select('commission_rate_override, custom_price, custom_price_unit')
              .eq('provider_id', providerIdToUse)
              .eq('service_id', booking.service_id)
              .maybeSingle();

            if (providerServiceError && providerServiceError.code !== 'PGRST116') {
              console.error('Error fetching provider service:', providerServiceError);
            }

            // Determine effective commission rate
            const defaultCommissionRate = 15.0;
            const categoryCommissionRate = booking.service?.category?.commission_rate || defaultCommissionRate;
            const effectiveCommissionRate = providerService?.commission_rate_override !== null && 
                                           providerService?.commission_rate_override !== undefined
                                           ? providerService.commission_rate_override
                                           : categoryCommissionRate;

            // Calculate professional earning - UPDATED to use calculateDetailedPrices
            const bookingPrice = booking.final_price || estimatedPrice || 0;
            
            // Use the calculateDetailedPrices function to get the costPrice (what professional receives)
            const { costPrice } = calculateDetailedPrices(
              0, // Not used in reverse calculation
              0, // Not used
              21, // VAT rate
              effectiveCommissionRate,
              effectiveCommissionRate // Pass effective commission rate
            );
            
            // Calculate the professional's earnings (costPrice) from the selling price
            const vatRate = 21; // Standard VAT rate
            const sellingPrice = bookingPrice;
            
            // Formula: costPrice = sellingPrice / (1 + vatRate/100) / (1 + commissionRate/100)
            const professionalEarning = sellingPrice / (1 + vatRate/100) / (1 + effectiveCommissionRate/100);
            
            // Determine service price and unit
            const servicePrice = providerService?.custom_price || pricingTier?.price;
            const servicePriceUnit = providerService?.custom_price_unit || pricingTier?.price_unit;
            
            return {
              ...booking,
              customer: customerProfile,
              estimated_price: estimatedPrice,
              professional_earning: professionalEarning,
              service_price: servicePrice,
              service_price_unit: servicePriceUnit
            };
          } catch (err) {
            console.warn('Error processing booking customer:', err);
            return booking;
          }
        })
      );
      
      setBookings(bookingsWithDetails);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus, notes?: string) => {
    if (!providerId) {
      return { data: null, error: new Error('Provider ID not found') };
    }

    try {
      setError(null);
      
      // Check if booking belongs to this provider
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error('Boeking niet gevonden');
      }
      
      if (booking.provider_id !== providerId) {
        throw new Error('Je hebt geen toestemming om deze boeking te wijzigen');
      }
      
      // Check if status transition is valid
      if (!isValidStatusTransition(booking.status, status)) {
        throw new Error(`Kan status niet wijzigen van "${getStatusLabel(booking.status)}" naar "${getStatusLabel(status)}"`);
      }
      
      // Update booking status
      const updateData: Partial<BookingWithDetails> = { 
        status,
        provider_notes: notes || booking.provider_notes || ''
      };

      // Add timestamp based on status
      const now = new Date().toISOString();
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = now;
          break;
        case 'in_progress':
          updateData.started_at = now;
          break;
        case 'completed':
          updateData.completed_at = now;
          break;
        case 'cancelled':
          updateData.cancelled_at = now;
          break;
      }

      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('provider_id', providerId)
        .select();
      
      if (updateError) throw updateError;

      // Add status history entry
      const { error: historyError } = await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          old_status: booking.status,
          new_status: status,
          changed_by: user?.id,
          change_reason: 'Provider status update',
          notes: notes
        });
      
      if (historyError) throw historyError;
      
      // Send email notifications based on status change
      try {
        // Get customer profile
        const { data: customerProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', booking.customer_id)
          .maybeSingle();
          
        // Get service details
        const { data: serviceData } = await supabase
          .from('services')
          .select('name')
          .eq('id', booking.service_id)
          .single();
          
        // Get provider details
        const { data: providerData } = await supabase
          .from('service_providers')
          .select('business_name, phone')
          .eq('id', providerId)
          .single();
          
        if (customerProfile && serviceData && providerData) {
          const emailData = {
            first_name: customerProfile.first_name || 'Klant',
            service_name: serviceData.name,
            booking_date: new Date(booking.booking_date).toLocaleDateString('nl-NL'),
            booking_time: booking.booking_time,
            booking_address: booking.customer_address || 'Niet opgegeven',
            provider_name: providerData.business_name || 'Professional',
            provider_phone: providerData.phone || 'Niet opgegeven',
            estimated_price: booking.estimated_price?.toFixed(2) || '0.00',
            cancellation_reason: notes || 'Geen reden opgegeven'
          };
          
          // Send appropriate email based on new status
          switch (status) {
            case 'confirmed':
              // Send confirmation email to client using customer_id
              await sendEmail('booking_confirmed_client', booking.customer_id, emailData);
              console.log('✅ Booking confirmation email sent to client');
              
              // Send confirmation email to provider
              await sendEmail('booking_confirmed_professional', user!.id, {
                ...emailData,
                provider_name: providerData.business_name || 'Professional',
                client_name: `${customerProfile.first_name} ${customerProfile.last_name}`,
                client_phone: booking.customer_phone || 'Niet opgegeven'
              });
              console.log('✅ Booking confirmation email sent to provider');
              
              // Note: Invoice generation is handled by the backend trigger when booking status changes to confirmed
              // This ensures proper permissions and consistency
              break;
              
            case 'in_progress':
              // Send service started email to client using customer_id
              await sendEmail('service_started_client', booking.customer_id, emailData);
              console.log('✅ Service started email sent to client');
              break;
              
            case 'completed':
              // Send service completed email to client using customer_id
              await sendEmail('service_completed_client', booking.customer_id, {
                ...emailData,
                review_link: `${window.location.origin}/client-dashboard?tab=bookings&review=${bookingId}`
              });
              console.log('✅ Service completed email sent to client');
              break;
              
            case 'cancelled':
              // Send cancellation email to client using customer_id
              await sendEmail('booking_cancelled_client', booking.customer_id, emailData);
              console.log('✅ Booking cancellation email sent to client');
              break;
              
            case 'rescheduled':
              // Send rescheduled email to client using customer_id
              await sendEmail('booking_rescheduled_client', booking.customer_id, {
                ...emailData,
                new_booking_date: new Date(booking.booking_date).toLocaleDateString('nl-NL'),
                new_booking_time: booking.booking_time
              });
              console.log('✅ Booking rescheduled email sent to client');
              break;
          }
        }
      } catch (emailErr) {
        console.error('Error sending status update email:', emailErr);
        // Continue with the process even if email fails
      }
      
      // Refresh bookings list
      await fetchBookings(providerId);
      
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Check if a status transition is valid
  const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
    // Define valid transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled', 'rescheduled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // No transitions from completed
      'cancelled': [], // No transitions from cancelled
      'rescheduled': ['confirmed', 'cancelled']
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  // Get status label for display
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'In afwachting';
      case 'confirmed': return 'Bevestigd';
      case 'in_progress': return 'In uitvoering';
      case 'completed': return 'Voltooid';
      case 'cancelled': return 'Geannuleerd';
      case 'rescheduled': return 'Verzet';
      default: return status;
    }
  };

  // Helper functions for filtering bookings
  const pendingBookings = bookings.filter(booking => 
    booking.status === 'pending'
  );

  const confirmedBookings = bookings.filter(booking => 
    booking.status === 'confirmed'
  );

  const inProgressBookings = bookings.filter(booking => 
    booking.status === 'in_progress'
  );

  const completedBookings = bookings.filter(booking => 
    booking.status === 'completed'
  );

  const activeBookings = bookings.filter(booking => 
    ['confirmed', 'in_progress'].includes(booking.status)
  );

  return {
    bookings,
    pendingBookings,
    confirmedBookings,
    inProgressBookings,
    completedBookings,
    activeBookings,
    loading,
    error,
    providerId,
    updateBookingStatus,
    refetch: providerId ? () => fetchBookings(providerId) : fetchProviderIdAndBookings
  };
}