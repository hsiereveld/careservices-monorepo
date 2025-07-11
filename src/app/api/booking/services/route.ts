import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withErrorHandling } from '@/lib/api/middleware';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const availability = searchParams.get('availability');
  const language = searchParams.get('language');
  const emergency = searchParams.get('emergency') === 'true';
  const location = searchParams.get('location');
  
  let query = supabaseAdmin
    .from('services')
    .select('*')
    .eq('is_active', true);

  // Apply filters
  if (category) {
    query = query.eq('category_id', category);
  }
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,short_description.ilike.%${search}%,full_description.ilike.%${search}%`);
  }
  
  if (priceMin) {
    query = query.gte('base_price', parseFloat(priceMin));
  }
  
  if (priceMax) {
    query = query.lte('base_price', parseFloat(priceMax));
  }

  if (language) {
    query = query.contains('languages', [language]);
  }

  if (location) {
    // Skip location filter for now since we don't have the join
  }

  // Add pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  // Order by featured status and name
  query = query.order('is_featured', { ascending: false })
               .order('name', { ascending: true });

  const { data: services, error } = await query;

  if (error) {
    throw error;
  }

  // Transform data for frontend
  const transformedServices = services?.map(service => ({
    id: service.id,
    name: service.name,
    description: service.short_description,
    full_description: service.full_description,
    category_id: service.category_id,
    price: service.base_price,
    final_price: service.final_price,
    commission_rate: service.commission_rate,
    is_featured: service.is_featured,
    image_url: service.image_url,
    location: null // No provider join for now
  })) || [];

  // Filter by availability if specified (simplified for now)
  let filteredServices = transformedServices;
  if (availability) {
    // For now, just return all services regardless of availability
    filteredServices = transformedServices;
  }

  return NextResponse.json({
    services: filteredServices,
    pagination: {
      page,
      limit,
      total: services?.length || 0,
      totalPages: services ? Math.ceil(services.length / limit) : 1
    },
    filters: {
      category,
      search,
      priceMin: priceMin ? parseFloat(priceMin) : null,
      priceMax: priceMax ? parseFloat(priceMax) : null,
      availability,
      language,
      emergency,
      location
    }
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  
  // Validate required fields
  if (!body.template_id && (!body.custom_name || !body.custom_price)) {
    return NextResponse.json(
      { error: 'Template ID or custom name and price are required' },
      { status: 400 }
    );
  }

  // For now, we'll skip user authentication to test the API
  // In production, you'd want to verify the user session here
  
  // Create the service
  const { data: service, error } = await supabaseAdmin
    .from('professional_services')
    .insert([{
      professional_id: body.professional_id || 'test-professional-id', // Temporary for testing
      template_id: body.template_id,
      custom_name: body.custom_name,
      custom_description: body.custom_description,
      custom_price: body.custom_price,
      custom_minimum_duration: body.custom_minimum_duration,
      custom_call_out_fee: body.custom_call_out_fee,
      custom_emergency_premium: body.custom_emergency_premium,
      is_emergency_available: body.is_emergency_available || false,
      languages: body.languages,
      specializations: body.specializations,
      certifications: body.certifications,
      is_active: true,
      is_approved: false // Requires admin approval
    }])
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json(service, { status: 201 });
}); 