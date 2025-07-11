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

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'catalog') {
      // Get available services catalog
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          service_category:service_categories(*)
        `)
        .eq('is_active', true)
        .eq('franchise_id', profile.franchise_id)
        .order('name');

      if (error) throw error;
      return NextResponse.json(services);
    } else {
      // Get professional's own services
      const { data: myServices, error } = await supabase
        .from('provider_services')
        .select(`
          *,
          service:services(*,
            service_category:service_categories(*)
          )
        `)
        .eq('provider_id', serviceProvider.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(myServices);
    }
  } catch (error) {
    console.error('Error in professional services API:', error);
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

    const { service_id, custom_price, commission_rate_override } = await request.json();

    if (!service_id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Check if provider already offers this service
    const { data: existingService } = await supabase
      .from('provider_services')
      .select('id')
      .eq('provider_id', serviceProvider.id)
      .eq('service_id', service_id)
      .single();

    if (existingService) {
      return NextResponse.json({ 
        error: 'You already offer this service' 
      }, { status: 400 });
    }

    // Get the base service details
    const { data: baseService } = await supabase
      .from('services')
      .select('base_price, commission_rate')
      .eq('id', service_id)
      .single();

    if (!baseService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Add service to provider's offerings
    const { data: providerService, error } = await supabase
      .from('provider_services')
      .insert({
        provider_id: serviceProvider.id,
        service_id,
        custom_price: custom_price || baseService.base_price,
        commission_rate_override: commission_rate_override,
        is_available: true,
        review_status: 'pending_review'
      })
      .select(`
        *,
        service:services(*,
          service_category:service_categories(*)
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(providerService);
  } catch (error) {
    console.error('Error adding provider service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const { custom_price, commission_rate_override, is_available, custom_name, custom_short_description } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Provider service ID is required' }, { status: 400 });
    }

    // Build update data object
    let updateData: any = {};
    if (custom_price !== undefined) updateData.custom_price = custom_price;
    if (commission_rate_override !== undefined) updateData.commission_rate_override = commission_rate_override;
    if (is_available !== undefined) updateData.is_available = is_available;
    if (custom_name !== undefined) updateData.custom_name = custom_name;
    if (custom_short_description !== undefined) updateData.custom_short_description = custom_short_description;

    const { data: providerService, error } = await supabase
      .from('provider_services')
      .update(updateData)
      .eq('id', id)
      .eq('provider_id', serviceProvider.id)
      .select(`
        *,
        service:services(*,
          service_category:service_categories(*)
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(providerService);
  } catch (error) {
    console.error('Error updating provider service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Provider service ID is required' }, { status: 400 });
    }

    // Remove service from provider's offerings
    const { error } = await supabase
      .from('provider_services')
      .delete()
      .eq('id', id)
      .eq('provider_id', serviceProvider.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing provider service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 