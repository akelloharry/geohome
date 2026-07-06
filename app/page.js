'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Map from '../components/Map'

const kisumuCenter = [34.7617, -0.0917]
const localFallbackProperties = [
  {
    id: 'fallback-1',
    title: 'Riverside Apartments',
    address: 'Along Kisumu River',
    price: 15000,
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Rental',
    lat: -0.0905,
    lng: 34.761,
    available: true,
    verification_status: 'verified',
    sponsored: false
  },
  {
    id: 'fallback-2',
    title: 'Campus View Hostel',
    address: 'Near University',
    price: 8000,
    bedrooms: 6,
    bathrooms: 2,
    property_type: 'Hostel',
    lat: -0.095,
    lng: 34.7625,
    available: true,
    verification_status: 'verified',
    sponsored: true
  },
  {
    id: 'fallback-3',
    title: 'Cozy BnB',
    address: 'Central Kisumu',
    price: 5000,
    bedrooms: 1,
    bathrooms: 1,
    property_type: 'BnB',
    lat: -0.0919,
    lng: 34.763,
    available: true,
    verification_status: 'verified',
    sponsored: false
  }
]

function getSessionId() {
  if (typeof window === 'undefined') return null
  const existing = window.localStorage.getItem('geohome_session_id')
  if (existing) return existing
  const id = crypto.randomUUID()
  window.localStorage.setItem('geohome_session_id', id)
  return id
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const [properties, setProperties] = useState([])
  const [stats, setStats] = useState({ counties: 0, activeListings: 0, verifiedCount: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [hasPass, setHasPass] = useState(false)
  const [checkingPass, setCheckingPass] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submittingPass, setSubmittingPass] = useState(false)
  const [passMessage, setPassMessage] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      const [{ count: counties }, { count: activeListings }, { count: verifiedCount }] = await Promise.all([
        supabase.from('boundaries').select('*', { count: 'exact', head: true }).eq('category_name', 'county'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified').eq('available', true),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified')
      ])

      setStats({ counties: counties ?? 0, activeListings: activeListings ?? 0, verifiedCount: verifiedCount ?? 0 })
      setLoadingStats(false)
    }

    const fetchProperties = async () => {
      setLoadingProperties(true)
      let loaded = []

      const { data, error } = await supabase.rpc('properties_in_boundary', { boundary_name: 'kisumu' })
      if (!error && Array.isArray(data) && data.length > 0) {
        loaded = data
      }

      if (loaded.length === 0) {
        const { data: nearbyData, error: nearbyError } = await supabase.rpc('nearby_properties', {
          lat_param: kisumuCenter[1],
          lng_param: kisumuCenter[0],
          radius: 5000
        })

        if (!nearbyError && Array.isArray(nearbyData) && nearbyData.length > 0) {
          loaded = nearbyData
        }
      }

      if (loaded.length === 0) {
        loaded = localFallbackProperties
      }

      setProperties(loaded)
      setLoadingProperties(false)
    }

    fetchStats()
    fetchProperties()
  }, [])

  useEffect(() => {
    if (loading) return

    let mounted = true
    const checkPass = async () => {
      setCheckingPass(true)
      const sessionId = getSessionId()
      const { data, error } = await supabase.rpc('has_active_pass', {
        user_id: user?.id ?? null,
        session_id: sessionId
      })

      if (!mounted) return
      if (!error) {
        setHasPass(Boolean(data))
      }
      setCheckingPass(false)
    }

    checkPass()
    return () => {
      mounted = false
    }
  }, [user, loading])

  const handlePassPurchase = async (event) => {
    event.preventDefault()
    if (!phoneNumber.trim()) {
      setPassMessage('Please enter your Safaricom phone number.')
      return
    }

    setSubmittingPass(true)
    setPassMessage('Requesting STK push…')

    const normalizedPhone = phoneNumber.replace(/\D/g, '')
    const response = await fetch('/api/daraja/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: normalizedPhone, amount: 200 })
    })

    const result = await response.json().catch(() => ({ error: 'Unable to start payment.' }))
    if (!response.ok || !result?.success) {
      setSubmittingPass(false)
      setPassMessage(result?.error || 'Unable to start payment right now.')
      return
    }

    setPassMessage('Payment request sent. Waiting for your confirmation…')

    const startedAt = Date.now()
    const interval = window.setInterval(async () => {
      const sessionId = getSessionId()
      const { data, error } = await supabase.rpc('has_active_pass', {
        user_id: user?.id ?? null,
        session_id: sessionId
      })

      if (!error && data) {
        window.clearInterval(interval)
        setHasPass(true)
        setSubmittingPass(false)
        setPassMessage('Full map access is unlocked.')
        setIsModalOpen(false)
        return
      }

      if (Date.now() - startedAt > 30000) {
        window.clearInterval(interval)
        setSubmittingPass(false)
        setPassMessage('We did not detect an active pass yet. Please try again if needed.')
      }
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep-maritime">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-official-teal" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-deep-maritime text-white">
      <Map
        center={kisumuCenter}
        properties={properties}
        className="absolute inset-0 h-full w-full"
        maxZoom={hasPass ? 18 : 12}
        hasActivePass={hasPass}
        showPropertyNames={hasPass}
        showDetailsButton={hasPass}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(44, 110, 92, 0.55) 0%, rgba(44, 110, 92, 0.45) 30%, rgba(94, 138, 123, 0.35) 60%, rgba(30, 58, 77, 0.50) 100%)'
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-cloud-white">GeoHome Kenya</div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-3xl font-heading font-black text-cloud-white sm:text-4xl">
              <span>Geo</span>
              <span className="text-geohome-gold">Home</span>
              <span>Kenya</span>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-cloud-white/90">
            <Link href="#about" className="transition hover:text-geohome-gold">About</Link>
            <Link href="#contact" className="transition hover:text-geohome-gold">Contact</Link>
            <Link href="#privacy" className="transition hover:text-geohome-gold">Privacy</Link>
          </nav>
        </header>

        <main className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-1 items-center py-8 sm:py-12 lg:py-16">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/20 bg-cloud-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-cloud-white">
              GeoHome verified rentals in Kisumu
            </div>
            <h1 className="mt-6 text-4xl font-heading font-black leading-tight tracking-tight text-cloud-white sm:text-5xl md:text-6xl">
              Find your home in Kenya — as simple as dropping a pin.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-cloud-white/90 sm:text-lg">
              Explore verified homes, unlock the full map experience, and browse high-confidence listings built for Kenyan tenants.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/map" className="inline-flex items-center justify-center rounded-full bg-geohome-gold px-5 py-3 text-sm font-semibold text-deep-maritime transition hover:opacity-90">
                View more listings
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-cloud-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-cloud-white transition hover:bg-white/20"
              >
                {hasPass ? 'Full map unlocked' : 'Unlock full map'}
              </button>
            </div>

            <div className="mt-6 rounded-3xl border border-white/20 bg-cloud-white/15 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-cloud-white/90">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  {checkingPass ? 'Checking pass status…' : hasPass ? 'Full access unlocked' : 'Limited map access'}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">Zoom {hasPass ? 'up to 18' : 'up to 12'}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">{hasPass ? 'Property names visible' : 'Property names hidden'}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[32px] border border-white/20 bg-cloud-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/20 bg-cloud-white p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Counties</div>
                  <div className="mt-3 text-3xl font-heading font-black text-official-teal">{loadingStats ? '...' : stats.counties}</div>
                </div>
                <div className="rounded-3xl border border-white/20 bg-cloud-white p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Active listings</div>
                  <div className="mt-3 text-3xl font-heading font-black text-trust-teal">{loadingStats ? '...' : stats.activeListings}</div>
                </div>
                <div className="rounded-3xl border border-white/20 bg-cloud-white p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Verified</div>
                  <div className="mt-3 text-3xl font-heading font-black text-deep-maritime">{loadingStats ? '...' : stats.verifiedCount}</div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/20 bg-cloud-white p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Latest properties</div>
                <div className="mt-5 space-y-4 text-sm text-anchor-gray">
                  {loadingProperties ? (
                    <div>Loading active listings…</div>
                  ) : properties.length === 0 ? (
                    <div>No active properties found in Kisumu.</div>
                  ) : (
                    properties.slice(0, 3).map((property) => (
                      <div key={property.id} className="rounded-3xl border border-pale-steel/70 bg-cloud-white/90 p-4">
                        <div className="font-semibold text-deep-maritime">{property.title || 'Verified rental'}</div>
                        <div className="mt-1 text-sm text-anchor-gray">{property.address || 'Kisumu, Kenya'}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-anchor-gray">
                          <span>{property.property_type || 'Rental'}</span>
                          <span>•</span>
                          <span>KES {property.price ?? '—'}/month</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/20 bg-cloud-white p-6 text-anchor-gray shadow-2xl shadow-slate-950/20 sm:p-8">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-official-teal">Why tenants choose GeoHome</div>
              <h2 className="mt-4 text-3xl font-heading font-black text-deep-maritime">See verified homes in one focused map view.</h2>
              <p className="mt-4 text-sm leading-7 text-anchor-gray">
                The homepage is built to feel like a live city search experience: map-first, premium, and tailored for Kenyan renters exploring homes in Kisumu.
              </p>
              <div className="mt-6 space-y-3">
                <div className="rounded-3xl border border-pale-steel bg-cloud-white/80 p-4">
                  <div className="font-semibold text-deep-maritime">Verified listing flow</div>
                  <p className="mt-1 text-sm text-anchor-gray">Only active and verified homes appear in the primary search experience.</p>
                </div>
                <div className="rounded-3xl border border-pale-steel bg-cloud-white/80 p-4">
                  <div className="font-semibold text-deep-maritime">Premium search pass</div>
                  <p className="mt-1 text-sm text-anchor-gray">Unlock full map features and richer property details with a single pass purchase.</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-white/20 pt-6 text-sm text-cloud-white/90 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 GeoHome Kenya</div>
          <div className="flex flex-wrap gap-4">
            <Link href="#about" className="transition hover:text-geohome-gold">About</Link>
            <Link href="#contact" className="transition hover:text-geohome-gold">Contact</Link>
            <Link href="#privacy" className="transition hover:text-geohome-gold">Privacy</Link>
          </div>
        </footer>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-md rounded-[32px] border border-pale-steel bg-cloud-white p-6 shadow-2xl shadow-slate-950/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-official-teal">Unlock full map</p>
                <h3 className="mt-2 text-2xl font-heading font-black text-deep-maritime">Buy a search pass</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-pale-steel px-3 py-1 text-sm text-anchor-gray">
                Close
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-anchor-gray">
              Enter your Safaricom number to receive an STK push for the KES 200 search pass. Full map features unlock after payment confirmation.
            </p>
            <form onSubmit={handlePassPurchase} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-deep-maritime">
                Phone number
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="254700000000"
                  className="mt-2 w-full rounded-full border border-pale-steel bg-white px-4 py-3 text-sm text-anchor-gray outline-none ring-0 focus:border-official-teal"
                />
              </label>
              <button
                type="submit"
                disabled={submittingPass}
                className="w-full rounded-full bg-official-teal px-4 py-3 text-sm font-semibold text-white transition hover:bg-muted-teal disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingPass ? 'Sending request…' : 'Pay KES 200'}
              </button>
            </form>
            {passMessage ? <p className="mt-4 text-sm text-anchor-gray">{passMessage}</p> : null}
          </div>
        </div>
      )}
    </div>
  )
}
