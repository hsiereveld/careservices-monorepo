import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booking_id,
      rating,
      punctuality_rating,
      quality_rating,
      communication_rating,
      review_text,
      would_recommend,
      is_public
    } = body;

    // Validate required fields
    if (!booking_id || !rating) {
      return NextResponse.json({ error: 'Booking ID and rating are required' }, { status: 400 });
    }

    // Validate rating values
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Get booking details to verify it exists and is completed
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, 
        customer_id, 
        provider_id, 
        status,
        service:services(name),
        provider:service_providers(business_name, user_id)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });
    }

    // Check if review already exists
    const { data: existingReview } = await supabaseAdmin
      .from('booking_reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists for this booking' }, { status: 400 });
    }

    // Create the review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('booking_reviews')
      .insert({
        booking_id,
        customer_id: booking.customer_id,
        provider_id: booking.provider_id,
        rating,
        punctuality_rating: punctuality_rating || rating,
        quality_rating: quality_rating || rating,
        communication_rating: communication_rating || rating,
        review_text: review_text || '',
        would_recommend: would_recommend !== false,
        is_public: is_public !== false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    // Update provider's average rating
    await updateProviderRating(booking.provider_id);

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');
    const bookingId = searchParams.get('booking_id');
    const isPublic = searchParams.get('public') === 'true';

    let query = supabaseAdmin
      .from('booking_reviews')
      .select(`
        *,
        customer:profiles!booking_reviews_customer_id_fkey(first_name, last_name),
        booking:bookings(booking_date, service:services(name))
      `);

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    if (isPublic) {
      query = query.eq('is_public', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || []
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateProviderRating(providerId: string) {
  try {
    // Calculate new average rating for the provider
    const { data: reviews } = await supabaseAdmin
      .from('booking_reviews')
      .select('rating')
      .eq('provider_id', providerId);

    if (reviews && reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      const totalReviews = reviews.length;

      // Update provider rating
      await supabaseAdmin
        .from('service_providers')
        .update({
          rating_average: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          total_reviews: totalReviews,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);
    }
  } catch (error) {
    console.error('Error updating provider rating:', error);
  }
}
