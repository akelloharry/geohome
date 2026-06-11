'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Fetch role from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      setError('Could not retrieve user role. Please contact support.')
      setLoading(false)
      return
    }

    // Determine target URL
    let target = '/'
    switch (profile.role) {
      case 'landlord':
        target = '/dashboard'
        break
      case 'agent':
        target = '/agent'
        break
      case 'admin':
        target = '/admin'
        break
      default:
        target = '/'
    }

    // Hard redirect immediately - log for debugging
    console.log('Executing redirect to:', target)
    console.log('window.location:', window.location)
    window.location.href = target
    console.log('Redirect command sent')
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          required
          type="email"
          className="w-full border px-2 py-1"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          required
          type="password"
          className="w-full border px-2 py-1"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {error && <div className="text-estateRed text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-teal text-white px-4 py-2 rounded disabled:opacity-50 w-full"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-anchorGray mt-4">
        Don't have an account? <a href="/signup" className="text-teal">Sign up</a>
      </p>
    </div>
  )
}
