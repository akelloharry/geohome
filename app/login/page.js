"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSigningIn(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setSigningIn(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error(profileError)
      setError('Could not retrieve user role. Please contact support.')
      setSigningIn(false)
      return
    }

    switch (profile.role) {
      case 'landlord':
        router.push('/dashboard')
        break
      case 'tenant':
        router.push('/')
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
      <form onSubmit={handleLogin} className="space-y-3">
        <input required type="email" className="w-full border px-2 py-1" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} disabled={signingIn} />
        <input required className="w-full border px-2 py-1" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} disabled={signingIn} />
        {error && <div className="text-estateRed">{error}</div>}
        <button disabled={signingIn} className="bg-teal text-white px-4 py-2 rounded disabled:opacity-50">{signingIn ? 'Signing in...' : 'Login'}</button>
      </form>
    </div>
  )
}
