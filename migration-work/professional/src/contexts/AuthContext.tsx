import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted && !isSigningOut) {
          if (error) {
            // Check if the error is related to invalid refresh token or session not found
            const isSessionError = error.message?.includes('Invalid Refresh Token') || 
                                 error.message?.includes('refresh_token_not_found') ||
                                 error.message?.includes('Refresh Token Not Found') ||
                                 error.message?.includes('session_not_found') ||
                                 error.message?.includes('Session from session_id claim in JWT does not exist');
            
            // Only log non-session errors to avoid console noise
            if (!isSessionError) {
              console.error('Session error:', error);
            }
            
            if (isSessionError) {
              console.log('Invalid session detected, signing out...');
              // Force a complete logout to clear invalid session data
              await signOut();
              return;
            }
            
            // Clear any invalid session data
            setSession(null);
            setUser(null);
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
      } catch (err) {
        // Check if the caught error is also a session error
        const errorMessage = err instanceof Error ? err.message : String(err);
        const isSessionError = errorMessage.includes('Invalid Refresh Token') || 
                             errorMessage.includes('refresh_token_not_found') ||
                             errorMessage.includes('Refresh Token Not Found') ||
                             errorMessage.includes('session_not_found') ||
                             errorMessage.includes('Session from session_id claim in JWT does not exist');
        
        // Only log non-session errors to avoid console noise
        if (!isSessionError) {
          console.error('Failed to get session:', err);
        }
        
        if (isSessionError && mounted && !isSigningOut) {
          console.log('Invalid session detected in catch block, signing out...');
          await signOut();
          return;
        }
        
        if (mounted && !isSigningOut) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (mounted && !isSigningOut) {
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session.user);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSigningOut]);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      console.error('SignUp error:', err);
      return { data: null, error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      console.error('SignIn error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear any remaining local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force page reload to ensure clean state
      window.location.replace('/');
    } catch (err) {
      console.error('SignOut error:', err);
      // Even if signOut fails, still redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}