import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API /admin/database-analytics called');

    // Get franchise_id from query params or use default
    const { searchParams } = new URL(request.url);
    const franchiseId = searchParams.get('franchise_id');

    // Build franchise filter condition for tables that have franchise_id
    const franchiseFilter = franchiseId ? { franchise_id: franchiseId } : {};

    // Parallel queries for performance
    const [
      profilesResult,
      serviceProvidersResult,
      servicesResult,
      serviceCategoriesResult,
      bookingsResult,
      paymentsResult,
      reviewsResult,
      franchisesResult
    ] = await Promise.all([
      // Profiles with role counts (using 'role' instead of 'user_type')
      supabaseAdmin
        .from('profiles')
        .select('id, role, created_at', { count: 'exact' })
        .match(franchiseFilter),
      
      // Service providers (no franchise_id filter since column doesn't exist)
      supabaseAdmin
        .from('service_providers')
        .select('id, is_active, is_verified, rating_average, total_bookings', { count: 'exact' }),
      
      // Services
      supabaseAdmin
        .from('services')
        .select('id, is_active, base_price', { count: 'exact' }),
      
      // Service categories
      supabaseAdmin
        .from('service_categories')
        .select('id, is_active', { count: 'exact' }),
      
      // Bookings with status breakdown (using 'final_price' instead of 'total_price')
      supabaseAdmin
        .from('bookings')
        .select('id, status, final_price, created_at', { count: 'exact' })
        .match(franchiseFilter),
      
      // Payments (simplified - no status filter since column might not exist)
      supabaseAdmin
        .from('payments')
        .select('id, amount', { count: 'exact' }),
      
      // Reviews (using 'rating' instead of 'overall_rating')
      supabaseAdmin
        .from('booking_reviews')
        .select('id, rating, is_public', { count: 'exact' }),
      
      // Franchises (using 'name' instead of 'subdomain')
      supabaseAdmin
        .from('franchises')
        .select('id, name, slug, is_active', { count: 'exact' })
    ]);

    // Process results and handle errors
    const results = {
      profiles: profilesResult,
      serviceProviders: serviceProvidersResult,
      services: servicesResult,
      serviceCategories: serviceCategoriesResult,
      bookings: bookingsResult,
      payments: paymentsResult,
      reviews: reviewsResult,
      franchises: franchisesResult
    };

    // Check for errors
    const errors = Object.entries(results)
      .filter(([_, result]) => result.error)
      .map(([key, result]) => `${key}: ${result.error?.message}`);

    if (errors.length > 0) {
      console.error('❌ Database query errors:', errors);
    }

    // Calculate statistics
    const profiles = profilesResult.data || [];
    const serviceProviders = serviceProvidersResult.data || [];
    const bookings = bookingsResult.data || [];
    const payments = paymentsResult.data || [];
    const reviews = reviewsResult.data || [];

    // User type breakdown (using 'role' field)
    const userTypes = profiles.reduce((acc: any, profile: any) => {
      const type = profile.role || 'customer';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Booking status breakdown
    const bookingStatuses = bookings.reduce((acc: any, booking: any) => {
      const status = booking.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Provider statistics (using 'rating_average')
    const activeProviders = serviceProviders.filter(p => p.is_active).length;
    const verifiedProviders = serviceProviders.filter(p => p.is_verified).length;
    const avgProviderRating = serviceProviders.length > 0 
      ? serviceProviders.reduce((sum, p) => sum + (p.rating_average || 0), 0) / serviceProviders.length
      : 0;

    // Financial statistics (simplified)
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalBookingValue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.final_price || 0), 0);

    // Review statistics (using 'rating' field)
    const publicReviews = reviews.filter(r => r.is_public).length;
    const avgReviewRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    // Growth statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProfiles = profiles.filter(p => 
      p.created_at && new Date(p.created_at) >= thirtyDaysAgo
    ).length;

    const recentBookings = bookings.filter(b => 
      b.created_at && new Date(b.created_at) >= thirtyDaysAgo
    ).length;

    const analytics = {
      // Core counts
      totalUsers: profilesResult.count || 0,
      totalProviders: serviceProvidersResult.count || 0,
      totalServices: servicesResult.count || 0,
      totalCategories: serviceCategoriesResult.count || 0,
      totalBookings: bookingsResult.count || 0,
      totalPayments: paymentsResult.count || 0,
      totalReviews: reviewsResult.count || 0,
      totalFranchises: franchisesResult.count || 0,

      // User breakdown
      userTypes: {
        customers: userTypes.customer || 0,
        professionals: userTypes.professional || 0,
        admins: userTypes.admin || 0,
        total: profilesResult.count || 0
      },

      // Provider statistics
      providerStats: {
        active: activeProviders,
        verified: verifiedProviders,
        total: serviceProvidersResult.count || 0,
        averageRating: Math.round(avgProviderRating * 100) / 100
      },

      // Booking statistics
      bookingStats: {
        pending: bookingStatuses.pending || 0,
        confirmed: bookingStatuses.confirmed || 0,
        completed: bookingStatuses.completed || 0,
        cancelled: bookingStatuses.cancelled || 0,
        total: bookingsResult.count || 0
      },

      // Payment statistics (simplified)
      paymentStats: {
        total: paymentsResult.count || 0
      },

      // Financial statistics
      financialStats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookingValue: Math.round(totalBookingValue * 100) / 100,
        currency: 'EUR'
      },

      // Review statistics
      reviewStats: {
        public: publicReviews,
        total: reviewsResult.count || 0,
        averageRating: Math.round(avgReviewRating * 100) / 100
      },

      // Growth statistics
      growthStats: {
        newUsersLast30Days: recentProfiles,
        newBookingsLast30Days: recentBookings
      },

      // Service statistics
      serviceStats: {
        active: servicesResult.data?.filter(s => s.is_active).length || 0,
        total: servicesResult.count || 0,
        categoriesActive: serviceCategoriesResult.data?.filter(c => c.is_active).length || 0,
        categoriesTotal: serviceCategoriesResult.count || 0
      },

      // Metadata
      franchiseId: franchiseId || 'all',
      generatedAt: new Date().toISOString(),
      errors: errors.length > 0 ? errors : null
    };

    console.log('✅ Database analytics generated successfully');
    return NextResponse.json(analytics);

  } catch (error: any) {
    console.error('❌ Database analytics error:', error);
    return NextResponse.json({
      error: 'Failed to fetch database analytics',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 