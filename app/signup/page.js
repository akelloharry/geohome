"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('tenant')
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
    const res = await signUp(email, password, fullName, phone, role)
    if (res.error) {
      setError(res.error.message)
      return
    }
    if (!res.data?.session) {
      setError('Account created. Please check your email to confirm and then login.')
      return
    }
    router.push(determineRedirect(role))
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Sign up</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border px-2 py-1" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input className="w-full border px-2 py-1" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="w-full border px-2 py-1" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border px-2 py-1" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <select className="w-full border px-2 py-1" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
          <option value="agent">Agent</option>
        </select>
        {error && <div className="text-estateRed">{error}</div>}
        <button className="bg-teal text-white px-4 py-2 rounded">Create account</button>
      </form>
    </div>
  )
}
