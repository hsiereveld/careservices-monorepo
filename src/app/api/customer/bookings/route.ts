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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get customer ID from user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }

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
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      bookings: bookings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in customer bookings GET:', error);
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

    // Get customer ID from user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      provider_id,
      service_id,
      booking_date,
      booking_time,
      duration_hours,
      notes,
      emergency_booking = false
    } = body;

    // Validate required fields
    if (!provider_id || !service_id || !booking_date || !booking_time) {
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
        customer_id: customer.id,
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
    console.error('Error in customer bookings POST:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('🚀 Customer booking update API called for user:', userId);

    const { booking_id, action, ...updates } = await request.json();

    if (!booking_id || !action) {
      return NextResponse.json({ error: 'Booking ID and action are required' }, { status: 400 });
    }

    let updateData: any = {};

    switch (action) {
      case 'cancel':
        updateData = { 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString(),
          cancellation_reason: updates.cancel_reason || 'Cancelled by customer'
        };
        break;
      case 'reschedule':
        updateData = {
          booking_date: updates.booking_date,
          booking_time: updates.booking_time || updates.start_time,
          status: 'pending' // Reset to pending for approval
        };
        break;
      case 'update_notes':
        updateData = { customer_notes: updates.customer_notes };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking_id)
      .eq('customer_id', userId)
      .select(`
        *,
        service:services(name, short_description),
        provider:service_providers(business_name, user_id)
      `)
      .single();

    if (error) throw error;

    console.log('✅ Successfully updated booking:', booking.id);

    return NextResponse.json({
      success: true,
      booking: booking
    });
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 