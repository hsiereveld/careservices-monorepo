import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const GET = async (request: NextRequest) => {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const professional_id = searchParams.get('professional_id');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        service_providers!inner(
          id,
          user_id,
          business_name,
          rating_average,
          total_bookings
        ),
        services!inner(
          id,
          name,
          description,
          price,
          duration_hours
        ),
        customers!inner(
          id,
          user_id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by professional if provided
    if (professional_id) {
      query = query.eq('provider_id', professional_id);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: bookings || [],
      total: bookings?.length || 0
    });

  } catch (error) {
    console.error('Error in bookings GET:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      provider_id,
      service_id,
      customer_id,
      booking_date,
      booking_time,
      duration_hours,
      notes,
      emergency_booking = false
    } = body;

    // Validate required fields
    if (!provider_id || !service_id || !customer_id || !booking_date || !booking_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('provider_id', provider_id)
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .in('status', ['pending', 'confirmed', 'in_progress']);

    if (conflictError) {
      console.error('Conflict check error:', conflictError);
      return NextResponse.json(
        { error: 'Error checking availability' },
        { status: 500 }
      );
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Time slot not available' },
        { status: 409 }
      );
    }

    // Get service details for price calculation
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('price, duration_hours')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Calculate final price
    const final_price = service.price * (duration_hours || service.duration_hours);

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        provider_id,
        service_id,
        customer_id,
        booking_date,
        booking_time,
        duration_hours: duration_hours || service.duration_hours,
        final_price,
        notes,
        emergency_booking,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Booking creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      booking,
      message: 'Booking created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in bookings POST:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}; 