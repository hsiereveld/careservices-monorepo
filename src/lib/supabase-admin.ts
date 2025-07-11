import { createClient } from '@supabase/supabase-js';

// Voor API routes - gebruik SERVICE ROLE KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role, niet anon key!

console.log('🔧 Supabase Admin Setup:');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Service Key:', supabaseServiceKey ? '✅' : '❌');

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to verify admin role using service role client
export const verifyAdminRole = async (userId: string) => {
  const { data: userRole, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
    
  if (error || !userRole) {
    return false;
  }
  
  return true;
}; 