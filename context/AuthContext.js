"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await supabase.auth.getSession()
      if (mounted && res?.data?.session) setUser(res.data.session.user)
    })()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => { mounted = false; listener?.subscription?.unsubscribe && listener.subscription.unsubscribe() }
  }, [])

  // signUp supports passing metadata so DB trigger can create profile
  const signUp = (email, password, full_name, phone, role = 'tenant') => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role }
      }
    })
  }

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
