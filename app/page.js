'use client'

import { useEffect, useState } from 'react'
import Map from '../components/Map'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Stats from '../components/Stats'

const kisumuCenter = [34.7617, -0.12]
const overlayStyles = 'pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(30,111,223,0.70)_0%,rgba(245,158,11,0.60)_100%)]'

const boundaryFillLayer = {
  id: 'boundary-fill',
  type: 'fill',
  paint: {
    'fill-color': '#2C6E5C',
    'fill-opacity': 0.18
  }
}

const boundaryLineLayer = {
  id: 'boundary-line',
  type: 'line',
  paint: {
    'line-color': '#2C6E5C',
    'line-width': 3
  }
}

export default function HomePage() {
  const { loading } = useAuth()
  const [boundary, setBoundary] = useState(null)
  const [viewState, setViewState] = useState({
    longitude: kisumuCenter[0],
    latitude: kisumuCenter[1],
    zoom: 10
  })
  const [properties, setProperties] = useState([])
  const [stats, setStats] = useState({ counties: 0, activeListings: 0, verifiedCount: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingProperties, setLoadingProperties] = useState(true)
  useEffect(() => {
    const fetchBoundary = async () => {
      const { data, error } = await supabase
        .from('boundaries')
        .select('name,geometry')
        .limit(1)

      if (error) {
        console.error('Failed to load boundary:', error)
        return
      }

      if (data?.length) {
        setBoundary({
          type: 'Feature',
          geometry: data[0].geometry,
          properties: { name: data[0].name }
        })
      }
    }

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
      const { data, error } = await supabase.rpc('properties_in_boundary', { boundary_name: 'kisumu' })
      if (error) {
        console.error('Failed to load properties:', error)
        setLoadingProperties(false)
        return
      }
      setProperties(data || [])
      setLoadingProperties(false)
    }

    fetchBoundary()
    fetchStats()
    fetchProperties()
  }, [])

  useEffect(() => {
    if (!navigator?.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setViewState((current) => ({
          ...current,
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: 11
        }))
      },
      (error) => {
        console.warn('Geolocation unavailable:', error.message)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 }
    )
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1E6FDF]"></div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 text-white">
      <Map
        center={kisumuCenter}
        properties={properties}
        className="absolute inset-0 h-full w-full"
      />

      <div className={overlayStyles} />

      <div className="absolute inset-0 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-6 py-6 lg:px-10">
        <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-white/75">GeoHome Kenya</div>
            <div className="mt-3 flex items-center gap-2 text-2xl font-black sm:text-3xl">
              <span>Geo</span>
              <span className="text-[#F59E0B]">Home</span>
              <span>Kenya</span>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <Link href="#about" className="hover:text-white">About</Link>
            <Link href="#contact" className="hover:text-white">Contact</Link>
            <Link href="#privacy" className="hover:text-white">Privacy</Link>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-5xl flex-col items-start gap-8 py-10 text-left sm:py-16">
          <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/85 backdrop-blur-xl">
            Map-first rental discovery
          </span>
          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            Find your home in Kenya — as simple as dropping a pin.
          </h1>
          <p className="max-w-2xl text-lg text-white/80 sm:text-xl">
            Explore verified rentals in Kisumu with live property markers, real-time listings statistics, and a polished map-driven landing experience.
          </p>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Live stats</div>
              <div className="mt-5">
                <Stats {...stats} loading={loadingStats} />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Latest properties</div>
              <div className="mt-5 space-y-3 text-sm text-white/80">
                {loadingProperties ? (
                  <div>Loading active listings…</div>
                ) : properties.length === 0 ? (
                  <div>No active properties found in Kisumu.</div>
                ) : (
                  properties.slice(0, 3).map((property) => (
                    <div key={property.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="font-semibold text-white">{property.title || 'Verified rental'}</div>
                      <div className="mt-1 text-sm text-white/70">{property.property_type || 'Property'} • KES {property.price ?? '—'}/month</div>
                      <div className="mt-2 text-sm text-white/70">{property.bedrooms ?? '—'} bd • {property.bathrooms ?? '—'} ba</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <Link href="/map" className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#1E6FDF] px-7 py-4 text-base font-semibold text-white shadow-lg shadow-[#1E6FDF]/25 transition-transform duration-300 hover:-translate-y-1 hover:bg-[#1556b9]">
            View More Listings
            <span className="inline-flex transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </main>

        <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 GeoHome Kenya</div>
          <div className="flex flex-wrap gap-4">
            <Link href="#about" className="hover:text-white">About</Link>
            <Link href="#contact" className="hover:text-white">Contact</Link>
            <Link href="#privacy" className="hover:text-white">Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
