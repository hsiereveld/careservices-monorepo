import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withAuth, withErrorHandling } from '@/lib/api/middleware';

export const GET = withAuth(withErrorHandling(async (request: NextRequest, context) => {
  const supabase = createServerComponentClient({ cookies });
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');
  
  // Check if user is admin or professional
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role, franchise_id')
    .eq('id', context.user.id)
    .single();
  
  if (!userProfile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }
  
  let query = supabase
    .from('commission_requests')
    .select(`
      *,
      professional:profiles!commission_requests_professional_id_fkey(
        id,
        full_name,
        email,
        phone
      ),
      service:services!commission_requests_service_id_fkey(
        id,
        title,
        base_price,
        commission_rate
      ),
      franchise:franchises!commission_requests_franchise_id_fkey(
        id,
        name,
        slug,
        display_name
      ),
      reviewer:profiles!commission_requests_reviewed_by_fkey(
        id,
        full_name
      )
    `)
    .order('created_at', { ascending: false });
  
  // Filter by user role
  if (userProfile.role === 'professional') {
    // Professionals can only see their own requests
    query = query.eq('professional_id', context.user.id);
  } else if (userProfile.role === 'admin') {
    // Admins can see all requests in their franchise
    query = query.eq('franchise_id', userProfile.franchise_id);
  } else {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1);
  
  if (error) throw error;
  
  return NextResponse.json({
    commission_requests: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: count ? Math.ceil(count / limit) : 1
    }
  });
}));

export const POST = withAuth(withErrorHandling(async (request: NextRequest, context) => {
  const supabase = createServerComponentClient({ cookies });
  const body = await request.json();
  
  const { service_id, requested_commission_rate, reason } = body;
  
  if (!service_id || !requested_commission_rate || !reason) {
    return NextResponse.json({ 
      error: 'Service ID, requested commission rate, and reason are required' 
    }, { status: 400 });
  }
  
  // Get user's franchise
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('franchise_id')
    .eq('id', context.user.id)
    .single();
  
  if (!userProfile?.franchise_id) {
    return NextResponse.json({ error: 'User not associated with a franchise' }, { status: 400 });
  }
  
  // Get current service details
  const { data: service } = await supabase
    .from('services')
    .select('id, commission_rate, franchise_id')
    .eq('id', service_id)
    .eq('professional_id', context.user.id)
    .single();
  
  if (!service) {
    return NextResponse.json({ error: 'Service not found or not owned by user' }, { status: 404 });
  }
  
  if (service.franchise_id !== userProfile.franchise_id) {
    return NextResponse.json({ error: 'Service not in user franchise' }, { status: 403 });
  }
  
  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from('commission_requests')
    .select('id')
    .eq('service_id', service_id)
    .eq('professional_id', context.user.id)
    .eq('status', 'pending')
    .single();
  
  if (existingRequest) {
    return NextResponse.json({ error: 'Commission request already pending for this service' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('commission_requests')
    .insert([{
      professional_id: context.user.id,
      service_id,
      franchise_id: userProfile.franchise_id,
      current_commission_rate: service.commission_rate,
      requested_commission_rate,
      reason,
      status: 'pending'
    }])
    .select(`
      *,
      service:services!commission_requests_service_id_fkey(
        id,
        title,
        base_price,
        commission_rate
      ),
      franchise:franchises!commission_requests_franchise_id_fkey(
        id,
        name,
        slug,
        display_name
      )
    `)
    .single();
  
  if (error) throw error;
  
  return NextResponse.json(data, { status: 201 });
})); 