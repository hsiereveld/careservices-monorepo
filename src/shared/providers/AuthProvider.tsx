'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/shared/types';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role: 'customer' | 'professional') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  redirectToDashboard: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    getInitialSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
        
        // Handle cross-subdomain session sync
        if (event === 'SIGNED_IN') {
          syncSessionAcrossSubdomains(session.access_token);
        }
      } else {
        setUser(null);
        if (event === 'SIGNED_OUT') {
          clearSessionAcrossSubdomains();
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error in getInitialSession:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch profile (primary source of user data)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      // Use profiles.role as primary role source
      // Only fallback to user_roles if profiles.role is null
      let userRole = profile.role;
      
      if (!userRole) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
          // Default to customer if no role found
          userRole = 'customer';
        } else {
          userRole = roleData?.role || 'customer';
        }
      }

      // Always use profiles data with resolved role
      setUser({ 
        ...profile, 
        role: userRole,
        email: profile.email || '' // Ensure email is available
      });
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
        
        // Sync session across subdomains
        if (data.session?.access_token) {
          syncSessionAcrossSubdomains(data.session.access_token);
        }
        
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: 'customer' | 'professional'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            role
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Registration failed' };
      }

      // Note: Profile creation should be handled by database triggers or server-side API
      // This signup is just for auth - profile creation happens in the marketing site signup
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear user state immediately
      setUser(null);
      
      // Clear auth-related localStorage items but preserve franchise selection
      if (typeof window !== 'undefined') {
        // Preserve franchise_id
        const franchiseId = localStorage.getItem('franchise_id');
        
        // Clear all localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore franchise_id if it existed
        if (franchiseId) {
          localStorage.setItem('franchise_id', franchiseId);
        }
      }
      
      // Clear session across subdomains
      clearSessionAcrossSubdomains();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Force complete page reload to clear all state
      window.location.href = '/';
        
    } catch (error) {
      console.error('Error in signOut:', error);
      // Force redirect even on error
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const redirectToDashboard = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Role-based subdomain redirects
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://careservices.es' 
      : 'http://localhost:3000';

    switch (user.role) {
      case 'customer':
        window.location.href = `${baseUrl.replace('careservices.es', 'my.careservices.es')}/dashboard`;
        break;
      case 'professional':
        window.location.href = `${baseUrl.replace('careservices.es', 'pro.careservices.es')}/dashboard`;
        break;
      case 'admin':
        window.location.href = `${baseUrl.replace('careservices.es', 'admin.careservices.es')}/dashboard`;
        break;
      default:
        router.push('/dashboard');
    }
  };

  // Cross-subdomain session sync functions
  const syncSessionAcrossSubdomains = (accessToken: string) => {
    try {
      // Store in localStorage for same-origin access
      localStorage.setItem('supabase.auth.token', accessToken);
      
      // Use postMessage for cross-subdomain communication
      const subdomains = ['my', 'book', 'pro', 'admin'];
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'careservices.es' 
        : 'localhost:3000';

      subdomains.forEach(subdomain => {
        const targetOrigin = process.env.NODE_ENV === 'production'
          ? `https://${subdomain}.${baseUrl}`
          : `http://${subdomain}.${baseUrl}`;
          
        // Send session sync message to all subdomains
        if (window.location.origin !== targetOrigin) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = `${targetOrigin}/auth/sync?token=${accessToken}`;
          document.body.appendChild(iframe);
          
          // Clean up iframe after sync
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }
      });
    } catch (error) {
      console.error('Error syncing session across subdomains:', error);
    }
  };

  const clearSessionAcrossSubdomains = () => {
    try {
      // Clear sessions on all subdomains
      const subdomains = ['my', 'book', 'pro', 'admin'];
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'careservices.es' 
        : 'localhost:3000';

      subdomains.forEach(subdomain => {
        const targetOrigin = process.env.NODE_ENV === 'production'
          ? `https://${subdomain}.${baseUrl}`
          : `http://${subdomain}.${baseUrl}`;
          
        if (window.location.origin !== targetOrigin) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = `${targetOrigin}/auth/clear`;
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }
      });
    } catch (error) {
      console.error('Error clearing session across subdomains:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    redirectToDashboard,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 