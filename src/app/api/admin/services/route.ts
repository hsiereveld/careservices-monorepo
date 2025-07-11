import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Haal alle services op
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        category:service_categories(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Maak nieuwe service aan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      category_id, 
      name, 
      description, 
      price, 
      duration,
      professional_id,
      is_active 
    } = body;

    // Validatie
    if (!name || !price) {
      return NextResponse.json({ 
        error: 'name and price are required' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('services')
      .insert([{
        category_id,
        name,
        description,
        price: parseFloat(price),
        duration: duration || 60,
        professional_id,
        is_active: is_active ?? true
      }])
      .select(`
        *,
        category:service_categories(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update bestaande service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      category_id, 
      name, 
      description, 
      price, 
      duration,
      professional_id,
      is_active 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('services')
      .update({
        category_id,
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        duration,
        professional_id,
        is_active
      })
      .eq('id', id)
      .select(`
        *,
        category:service_categories(id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Verwijder service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
