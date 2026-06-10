"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('tenant')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await signUp(email, password, firstName, lastName, phone, role)
    if (res.error) {
      const message = res.error.message?.toLowerCase()
      if (message?.includes('duplicate') || message?.includes('already registered') || message?.includes('already exists')) {
        setError('Email already registered')
      } else {
        setError(res.error.message)
      }
      return
    }
    router.push('/login')
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Sign up</h2>
      <form onSubmit={submit} className="space-y-3">
        <input required className="w-full border px-2 py-1" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input required className="w-full border px-2 py-1" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
        <input required className="w-full border px-2 py-1" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <input required type="email" className="w-full border px-2 py-1" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input required className="w-full border px-2 py-1" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <select required className="w-full border px-2 py-1" value={role} onChange={e => setRole(e.target.value)}>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
        {error && <div className="text-estateRed">{error}</div>}
        <button className="bg-teal text-white px-4 py-2 rounded">Create account</button>
      </form>
    </div>
  )
}
