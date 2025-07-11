'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { Database } from '@/../packages/types/supabase.types';
import { supabase } from '@/lib/supabase';

// Franchise type from Supabase types
export type Franchise = Database['public']['Tables']['franchises']['Row'];

type FranchiseContextType = {
  franchiseId: string | null;
  franchise: Franchise | null;
  setFranchiseId: (id: string, source?: FranchiseSource) => void;
  loading: boolean;
  source: FranchiseSource;
  requestGeolocation: () => void;
  needsManualSelection: boolean;
};

type FranchiseSource = 'profile' | 'localStorage' | 'geolocation' | 'manual' | null;

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

export const FranchiseProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [franchiseId, setFranchiseIdState] = useState<string | null>(null);
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<FranchiseSource>(null);
  const [needsManualSelection, setNeedsManualSelection] = useState(false);

  // Helper to set and persist franchiseId
  const setFranchiseId = (id: string, src: FranchiseSource = 'manual') => {
    setFranchiseIdState(id);
    setSource(src);
    setNeedsManualSelection(false); // Hide modal once selected
    if (typeof window !== 'undefined') {
      localStorage.setItem('franchise_id', id);
    }
  };

  // Function to request geolocation (only when user initiates)
  const requestGeolocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          // TODO: Implement reverse geocode to region/franchise
          // For now, just set the source
          setSource('geolocation');
          setNeedsManualSelection(false);
          console.log('Geolocation obtained:', pos.coords);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setSource('manual');
          setNeedsManualSelection(true);
        }
      );
    }
  };

  useEffect(() => {
    const initFranchise = async () => {
      setLoading(true);
      
      // 1. From user profile (if available)
      if (user && (user as any).franchise_id) {
        setFranchiseIdState((user as any).franchise_id);
        setSource('profile');
        setNeedsManualSelection(false);
        setLoading(false);
        return;
      }
      
      // 2. From localStorage
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('franchise_id');
        if (storedId) {
          setFranchiseIdState(storedId);
          setSource('localStorage');
          setNeedsManualSelection(false);
          setLoading(false);
          return;
        }
      }
      
      // 3. Manual selection needed (but only show once)
      setSource('manual');
      setNeedsManualSelection(true);
      setLoading(false);
    };
    
    initFranchise();
  }, [user]);

  // Fetch full franchise object when franchiseId changes
  useEffect(() => {
    const fetchFranchise = async () => {
      if (franchiseId) {
        const { data, error } = await supabase
          .from('franchises')
          .select('*')
          .eq('id', franchiseId)
          .single();
        if (!error && data) {
          setFranchise(data as Franchise);
        } else {
          setFranchise(null);
        }
      } else {
        setFranchise(null);
      }
    };
    fetchFranchise();
  }, [franchiseId]);

  return (
    <FranchiseContext.Provider value={{ 
      franchiseId, 
      franchise, 
      setFranchiseId, 
      loading, 
      source, 
      requestGeolocation,
      needsManualSelection
    }}>
      {children}
    </FranchiseContext.Provider>
  );
};

export const useFranchise = () => {
  const ctx = useContext(FranchiseContext);
  if (!ctx) {
    // In development, show more info; in production, provide fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('useFranchise must be used within FranchiseProvider - providing fallback context');
    }
    
    // Provide a fallback context to prevent crashes
    return {
      franchiseId: null,
      franchise: null,
      setFranchiseId: () => {},
      loading: false,
      source: null,
      requestGeolocation: () => {},
      needsManualSelection: false
    };
  }
  return ctx;
}; 