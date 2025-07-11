import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withAuth, withErrorHandling } from '@/lib/api/middleware';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = createServerComponentClient({ cookies });
  const { searchParams } = new URL(request.url);
  
  const franchise = searchParams.get('franchise') || 'pinoso';
  
  // Get franchise ID
  const { data: franchiseData } = await supabase
    .from('franchises')
    .select('id')
    .eq('slug', franchise)
    .eq('is_active', true)
    .single();
  
  if (!franchiseData) {
    return NextResponse.json({ error: 'Franchise not found' }, { status: 404 });
  }
  
  // Get service categories (admin-controlled, same for all franchises)
  const { data: categories, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  
  // Get service count per category for this franchise
  const { data: serviceCounts } = await supabase
    .from('services')
    .select('category_id')
    .eq('franchise_id', franchiseData.id)
    .eq('is_active', true);
  
  // Count services per category
  const categoryCounts = serviceCounts?.reduce((acc, service) => {
    if (service.category_id) {
      acc[service.category_id] = (acc[service.category_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Add service count to each category
  const categoriesWithCounts = categories?.map(category => ({
    ...category,
    service_count: categoryCounts[category.id] || 0
  })) || [];
  
  return NextResponse.json({
    categories: categoriesWithCounts,
    franchise: {
      id: franchiseData.id,
      slug: franchise
    }
  });
});

export const POST = withAuth(withErrorHandling(async (request: NextRequest, context) => {
  const supabase = createServerComponentClient({ cookies });
  const body = await request.json();
  
  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', context.user.id)
    .single();
  
  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  const { name, description, icon, sort_order } = body;
  
  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('service_categories')
    .insert([{
      name,
      description,
      icon,
      sort_order: sort_order || 0
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return NextResponse.json(data, { status: 201 });
})); 