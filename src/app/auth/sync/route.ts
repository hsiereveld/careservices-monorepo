import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Set the session token
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token
    });

    if (error) {
      console.error('Auth sync error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Redirect to the appropriate page based on user role
    const user = data.user;
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let redirectUrl = '/my';
    
    if (profile?.role === 'admin') {
      redirectUrl = '/admin';
    } else if (profile?.role === 'professional') {
      redirectUrl = '/pro';
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 