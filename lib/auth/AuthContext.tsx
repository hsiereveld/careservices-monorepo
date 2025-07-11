"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createSupabaseBrowser } from '../../packages/auth/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '../../packages/types/supabase.types'

type Role = 'admin' | 'professional' | 'client' | null

interface AuthContextType {
  user: User | null
  role: Role
  session: Session | null
  loading: boolean
  signIn: (options: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Initial session fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    // Fetch current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch user role from your users table
  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setRole(data.role as Role)
    } else {
      setRole(null)
    }
  }

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setSession(data.session)
    setUser(data.user)
    if (data.user) {
      await fetchUserRole(data.user.id)
    }
    setLoading(false)
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setRole(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, role, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }; 