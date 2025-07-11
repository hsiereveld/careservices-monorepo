import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Temporarily disable middleware for testing
  return NextResponse.next();
  
  /*
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  
  // Handle authentication routes
  if (pathname.includes('/auth/')) {
    return res;
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    return res;
  }

  // Handle admin routes - require authentication
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Handle professional routes - require authentication and professional role
  if (pathname.startsWith('/pro')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'professional') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Handle customer routes - require authentication
  if (pathname.startsWith('/my')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return res;
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 