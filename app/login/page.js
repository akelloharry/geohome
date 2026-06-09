"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const determineRedirect = (roleValue) => {
    if (roleValue === 'landlord') return '/dashboard'
    if (roleValue === 'agent') return '/agent'
    if (roleValue === 'admin') return '/admin'
    return '/'
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await signIn(email, password)
    if (res.error) {
      setError(res.error.message || 'Login failed. Please check your credentials.')
      return
    }
    const roleValue = res.data?.user?.user_metadata?.role || 'tenant'
    router.push(determineRedirect(roleValue))
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input required type="email" className="w-full border px-2 py-1" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input required className="w-full border px-2 py-1" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div className="text-estateRed">{error}</div>}
        <button className="bg-teal text-white px-4 py-2 rounded">Login</button>
      </form>
    </div>
  )
}
