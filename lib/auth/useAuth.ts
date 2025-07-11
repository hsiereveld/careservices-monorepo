import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const { user, role, session, loading, signIn, signOut } = context

  // Role-based permissions
  const isAdmin = role === 'admin'
  const isProfessional = role === 'professional'
  const isClient = role === 'client'

  // Example permissions (uitbreidbaar)
  const canManageUsers = isAdmin
  const canManageBookings = isAdmin || isProfessional
  const canBookService = isClient

  return {
    user,
    role,
    session,
    loading,
    signIn,
    signOut,
    isAdmin,
    isProfessional,
    isClient,
    canManageUsers,
    canManageBookings,
    canBookService,
  }
} 