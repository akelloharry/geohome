"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === null) return // still loading
    if (!user) router.push('/login')
    if (roles.length > 0 && user && !roles.includes(user.user_metadata?.role)) {
      // redirect based on role
      const role = user.user_metadata?.role || 'tenant'
      if (role === 'tenant') router.push('/')
      else if (role === 'landlord') router.push('/dashboard')
      else router.push('/')
    }
  }, [user])

  if (!user) return <p>Loading...</p>
  return children
}
