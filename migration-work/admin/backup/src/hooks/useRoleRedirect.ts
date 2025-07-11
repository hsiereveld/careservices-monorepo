import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useRoleRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      redirectToDashboard();
    }
  }, [user]);

  const redirectToDashboard = async () => {
    if (!user) return;

    try {
      // First try to use the RPC function
      try {
        const { data: redirectPath, error } = await supabase
          .rpc('get_dashboard_redirect');

        if (!error && redirectPath) {
          navigate(redirectPath);
          return;
        }
      } catch (rpcError) {
        console.warn('RPC redirect failed, falling back to direct query:', rpcError);
      }

      // Fallback: Get user's role directly
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error getting user role:', roleError);
        navigate('/client-dashboard'); // Default to client dashboard
        return;
      }

      // Navigate based on role
      const role = userRole?.role || 'client';
      switch (role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'backoffice':
          navigate('/backoffice-dashboard');
          break;
        case 'professional':
          navigate('/professional-dashboard');
          break;
        case 'client':
          navigate('/client-dashboard');
          break;
        default:
          navigate('/client-dashboard'); // Default to client dashboard
      }
    } catch (err) {
      console.error('Error in role redirect:', err);
      navigate('/client-dashboard'); // Fallback to client dashboard
    }
  };

  return { redirectToDashboard };
}