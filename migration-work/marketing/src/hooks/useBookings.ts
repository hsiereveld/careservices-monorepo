import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI, BookingWithDetails, Booking, BookingStatus } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { calculateEstimatedPrice } from '../utils/bookingPriceCalculator';
import { sendEmail } from '../utils/emailService';

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await bookingAPI.getCustomerBookings(user.id);
      
      if (fetchError) throw fetchError;
      
      setBookings(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: Partial<Booking>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      // Prepare booking data with customer_id and proper field mapping
      const bookingPayload = {
        ...bookingData,
        customer_id: user.id
      };
      
      // Map booking_start_date to booking_date if present
      if (bookingPayload.booking_start_date && !bookingPayload.booking_date) {
        bookingPayload.booking_date = bookingPayload.booking_start_date;
      }
      
      // Map booking_start_time to booking_time if present
      if (bookingPayload.booking_start_time && !bookingPayload.booking_time) {
        bookingPayload.booking_time = bookingPayload.booking_start_time;
      }
      
      // Remove discount_id if it's null to avoid schema errors
      if (bookingPayload.discount_id === null) {
        delete bookingPayload.discount_id;
      }
      
      // Calculate estimated price if service_id is provided but estimated_price is not
      if (!bookingPayload.estimated_price && bookingPayload.service_id) {
        try {
          // Get the service pricing tier
          const { data: pricingTiers } = await supabase
            .from('pricing_tiers')
            .select('*')
            .eq('service_id', bookingPayload.service_id)
            .order('price', { ascending: true })
            .limit(1);
            
          if (pricingTiers && pricingTiers.length > 0) {
            const pricingTier = pricingTiers[0];
            
            // Calculate estimated price based on duration and price unit
            bookingPayload.estimated_price = calculateEstimatedPrice(
              pricingTier.price,
              pricingTier.price_unit,
              bookingPayload.booking_start_date,
              bookingPayload.booking_start_time,
              bookingPayload.booking_end_date,
              bookingPayload.booking_end_time
            );
            
            console.log('Calculated estimated price:', bookingPayload.estimated_price);
          }
        } catch (priceError) {
          console.error('Error calculating estimated price:', priceError);
        }
      }
      
      const { data, error: createError } = await bookingAPI.createBooking(bookingPayload);
      
      if (createError) throw createError;
      
      // Send booking confirmation email to client
      try {
        // Get service details
        const { data: serviceData } = await supabase
          .from('services')
          .select('name')
          .eq('id', bookingPayload.service_id)
          .single();
          
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
          
        if (serviceData && profileData) {
          await sendEmail('booking_request_client', user.email!, {
            first_name: profileData.first_name || 'Klant',
            service_name: serviceData.name,
            booking_date: new Date(bookingPayload.booking_date || bookingPayload.booking_start_date!).toLocaleDateString('nl-NL'),
            booking_time: bookingPayload.booking_time || bookingPayload.booking_start_time!,
            booking_address: bookingPayload.customer_address || 'Niet opgegeven',
            estimated_price: bookingPayload.estimated_price?.toFixed(2) || '0.00'
          });
          
          console.log('✅ Booking request email sent to client');
        }
      } catch (emailErr) {
        console.error('Error sending booking request email:', emailErr);
        // Continue with the process even if email fails
      }
      
      // Refresh bookings list
      await fetchBookings();
      
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const updateBooking = async (bookingId: string, bookingData: Partial<Booking>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      // Check if booking exists and belongs to the user
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error('Boeking niet gevonden');
      }
      
      if (booking.customer_id !== user.id) {
        throw new Error('Je hebt geen toestemming om deze boeking te wijzigen');
      }
      
      // Check if booking can be modified based on its current status
      if (booking.status !== 'pending') {
        throw new Error(`Boekingen met status "${getStatusLabel(booking.status)}" kunnen niet meer worden gewijzigd.`);
      }
      
      // Prepare booking data
      const updatePayload = {
        ...bookingData,
        customer_id: user.id
      };
      
      // Map booking_start_date to booking_date if present
      if (updatePayload.booking_start_date && !updatePayload.booking_date) {
        updatePayload.booking_date = updatePayload.booking_start_date;
      }
      
      // Map booking_start_time to booking_time if present
      if (updatePayload.booking_start_time && !updatePayload.booking_time) {
        updatePayload.booking_time = updatePayload.booking_start_time;
      }
      
      // Calculate estimated price if service_id is provided but estimated_price is not
      if (updatePayload.service_id && !updatePayload.estimated_price) {
        try {
          // Get the service pricing tier
          const { data: pricingTiers } = await supabase
            .from('pricing_tiers')
            .select('*')
            .eq('service_id', updatePayload.service_id)
            .order('price', { ascending: true })
            .limit(1);
            
          if (pricingTiers && pricingTiers.length > 0) {
            const pricingTier = pricingTiers[0];
            
            // Calculate estimated price based on duration and price unit
            updatePayload.estimated_price = calculateEstimatedPrice(
              pricingTier.price,
              pricingTier.price_unit,
              updatePayload.booking_start_date,
              updatePayload.booking_start_time,
              updatePayload.booking_end_date,
              updatePayload.booking_end_time
            );
          }
        } catch (priceError) {
          console.error('Error calculating estimated price:', priceError);
        }
      }
      
      // Update booking
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId)
        .eq('customer_id', user.id) // Ensure the booking belongs to the user
        .select();
      
      if (updateError) throw updateError;
      
      // Refresh bookings list
      await fetchBookings();
      
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus, notes?: string) => {
    try {
      setError(null);
      
      // Check if booking can be modified based on its current status
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        // Clients can only modify bookings with status 'pending'
        if (booking.status !== 'pending') {
          throw new Error(`Boekingen met status "${getStatusLabel(booking.status)}" kunnen niet meer worden gewijzigd.`);
        }
      }
      
      const { data, error: updateError } = await bookingAPI.updateBookingStatus(bookingId, status, notes);
      
      if (updateError) throw updateError;
      
      // Send email notification if status is changed to cancelled
      if (status === 'cancelled' && booking) {
        try {
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user!.id)
            .single();
            
          // Get service details
          const { data: serviceData } = await supabase
            .from('services')
            .select('name')
            .eq('id', booking.service_id)
            .single();
            
          if (profileData && serviceData) {
            await sendEmail('booking_cancelled_client', user!.email!, {
              first_name: profileData.first_name || 'Klant',
              service_name: serviceData.name,
              booking_date: new Date(booking.booking_date).toLocaleDateString('nl-NL'),
              booking_time: booking.booking_time,
              cancellation_reason: notes || 'Geannuleerd door klant'
            });
            
            console.log('✅ Booking cancellation email sent to client');
            
            // If there's a provider assigned, also send them an email
            if (booking.provider_id) {
              // Get provider details
              const { data: providerData } = await supabase
                .from('service_providers')
                .select('user_id, business_name')
                .eq('id', booking.provider_id)
                .single();
                
              if (providerData) {
                // Get provider email
                const { data: providerUser } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', providerData.user_id)
                  .single();
                  
                if (providerUser) {
                  // Get provider email from auth
                  const { data: authData } = await supabase.auth.admin.getUserById(providerUser.id);
                  
                  if (authData && authData.user) {
                    await sendEmail('booking_cancelled_by_client_professional', authData.user.email!, {
                      provider_name: providerData.business_name || 'Professional',
                      service_name: serviceData.name,
                      booking_date: new Date(booking.booking_date).toLocaleDateString('nl-NL'),
                      booking_time: booking.booking_time,
                      cancellation_reason: notes || 'Geannuleerd door klant',
                      client_name: `${profileData.first_name} ${profileData.last_name}`
                    });
                    
                    console.log('✅ Booking cancellation email sent to provider');
                  }
                }
              }
            }
          }
        } catch (emailErr) {
          console.error('Error sending cancellation email:', emailErr);
          // Continue with the process even if email fails
        }
      }
      
      // Refresh bookings list
      await fetchBookings();
      
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const addReview = async (bookingId: string, rating: number, reviewText?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking || !booking.provider_id) {
        throw new Error('Booking or provider not found');
      }

      const { data, error: reviewError } = await bookingAPI.addReview({
        booking_id: bookingId,
        customer_id: user.id,
        provider_id: booking.provider_id,
        rating,
        review_text: reviewText
      });
      
      if (reviewError) throw reviewError;
      
      // Send email notification to provider about the new review
      try {
        // Get provider details
        const { data: providerData } = await supabase
          .from('service_providers')
          .select('user_id, business_name')
          .eq('id', booking.provider_id)
          .single();
          
        if (providerData) {
          // Get provider email
          const { data: providerUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', providerData.user_id)
            .single();
            
          if (providerUser) {
            // Get provider email from auth
            const { data: authData } = await supabase.auth.admin.getUserById(providerUser.id);
            
            // Get client profile
            const { data: clientProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', user.id)
              .single();
              
            // Get service details
            const { data: serviceData } = await supabase
              .from('services')
              .select('name')
              .eq('id', booking.service_id)
              .single();
              
            if (authData && authData.user && clientProfile && serviceData) {
              await sendEmail('review_received_professional', authData.user.email!, {
                provider_name: providerData.business_name || 'Professional',
                client_name: `${clientProfile.first_name} ${clientProfile.last_name}`,
                service_name: serviceData.name,
                booking_date: new Date(booking.booking_date).toLocaleDateString('nl-NL'),
                rating: rating.toString(),
                review_text: reviewText || 'Geen tekst toegevoegd'
              });
              
              console.log('✅ Review notification email sent to provider');
            }
          }
        }
      } catch (emailErr) {
        console.error('Error sending review notification email:', emailErr);
        // Continue with the process even if email fails
      }
      
      // Refresh bookings list
      await fetchBookings();
      
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Apply discount to booking
  const applyDiscount = async (bookingId: string, discountCode: string) => {
    try {
      setError(null);
      
      // First, validate the discount code
      const { data: discountData, error: discountError } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', discountCode)
        .eq('is_active', true)
        .single();
      
      if (discountError) {
        if (discountError.code === 'PGRST116') {
          throw new Error('Ongeldige kortingscode');
        }
        throw discountError;
      }
      
      // Get the booking to check if discount can be applied
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      if (bookingError) throw bookingError;
      
      // Validate discount
      const now = new Date();
      if (discountData.start_date && new Date(discountData.start_date) > now) {
        throw new Error('Deze kortingscode is nog niet geldig');
      }
      if (discountData.end_date && new Date(discountData.end_date) < now) {
        throw new Error('Deze kortingscode is verlopen');
      }
      if (discountData.max_uses !== null && discountData.uses_count >= discountData.max_uses) {
        throw new Error('Deze kortingscode is het maximaal aantal keren gebruikt');
      }
      if (discountData.min_order_amount > bookingData.estimated_price) {
        throw new Error(`Deze kortingscode is alleen geldig bij bestellingen vanaf €${discountData.min_order_amount.toFixed(2)}`);
      }
      
      // Calculate discount amount
      let discountAmount = 0;
      if (discountData.is_percentage && discountData.percentage) {
        discountAmount = (bookingData.estimated_price * discountData.percentage) / 100;
      } else if (!discountData.is_percentage && discountData.amount) {
        discountAmount = discountData.amount;
      }
      
      // Update booking with discount
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          discount_id: discountData.id,
          discount_amount: discountAmount
        })
        .eq('id', bookingId)
        .select();
      
      if (updateError) throw updateError;
      
      // Increment discount usage count
      await supabase
        .from('discounts')
        .update({
          uses_count: discountData.uses_count + 1
        })
        .eq('id', discountData.id);
      
      // Refresh bookings list
      await fetchBookings();
      
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Apply subscription to booking
  const applySubscription = async (bookingId: string, subscriptionId: string) => {
    try {
      setError(null);
      
      // Get the booking to check if subscription can be applied
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      if (bookingError) throw bookingError;
      
      // Get the subscription to check if it has enough hours
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('is_active', true)
        .single();
      
      if (subscriptionError) throw subscriptionError;
      
      // Check if subscription has enough hours
      if (subscriptionData.hours_remaining < bookingData.duration_hours) {
        throw new Error('Niet genoeg uren beschikbaar in je abonnement');
      }
      
      // Update booking with subscription
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          subscription_id: subscriptionId,
          subscription_hours_used: bookingData.duration_hours
        })
        .eq('id', bookingId)
        .select();
      
      if (updateError) throw updateError;
      
      // Update subscription hours
      await supabase
        .from('user_subscriptions')
        .update({
          hours_used: subscriptionData.hours_used + bookingData.duration_hours,
          hours_remaining: subscriptionData.hours_remaining - bookingData.duration_hours
        })
        .eq('id', subscriptionId);
      
      // Refresh bookings list
      await fetchBookings();
      
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
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
  const upcomingBookings = bookings.filter(booking => 
    ['pending', 'confirmed'].includes(booking.status) && 
    new Date(booking.booking_date) >= new Date()
  );

  const completedBookings = bookings.filter(booking => 
    booking.status === 'completed'
  );

  const activeBookings = bookings.filter(booking => 
    ['confirmed', 'in_progress'].includes(booking.status)
  );

  return {
    bookings,
    upcomingBookings,
    completedBookings,
    activeBookings,
    loading,
    error,
    createBooking,
    updateBooking,
    updateBookingStatus,
    addReview,
    applyDiscount,
    applySubscription,
    refetch: fetchBookings
  };
}