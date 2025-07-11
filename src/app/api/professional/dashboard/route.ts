import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get professional profile and stats
    const professionalStats = await supabase.rpc('get_professional_dashboard_stats', {
      professional_user_id: userId
    });

    // Get recent bookings for this professional
    const recentBookings = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(name, short_description, base_price),
        customer:profiles!bookings_customer_id_fkey(first_name, last_name, phone, email)
      `)
      .eq('provider_id', userId)
      .order('booking_date', { ascending: false })
      .limit(10);

    // Get earnings summary
    const earnings = await supabase
      .from('bookings')
      .select('final_price')
      .eq('provider_id', userId)
      .eq('status', 'completed')
      .gte('booking_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const totalEarnings = earnings.data?.reduce((sum, booking) => sum + (booking.final_price || 0), 0) || 0;

    // Format response data
    const dashboardData = {
      stats: professionalStats.data?.[0] || {
        total_bookings: 0,
        pending_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0,
        total_earned: 0,
        average_rating: 0
      },
      recent_bookings: recentBookings.data?.map(booking => ({
        ...booking,
        professional_id: booking.provider_id,
        start_time: booking.booking_time,
        total_amount: booking.final_price,
        scheduled_date: booking.booking_date,
        scheduled_time: booking.booking_time
      })) || [],
      monthly_earnings: totalEarnings
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching professional dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 