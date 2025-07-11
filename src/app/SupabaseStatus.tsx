"use client";
import React, { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '../../packages/auth/supabaseClient'

const SupabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'pending' | 'connected' | 'error'>('pending')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createSupabaseBrowser()
        // Probeer een simpele query op een bestaande tabel, bijvoorbeeld 'users'
        const { error } = await supabase.from('users').select('id').limit(1)
        if (error) {
          setStatus('error')
          setError(error.message)
        } else {
          setStatus('connected')
        }
      } catch (e: any) {
        setStatus('error')
        setError(e.message)
      }
    }
    testConnection()
  }, [])

  if (status === 'pending') return <div>Supabase: verbinding testen...</div>
  if (status === 'connected') return <div>✅ Supabase connectie werkt!</div>
  return <div>❌ Supabase fout: {error}</div>
}

export default SupabaseStatus 