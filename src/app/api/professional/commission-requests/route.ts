import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check if they are a professional
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'professional') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get service provider ID for this user
    const { data: serviceProvider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!serviceProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    // Get professional's commission requests
    const { data: commissionRequests, error } = await supabase
      .from('commission_requests')
      .select(`
        *,
        service:services(*,
          service_category:service_categories(*)
        )
      `)
      .eq('professional_id', serviceProvider.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(commissionRequests);
  } catch (error) {
    console.error('Error in professional commission requests API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, franchise_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'professional') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get service provider ID for this user
    const { data: serviceProvider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!serviceProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const { service_id, requested_commission_rate, justification } = await request.json();

    if (!service_id || !requested_commission_rate || !justification) {
      return NextResponse.json({ 
        error: 'Service ID, requested commission rate, and justification are required' 
      }, { status: 400 });
    }

    // Check if there's already a pending request for this service
    const { data: existingRequest } = await supabase
      .from('commission_requests')
      .select('id')
      .eq('professional_id', serviceProvider.id)
      .eq('service_id', service_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'You already have a pending commission request for this service' 
      }, { status: 400 });
    }

    // Create the commission request
    const { data: commissionRequest, error } = await supabase
      .from('commission_requests')
      .insert({
        professional_id: serviceProvider.id,
        service_id,
        requested_commission_rate,
        justification,
        franchise_id: profile.franchise_id,
        status: 'pending'
      })
      .select(`
        *,
        service:services(*,
          service_category:service_categories(*)
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(commissionRequest);
  } catch (error) {
    console.error('Error creating commission request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 