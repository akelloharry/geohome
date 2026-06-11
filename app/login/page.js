"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Step 1: Sign in
      console.log('Attempting sign in with:', email)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('Auth error:', authError)
        setError(authError.message)
        setLoading(false)
        return
      }

      console.log('Auth successful, user ID:', authData.user.id)

      // Step 2: Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        setError('Could not retrieve user profile. Please try again or contact support.')
        setLoading(false)
        return
      }

      console.log('Profile found, role:', profileData?.role)

      // Step 3: Redirect based on role
      const role = profileData?.role || 'tenant'
      console.log('Redirecting based on role:', role)

      let target = '/'
      if (role === 'landlord') {
        target = '/dashboard'
      } else if (role === 'agent') {
        target = '/agent'
      } else if (role === 'admin') {
        target = '/admin'
      }
      console.log('Navigating to', target)
      await router.replace(target)

      if (typeof window !== 'undefined') {
        window.location.assign(target)
      }
      return
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
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
