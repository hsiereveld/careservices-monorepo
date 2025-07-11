import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) {
      console.error('Services fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    return NextResponse.json({
      services: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 1
      }
    });
  } catch (error) {
    console.error('Services GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const { name, description, price, duration_hours, category_id } = body;
    if (!name || !description || !price || !duration_hours || !category_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get provider ID from user
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('service_categories')
      .select('id')
      .eq('id', category_id)
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Create the service
    const { data, error } = await supabase
      .from('services')
      .insert([{
        name,
        description,
        price,
        duration_hours,
        category_id,
        provider_id: provider.id,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Service creation error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Services POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 