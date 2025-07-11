import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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

    const { id } = params;

    const { data: booking, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Error in booking GET:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};

export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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

    const { id } = params;
    const body = await request.json();
    const {
      status,
      notes,
      booking_date,
      booking_time,
      duration_hours
    } = body;

    // Validate that booking exists and user has permission
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('customer_id, provider_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user is the customer or provider of this booking
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const isCustomer = customer?.id === existingBooking.customer_id;
    const isProvider = provider?.id === existingBooking.provider_id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (booking_date !== undefined) updateData.booking_date = booking_date;
    if (booking_time !== undefined) updateData.booking_time = booking_time;
    if (duration_hours !== undefined) updateData.duration_hours = duration_hours;

    // If changing date/time, check for conflicts
    if (booking_date || booking_time) {
      const { data: conflicts, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('provider_id', existingBooking.provider_id)
        .eq('booking_date', booking_date || existingBooking.booking_date)
        .eq('booking_time', booking_time || existingBooking.booking_time)
        .neq('id', id)
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
    }

    // Update booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Booking update error:', error);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      booking,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Error in booking PUT:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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

    const { id } = params;

    // Validate that booking exists and user has permission
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('customer_id, provider_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(existingBooking.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel booking in current status' },
        { status: 400 }
      );
    }

    // Check if user is the customer or provider of this booking
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const isCustomer = customer?.id === existingBooking.customer_id;
    const isProvider = provider?.id === existingBooking.provider_id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Cancel booking (soft delete by setting status to cancelled)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      console.error('Booking cancellation error:', error);
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Error in booking DELETE:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}; 