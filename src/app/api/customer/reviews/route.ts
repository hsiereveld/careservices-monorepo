import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // For now, use the known customer ID from the logs for testing
    const userId = '16333373-743d-4040-8f60-233391ec7ed6';

    console.log('🚀 Customer reviews API called for user:', userId);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'my-reviews';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query;

    if (type === 'pending') {
      // Get bookings that need reviews (completed but no review yet)
      query = supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('customer_id', userId)
        .eq('status', 'completed');
    } else {
      // Get existing reviews by this customer
      query = supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('customer_id', userId);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1)
                 .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} ${type} items`);

    return NextResponse.json({
      success: true,
      data: data || [],
      type: type,
      pagination: {
        page,
        limit,
        total: data?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Customer reviews error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, use the known customer ID from the logs for testing
    const userId = '16333373-743d-4040-8f60-233391ec7ed6';

    console.log('🚀 Customer review creation API called for user:', userId);

    const {
      booking_id,
      rating,
      review_text,
      punctuality_rating,
      quality_rating,
      communication_rating,
      would_recommend
    } = await request.json();

    if (!booking_id || !rating) {
      return NextResponse.json({ 
        error: 'Booking ID and rating are required' 
      }, { status: 400 });
    }

    // Verify the booking belongs to the customer and is completed
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, status, provider_id')
      .eq('id', booking_id)
      .eq('customer_id', userId)
      .eq('status', 'completed')
      .single();

    if (!booking) {
      return NextResponse.json({ 
        error: 'Booking not found or not eligible for review' 
      }, { status: 404 });
    }

    // Check if review already exists
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('customer_id', userId)
      .single();

    if (existingReview) {
      return NextResponse.json({ 
        error: 'Review already exists for this booking' 
      }, { status: 400 });
    }

    // Create the review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        customer_id: userId,
        professional_id: booking.provider_id,
        booking_id: booking_id,
        rating,
        review_text,
        punctuality_rating,
        quality_rating,
        communication_rating,
        would_recommend: would_recommend || false
      })
      .select('*')
      .single();

    if (error) throw error;

    console.log('✅ Successfully created review:', review.id);

    return NextResponse.json({
      success: true,
      review: review
    });
  } catch (error) {
    console.error('❌ Error creating review:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 