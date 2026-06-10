"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const { signIn, user, profile, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!user || loading || signingIn) return
    const role = profile?.role ?? user?.user_metadata?.role ?? 'tenant'
    const getRedirectPath = (roleValue) => {
      if (roleValue === 'landlord') return '/dashboard'
      if (roleValue === 'agent') return '/agent'
      if (roleValue === 'admin') return '/admin'
      return '/'
    }
    router.push(getRedirectPath(role))
  }, [user, profile, loading, signingIn, router])

  const determineRedirect = (roleValue) => {
    if (roleValue === 'landlord') return '/dashboard'
    if (roleValue === 'agent') return '/agent'
    if (roleValue === 'admin') return '/admin'
    return '/'
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSigningIn(true)
    const res = await signIn(email, password)
    if (res.error) {
      setError(res.error.message || 'Login failed. Please check your credentials.')
      setSigningIn(false)
      return
    }

    const userId = res.data?.user?.id
    if (!userId) {
      setError('Login failed. Please try again.')
      setSigningIn(false)
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error(profileError)
      router.push('/')
      setSigningIn(false)
      return
    }

    const userMeta = res.data?.user?.user_metadata ?? {}
    let role = profileData?.role ?? userMeta.role ?? 'tenant'
    let finalProfile = profileData

    if (!profileData) {
      const fullName = userMeta.full_name || `${userMeta.first_name || ''} ${userMeta.last_name || ''}`.trim() || null
      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            full_name: fullName,
            phone: userMeta.phone || null,
            role
          }
        ])
        .select('role')
        .single()

      if (insertError) {
        console.error('Profile insert failed:', insertError)
      } else if (insertedProfile) {
        role = insertedProfile.role || role
      }
    }

    switch (role) {
      case 'landlord':
        router.push('/dashboard')
        break
      case 'agent':
        router.push('/agent')
        break
      case 'admin':
        router.push('/admin')
        break
      default:
        router.push('/')
    }

    setSigningIn(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input required type="email" className="w-full border px-2 py-1" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} disabled={signingIn} />
        <input required className="w-full border px-2 py-1" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} disabled={signingIn} />
        {error && <div className="text-estateRed">{error}</div>}
        <button disabled={signingIn} className="bg-teal text-white px-4 py-2 rounded disabled:opacity-50">{signingIn ? 'Signing in...' : 'Login'}</button>
      </form>
    </div>
  )
}
