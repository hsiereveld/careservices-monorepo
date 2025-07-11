import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Retrieve a specific service by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
    }

    // Get basic service data
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (serviceError || !serviceData) {
      if (serviceError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      console.error('Service fetch error:', serviceError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get category data
    const { data: categoryData } = await supabase
      .from('service_categories')
      .select('id, name, description, icon, color_scheme')
      .eq('id', serviceData.category_id)
      .eq('is_active', true)
      .single();

    // Get provider data
    const { data: providerData } = await supabase
      .from('service_providers')
      .select('id, business_name, rating_average, total_bookings, description')
      .eq('id', serviceData.provider_id)
      .eq('is_active', true)
      .single();

    // Combine the data
    const result = {
      ...serviceData,
      category: categoryData || { id: '', name: 'Unknown Category', description: '', icon: '', color_scheme: '' },
      service_providers: providerData || { id: '', business_name: 'Unknown Provider', rating_average: 0, total_bookings: 0, description: '' }
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Service GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a service (authenticated users only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { id } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const { name, description, price, duration_hours } = body;
    if (!name || !description || !price || !duration_hours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user owns this service
    const { data: existingService, error: checkError } = await supabase
      .from('services')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get provider ID from user
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (providerError || !provider || provider.id !== existingService.provider_id) {
      return NextResponse.json({ error: 'Unauthorized - You can only update your own services' }, { status: 403 });
    }

    // Update the service
    const { data, error } = await supabase
      .from('services')
      .update({
        name,
        description,
        price,
        duration_hours,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Service update error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Service PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a service (authenticated users only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { id } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this service
    const { data: existingService, error: checkError } = await supabase
      .from('services')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get provider ID from user
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (providerError || !provider || provider.id !== existingService.provider_id) {
      return NextResponse.json({ error: 'Unauthorized - You can only delete your own services' }, { status: 403 });
    }

    // Check if service has active bookings
    const { data: activeBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('service_id', id)
      .in('status', ['pending', 'confirmed', 'in_progress']);

    if (bookingError) {
      console.error('Booking check error:', bookingError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (activeBookings && activeBookings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete service with active bookings' 
      }, { status: 409 });
    }

    // Soft delete the service
    const { error } = await supabase
      .from('services')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Service delete error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Service DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}