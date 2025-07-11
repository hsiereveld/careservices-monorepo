import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '../types/supabase.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (singleton)
export const createSupabaseBrowser = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (per request, met cookies)
export const createSupabaseServer = (cookies: {
  get: (name: string) => string | undefined,
  set: (name: string, value: string, options: CookieOptions) => void
}) =>
  createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies
  }); 