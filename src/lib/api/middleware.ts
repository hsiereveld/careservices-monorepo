import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Maak ApiContext generiek zodat het altijd params kan bevatten
export interface ApiContext {
  params: Promise<Record<string, any>>;
  user?: any;
  [key: string]: any;
}

type ApiHandler = (request: NextRequest, context: ApiContext) => Promise<Response>;

export function withAuth(handler: ApiHandler) {
  return async (request: NextRequest, context: ApiContext) => {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Add user to context (niet op request!)
      context.user = user;
      return handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

export function withAdminAuth(handler: ApiHandler) {
  return async (request: NextRequest, context: ApiContext) => {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Check if user has admin role (let op: veldnaam is 'role')
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      context.user = user;
      return handler(request, context);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

export function withErrorHandling(handler: ApiHandler) {
  return async (request: NextRequest, context: ApiContext) => {
    try {
      return await handler(request, context);
    } catch (error: any) {
      console.error('API Error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}
