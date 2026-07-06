"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'tenant'
        }
      }
    })

    if (signupError) {
      const message = signupError.message?.toLowerCase() || ''
      if (message.includes('already registered') || message.includes('already exists')) {
        setError('Email already registered')
      } else {
        setError(signupError.message)
      }
      setLoading(false)
      return
    }

    console.log('Signup successful for:', email)
    router.push('/login?message=Account created. Please log in.')
    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-10">
      <div className="w-full rounded-[32px] border border-pale-steel bg-white p-8 shadow-xl shadow-slate-900/10">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-official-teal">Create account</div>
        <h2 className="mt-3 text-3xl font-heading font-black text-deep-maritime">Join GeoHome Kenya</h2>
        <p className="mt-3 text-sm text-anchor-gray">Sign up as a tenant to manage your search pass and explore listings.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          required
          type="text"
          className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none focus:border-official-teal"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
        />
        <input
          required
          type="text"
          className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none focus:border-official-teal"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
        />
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
        <p className="mt-5 text-sm text-anchor-gray">
          Already have an account? <a href="/login" className="font-semibold text-official-teal">Log in</a>
        </p>
      </div>
    </div>
  )
}
