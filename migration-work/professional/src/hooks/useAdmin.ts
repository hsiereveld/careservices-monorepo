import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBackOffice, setIsBackOffice] = useState(false);
  const [hasAdminPrivileges, setHasAdminPrivileges] = useState(false);
  const [userRole, setUserRole] = useState<string | null>('professional');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't check admin status if user is null or undefined
    if (!user) {
      setIsAdmin(false);
      setIsBackOffice(false);
      setHasAdminPrivileges(false);
      setUserRole(null);
      setLoading(false);
      return;
    }

    checkUserRole();
  }, [user]);

  const checkUserRole = async () => {
    // Double check user exists before making any calls
    if (!user?.id) {
      setIsAdmin(false);
      setIsBackOffice(false);
      setHasAdminPrivileges(false);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      // Get user role from user_roles table
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        setIsBackOffice(false);
        setHasAdminPrivileges(false);
        setUserRole('professional');
      } else {
        const role = roleData?.role || 'professional'; // Default to professional
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setIsBackOffice(role === 'backoffice');
        setHasAdminPrivileges(role === 'admin' || role === 'backoffice');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      setIsAdmin(false);
      setIsBackOffice(false);
      setHasAdminPrivileges(false);
      setUserRole('professional');
    } finally {
      setLoading(false);
    }
  };

  return { 
    isAdmin, 
    isBackOffice, 
    hasAdminPrivileges, 
    userRole, 
    loading 
  };
}