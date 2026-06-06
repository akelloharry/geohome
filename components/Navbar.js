"use client"

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">GeoHome</Link>
          <Link href="/">Map</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm">{user.email}</span>
              <button className="text-sm text-accent" onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup" className="text-sm text-white bg-accent px-3 py-1 rounded">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
