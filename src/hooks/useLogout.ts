import { useState } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even on error
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
} 