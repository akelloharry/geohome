'use client'

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
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      const role = data?.user?.user_metadata?.role
      if (role && role !== 'tenant') {
        await supabase.auth.signOut()
        setError('Only tenant accounts can sign in here.')
        setLoading(false)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      setLoading(false)
      router.push('/')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-10">
      <div className="w-full rounded-[32px] border border-pale-steel bg-white p-8 shadow-xl shadow-slate-900/10">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-official-teal">Welcome back</div>
        <h2 className="mt-3 text-3xl font-heading font-black text-deep-maritime">Login to GeoHome Kenya</h2>
        <p className="mt-3 text-sm text-anchor-gray">Access your dashboard, view listings, and manage tenant activity.</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <input
          required
          type="email"
          className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none focus:border-official-teal"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          required
          type="password"
          className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none focus:border-official-teal"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {error && <div className="text-estate-red text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-official-teal px-4 py-3 text-sm font-semibold text-white transition hover:bg-muted-teal disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
        <p className="mt-5 text-sm text-anchor-gray">
          Don't have an account? <a href="/signup" className="font-semibold text-official-teal">Sign up</a>
        </p>
      </div>
    </div>
  )
}
