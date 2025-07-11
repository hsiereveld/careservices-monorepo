import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withAuth, withErrorHandling } from '@/lib/api/middleware';

export const POST = withAuth(withErrorHandling(async (
  request: NextRequest, 
  context: { user: { id: string } }
) => {
  const supabase = createServerComponentClient({ cookies });
  const body = await request.json();
  
  const { status, review_notes } = body;
  const requestId = request.url.split('/').pop();
  
  if (!requestId) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
  }
  
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 });
  }
  
  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role, franchise_id')
    .eq('id', context.user.id)
    .single();
  
  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  // Get commission request
  const { data: commissionRequest, error: fetchError } = await supabase
    .from('commission_requests')
    .select('*')
    .eq('id', requestId)
    .eq('franchise_id', userProfile.franchise_id)
    .eq('status', 'pending')
    .single();
  
  if (fetchError || !commissionRequest) {
    return NextResponse.json({ error: 'Commission request not found or already reviewed' }, { status: 404 });
  }
  
  // Update commission request
  const { data: updatedRequest, error: updateError } = await supabase
    .from('commission_requests')
    .update({
      status,
      review_notes,
      reviewed_by: context.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select(`
      *,
      professional:profiles!commission_requests_professional_id_fkey(
        id,
        full_name,
        email
      ),
      service:services!commission_requests_service_id_fkey(
        id,
        title,
        commission_rate
      )
    `)
    .single();
  
  if (updateError) throw updateError;
  
  // If approved, update the service commission rate
  if (status === 'approved') {
    const { error: serviceUpdateError } = await supabase
      .from('services')
      .update({
        commission_rate: commissionRequest.requested_commission_rate
      })
      .eq('id', commissionRequest.service_id);
    
    if (serviceUpdateError) {
      console.error('Error updating service commission rate:', serviceUpdateError);
      // Don't fail the request, but log the error
    }
  }
  
  return NextResponse.json(updatedRequest);
})); 