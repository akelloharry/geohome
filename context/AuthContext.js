"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      setLoading(true)
      const res = await supabase.auth.getSession()
      const session = res?.data?.session ?? null
      if (!mounted) return
      setUser(session?.user ?? null)

      if (session?.user?.id) {
        const { data: p, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (!error && mounted) setProfile(p ?? null)
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true)
      setUser(session?.user ?? null)
      if (session?.user?.id) {
        const { data: p, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (!error) setProfile(p ?? null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => { mounted = false; listener?.subscription?.unsubscribe && listener.subscription.unsubscribe() }
  }, [])

  // signUp supports passing metadata so DB trigger can create profile
  const signUp = (email, password, full_name, phone, role = 'tenant') => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
      }
    })
  }

  const signIn = (email, password) => supabase.auth.signInWithPassword(
    { email, password },
    { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
  )
  const signOut = async () => await supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
