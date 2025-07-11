import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Haal alle commission requests op
export async function GET() {
  try {
    console.log('🚀 API /admin/commission-requests called');
    
    const { data, error } = await supabaseAdmin
      .from('commission_requests')
      .select(`
        *,
        professional:profiles!commission_requests_professional_id_fkey(first_name, last_name, email),
        service:services!commission_requests_service_id_fkey(name),
        franchise:franchises!commission_requests_franchise_id_fkey(name, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching commission requests:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch commission requests',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} commission requests`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update commission request status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      status,
      review_notes,
      reviewed_by
    } = body;

    if (!id || !status) {
      return NextResponse.json({ 
        error: 'ID and status are required' 
      }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status must be approved or rejected' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('commission_requests')
      .update({
        status,
        review_notes,
        reviewed_by,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        professional:profiles!commission_requests_professional_id_fkey(first_name, last_name, email),
        service:services!commission_requests_service_id_fkey(name)
      `)
      .single();

    if (error) {
      console.error('Error updating commission request:', error);
      return NextResponse.json({ error: 'Failed to update commission request' }, { status: 500 });
    }

    // If approved, update the service commission rate
    if (status === 'approved') {
      const { error: serviceError } = await supabaseAdmin
        .from('services')
        .update({
          commission_rate: data.requested_commission_rate
        })
        .eq('id', data.service_id);

      if (serviceError) {
        console.error('Error updating service commission rate:', serviceError);
        // Don't fail the request, just log the error
      }
    }

    console.log(`✅ Successfully updated commission request ${id} to ${status}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Verwijder commission request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('commission_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting commission request:', error);
      return NextResponse.json({ error: 'Failed to delete commission request' }, { status: 500 });
    }

    console.log(`✅ Successfully deleted commission request ${id}`);
    return NextResponse.json({ message: 'Commission request deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 