import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });

    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Auth clear error:', error);
    }

    return NextResponse.json({ success: true, cleared: true });
  } catch (error) {
    console.error('Auth clear error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 