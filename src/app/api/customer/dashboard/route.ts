import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // For now, use the known customer ID from the logs for testing
    // In production, you'd extract this from authenticated session
    const userId = '16333373-743d-4040-8f60-233391ec7ed6';

    console.log('🚀 Customer dashboard API called for user:', userId);

    // Get customer profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }

    // Get basic booking statistics
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, final_price, booking_date')
      .eq('customer_id', userId);

    if (bookingsError) {
      console.error('Bookings error:', bookingsError);
    }

    const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
    const upcomingBookings = bookings?.filter(b => 
      b.status !== 'completed' && 
      b.status !== 'cancelled' &&
      new Date(b.booking_date) >= new Date()
    ) || [];
    
    const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.final_price || 0), 0);

    const stats = {
      total_bookings: bookings?.length || 0,
      pending_bookings: bookings?.filter(b => b.status === 'pending').length || 0,
      completed_bookings: completedBookings.length,
      cancelled_bookings: bookings?.filter(b => b.status === 'cancelled').length || 0,
      total_spent: totalSpent,
      upcoming_bookings: upcomingBookings.length,
      pending_reviews: 0 // TODO: Calculate when reviews table is available
    };

    // Get recent bookings with service info
    const { data: recentBookingsData, error: recentError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        service:services(name, short_description, base_price)
      `)
      .eq('customer_id', userId)
      .order('booking_date', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('Recent bookings error:', recentError);
    }

    const recentBookings = recentBookingsData?.map(booking => ({
      ...booking,
      professional_id: booking.provider_id,
      start_time: booking.booking_time,
      total_amount: booking.final_price,
      scheduled_date: booking.booking_date,
      scheduled_time: booking.booking_time,
      serviceName: booking.service?.name || 'Unknown Service',
      providerName: 'Provider' // TODO: Get from service_providers table
    })) || [];

    const dashboardData = {
      success: true,
      user: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role
      },
      stats,
      recent_bookings: recentBookings,
      pending_reviews: [] // TODO: Implement when reviews functionality is available
    };

    console.log('✅ Customer dashboard data prepared:', {
      user_id: userId,
      stats_summary: stats,
      recent_bookings_count: recentBookings.length
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('❌ Customer dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 