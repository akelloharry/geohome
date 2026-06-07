"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // wait for initialization
    if (!user) {
      router.replace('/login')
      return
    }

    const role = profile?.role ?? user?.user_metadata?.role ?? 'tenant'
    if (roles.length > 0 && !roles.includes(role)) {
      if (role === 'landlord') router.replace('/dashboard')
      else router.replace('/')
    }
  }, [user, profile, loading, roles, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal"></div>
      </div>
    )
  }

  if (!user) return null

  return children
}
