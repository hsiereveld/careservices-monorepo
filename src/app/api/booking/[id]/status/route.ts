import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

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

    // Check if user is the provider of this booking (only providers can update status)
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const isProvider = provider?.id === existingBooking.provider_id;

    if (!isProvider) {
      return NextResponse.json(
        { error: 'Only service providers can update booking status' },
        { status: 403 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    const allowedTransitions = validTransitions[existingBooking.status] || [];
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existingBooking.status} to ${status}` },
        { status: 400 }
      );
    }

    // Update booking status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Booking status update error:', error);
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      booking,
      message: `Booking status updated to ${status}`
    });

  } catch (error) {
    console.error('Error in booking status PUT:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}; 