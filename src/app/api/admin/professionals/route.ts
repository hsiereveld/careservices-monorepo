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
    console.log('🚀 API /admin/professionals called');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const franchiseId = searchParams.get('franchise_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const isActive = searchParams.get('is_active');
    const isVerified = searchParams.get('is_verified');

    // First, get service providers (without franchise_id since it doesn't exist in this table)
    let query = supabaseAdmin
      .from('service_providers')
      .select(`
        id,
        user_id,
        business_name,
        description,
        phone,
        email,
        hourly_rate,
        is_active,
        is_verified,
        rating_average,
        total_reviews,
        total_bookings,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters (only for columns that exist)
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    if (isVerified !== null) {
      query = query.eq('is_verified', isVerified === 'true');
    }

    const { data: professionals, error, count } = await query;

    if (error) {
      console.error('❌ Service providers query failed:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch professionals',
        details: error.message 
      }, { status: 500 });
    }

    if (!professionals || professionals.length === 0) {
      return NextResponse.json({
        professionals: [],
        summary: {
          total: 0,
          active: 0,
          verified: 0,
          averageRating: 0,
          totalServices: 0,
          totalBookings: 0,
          totalEarnings: 0
        },
        pagination: {
          offset,
          limit,
          total: 0,
          hasMore: false
        },
        filters: {
          franchiseId,
          isActive,
          isVerified
        },
        errors: []
      });
    }

    // Get user IDs to fetch profiles separately
    const userIds = professionals.map(p => p.user_id);

    // Get profiles for these users (with franchise filtering if needed)
    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        city,
        postal_code,
        address,
        role,
        preferred_language,
        franchise_id,
        created_at
      `)
      .in('id', userIds);

    // Apply franchise filter on profiles if specified
    if (franchiseId) {
      profilesQuery = profilesQuery.eq('franchise_id', franchiseId);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    // Filter professionals to only include those with profiles in the specified franchise
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const filteredProfessionals = professionals.filter(prof => profileMap.has(prof.user_id));

    if (filteredProfessionals.length === 0) {
      return NextResponse.json({
        professionals: [],
        summary: {
          total: 0,
          active: 0,
          verified: 0,
          averageRating: 0,
          totalServices: 0,
          totalBookings: 0,
          totalEarnings: 0
        },
        pagination: {
          offset,
          limit,
          total: 0,
          hasMore: false
        },
        filters: {
          franchiseId,
          isActive,
          isVerified
        },
        errors: []
      });
    }

    // Get professional IDs for additional data
    const professionalIds = filteredProfessionals.map(p => p.id);
    
    // Get services for each professional
    const { data: providerServices, error: servicesError } = await supabaseAdmin
      .from('provider_services')
      .select(`
        provider_id,
        service_id,
        custom_price,
        is_available,
        services (
          id,
          name,
          description,
          base_price,
          service_categories (
            id,
            name
          )
        )
      `)
      .in('provider_id', professionalIds);

    // Get recent bookings for each professional
    const { data: recentBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        provider_id,
        id,
        status,
        final_price,
        booking_date,
        created_at
      `)
      .in('provider_id', professionalIds)
      .order('created_at', { ascending: false })
      .limit(200);

    // Get recent reviews for each professional (simplified)
    const { data: recentReviews, error: reviewsError } = await supabaseAdmin
      .from('booking_reviews')
      .select(`
        provider_id,
        rating,
        created_at
      `)
      .in('provider_id', professionalIds)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(100);

    // Create lookup maps
    const servicesMap = new Map();
    const bookingsMap = new Map();
    const reviewsMap = new Map();

    // Group services by provider
    providerServices?.forEach((ps: any) => {
      if (!servicesMap.has(ps.provider_id)) {
        servicesMap.set(ps.provider_id, []);
      }
      servicesMap.get(ps.provider_id).push(ps);
    });

    // Group bookings by provider
    recentBookings?.forEach((b: any) => {
      if (!bookingsMap.has(b.provider_id)) {
        bookingsMap.set(b.provider_id, []);
      }
      bookingsMap.get(b.provider_id).push(b);
    });

    // Group reviews by provider
    recentReviews?.forEach((r: any) => {
      if (!reviewsMap.has(r.provider_id)) {
        reviewsMap.set(r.provider_id, []);
      }
      reviewsMap.get(r.provider_id).push(r);
    });

    // Process and enrich the data
    const enrichedProfessionals = filteredProfessionals.map(professional => {
      const profile = profileMap.get(professional.user_id);
      const services = servicesMap.get(professional.id) || [];
      const bookings = bookingsMap.get(professional.id) || [];
      const reviews = reviewsMap.get(professional.id) || [];
      
      // Calculate statistics
      const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
      const totalEarnings = bookings
        .filter((b: any) => b.status === 'completed')
        .reduce((sum: number, b: any) => sum + (b.final_price || 0), 0);
      
      const avgRecentRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
        : null;

      return {
        ...professional,
        // Profile information
        profile: profile ? {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          city: profile.city,
          postal_code: profile.postal_code,
          address: profile.address,
          role: profile.role,
          preferred_language: profile.preferred_language,
          franchise_id: profile.franchise_id,
          created_at: profile.created_at,
          display_name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : professional.business_name || 'Onbekend'
        } : null,
        
        // Services offered
        services: services.map((ps: any) => ({
          id: ps.service_id,
          name: ps.services?.name,
          description: ps.services?.description,
          base_price: ps.services?.base_price,
          custom_price: ps.custom_price,
          is_available: ps.is_available,
          category: ps.services?.service_categories
        })),
        
        // Statistics
        stats: {
          completedBookings,
          pendingBookings,
          totalBookings: bookings.length,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          avgRecentRating: avgRecentRating ? Math.round(avgRecentRating * 100) / 100 : null,
          recentReviews: reviews.length,
          servicesOffered: services.length
        },
        
        // Recent activity
        recentBookings: bookings.slice(0, 5).map((b: any) => ({
          id: b.id,
          status: b.status,
          final_price: b.final_price,
          booking_date: b.booking_date,
          created_at: b.created_at
        })),
        
        recentReviews: reviews.slice(0, 3).map((r: any) => ({
          rating: r.rating,
          created_at: r.created_at
        }))
      };
    });

    // Calculate summary statistics
    const summary = {
      total: filteredProfessionals.length,
      active: enrichedProfessionals.filter(p => p.is_active).length,
      verified: enrichedProfessionals.filter(p => p.is_verified).length,
      averageRating: enrichedProfessionals.length > 0
        ? enrichedProfessionals.reduce((sum, p) => sum + (p.rating_average || 0), 0) / enrichedProfessionals.length
        : 0,
      totalServices: enrichedProfessionals.reduce((sum, p) => sum + p.services.length, 0),
      totalBookings: enrichedProfessionals.reduce((sum, p) => sum + (p.total_bookings || 0), 0),
      totalEarnings: enrichedProfessionals.reduce((sum, p) => sum + p.stats.totalEarnings, 0)
    };

    const response = {
      professionals: enrichedProfessionals,
      summary,
      pagination: {
        offset,
        limit,
        total: filteredProfessionals.length,
        hasMore: (offset + limit) < filteredProfessionals.length
      },
      filters: {
        franchiseId,
        isActive,
        isVerified
      },
      errors: [
        profilesError && `Profiles: ${profilesError.message}`,
        servicesError && `Services: ${servicesError.message}`,
        bookingsError && `Bookings: ${bookingsError.message}`,
        reviewsError && `Reviews: ${reviewsError.message}`
      ].filter(Boolean)
    };

    console.log(`✅ Successfully fetched ${enrichedProfessionals.length} professionals`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Unexpected error in /api/admin/professionals:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST - Create new professional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      business_name,
      description,
      phone,
      email,
      hourly_rate
    } = body;

    if (!user_id) {
      return NextResponse.json({
        error: 'user_id is required'
      }, { status: 400 });
    }

    const { data: professional, error } = await supabaseAdmin
      .from('service_providers')
      .insert([{
        user_id,
        business_name,
        description,
        phone,
        email,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
        is_active: true,
        is_verified: false,
        rating_average: 0.00,
        total_reviews: 0,
        total_bookings: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating professional:', error);
      return NextResponse.json({
        error: 'Failed to create professional',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ Successfully created professional ${professional.id}`);
    return NextResponse.json(professional, { status: 201 });

  } catch (error: any) {
    console.error('❌ Unexpected error creating professional:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// PUT - Update professional
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      business_name,
      description,
      phone,
      email,
      hourly_rate,
      is_active,
      is_verified
    } = body;

    if (!id) {
      return NextResponse.json({
        error: 'ID is required for update'
      }, { status: 400 });
    }

    const updateData: any = {};
    
    if (business_name !== undefined) updateData.business_name = business_name;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate ? parseFloat(hourly_rate) : null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    updateData.updated_at = new Date().toISOString();

    const { data: professional, error } = await supabaseAdmin
      .from('service_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating professional:', error);
      return NextResponse.json({
        error: 'Failed to update professional',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ Successfully updated professional ${id}`);
    return NextResponse.json(professional);

  } catch (error: any) {
    console.error('❌ Unexpected error updating professional:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 