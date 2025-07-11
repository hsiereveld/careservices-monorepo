import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API /admin/users called');
    
    // Get franchise_id from query params or use default
    const { searchParams } = new URL(request.url);
    const franchiseId = searchParams.get('franchise_id') || 'e87387a2-dff4-4662-ab4c-c7aac171a204';
    
    // First, let's discover what columns exist in profiles table
    const { data: schemaInfo, error: schemaError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('franchise_id', franchiseId)
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema discovery failed:', schemaError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: schemaError.message
      }, { status: 500 });
    }
    
    console.log('✅ Schema discovery successful. Sample record:', schemaInfo?.[0]);
    
    // Fetch users with email from auth.users table
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth users query failed:', authError);
      return NextResponse.json({ 
        error: 'Failed to fetch auth users',
        details: authError.message 
      }, { status: 500 });
    }

    // Fetch profiles (filtered by franchise)
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')  // Select all available columns
      .eq('franchise_id', franchiseId) // Add franchise filter
      .order('created_at', { ascending: false })
      .limit(100);

    // Merge auth data with profiles
    const enrichedUsers = profiles?.map(profile => {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || profile.email || 'Geen email',
        email_confirmed_at: authUser?.email_confirmed_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        auth_provider: authUser?.app_metadata?.provider
      };
    }) || [];

    if (error) {
      console.error('❌ Profiles query failed:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch user profiles',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`✅ Successfully fetched ${enrichedUsers.length} profiles with email data`);
    return NextResponse.json(enrichedUsers);

  } catch (error: any) {
    console.error('❌ Unexpected error in /api/admin/users:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
