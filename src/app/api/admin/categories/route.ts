import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Haal alle categorieën op
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Maak nieuwe categorie aan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, name_nl, name_en, name_es, description_nl, is_active, sort_order } = body;

    // Validatie
    if (!name || !name_nl) {
      return NextResponse.json({ error: 'Name and name_nl are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('service_categories')
      .insert([{
        name,
        name_nl,
        name_en: name_en || name_nl,
        name_es: name_es || name_nl,
        description_nl,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update bestaande categorie
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, name_nl, name_en, name_es, description_nl, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('service_categories')
      .update({
        name,
        name_nl,
        name_en,
        name_es,
        description_nl,
        is_active,
        sort_order
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Verwijder categorie
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 